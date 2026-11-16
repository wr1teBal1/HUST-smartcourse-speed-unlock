/* =========================================================================
 * SmartCourse 倍速解锁 — 主世界播放器 Hook（MAIN world）
 *
 * 运行时机：document_start，先于页面任何脚本执行。
 * 核心作用：
 *   1. 接管 HTMLMediaElement.prototype.playbackRate / defaultPlaybackRate，
 *      页面脚本写入的倍速会被重定向为扩展配置的倍速（防播放器重置）；
 *   2. 可选“伪装”：页面读取 playbackRate 时返回 1.0，降低被播放器/平台
 *      的防倍速检测逻辑发现概率；
 *   3. 覆盖动态插入、同源/跨域 iframe（各框架内由扩展分别注入）的媒体元素；
 *   4. v1.2.0：播放恢复助手 —— 播放按钮点了没反应 / 切屏暂停后卡住 /
 *      缓冲卡死时，自动尝试恢复播放，并提供手动修复（Alt+R / 弹窗按钮）；
 *   5. 通过 window.postMessage 与隔离世界的 bridge.js 同步配置。
 *
 * 注意：本脚本只解除“浏览器端”的播放速度控制、只做播放恢复，
 *       不修改任何课程进度数据，不伪造学习时长。
 * ========================================================================= */
