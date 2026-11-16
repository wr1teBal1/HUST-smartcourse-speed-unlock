/* =========================================================================
 * SmartCourse 倍速解锁 — 隔离世界桥接（ISOLATED world）
 *
 * 职责：
 *   1. 从 chrome.storage.local 读取配置，通过 window.postMessage 下发给
 *      主世界的播放器 Hook；配置改动实时生效（无需刷新页面）；
 *   2. 快捷键：Alt + ↑ / ↓ 调节倍速；Alt + R 修复卡住的播放；
 *   3. 响应弹窗（popup）的状态查询、手动修复请求与诊断信息。
 *
 * 本脚本运行在扩展的隔离世界中，页面脚本无法访问它。
 * ========================================================================= */
(function () {
  'use strict';

  var BRIDGE_FLAG = '__SMARTCOURSE_SPEED_BRIDGE__';
  if (window[BRIDGE_FLAG]) return;
  window[BRIDGE_FLAG] = true;

  var TAG = '__SMARTCOURSE_SPEED__';
  var KEY = 'sc_speed_cfg_v1';
  var MIN_RATE = 0.25;
  var MAX_RATE = 16;
  var STEP = 0.25;
  var DEFAULTS = {
    enabled: true,
    rate: 2,
    spoof: true,
    preservesPitch: true,
    safeCap: true,
    autoRecover: true
  };

  var cfg = normalize(DEFAULTS);

  function normalize(raw) {
    raw = raw || {};
    var rate = Number(raw.rate);
    if (!isFinite(rate)) rate = DEFAULTS.rate;
    rate = Math.min(MAX_RATE, Math.max(MIN_RATE, rate));
    rate = Math.round(rate * 100) / 100;
    return {
      enabled: raw.enabled !== false,
      rate: rate,
      spoof: raw.spoof !== false,
      preservesPitch: raw.preservesPitch !== false,
      safeCap: raw.safeCap !== false,
      autoRecover: raw.autoRecover !== false
    };
  }

  function postConfig() {
    try {
      window.postMessage({ source: TAG, type: 'config', config: cfg }, '*');
    } catch (e) { /* ignore */ }
  }

  function postWarn(text) {
    try {
      window.postMessage({ source: TAG, type: 'warn', text: text }, '*');
    } catch (e) { /* ignore */ }
  }

  function postFix() {
    try {
      window.postMessage({ source: TAG, type: 'fix' }, '*');
    } catch (e) { /* ignore */ }
  }

  function persist() {
    try {
      var patch = {};
      patch[KEY] = cfg;
      chrome.storage.local.set(patch);
    } catch (e) { /* 极少数页面上下文不支持 storage 时忽略 */ }
  }

  function load() {
    try {
      chrome.storage.local.get([KEY], function (result) {
        if (result && result[KEY]) cfg = normalize(result[KEY]);
        postConfig();
      });
    } catch (e) {
      postConfig();
    }
  }

  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'local' || !changes || !changes[KEY]) return;
      cfg = normalize(changes[KEY].newValue);
      postConfig();
    });
  } catch (e) { /* ignore */ }

  // 主世界 Hook 就绪后（或启动竞态时）主动下发配置
  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    var data = event.data;
    if (data && data.source === TAG && data.type === 'hook-ready') postConfig();
  });

  // Alt + ↑ / ↓：调节倍速；Alt + R：修复卡住的播放
  window.addEventListener('keydown', function (event) {
    if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.isComposing) return;

    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      event.stopPropagation();
      try { event.stopImmediatePropagation(); } catch (e) { /* ignore */ }
      postFix();
      return;
    }

    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    event.stopPropagation();
    try { event.stopImmediatePropagation(); } catch (e) { /* ignore */ }

    var next = cfg.rate + (event.key === 'ArrowUp' ? STEP : -STEP);
    next = Math.round(next * 100) / 100;
    next = Math.min(MAX_RATE, Math.max(MIN_RATE, next));
    if (Math.abs(next - cfg.rate) < 0.001) return;
    cfg.rate = next;
    postConfig();
    persist();
    // 安全上限提醒：快捷键把倍速调过 2× 时，在视频页面内提示一次
    if (cfg.enabled && cfg.safeCap && cfg.rate > 2) {
      postWarn('已调整到 ' + cfg.rate + '×，超过平台允许的 2× 上限，任务点记录可能受影响');
    }
  }, true);

  // 弹窗消息：状态查询 / 手动修复
  try {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (!message || !message.type) return;

      if (message.type === 'SC_SPEED_FIX') {
        postFix();
        sendResponse({ ok: true, frame: window === window.top ? 'top' : 'child' });
        return;
      }

      if (message.type !== 'SC_SPEED_STATUS') return;
      var medias;
      try { medias = document.querySelectorAll('video, audio'); } catch (e) { medias = []; }
      if (!medias.length && window !== window.top) return; // 让有媒体的子框架回答
      var realRate = null;
      var mediaList = [];
      if (medias.length) {
        try { realRate = medias[0].playbackRate; } catch (e) { /* ignore */ }
        for (var i = 0; i < medias.length && i < 3; i++) {
          try {
            var m = medias[i];
            mediaList.push({
              tag: m.tagName,
              paused: m.paused,
              ended: m.ended,
              currentTime: Math.round(m.currentTime * 100) / 100,
              duration: isFinite(m.duration) ? Math.round(m.duration * 100) / 100 : String(m.duration),
              readyState: m.readyState,
              networkState: m.networkState,
              rateReal: m.playbackRate,
              error: m.error ? { code: m.error.code, message: String(m.error.message || '') } : null
            });
          } catch (e) { /* ignore */ }
        }
      }
      sendResponse({
        injected: true,
        media: medias.length,
        realRate: realRate,
        config: cfg,
        frame: window === window.top ? 'top' : 'child',
        diag: {
          href: location.href,
          hidden: document.hidden,
          media: mediaList
        }
      });
    });
  } catch (e) { /* ignore */ }

  load();
})();
