/* SmartCourse 倍速解锁 — 弹窗逻辑 */
'use strict';

(function () {
  var KEY = 'sc_speed_cfg_v1';
  var VERSION = '1.2.0';
  var DEFAULTS = {
    enabled: true,
    rate: 2,
    spoof: true,
    preservesPitch: true,
    safeCap: true,
    autoRecover: true
  };
  var RATES = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 6, 8, 12, 16];
  var MIN_RATE = 0.25;
  var MAX_RATE = 16;
  var SAFE_RATE = 2;

  var cfg = normalize(DEFAULTS);
  var pendingRate = null;

  function $(id) { return document.getElementById(id); }

  function clampRate(value) {
    var n = Number(value);
    if (!isFinite(n)) n = DEFAULTS.rate;
    n = Math.min(MAX_RATE, Math.max(MIN_RATE, n));
    return Math.round(n * 100) / 100;
  }

  function normalize(raw) {
    raw = raw || {};
    return {
      enabled: raw.enabled !== false,
      rate: clampRate(raw.rate === undefined || raw.rate === null ? DEFAULTS.rate : raw.rate),
      spoof: raw.spoof !== false,
      preservesPitch: raw.preservesPitch !== false,
      safeCap: raw.safeCap !== false,
      autoRecover: raw.autoRecover !== false
    };
  }

  function formatRate(rate) {
    var n = Number(rate);
    if (!isFinite(n)) return '1.0';
    var trimmed = n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return trimmed === String(Math.trunc(n)) ? n.toFixed(1) : trimmed;
  }

  function setStatus(text) {
    var el = $('statusText');
    el.textContent = text;
    el.title = text;
  }

  function setTemporaryStatus(text, restoreMs) {
    var previous = $('statusText').textContent;
    setStatus(text);
    setTimeout(function () { setStatus(previous); }, restoreMs || 2600);
  }

  function activeTab() {
    var query = Promise.resolve([]);
    try {
      query = chrome.tabs.query({ active: true, currentWindow: true });
    } catch (e) { /* ignore */ }
    return query.then(function (tabs) {
      var tab = tabs && tabs[0];
      if (!tab) throw new Error('no tab');
      return tab;
    });
  }

  function sendToTab(message) {
    return activeTab().then(function (tab) {
      return chrome.tabs.sendMessage(tab.id, message);
    });
  }

  function render() {
    $('rateValue').textContent = formatRate(cfg.rate);
    var chips = document.querySelectorAll('.chip');
    for (var i = 0; i < chips.length; i++) {
      var active = Math.abs(Number(chips[i].dataset.rate) - cfg.rate) < 0.001;
      chips[i].classList.toggle('active', active);
      chips[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    $('toggleEnabled').checked = cfg.enabled;
    $('toggleAutoRecover').checked = cfg.autoRecover;
    $('toggleSafeCap').checked = cfg.safeCap;
    $('toggleSpoof').checked = cfg.spoof;
    $('togglePitch').checked = cfg.preservesPitch;

    var warning = $('rateWarning');
    if (cfg.safeCap && cfg.rate > SAFE_RATE) {
      warning.hidden = false;
      warning.textContent = '⚠ 当前 ' + formatRate(cfg.rate) + '× 超过平台允许的 2× 上限，任务点记录可能受影响';
    } else {
      warning.hidden = true;
    }

    if (document.activeElement !== $('customRate')) {
      $('customRate').value = formatRate(cfg.rate);
    }
    document.body.classList.toggle('is-disabled', !cfg.enabled);
  }

  function buildChips() {
    var box = $('chips');
    box.textContent = '';
    RATES.forEach(function (rate) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.dataset.rate = String(rate);
      btn.textContent = formatRate(rate) + '×';
      btn.addEventListener('click', function () { requestRate(rate); });
      box.appendChild(btn);
    });
  }

  function save(patch) {
    var next = {};
    for (var key in cfg) next[key] = cfg[key];
    for (var patchKey in patch) next[patchKey] = patch[patchKey];
    cfg = normalize(next);
    render();
    try {
      var payload = {};
      payload[KEY] = cfg;
      chrome.storage.local.set(payload);
    } catch (e) { /* ignore */ }
  }

  /* 安全上限：设置超过 2× 时先弹窗确认 */
  function requestRate(rate) {
    rate = clampRate(rate);
    if (rate > SAFE_RATE && cfg.safeCap) {
      openConfirm(rate);
      return;
    }
    save({ rate: rate });
  }

  function openConfirm(rate) {
    pendingRate = rate;
    $('confirmText').textContent = '即将切换到 ' + formatRate(rate) + '×，超过平台允许的 2× 上限。';
    $('confirmMask').hidden = false;
    $('confirmOk').focus();
  }

  function closeConfirm() {
    pendingRate = null;
    $('confirmMask').hidden = true;
  }

  function confirmRate() {
    var rate = pendingRate;
    closeConfirm();
    if (rate !== null) save({ rate: rate });
  }

  function cancelConfirm() {
    closeConfirm();
    render();
  }

  function applyCustom() {
    var raw = $('customRate').value;
    var value = Number(raw);
    if (!isFinite(value) || raw === '') {
      $('customRate').focus();
      return;
    }
    requestRate(value);
    if ($('confirmMask').hidden) {
      $('customRate').value = formatRate(cfg.rate);
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(area);
        if (ok) resolve();
        else reject(new Error('copy failed'));
      } catch (e) {
        reject(e);
      }
    });
  }

  function fixPlayback() {
    sendToTab({ type: 'SC_SPEED_FIX' }).then(function () {
      setTemporaryStatus('已发送修复指令；若仍卡住，请刷新页面');
    }).catch(function () {
      setTemporaryStatus('当前页面不可修复（不在生效范围或视频未加载）');
    });
  }

  function copyDiagnostics() {
    sendToTab({ type: 'SC_SPEED_STATUS' }).then(function (res) {
      var info = {
        extensionVersion: VERSION,
        time: new Date().toISOString(),
        config: cfg,
        injected: !!(res && res.injected),
        mediaCount: res ? res.media : null,
        realRate: res ? res.realRate : null,
        page: res && res.diag ? res.diag : null
      };
      return copyText(JSON.stringify(info, null, 2)).then(function () {
        setTemporaryStatus('诊断信息已复制到剪贴板');
      });
    }).catch(function () {
      setTemporaryStatus('复制失败：当前页面不在生效范围');
    });
  }

  function bind() {
    $('toggleEnabled').addEventListener('change', function (e) {
      save({ enabled: e.target.checked });
    });
    $('toggleAutoRecover').addEventListener('change', function (e) {
      save({ autoRecover: e.target.checked });
    });
    $('toggleSafeCap').addEventListener('change', function (e) {
      save({ safeCap: e.target.checked });
    });
    $('toggleSpoof').addEventListener('change', function (e) {
      save({ spoof: e.target.checked });
    });
    $('togglePitch').addEventListener('change', function (e) {
      save({ preservesPitch: e.target.checked });
    });
    $('applyCustom').addEventListener('click', applyCustom);
    $('customRate').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCustom();
      }
    });
    $('fixPlay').addEventListener('click', fixPlayback);
    $('copyDiag').addEventListener('click', copyDiagnostics);
    $('confirmOk').addEventListener('click', confirmRate);
    $('confirmCancel').addEventListener('click', cancelConfirm);
    $('confirmMask').addEventListener('click', function (e) {
      if (e.target === $('confirmMask')) cancelConfirm();
    });
    document.addEventListener('keydown', function (e) {
      if ($('confirmMask').hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelConfirm();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmRate();
      }
    });
  }

  function refreshStatus() {
    var dot = $('statusDot');
    dot.className = 'dot';
    setStatus('正在检测当前页面…');
    activeTab().then(function (tab) {
      return chrome.tabs.sendMessage(tab.id, { type: 'SC_SPEED_STATUS' });
    }).then(function (res) {
      if (!res || !res.injected) throw new Error('no responder');
      dot.classList.add('ok');
      if (res.media > 0) {
        var real = res.realRate !== null && res.realRate !== undefined
          ? formatRate(res.realRate) + '×'
          : '—';
        setStatus('已接管 ' + res.media + ' 个媒体 · 实际倍速 ' + real);
      } else {
        setStatus('已注入当前页，视频在子框架中，播放时自动接管');
      }
    }).catch(function () {
      dot.classList.add('warn');
      setStatus('当前标签页不在生效范围（请打开课程视频页面）');
    });
  }

  function init() {
    var loaded = Promise.resolve();
    try {
      loaded = chrome.storage.local.get(KEY);
    } catch (e) { /* ignore */ }
    loaded.then(function (res) {
      cfg = normalize(res && res[KEY]);
      buildChips();
      render();
      bind();
      refreshStatus();
      try {
        chrome.storage.onChanged.addListener(function (changes, area) {
          if (area !== 'local' || !changes || !changes[KEY]) return;
          cfg = normalize(changes[KEY].newValue);
          render();
        });
      } catch (e) { /* ignore */ }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