(function () {
  'use strict';

  var HOOK_FLAG = '__SMARTCOURSE_SPEED_HOOKED__';
  if (window[HOOK_FLAG]) return;

  var proto = window.HTMLMediaElement && window.HTMLMediaElement.prototype;
  if (!proto) return;

  var rateDesc = Object.getOwnPropertyDescriptor(proto, 'playbackRate');
  var defDesc = Object.getOwnPropertyDescriptor(proto, 'defaultPlaybackRate');
  if (!rateDesc || typeof rateDesc.get !== 'function' || typeof rateDesc.set !== 'function') return;
  if (typeof proto.play !== 'function' || typeof proto.pause !== 'function') return;

  var realGetRate = rateDesc.get;
  var realSetRate = rateDesc.set;
  var realGetDef = defDesc && typeof defDesc.get === 'function' ? defDesc.get : null;
  var realSetDef = defDesc && typeof defDesc.set === 'function' ? defDesc.set : null;
  var realPlay = proto.play;
  var realPause = proto.pause;

  var MSG = '__SMARTCOURSE_SPEED__';
  var MIN_RATE = 0.25;
  var MAX_RATE = 16;
  var DEFAULT_CFG = {
    enabled: true,
    rate: 2,
    spoof: true,
    preservesPitch: true,
    safeCap: true,
    autoRecover: true
  };

  var state = {
    enabled: DEFAULT_CFG.enabled,
    rate: DEFAULT_CFG.rate,
    spoof: DEFAULT_CFG.spoof,
    preservesPitch: DEFAULT_CFG.preservesPitch,
    autoRecover: DEFAULT_CFG.autoRecover
  };

  /* ------------------------------ 诊断工具 ------------------------------ */

  var EVENTS = [];
  var lastPlayCallAt = 0;
  var lastPauseCallAt = 0;
  var lastProgressAt = 0;
  var lastProgressTime = -1;
  var lastRecoveryAt = 0;
  var recoveryAttempts = 0;

  function nowMs() { return Date.now(); }
  function round2(n) { return Math.round(n * 100) / 100; }

  function firstMedia() {
    try { return document.querySelector('video, audio'); } catch (e) { return null; }
  }

  function mediaSnapshot(el) {
    var media = el || firstMedia();
    if (!media) return null;
    try {
      return {
        tag: media.tagName,
        id: media.id || '',
        paused: media.paused,
        ended: media.ended,
        readyState: media.readyState,
        networkState: media.networkState,
        currentTime: round2(media.currentTime),
        duration: isFinite(media.duration) ? round2(media.duration) : String(media.duration),
        rateReal: realGetRate.call(media),
        rateVisible: media.playbackRate,
        error: media.error ? { code: media.error.code, message: String(media.error.message || '') } : null
      };
    } catch (e) {
      return { snapshotError: String(e) };
    }
  }

  function record(type, extra) {
    var item = { t: nowMs(), type: type };
    try { item.hidden = document.hidden; } catch (e) { item.hidden = null; }
    if (extra) {
      for (var key in extra) item[key] = extra[key];
    }
    EVENTS.push(item);
    if (EVENTS.length > 120) EVENTS.shift();
    try { console.debug('[SC-SPEED]', item.type, item); } catch (e) { /* ignore */ }
  }

  function installDiagApi() {
    var api = {
      snapshot: function () {
        return {
          url: location.href,
          hidden: document.hidden,
          config: { enabled: state.enabled, rate: state.rate, spoof: state.spoof, autoRecover: state.autoRecover },
          media: mediaSnapshot(),
          events: EVENTS.slice(-80)
        };
      },
      events: function () { return EVENTS.slice(-120); }
    };
    try {
      Object.defineProperty(window, '__SMARTCOURSE_SPEED_DIAG__', { configurable: true, value: api });
    } catch (e) {
      try { window.__SMARTCOURSE_SPEED_DIAG__ = api; } catch (e2) { /* ignore */ }
    }
  }

  /* ------------------------------ 配置 ------------------------------ */

  function clampRate(value) {
    var n = Number(value);
    if (!isFinite(n)) n = DEFAULT_CFG.rate;
    n = Math.min(MAX_RATE, Math.max(MIN_RATE, n));
    return Math.round(n * 100) / 100;
  }

  function normalizeConfig(raw) {
    raw = raw || {};
    return {
      enabled: raw.enabled !== false,
      rate: clampRate(raw.rate === undefined || raw.rate === null ? DEFAULT_CFG.rate : raw.rate),
      spoof: raw.spoof !== false,
      preservesPitch: raw.preservesPitch !== false,
      safeCap: raw.safeCap !== false,
      autoRecover: raw.autoRecover !== false
    };
  }

  /* ------------------------------ Hook 安装 ------------------------------ */

  function hookedRateGetter() {
    var real = realGetRate.call(this);
    if (state.enabled && state.spoof) return 1;
    return real;
  }

  function hookedRateSetter(value) {
    if (!state.enabled) return realSetRate.call(this, value);
    return realSetRate.call(this, state.rate);
  }

  function hookedDefGetter() {
    var real = realGetDef ? realGetDef.call(this) : 1;
    if (state.enabled && state.spoof) return 1;
    return real;
  }

  function hookedDefSetter(value) {
    if (!realSetDef) return;
    if (!state.enabled) return realSetDef.call(this, value);
    return realSetDef.call(this, state.rate);
  }

  function wrappedPlay() {
    var el = this;
    lastPlayCallAt = nowMs();
    lastProgressAt = nowMs();
    lastProgressTime = el.currentTime;
    record('play.call', { paused: el.paused, ended: el.ended });

    var promise;
    try {
      promise = realPlay.apply(el, arguments);
    } catch (err) {
      record('play.throw', { message: String(err) });
      throw err;
    }

    if (promise && typeof promise.then === 'function') {
      promise.then(function () {
        record('play.ok');
      }, function (err) {
        record('play.reject', { name: err && err.name, message: err && String(err.message || '') });
      });
    }

    // 播放按钮无响应：play() 已调用、之后页面没有 pause()，但 2.4s 后仍未播放 → 直接强制恢复
    if (state.enabled && state.autoRecover) {
      setTimeout(function () {
        try {
          if (!el.paused || el.ended) return;
          if (lastPauseCallAt >= lastPlayCallAt) return; // 页面之后主动暂停，尊重
          attemptRecover(el, 'play-ineffective');
        } catch (e) { /* ignore */ }
      }, 2400);
    }

    return promise;
  }

  function wrappedPause() {
    lastPauseCallAt = nowMs();
    recoveryAttempts = 0;
    record('pause.call');
    return realPause.apply(this, arguments);
  }

  function installHook() {
    try {
      Object.defineProperty(proto, 'playbackRate', {
        configurable: true,
        enumerable: rateDesc.enumerable,
        get: hookedRateGetter,
        set: hookedRateSetter
      });
      if (realGetDef && realSetDef) {
        Object.defineProperty(proto, 'defaultPlaybackRate', {
          configurable: true,
          enumerable: defDesc.enumerable,
          get: hookedDefGetter,
          set: hookedDefSetter
        });
      }
      proto.play = wrappedPlay;
      proto.pause = wrappedPause;
      window[HOOK_FLAG] = true;
    } catch (e) {
      /* 极端情况下（属性不可配置）静默失败 */
    }
  }

  function ensureHook() {
    try {
      var desc = Object.getOwnPropertyDescriptor(proto, 'playbackRate');
      if (!desc || desc.set !== hookedRateSetter || proto.play !== wrappedPlay) installHook();
    } catch (e) { /* ignore */ }
  }

  /* ------------------------------ 强制倍速 ------------------------------ */

  function forceMedia(el) {
    if (!state.enabled || !el || !(el instanceof HTMLMediaElement)) return;
    try {
      if (state.preservesPitch && 'preservesPitch' in el) {
        try { el.preservesPitch = true; } catch (e) { /* ignore */ }
      }
      var real = realGetRate.call(el);
      if (Math.abs(real - state.rate) > 0.001) realSetRate.call(el, state.rate);
    } catch (e) { /* ignore */ }
  }

  function forceAll(root) {
    if (!state.enabled) return;
    var node = root && root.querySelectorAll ? root : document;
    try {
      var list = node.querySelectorAll('video, audio');
      for (var i = 0; i < list.length; i++) forceMedia(list[i]);
    } catch (e) { /* ignore */ }
  }

  function resetAllToNormal() {
    try {
      var list = document.querySelectorAll('video, audio');
      for (var i = 0; i < list.length; i++) {
        try { realSetRate.call(list[i], 1); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  }

  /* --------------------------- 播放恢复助手 --------------------------- */

  function attemptRecover(el, reason, force) {
    if (!el || el.ended) return false;
    if (!force && (!state.enabled || !state.autoRecover)) return false;
    var t = nowMs();
    if (!force && t - lastRecoveryAt < 1500) return false;
    if (!force && recoveryAttempts >= 3) return false;
    recoveryAttempts++;
    lastRecoveryAt = t;
    record('recover.attempt', { reason: reason, media: mediaSnapshot(el) });

    try {
      var dur = el.duration;
      var target = el.currentTime + 0.2;
      if (isFinite(dur) && dur > 0 && target > dur - 0.2) target = Math.max(0, dur - 0.2);
      if (target > el.currentTime) el.currentTime = target;
    } catch (e) { /* ignore */ }

    var called = false;
    try {
      var promise = realPlay.call(el);
      called = true;
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function (err) {
          record('recover.play-rejected', { reason: reason, name: err && err.name, message: err && String(err.message || '') });
        });
      }
    } catch (err) {
      record('recover.play-throw', { reason: reason, message: String(err) });
    }

    setTimeout(function () {
      var media = firstMedia();
      if (media && !media.paused) {
        recoveryAttempts = 0;
        lastProgressAt = nowMs();
        record('recover.ok', { reason: reason });
      } else {
        record('recover.maybe-failed', { reason: reason, media: mediaSnapshot(media) });
      }
    }, 900);

    return called;
  }

  function isPlayControl(target) {
    if (!target || !target.closest) return false;
    try {
      if (target.closest('.vjs-play-control, .vjs-big-play-button, .vjs-replay-button, [class*="vjs-play"], [class*="play-control"], [class*="playControl"], [title="播放"], [title="继续播放"], [aria-label="播放"], [aria-label="继续播放"]')) {
        return true;
      }
      var el = target.closest('button, a, [role="button"], .vjs-button');
      if (!el) return false;
      var text = ((el.textContent || '') + ' ' +
        (el.getAttribute ? (el.getAttribute('title') || '') : '') + ' ' +
        (el.getAttribute ? (el.getAttribute('aria-label') || '') : '')).replace(/\s+/g, '');
      return /播放|继续|重播|play|resume|replay/i.test(text);
    } catch (e) {
      return false;
    }
  }

  /* --------------------------- 配置应用 / 通信 --------------------------- */

  function applyConfig(raw) {
    var next = normalizeConfig(raw);
    var wasEnabled = state.enabled;
    state.enabled = next.enabled;
    state.rate = next.rate;
    state.spoof = next.spoof;
    state.preservesPitch = next.preservesPitch;
    state.autoRecover = next.autoRecover;
    if (wasEnabled && !state.enabled) resetAllToNormal();
    forceAll(document);
  }

  function post(message) {
    try { window.postMessage(message, '*'); } catch (e) { /* ignore */ }
  }

  function announceReady() {
    post({ source: MSG, type: 'hook-ready' });
  }

  /* 页面内轻提示（用于快捷键把倍速调过 2×、手动修复播放等） */
  var toastTimer = null;
  function showToast(text) {
    try {
      if (!document.documentElement) return;
      var id = '__smartcourse_speed_toast__';
      var el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.setAttribute('role', 'status');
        el.style.cssText = [
          'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
          'z-index:2147483647', 'max-width:80vw', 'padding:10px 16px',
          'background:rgba(18,22,31,.92)', 'color:#fff',
          'font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif',
          'border-radius:10px', 'box-shadow:0 6px 24px rgba(0,0,0,.35)',
          'pointer-events:none', 'opacity:0', 'transition:opacity .25s ease',
          'white-space:normal', 'text-align:center'
        ].join(';');
        document.documentElement.appendChild(el);
      }
      el.textContent = text;
      el.style.opacity = '1';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 3200);
    } catch (e) { /* ignore */ }
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    var data = event.data;
    if (!data || data.source !== MSG) return;
    if (data.type === 'config' && data.config) {
      applyConfig(data.config);
    } else if (data.type === 'warn' && typeof data.text === 'string') {
      showToast(data.text);
    } else if (data.type === 'fix') {
      var media = firstMedia();
      if (media) {
        attemptRecover(media, 'manual-fix', true);
        showToast('已尝试恢复播放');
        record('manual.fix');
      } else {
        showToast('未找到视频元素');
      }
    }
  });

  /* ------------------------------ 事件与兜底 ----------------------------- */

  var MEDIA_EVENTS = ['loadstart', 'loadedmetadata', 'canplay', 'play', 'playing',
    'ratechange', 'seeking', 'seeked'];

  function onMediaEvent(event) {
    var target = event.target;
    if (target instanceof HTMLMediaElement) {
      if (event.type === 'playing') {
        lastProgressAt = nowMs();
        lastProgressTime = target.currentTime;
        recoveryAttempts = 0;
      }
      forceMedia(target);
    }
  }
  for (var i = 0; i < MEDIA_EVENTS.length; i++) {
    document.addEventListener(MEDIA_EVENTS[i], onMediaEvent, true);
  }

  // 进度追踪（用于判断“播放中卡死”）
  document.addEventListener('timeupdate', function (event) {
    var target = event.target;
    if (target instanceof HTMLMediaElement) {
      if (target.currentTime !== lastProgressTime) {
        lastProgressTime = target.currentTime;
        lastProgressAt = nowMs();
      }
    }
  }, true);

  // 播放类控件点击后仍没播放 → 认为是“播放按钮无响应”，尝试直接恢复
  document.addEventListener('click', function (event) {
    if (!state.enabled || !state.autoRecover) return;
    if (!isPlayControl(event.target)) return;
    record('click.play-control');
    setTimeout(function () {
      var media = firstMedia();
      if (!media || media.ended) return;
      if (media.paused) attemptRecover(media, 'play-control-click');
    }, 1600);
  }, true);

  try {
    var observer = new MutationObserver(function (records) {
      for (var r = 0; r < records.length; r++) {
        var added = records[r].addedNodes;
        for (var a = 0; a < added.length; a++) {
          var node = added[a];
          if (!node || node.nodeType !== 1) continue;
          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') forceMedia(node);
          else forceAll(node);
        }
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  } catch (e) { /* ignore */ }

  // 兜底：页面若重新定义/删除属性，或绕过事件偷偷重置倍速，周期性恢复；
  // 同时检测“播放中却长时间没有进度”的卡死状态并尝试恢复
  setInterval(function () {
    ensureHook();
    if (!state.enabled) return;
    forceAll(document);
    if (!state.autoRecover) return;
    try {
      var media = firstMedia();
      if (!media || media.paused || media.ended || !lastProgressAt) return;
      if (nowMs() - lastProgressAt > 4000 && recoveryAttempts < 2) {
        record('stall.detected', { stalledMs: nowMs() - lastProgressAt, media: mediaSnapshot(media) });
        attemptRecover(media, 'stalled');
      }
    } catch (e) { /* ignore */ }
  }, 1000);

  installHook();
  installDiagApi();
  forceAll(document);
  announceReady();
  [60, 300, 1000, 2500].forEach(function (delay) {
    setTimeout(announceReady, delay);
  });
  document.addEventListener('DOMContentLoaded', function () {
    forceAll(document);
    announceReady();
  });
  window.addEventListener('load', function () {
    forceAll(document);
    announceReady();
  });
})();
