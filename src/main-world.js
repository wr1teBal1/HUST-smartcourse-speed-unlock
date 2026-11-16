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
 *   4. 通过 window.postMessage 与隔离世界的 bridge.js 同步配置。
 *
 * 注意：本脚本只解除“浏览器端”的播放速度控制，不修改任何课程进度数据。
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

  var realGetRate = rateDesc.get;
  var realSetRate = rateDesc.set;
  var realGetDef = defDesc && typeof defDesc.get === 'function' ? defDesc.get : null;
  var realSetDef = defDesc && typeof defDesc.set === 'function' ? defDesc.set : null;

  var MSG = '__SMARTCOURSE_SPEED__';
  var MIN_RATE = 0.25;
  var MAX_RATE = 16;
  var DEFAULT_CFG = { enabled: true, rate: 2, spoof: true, preservesPitch: true, safeCap: true };

  var state = {
    enabled: DEFAULT_CFG.enabled,
    rate: DEFAULT_CFG.rate,
    spoof: DEFAULT_CFG.spoof,
    preservesPitch: DEFAULT_CFG.preservesPitch
  };

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
      safeCap: raw.safeCap !== false
    };
  }

  /* ------------------------------ Hook 安装 ------------------------------ */

  function hookedRateGetter() {
    var real = realGetRate.call(this);
    // 页面读到 1.0：让“检测到倍速异常”这类逻辑失效
    if (state.enabled && state.spoof) return 1;
    return real;
  }

  function hookedRateSetter(value) {
    // 页面写入的倍速一律被重定向为扩展配置的倍速
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
      window[HOOK_FLAG] = true;
    } catch (e) {
      /* 极端情况下（属性被设为不可配置）静默失败 */
    }
  }

  function ensureHook() {
    try {
      var desc = Object.getOwnPropertyDescriptor(proto, 'playbackRate');
      if (!desc || desc.set !== hookedRateSetter) installHook();
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

  /* --------------------------- 配置应用 / 通信 --------------------------- */

  function applyConfig(raw) {
    var next = normalizeConfig(raw);
    var wasEnabled = state.enabled;
    state.enabled = next.enabled;
    state.rate = next.rate;
    state.spoof = next.spoof;
    state.preservesPitch = next.preservesPitch;
    if (wasEnabled && !state.enabled) resetAllToNormal();
    forceAll(document);
  }

  function post(message) {
    try { window.postMessage(message, '*'); } catch (e) { /* ignore */ }
  }

  function announceReady() {
    post({ source: MSG, type: 'hook-ready' });
  }

  /* 页面内轻提示（用于快捷键把倍速调过 2× 时的“安全上限”提醒） */
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
    if (data.type === 'config' && data.config) applyConfig(data.config);
    else if (data.type === 'warn' && typeof data.text === 'string') showToast(data.text);
  });

  /* ------------------------------ 事件与兜底 ----------------------------- */

  var MEDIA_EVENTS = ['loadstart', 'loadedmetadata', 'canplay', 'play', 'playing',
    'ratechange', 'seeking', 'seeked'];

  function onMediaEvent(event) {
    var target = event.target;
    if (target instanceof HTMLMediaElement) forceMedia(target);
  }
  for (var i = 0; i < MEDIA_EVENTS.length; i++) {
    document.addEventListener(MEDIA_EVENTS[i], onMediaEvent, true);
  }

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

  // 兜底：页面若重新定义/删除属性，或绕过事件偷偷重置倍速，周期性恢复
  setInterval(function () {
    ensureHook();
    if (state.enabled) forceAll(document);
  }, 700);

  installHook();
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
