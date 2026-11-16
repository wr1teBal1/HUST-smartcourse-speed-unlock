# SmartCourse 倍速解锁 — 独立验收报告（v1.1.0 · 安全上限提醒 + 回归）

- 生成时间：2026-11-16T12:35:19.581Z
- 扩展版本：**1.1.0**（extensionId `jdakeggaeemgneckbpfhlfkhhhoaging`，Chrome Chrome/157.0.8103.51）
- 结论：**所有可执行用例 PASS**（共 35 项：35 PASS / 0 FAIL / 0 SKIP|BLOCKED）
  - 新增功能用例（F0–F8）：9 项，9 PASS / 0 FAIL
  - 既有行为回归（P/T 用例）：26 项，26 PASS / 0 FAIL

## 环境与加载方式

| 项目 | 值 |
| --- | --- |
| OS / Node | win32 x64 / Node v24.22.1（零 npm 依赖，原生 http + WebSocket） |
| 浏览器 | Chrome/157.0.8103.51（CDP protocol 1.3） |
| 扩展 | `D:\dsh\smartcourse-speed-unlock` → extensionId `jdakeggaeemgneckbpfhlfkhhhoaging`，manifest version **1.1.0** |
| 扩展加载方式 | CDP Extensions.loadUnpacked；启动参数含 `--enable-unsafe-extension-debugging` |
| 命令行 --load-extension | Chrome 157 **被禁用**（stderr: `--load-extension is not allowed in Google Chrome, ignoring.`）；Edge 157 可用。详见 Phase A 证据 |
| 测试域名 | `--host-resolver-rules="MAP smartcourse.hust.edu.cn 127.0.0.1, MAP jwc.hust.edu.cn 127.0.0.1, MAP cross.example 127.0.0.1"`，全部流量命中本机 Node 服务器，**未访问真实课程平台** |

> 说明：Chrome 137+ 的 branded 构建不再接受命令行 `--load-extension`（浏览器策略，非测试缺陷）。官方自动化替代方案是 `--enable-unsafe-extension-debugging` + CDP `Extensions.loadUnpacked`，它加载的是**真实 unpacked 扩展**，manifest 的 matches / `world: MAIN` / `all_frames` 全部生效，因此本次验收属于扩展层真实验证，而非 CDP 注入模拟。普通用户通过 `chrome://extensions` → “加载已解压的扩展程序” 安装，加载后的行为与本次验证一致。

## 新增功能用例（v1.1.0 安全上限提醒）

| # | 用例 | 状态 | 关键证据 |
| --- | --- | --- | --- |
| F0 | 旧配置缺失 safeCap 时按默认 true：默认配置下 Alt+↑ 2→2.25 出现上限 toast（#__smartcourse_speed_toast__） | ✅ PASS | cfg={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; toast={"present":true,"text":"已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响","opacity":"1"}; real=2.25 |
| F1 | popup 安全上限 DOM：#toggleSafeCap / #rateWarning / #confirmMask-#confirmText-#confirmOk-#confirmCancel 均存在 | ✅ PASS | dom={"hasToggleSafeCap":true,"hasRateWarning":true,"hasConfirmMask":true,"hasConfirmText":true,"hasConfirmOk":true,"hasConfirmCancel":true}; ui.safeCap=true; ui.rateWarningHidden=true; ui.confirmMaskHidden=true |
| F2 | 旧配置（storage 中无 safeCap）按默认 true 处理：rate=2.5 时 #toggleSafeCap 勾选、#rateWarning 可见 | ✅ PASS | stored={"enabled":true,"preservesPitch":true,"rate":2.5,"spoof":true}; ui.safeCap=true; warningHidden=false; text=⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响; real=2.5 |
| F3 | #rateWarning 可见性矩阵：safeCap=true 且 rate>2 可见（文本含“2× 上限”），其余 hidden | ✅ PASS | safeCap=true rate=2.5: hidden=false; safeCap=false rate=2.5: hidden=true; safeCap=true rate=2: hidden=true |
| F4 | safeCap=true 点 .chip[data-rate="2.5"] → #confirmMask 显示、#confirmText 含 2.5×；点 #confirmCancel 取消且 rate 不变 | ✅ PASS | confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cancelHidden=true; rateBefore=2; rateAfterCancel=2; realAfterCancel=2; visible=1 |
| F5 | safeCap=true 自定义输入 3.5 + #applyCustom → 确认框；取消不改；#confirmOk 后 rate=3.5 实时生效、页面读 1、storage 含 safeCap、警告显示 | ✅ PASS | confirmText=即将切换到 3.5×，超过平台允许的 2× 上限。; afterCancel rate=2 real=2; afterOk cfg={"enabled":true,"preservesPitch":true,"rate":3.5,"safeCap":true,"spoof":true} real=3.5 visible=1 warningHidden=false |
| F6 | ≤2×（1.5/2.0 档位、自定义 1.75）直接生效，不出现确认框 | ✅ PASS | chip:1.5 confirmHidden=true cfg=true real=1.5; chip:2 confirmHidden=true cfg=true real=2; custom:1.75 confirmHidden=true cfg=true real=1.75 |
| F7 | safeCap=false：点 2.5× 无确认框、无警告、直接生效；重新开启 safeCap 后（rate 仍 2.5）警告恢复 | ✅ PASS | off cfg={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":false,"spoof":true}; snapshotHidden=true; rate=2.5; real=2.5; warningHidden=true; afterReenable warningHidden=false |
| F8 | 快捷键上限提示矩阵：safeCap=true 且 >2× 出现 toast；safeCap=false 或 ≤2× 不出现 | ✅ PASS | A cfg={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} toast={"present":true,"text":"已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响","opacity":"1"}; B cfg={"enabled":true,"preservesPitch":true,"rate":2 |

## 回归用例（既有行为，v1.0.0 基线）

| # | 用例 | 状态 | 关键证据 |
| --- | --- | --- | --- |
| P0 | 扩展加载层（Chrome 157）：CDP Extensions.loadUnpacked 加载真实扩展 | ✅ PASS | extensionId=jdakeggaeemgneckbpfhlfkhhhoaging, popupPageLoads=true |
| P0b | 扩展 manifest 版本与 content_scripts 匹配范围（真实加载的扩展） | ✅ PASS | version=1.1.0; name=SmartCourse 倍速解锁; matches=["*://smartcourse.hust.edu.cn/*","*://*.hust.edu.cn/*","*://*.chaoxing.com/*","*://*.xuexitong.com/*"] |
| P1 | content script 注入范围：匹配域（*.hust.edu.cn）注入 MAIN-world Hook，非匹配域不注入 | ✅ PASS | matched.hooked=true, outside.hooked=false |
| P2 | 测试流量全部命中本地服务器（host-resolver-rules），未访问真实课程平台 | ✅ PASS | location.host=smartcourse.hust.edu.cn:50427; server-seen host=smartcourse.hust.edu.cn:50427 |
| P3 | 测量通道准备：隔离世界 real rate + MAIN world spoof read + currentTime 斜率 | ✅ PASS | mainCtx=8; sameIframeCtx=9; jwcIframeCtx=10; media=[{"id":"early-audio","ct":0,"rate":1,"paused":true,"ready":4,"pr":true,"dur":10,"err":null}] |
| T1 | 未写入配置时默认行为：enabled=true/rate=2/spoof=true/safeCap=true（真实 2.0，页面读 1，无警告） | ✅ PASS | storageCfg=null; real=2; visible=all 1; ui.safeCap=true; ui.rateWarningHidden=true |
| T2 | 契约配置 chrome.storage.local["sc_speed_cfg_v1"] 写入并生效（经扩展页面，含 safeCap） | ✅ PASS | storage={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; ui.safeCap=true; appliedIn=1ms |
| T3 | 页面设置 playbackRate=3 / defaultPlaybackRate=0.5 → 内部真实倍速保持 2，页面读到 1 | ✅ PASS | pageSet.readBack=1; real=2; visible=1; defaultReal=2 |
| T4a | 页面循环重置（setInterval + ratechange 监听，mode=both）期间真实倍速持续为 2.0 | ✅ PASS | maxDeviation=0ms; page reset attempts 24→33 |
| T4b | page: defaultPlaybackRate=1 + load() 重置后，内部倍速在 ≤1.5s 内恢复为 2 | ✅ PASS | recovery=1ms (ok=true), pageRead=1 |
| T4c | 动态插入的 <audio>/<video> 也被强制为 2.0，且页面读取为 1 | ✅ PASS | audioId=audio-dyn-1 real=2; videoId=video-dyn-2 real=2; visibleAll1=true |
| T4d | 带外（绕过 Hook）把真实倍速改回 1 后，700ms 兜底巡检在 ≤1.5s 内恢复为 2 | ✅ PASS | outOfBandWrite=1; recovery=0ms (ok=true) |
| T4e | 页面篡改 Hook（重定义 playbackRate 属性）后，扩展 ≤1.5s 自动重新接管 | ✅ PASS | tamperedVisibleRead=0.5; repairedIn=365ms; real=2 |
| T5 | spoof=false：页面读取到真实倍速 2.0（关闭伪装实时生效，无需刷新） | ✅ PASS | cfg={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":false}; pageRead=2 in 0ms; real=2 |
| T5b | spoof 重新开启后页面读取立即恢复为 1.0（无需刷新） | ✅ PASS | pageRead=1 in 1ms; real=2 |
| T6a | enabled=false：内部倍速回到 1，页面可正常设置/读取 playbackRate（3.0 / 1.0） | ✅ PASS | hook=true; cfg={"enabled":false,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; afterDisableReal=[1]; set3 real=3 visible=3; set1 real=1 |
| T6b | enabled=true 重新开启：已打开页面无需刷新即恢复强制倍速 2.0 + 页面读 1 | ✅ PASS | cfg={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; real=2 in 2ms; visible=1 |
| T7 | 弹窗点击 2.5× → 安全上限二次确认 → 已打开页面无需刷新即生效（真实 2.5，页面读 1.0，storage 含 safeCap） | ✅ PASS | beforeCfg={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cfg={"enabled":true,"preservesPitch":true,"rate":2.5," |
| T8a | Alt+↑ / Alt+↓ 步进 0.25 并写入 chrome.storage（持久化） | ✅ PASS | AltUp: storage={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} real=2.25; AltDown: storage={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":t |
| T8b | Alt+↓ 在 0.25 下限 / Alt+↑ 在 16 上限均被钳制，不越界 | ✅ PASS | low: storage=0.25, real=0.25; high: confirmShown=true, storage=16, real=16 |
| T8c | 快捷键/配置写入 chrome.storage 持久化：新打开页面直接应用 2.25（storage 含 safeCap） | ✅ PASS | newPage real=2.25 in 1ms; storage={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; setViaConfirm=true |
| T9 | 跨域 iframe（jwc.hust.edu.cn）内媒体同样被强制：real=2.0、页面读=1、currentTime 斜率≈2、带外重置 ≤1.5s 恢复 | ✅ PASS | iframeTags=["iframe-cross-127.0.0.1","iframe-same-origin","iframe-cross-jwc.hust.edu.cn"]; jwc real=2 visible=1 ctSlope=1.98; sameOriginIframe real=2; outOfBand=1; recovery=2ms |
| T10 | 非匹配域跨域 iframe（127.0.0.1）不注入（与 manifest 生效范围一致，信息项） | ✅ PASS | external iframe visible rate=1 |
| T11 | preservesPitch=true 时真实媒体保持音调（页面/真实均 true） | ✅ PASS | real=true, visible=true |
| T12 | 10s 播放稳定性：无 ratechange 风暴 / CPU 暴涨，真实倍速持续 2.0 | ✅ PASS | ratechange +0 (0→5s +0, 5→10s +0), TaskDuration +0.179s, ScriptDuration +0.148s, maxDeviation=0ms, page reset attempts=234 |
| T13 | 弹窗 UI 与 storage 同步（信息项；headless 下注入状态圆点无法代表真实活动标签） | ✅ PASS | ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"safeCap":true,"spoof":true,"preservesPitch":true,"activeChip":"2.0×","rateWarningHidden":true,"rateWarningText":"⚠ 当前 2.25× |

## 逐项细节

### P0 扩展加载层（Chrome 157）：CDP Extensions.loadUnpacked 加载真实扩展 — ✅ PASS

- 预期：扩展被浏览器安装并启用（扩展页面可打开）
- 实测：extensionId=jdakeggaeemgneckbpfhlfkhhhoaging, popupPageLoads=true
- 备注：Chrome 137+ 禁止命令行 --load-extension；CDP Extensions.loadUnpacked 是官方自动化替代通道，加载的是真实 unpacked 扩展（manifest/content scripts 全生效）。

```json
{
  "id": "P0",
  "status": "PASS",
  "evidence": {
    "mechanism": "--enable-unsafe-extension-debugging + CDP Extensions.loadUnpacked",
    "cliLoadExtensionBlocked": "Chrome 157 branded 忽略 --load-extension（见 results/phase-a-results.json A6/A7）",
    "extensionId": "jdakeggaeemgneckbpfhlfkhhhoaging",
    "product": "Chrome/157.0.8103.51",
    "commandLine": [
      "--user-data-dir=C:\\Users\\WR1TE_~1\\AppData\\Local\\Temp\\sc-speed-test-WZKQCv",
      "--remote-debugging-port=0",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-crash-reporter",
      "--noerrdialogs",
      "--disable-popup-blocking",
      "--no-proxy-server",
      "--autoplay-policy=no-user-gesture-required",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-ipc-flooding-protection",
      "--disable-features=Translate,OptimizationHints,MediaRouter,IntensiveWakeUpThrottling",
      "--headless",
      "--host-resolver-rules=MAP smartcourse.hust.edu.cn 127.0.0.1, MAP jwc.hust.edu.cn 127.0.0.1, MAP cross.example 127.0.0.1",
      "--enable-unsafe-extension-debugging"
    ]
  }
}
```

### P0b 扩展 manifest 版本与 content_scripts 匹配范围（真实加载的扩展） — ✅ PASS

- 预期：version=1.1.0；matches 含 *://*.hust.edu.cn/* 与 *://smartcourse.hust.edu.cn/*
- 实测：version=1.1.0; name=SmartCourse 倍速解锁; matches=["*://smartcourse.hust.edu.cn/*","*://*.hust.edu.cn/*","*://*.chaoxing.com/*","*://*.xuexitong.com/*"]

```json
{
  "id": "P0b",
  "status": "PASS",
  "evidence": {
    "manifest": {
      "name": "SmartCourse 倍速解锁",
      "version": "1.1.0",
      "manifestVersion": 3,
      "matches": [
        "*://smartcourse.hust.edu.cn/*",
        "*://*.hust.edu.cn/*",
        "*://*.chaoxing.com/*",
        "*://*.xuexitong.com/*"
      ]
    },
    "extensionId": "jdakeggaeemgneckbpfhlfkhhhoaging",
    "popupUrl": "chrome-extension://jdakeggaeemgneckbpfhlfkhhhoaging/popup/popup.html"
  }
}
```

### P1 content script 注入范围：匹配域（*.hust.edu.cn）注入 MAIN-world Hook，非匹配域不注入 — ✅ PASS

- 预期：smartcourse.hust.edu.cn: hooked=true；127.0.0.1: hooked=false
- 实测：matched.hooked=true, outside.hooked=false

```json
{
  "id": "P1",
  "status": "PASS",
  "evidence": {
    "mainUrl": "http://smartcourse.hust.edu.cn:50427/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main",
    "hookMain": {
      "hooked": true,
      "bridge": false
    },
    "hookOutside": {
      "hooked": false,
      "bridge": false
    }
  }
}
```

### P2 测试流量全部命中本地服务器（host-resolver-rules），未访问真实课程平台 — ✅ PASS

- 预期：页面与服务器 Host 头均为 smartcourse.hust.edu.cn:50427
- 实测：location.host=smartcourse.hust.edu.cn:50427; server-seen host=smartcourse.hust.edu.cn:50427

```json
{
  "id": "P2",
  "status": "PASS",
  "evidence": {
    "mappedInfo": {
      "host": "smartcourse.hust.edu.cn:50427",
      "href": "http://smartcourse.hust.edu.cn:50427/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main"
    },
    "echo": {
      "ok": true,
      "host": "smartcourse.hust.edu.cn:50427",
      "url": "/health",
      "ts": 1794832498193,
      "pid": 66328,
      "serverPort": 50427,
      "wavBytes": 441044
    },
    "rules": "MAP smartcourse.hust.edu.cn 127.0.0.1, MAP jwc.hust.edu.cn 127.0.0.1, MAP cross.example 127.0.0.1"
  }
}
```

### P3 测量通道准备：隔离世界 real rate + MAIN world spoof read + currentTime 斜率 — ✅ PASS

- 预期：主 frame 隔离世界上线、媒体 ready>=2、iframe 隔离世界可建立
- 实测：mainCtx=8; sameIframeCtx=9; jwcIframeCtx=10; media=[{"id":"early-audio","ct":0,"rate":1,"paused":true,"ready":4,"pr":true,"dur":10,"err":null}]

```json
{
  "id": "P3",
  "status": "PASS",
  "evidence": {
    "mediaReady": {
      "count": 1,
      "ready": true,
      "media": [
        {
          "id": "early-audio",
          "ct": 0,
          "rate": 1,
          "paused": true,
          "ready": 4,
          "pr": true,
          "dur": 10,
          "err": null
        }
      ]
    },
    "contexts": {
      "main": 8,
      "sameOriginIframe": 9,
      "crossIframeJwc": 10
    },
    "frames": [
      {
        "id": "AF8EB036051EF66ED7BA413E5A47E548",
        "url": "http://smartcourse.hust.edu.cn:50427/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main",
        "securityOrigin": "http://smartcourse.hust.edu.cn:50427"
      },
      {
        "id": "ED44A9B627E7FD1E74CB439688DFF372",
        "url": "http://smartcourse.hust.edu.cn:50427/test/iframe?mode=both&tag=iframe-same-origin",
        "securityOrigin": "http://smartcourse.hust.edu.cn:50427"
      },
      {
        "id": "00B7032D8714BE429EA61267E55B0081",
        "url": "http://jwc.hust.edu.cn:50427/test/iframe?mode=both&tag=iframe-cross-jwc.hust.edu.cn",
        "securityOrigin": "http://jwc.hust.edu.cn:50427"
      }
    ]
  }
}
```

### T1 未写入配置时默认行为：enabled=true/rate=2/spoof=true/safeCap=true（真实 2.0，页面读 1，无警告） — ✅ PASS

- 预期：storage 为空 → hook 使用默认 rate=2、spoof=1.0、safeCap=true；真实内部倍速=2；popup 无 rateWarning
- 实测：storageCfg=null; real=2; visible=all 1; ui.safeCap=true; ui.rateWarningHidden=true

```json
{
  "id": "T1",
  "status": "PASS",
  "evidence": {
    "cfgFresh": null,
    "realRates": [
      {
        "id": "early-audio",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 0.770562,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "visibleMedia": [
      {
        "id": "early-audio",
        "ct": 0.77206,
        "rate": 1,
        "paused": false,
        "ready": 4,
        "pr": true,
        "dur": 10,
        "err": null
      }
    ],
    "uiFresh": {
      "rateValue": "2.0",
      "customRate": "2.0",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.0×",
      "rateWarningHidden": true,
      "rateWarningText": "",
      "rateWarningDisplay": "none",
      "confirmMaskHidden": true,
      "confirmText": "",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    },
    "playStart": [
      {
        "ok": true
      }
    ]
  }
}
```

### F0 旧配置缺失 safeCap 时按默认 true：默认配置下 Alt+↑ 2→2.25 出现上限 toast（#__smartcourse_speed_toast__） — ✅ PASS

- 预期：storage 为空 → hotkey 调到 2.25 时 MAIN world 出现 toast，文本含 "2.25×" 与 "2× 上限"；storage 持久化对象含 safeCap=true
- 实测：cfg={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; toast={"present":true,"text":"已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响","opacity":"1"}; real=2.25

```json
{
  "id": "F0",
  "status": "PASS",
  "evidence": {
    "toastBefore": {
      "present": false,
      "text": null
    },
    "cfgAfter": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.25,
      "safeCap": true,
      "spoof": true
    },
    "toast": {
      "present": true,
      "text": "已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响",
      "opacity": "1"
    },
    "real": {
      "ok": true,
      "value": 2.25,
      "elapsedMs": 1
    }
  }
}
```

### F1 popup 安全上限 DOM：#toggleSafeCap / #rateWarning / #confirmMask-#confirmText-#confirmOk-#confirmCancel 均存在 — ✅ PASS

- 预期：6 个元素均存在；rate=2（≤2）时 rateWarning.hidden=true；confirmMask 初始 hidden
- 实测：dom={"hasToggleSafeCap":true,"hasRateWarning":true,"hasConfirmMask":true,"hasConfirmText":true,"hasConfirmOk":true,"hasConfirmCancel":true}; ui.safeCap=true; ui.rateWarningHidden=true; ui.confirmMaskHidden=true

```json
{
  "id": "F1",
  "status": "PASS",
  "evidence": {
    "domF1": {
      "hasToggleSafeCap": true,
      "hasRateWarning": true,
      "hasConfirmMask": true,
      "hasConfirmText": true,
      "hasConfirmOk": true,
      "hasConfirmCancel": true
    },
    "uiF1": {
      "rateValue": "2.0",
      "customRate": "2.0",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.0×",
      "rateWarningHidden": true,
      "rateWarningText": "⚠ 当前 2.25× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "none",
      "confirmMaskHidden": true,
      "confirmText": "",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    }
  }
}
```

### F2 旧配置（storage 中无 safeCap）按默认 true 处理：rate=2.5 时 #toggleSafeCap 勾选、#rateWarning 可见 — ✅ PASS

- 预期：写入不含 safeCap 的旧对象（持久化后仍无该字段）；UI 归一化后 safeCap=true、警告含“2× 上限”；页面真实 2.5
- 实测：stored={"enabled":true,"preservesPitch":true,"rate":2.5,"spoof":true}; ui.safeCap=true; warningHidden=false; text=⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响; real=2.5

```json
{
  "id": "F2",
  "status": "PASS",
  "evidence": {
    "legacyCfg": {
      "enabled": true,
      "rate": 2.5,
      "spoof": true,
      "preservesPitch": true
    },
    "legacyWritten": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.5,
      "spoof": true
    },
    "legacyUi": {
      "rateValue": "2.5",
      "customRate": "2.5",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.5×",
      "rateWarningHidden": false,
      "rateWarningText": "⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "block",
      "confirmMaskHidden": true,
      "confirmText": "",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    },
    "legacyReal": {
      "ok": true,
      "value": 2.5,
      "elapsedMs": 0
    }
  }
}
```

### F3 #rateWarning 可见性矩阵：safeCap=true 且 rate>2 可见（文本含“2× 上限”），其余 hidden — ✅ PASS

- 预期：rate=2.5+safeCap → visible；rate=2.5+safeCap=false → hidden；rate=2+safeCap → hidden
- 实测：safeCap=true rate=2.5: hidden=false; safeCap=false rate=2.5: hidden=true; safeCap=true rate=2: hidden=true

```json
{
  "id": "F3",
  "status": "PASS",
  "evidence": {
    "warnMatrix": [
      {
        "label": "safeCap=true rate=2.5",
        "expectVisible": true,
        "stored": {
          "enabled": true,
          "preservesPitch": true,
          "rate": 2.5,
          "safeCap": true,
          "spoof": true
        },
        "ui": {
          "rateValue": "2.5",
          "customRate": "2.5",
          "enabled": true,
          "safeCap": true,
          "spoof": true,
          "preservesPitch": true,
          "activeChip": "2.5×",
          "rateWarningHidden": false,
          "rateWarningText": "⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响",
          "rateWarningDisplay": "block",
          "confirmMaskHidden": true,
          "confirmText": "",
          "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
          "statusDotClass": "dot warn"
        },
        "ok": true
      },
      {
        "label": "safeCap=false rate=2.5",
        "expectVisible": false,
        "stored": {
          "enabled": true,
          "preservesPitch": true,
          "rate": 2.5,
          "safeCap": false,
          "spoof": true
        },
        "ui": {
          "rateValue": "2.5",
          "customRate": "2.5",
          "enabled": true,
          "safeCap": false,
          "spoof": true,
          "preservesPitch": true,
          "activeChip": "2.5×",
          "rateWarningHidden": true,
          "rateWarningText": "⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响",
          "rateWarningDisplay": "none",
          "confirmMaskHidden": true,
          "confirmText": "",
          "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
          "statusDotClass": "dot warn"
        },
        "ok": true
      },
      {
        "label": "safeCap=true rate=2",
        "expectVisible": false,
        "stored": {
          "enabled": true,
          "preservesPitch": true,
          "rate": 2,
          "safeCap": true,
          "spoof": true
        },
        "ui": {
          "rateValue": "2.0",
          "customRate": "2.0",
          "enabled": true,
          "safeCap": true,
          "spoof": true,
          "preservesPitch": true,
          "activeChip": "2.0×",
          "rateWarningHidden": true,
          "rateWarningText": "⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响",
          "rateWarningDisplay": "none",
          "confirmMaskHidden": true,
          "confirmText": "",
          "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
          "statusDotClass": "dot warn"
        },
        "ok": true
      }
    ]
  }
}
```

### F4 safeCap=true 点 .chip[data-rate="2.5"] → #confirmMask 显示、#confirmText 含 2.5×；点 #confirmCancel 取消且 rate 不变 — ✅ PASS

- 预期：确认框出现且文本含目标倍速；取消后 mask 隐藏、storage/真实倍速保持 2.0、页面读 1
- 实测：confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cancelHidden=true; rateBefore=2; rateAfterCancel=2; realAfterCancel=2; visible=1

```json
{
  "id": "F4",
  "status": "PASS",
  "evidence": {
    "f4Chip": {
      "ok": true
    },
    "f4Confirm": {
      "maskExists": true,
      "maskHidden": false,
      "maskDisplay": "flex",
      "text": "即将切换到 2.5×，超过平台允许的 2× 上限。",
      "okButtonVisible": true
    },
    "f4StorageBeforeCancel": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "f4RealBeforeCancel": 2,
    "f4Cancel": {
      "ok": true
    },
    "f4Hidden": {
      "maskExists": true,
      "maskHidden": true,
      "maskDisplay": "none",
      "text": "即将切换到 2.5×，超过平台允许的 2× 上限。",
      "okButtonVisible": false
    },
    "f4StorageAfter": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "f4RealAfter": 2,
    "f4VisibleAfter": 1
  }
}
```

### F5 safeCap=true 自定义输入 3.5 + #applyCustom → 确认框；取消不改；#confirmOk 后 rate=3.5 实时生效、页面读 1、storage 含 safeCap、警告显示 — ✅ PASS

- 预期：取消：rate 保持 2；确认：mask 隐藏、storage rate=3.5 且 safeCap=true、页面 real=3.5、页面读 1、rateWarning 可见
- 实测：confirmText=即将切换到 3.5×，超过平台允许的 2× 上限。; afterCancel rate=2 real=2; afterOk cfg={"enabled":true,"preservesPitch":true,"rate":3.5,"safeCap":true,"spoof":true} real=3.5 visible=1 warningHidden=false

```json
{
  "id": "F5",
  "status": "PASS",
  "evidence": {
    "f5ConfirmCancel": {
      "maskExists": true,
      "maskHidden": false,
      "maskDisplay": "flex",
      "text": "即将切换到 3.5×，超过平台允许的 2× 上限。",
      "okButtonVisible": true
    },
    "f5StorageBefore": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "f5StorageAfterCancel": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "f5RealAfterCancel": 2,
    "f5ConfirmOk": {
      "maskExists": true,
      "maskHidden": false,
      "maskDisplay": "flex",
      "text": "即将切换到 3.5×，超过平台允许的 2× 上限。",
      "okButtonVisible": true
    },
    "f5Cfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 3.5,
      "safeCap": true,
      "spoof": true
    },
    "f5Real": {
      "ok": true,
      "value": 3.5,
      "elapsedMs": 1
    },
    "f5Visible": 1,
    "f5Ui": {
      "rateValue": "3.5",
      "customRate": "3.5",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": null,
      "rateWarningHidden": false,
      "rateWarningText": "⚠ 当前 3.5× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "block",
      "confirmMaskHidden": true,
      "confirmText": "即将切换到 3.5×，超过平台允许的 2× 上限。",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    }
  }
}
```

### F6 ≤2×（1.5/2.0 档位、自定义 1.75）直接生效，不出现确认框 — ✅ PASS

- 预期：三种 ≤2× 设置均无 #confirmMask，storage 与页面真实倍速立即变为目标值
- 实测：chip:1.5 confirmHidden=true cfg=true real=1.5; chip:2 confirmHidden=true cfg=true real=2; custom:1.75 confirmHidden=true cfg=true real=1.75

```json
{
  "id": "F6",
  "status": "PASS",
  "evidence": {
    "directResults": [
      {
        "kind": "chip",
        "rate": "1.5",
        "action": {
          "ok": true
        },
        "snapshot": {
          "hidden": true,
          "text": "即将切换到 3.5×，超过平台允许的 2× 上限。"
        },
        "cfgOk": true,
        "realOk": true,
        "real": 1.5,
        "afterHidden": {
          "hidden": true,
          "text": "即将切换到 3.5×，超过平台允许的 2× 上限。"
        },
        "pass": true
      },
      {
        "kind": "chip",
        "rate": "2",
        "action": {
          "ok": true
        },
        "snapshot": {
          "hidden": true,
          "text": "即将切换到 3.5×，超过平台允许的 2× 上限。"
        },
        "cfgOk": true,
        "realOk": true,
        "real": 2,
        "afterHidden": {
          "hidden": true,
          "text": "即将切换到 3.5×，超过平台允许的 2× 上限。"
        },
        "pass": true
      },
      {
        "kind": "custom",
        "rate": "1.75",
        "action": {
          "ok": true,
          "value": "1.75"
        },
        "snapshot": {
          "hidden": true,
          "text": "即将切换到 3.5×，超过平台允许的 2× 上限。"
        },
        "cfgOk": true,
        "realOk": true,
        "real": 1.75,
        "afterHidden": {
          "hidden": true,
          "text": "即将切换到 3.5×，超过平台允许的 2× 上限。"
        },
        "pass": true
      }
    ]
  }
}
```

### F7 safeCap=false：点 2.5× 无确认框、无警告、直接生效；重新开启 safeCap 后（rate 仍 2.5）警告恢复 — ✅ PASS

- 预期：safeCap=false 时 >2× 直接生效且 mask hidden、warning hidden；重新开启后 warning 可见且文本含“2× 上限”
- 实测：off cfg={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":false,"spoof":true}; snapshotHidden=true; rate=2.5; real=2.5; warningHidden=true; afterReenable warningHidden=false

```json
{
  "id": "F7",
  "status": "PASS",
  "evidence": {
    "f7OffCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": false,
      "spoof": true
    },
    "f7Snapshot": {
      "hidden": true,
      "text": "即将切换到 3.5×，超过平台允许的 2× 上限。"
    },
    "f7Cfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.5,
      "safeCap": false,
      "spoof": true
    },
    "f7Real": {
      "ok": true,
      "value": 2.5,
      "elapsedMs": 1
    },
    "f7Ui": {
      "rateValue": "2.5",
      "customRate": "2.5",
      "enabled": true,
      "safeCap": false,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.5×",
      "rateWarningHidden": true,
      "rateWarningText": "⚠ 当前 3.5× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "none",
      "confirmMaskHidden": true,
      "confirmText": "即将切换到 3.5×，超过平台允许的 2× 上限。",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    },
    "f7OnUi": {
      "rateValue": "2.5",
      "customRate": "2.5",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.5×",
      "rateWarningHidden": false,
      "rateWarningText": "⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "block",
      "confirmMaskHidden": true,
      "confirmText": "即将切换到 3.5×，超过平台允许的 2× 上限。",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    }
  }
}
```

### F8 快捷键上限提示矩阵：safeCap=true 且 >2× 出现 toast；safeCap=false 或 ≤2× 不出现 — ✅ PASS

- 预期：A: 2→2.25 出现 toast（含 2.25× 与 2× 上限）；B: safeCap=false 时无 toast；C: 1.5→1.75（≤2）无 toast
- 实测：A cfg={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} toast={"present":true,"text":"已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响","opacity":"1"}; B cfg={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":false,"spoof":true} toastPresent=false; C cfg={"enabled":true,"preservesPitch":true,"rate":1.75,"safeCap":true,"spoof":true} toastPresent=false

```json
{
  "id": "F8",
  "status": "PASS",
  "evidence": {
    "a": {
      "before": {
        "present": false,
        "text": null
      },
      "cfg": {
        "enabled": true,
        "preservesPitch": true,
        "rate": 2.25,
        "safeCap": true,
        "spoof": true
      },
      "toast": {
        "present": true,
        "text": "已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响",
        "opacity": "1"
      },
      "real": {
        "ok": true,
        "value": 2.25,
        "elapsedMs": 1
      }
    },
    "b": {
      "cfg": {
        "enabled": true,
        "preservesPitch": true,
        "rate": 2.25,
        "safeCap": false,
        "spoof": true
      },
      "toast": {
        "present": false,
        "text": null
      }
    },
    "c": {
      "cfg": {
        "enabled": true,
        "preservesPitch": true,
        "rate": 1.75,
        "safeCap": true,
        "spoof": true
      },
      "toast": {
        "present": false,
        "text": null
      }
    }
  }
}
```

### T2 契约配置 chrome.storage.local["sc_speed_cfg_v1"] 写入并生效（经扩展页面，含 safeCap） — ✅ PASS

- 预期：{"enabled":true,"rate":2,"spoof":true,"preservesPitch":true,"safeCap":true}；写入后已打开页面真实倍速=2
- 实测：storage={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; ui.safeCap=true; appliedIn=1ms

```json
{
  "id": "T2",
  "status": "PASS",
  "evidence": {
    "cfgWrite": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "ui": {
      "rateValue": "2.0",
      "customRate": "2.0",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.0×",
      "rateWarningHidden": true,
      "rateWarningText": "⚠ 当前 2.25× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "none",
      "confirmMaskHidden": true,
      "confirmText": "即将切换到 3.5×，超过平台允许的 2× 上限。",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    },
    "apply2": {
      "ok": true,
      "value": 2,
      "elapsedMs": 1
    }
  }
}
```

### T3 页面设置 playbackRate=3 / defaultPlaybackRate=0.5 → 内部真实倍速保持 2，页面读到 1 — ✅ PASS

- 预期：page set 3 → real 2.0；page read 1；defaultPlaybackRate 也被重定向为 2
- 实测：pageSet.readBack=1; real=2; visible=1; defaultReal=2

```json
{
  "id": "T3",
  "status": "PASS",
  "evidence": {
    "setAttempt": {
      "readBack": 1
    },
    "t3Real": 2,
    "t3Visible": 1,
    "t3Def": {
      "readBack": 1
    },
    "realMedia": [
      {
        "id": "early-audio",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 7.322718,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ]
  }
}
```

### T4a 页面循环重置（setInterval + ratechange 监听，mode=both）期间真实倍速持续为 2.0 — ✅ PASS

- 预期：真实倍速偏离 2.0 的最长持续时间 ≤ 1500ms（实测应≈0）
- 实测：maxDeviation=0ms; page reset attempts 24→33

```json
{
  "id": "T4a",
  "status": "PASS",
  "evidence": {
    "maxDeviationMs": 0,
    "resetsBefore": 24,
    "resetsAfter": 33,
    "samples": [
      {
        "t": 0,
        "rate": 2
      },
      {
        "t": 56,
        "rate": 2
      },
      {
        "t": 102,
        "rate": 2
      },
      {
        "t": 146,
        "rate": 2
      },
      {
        "t": 192,
        "rate": 2
      },
      {
        "t": 239,
        "rate": 2
      },
      {
        "t": 284,
        "rate": 2
      },
      {
        "t": 331,
        "rate": 2
      },
      {
        "t": 377,
        "rate": 2
      },
      {
        "t": 424,
        "rate": 2
      },
      {
        "t": 471,
        "rate": 2
      },
      {
        "t": 516,
        "rate": 2
      },
      {
        "t": 563,
        "rate": 2
      },
      {
        "t": 609,
        "rate": 2
      },
      {
        "t": 656,
        "rate": 2
      },
      {
        "t": 703,
        "rate": 2
      },
      {
        "t": 748,
        "rate": 2
      },
      {
        "t": 793,
        "rate": 2
      },
      {
        "t": 840,
        "rate": 2
      },
      {
        "t": 887,
        "rate": 2
      },
      {
        "t": 932,
        "rate": 2
      },
      {
        "t": 979,
        "rate": 2
      },
      {
        "t": 1025,
        "rate": 2
      },
      {
        "t": 1071,
        "rate": 2
      },
      {
        "t": 1117,
        "rate": 2
      },
      {
        "t": 1163,
        "rate": 2
      },
      {
        "t": 1209,
        "rate": 2
      },
      {
        "t": 1255,
        "rate": 2
      },
      {
        "t": 1301,
        "rate": 2
      },
      {
        "t": 1346,
        "rate": 2
      },
      {
        "t": 1393,
        "rate": 2
      },
      {
        "t": 1439,
        "rate": 2
      },
      {
        "t": 1485,
        "rate": 2
      },
      {
        "t": 1532,
        "rate": 2
      },
      {
        "t": 1578,
        "rate": 2
      },
      {
        "t": 1626,
        "rate": 2
      },
      {
        "t": 1672,
        "rate": 2
      },
      {
        "t": 1719,
        "rate": 2
      },
      {
        "t": 1765,
        "rate": 2
      },
      {
        "t": 1812,
        "rate": 2
      },
      {
        "t": 1859,
        "rate": 2
      },
      {
        "t": 1904,
        "rate": 2
      },
      {
        "t": 1951,
        "rate": 2
      },
      {
        "t": 1997,
        "rate": 2
      }
    ]
  }
}
```

### T4b page: defaultPlaybackRate=1 + load() 重置后，内部倍速在 ≤1.5s 内恢复为 2 — ✅ PASS

- 预期：恢复耗时 ≤ 1500ms，恢复后页面读取仍为 1
- 实测：recovery=1ms (ok=true), pageRead=1

```json
{
  "id": "T4b",
  "status": "PASS",
  "evidence": {
    "resetCall": true,
    "t4b": {
      "ok": true,
      "value": 2,
      "elapsedMs": 1
    },
    "pageReadAfter": 1
  }
}
```

### T4c 动态插入的 <audio>/<video> 也被强制为 2.0，且页面读取为 1 — ✅ PASS

- 预期：新插入元素 real=2.0，visible=1
- 实测：audioId=audio-dyn-1 real=2; videoId=video-dyn-2 real=2; visibleAll1=true

```json
{
  "id": "T4c",
  "status": "PASS",
  "evidence": {
    "dynAudio": "audio-dyn-1",
    "dynVideo": "video-dyn-2",
    "dynReals": [
      {
        "id": "early-audio",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 0,
        "paused": true,
        "ready": 4,
        "err": null
      },
      {
        "id": "audio-dyn-1",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 0,
        "paused": true,
        "ready": 4,
        "err": null
      },
      {
        "id": "video-dyn-2",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 0,
        "paused": true,
        "ready": 4,
        "err": null
      }
    ],
    "visible": [
      {
        "id": "early-audio",
        "rate": 1
      },
      {
        "id": "audio-dyn-1",
        "rate": 1
      },
      {
        "id": "video-dyn-2",
        "rate": 1
      }
    ],
    "dynRealsAfterPlay": [
      {
        "id": "early-audio",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.117048,
        "paused": false,
        "ready": 4,
        "err": null
      },
      {
        "id": "audio-dyn-1",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.116938,
        "paused": false,
        "ready": 4,
        "err": null
      },
      {
        "id": "video-dyn-2",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.116832,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ]
  }
}
```

### T4d 带外（绕过 Hook）把真实倍速改回 1 后，700ms 兜底巡检在 ≤1.5s 内恢复为 2 — ✅ PASS

- 预期：恢复耗时 ≤ 1500ms（扩展 700ms 周期 forceAll 兜底）
- 实测：outOfBandWrite=1; recovery=0ms (ok=true)

```json
{
  "id": "T4d",
  "status": "PASS",
  "evidence": {
    "outOfBandWrite": 1,
    "t4d": {
      "ok": true,
      "value": 2,
      "elapsedMs": 0
    }
  }
}
```

### T4e 页面篡改 Hook（重定义 playbackRate 属性）后，扩展 ≤1.5s 自动重新接管 — ✅ PASS

- 预期：篡改后页面读到 0.5（异常值）；≤1500ms 恢复为伪装值 1，真实倍速仍为 2
- 实测：tamperedVisibleRead=0.5; repairedIn=365ms; real=2
- 备注：对应 README“页面若重新定义/删除属性，700ms 周期巡检会重新接管”。

```json
{
  "id": "T4e",
  "status": "PASS",
  "evidence": {
    "tamper": {
      "tamperVisibleRead": 0.5
    },
    "repaired": {
      "ok": true,
      "value": 1,
      "elapsedMs": 365
    },
    "repairedReal": 2
  }
}
```

### T5 spoof=false：页面读取到真实倍速 2.0（关闭伪装实时生效，无需刷新） — ✅ PASS

- 预期：storage.spoof=false 后 ≤1.5s 页面读 =2.0，真实 =2.0
- 实测：cfg={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":false}; pageRead=2 in 0ms; real=2

```json
{
  "id": "T5",
  "status": "PASS",
  "evidence": {
    "spoofOffCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": false
    },
    "pageRead": {
      "ok": true,
      "value": 2,
      "elapsedMs": 0
    },
    "realRate": 2
  }
}
```

### T5b spoof 重新开启后页面读取立即恢复为 1.0（无需刷新） — ✅ PASS

- 预期：页面读=1.0，真实=2.0
- 实测：pageRead=1 in 1ms; real=2

```json
{
  "id": "T5b",
  "status": "PASS",
  "evidence": {
    "spoofBack": {
      "ok": true,
      "value": 1,
      "elapsedMs": 1
    }
  }
}
```

### T6a enabled=false：内部倍速回到 1，页面可正常设置/读取 playbackRate（3.0 / 1.0） — ✅ PASS

- 预期：关闭后 ≤2s 全部媒体 real=1；页面 set 3 → real 3 且页面读 3；set 1 → real 1
- 实测：hook=true; cfg={"enabled":false,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; afterDisableReal=[1]; set3 real=3 visible=3; set1 real=1

```json
{
  "id": "T6a",
  "status": "PASS",
  "evidence": {
    "offPageHook": {
      "hooked": true,
      "bridge": false
    },
    "offCfg": {
      "enabled": false,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "offDefault": 2,
    "afterDisable": [
      {
        "id": "early-audio",
        "rate": 1,
        "def": 2,
        "pr": true,
        "ct": 0,
        "paused": true,
        "ready": 4,
        "err": null
      }
    ],
    "offSet": 3,
    "offReal3": 3,
    "offVisible3": 3,
    "offReset": 1,
    "offReal1": 1
  }
}
```

### T6b enabled=true 重新开启：已打开页面无需刷新即恢复强制倍速 2.0 + 页面读 1 — ✅ PASS

- 预期：≤1.5s 恢复 real=2.0，页面读=1.0
- 实测：cfg={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; real=2 in 2ms; visible=1

```json
{
  "id": "T6b",
  "status": "PASS",
  "evidence": {
    "onCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "onReal": {
      "ok": true,
      "value": 2,
      "elapsedMs": 2
    },
    "onVisible": 1
  }
}
```

### T7 弹窗点击 2.5× → 安全上限二次确认 → 已打开页面无需刷新即生效（真实 2.5，页面读 1.0，storage 含 safeCap） — ✅ PASS

- 预期：点 2.5× 出现确认框（文本含 2.5×）→ 点“仍然使用”后 mask 隐藏、storage/UI=2.5 且含 safeCap、页面 real=2.5、visible=1.0，≤1.5s
- 实测：beforeCfg={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cfg={"enabled":true,"preservesPitch":true,"rate":2.5,"safeCap":true,"spoof":true}; real=2.5 in 0ms; visible=1; ui.rateValue=2.5

```json
{
  "id": "T7",
  "status": "PASS",
  "evidence": {
    "t7BeforeCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "chipRes": {
      "ok": true
    },
    "t7Confirm": {
      "maskExists": true,
      "maskHidden": false,
      "maskDisplay": "flex",
      "text": "即将切换到 2.5×，超过平台允许的 2× 上限。",
      "okButtonVisible": true
    },
    "t7OkClick": {
      "ok": true
    },
    "t7Hidden": {
      "maskExists": true,
      "maskHidden": true,
      "maskDisplay": "none",
      "text": "即将切换到 2.5×，超过平台允许的 2× 上限。",
      "okButtonVisible": false
    },
    "cfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.5,
      "safeCap": true,
      "spoof": true
    },
    "real25": {
      "ok": true,
      "value": 2.5,
      "elapsedMs": 0
    },
    "vis25": 1,
    "ui25": {
      "rateValue": "2.5",
      "customRate": "2.5",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.5×",
      "rateWarningHidden": false,
      "rateWarningText": "⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "block",
      "confirmMaskHidden": true,
      "confirmText": "即将切换到 2.5×，超过平台允许的 2× 上限。",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    }
  }
}
```

### T8a Alt+↑ / Alt+↓ 步进 0.25 并写入 chrome.storage（持久化） — ✅ PASS

- 预期：2.00 →(Alt+↑) 2.25 →(Alt+↓) 2.00；storage 与弹窗 UI 同步
- 实测：AltUp: storage={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} real=2.25; AltDown: storage={"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true} real=2; ui=2.25

```json
{
  "id": "T8a",
  "status": "PASS",
  "evidence": {
    "backTo2": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "altUpCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.25,
      "safeCap": true,
      "spoof": true
    },
    "altUpReal": {
      "ok": true,
      "value": 2.25,
      "elapsedMs": 67
    },
    "altUpUi": {
      "rateValue": "2.25",
      "customRate": "2.25",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": null,
      "rateWarningHidden": false,
      "rateWarningText": "⚠ 当前 2.25× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "block",
      "confirmMaskHidden": true,
      "confirmText": "即将切换到 2.5×，超过平台允许的 2× 上限。",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    },
    "altDownCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "altDownReal": {
      "ok": true,
      "value": 2,
      "elapsedMs": 61
    }
  }
}
```

### T8b Alt+↓ 在 0.25 下限 / Alt+↑ 在 16 上限均被钳制，不越界 — ✅ PASS

- 预期：下限 0.25 保持；上限 16 保持（16 通过自定义输入 + 安全上限确认设置）
- 实测：low: storage=0.25, real=0.25; high: confirmShown=true, storage=16, real=16

```json
{
  "id": "T8b",
  "status": "PASS",
  "evidence": {
    "lowCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 0.25,
      "safeCap": true,
      "spoof": true
    },
    "lowReal": 0.25,
    "highSet": {
      "confirmShown": true,
      "confirm": {
        "maskExists": true,
        "maskHidden": false,
        "maskDisplay": "flex",
        "text": "即将切换到 16.0×，超过平台允许的 2× 上限。",
        "okButtonVisible": true
      }
    },
    "highCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 16,
      "safeCap": true,
      "spoof": true
    },
    "highReal": 16
  }
}
```

### T8c 快捷键/配置写入 chrome.storage 持久化：新打开页面直接应用 2.25（storage 含 safeCap） — ✅ PASS

- 预期：新页面（未刷新前即已写入 storage）real=2.25；storage 对象含 safeCap
- 实测：newPage real=2.25 in 1ms; storage={"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; setViaConfirm=true

```json
{
  "id": "T8c",
  "status": "PASS",
  "evidence": {
    "persistSet": {
      "confirmShown": true,
      "confirm": {
        "maskExists": true,
        "maskHidden": false,
        "maskDisplay": "flex",
        "text": "即将切换到 2.25×，超过平台允许的 2× 上限。",
        "okButtonVisible": true
      }
    },
    "persistReal": {
      "ok": true,
      "value": 2.25,
      "elapsedMs": 1
    },
    "persistCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.25,
      "safeCap": true,
      "spoof": true
    }
  }
}
```

### T9 跨域 iframe（jwc.hust.edu.cn）内媒体同样被强制：real=2.0、页面读=1、currentTime 斜率≈2、带外重置 ≤1.5s 恢复 — ✅ PASS

- 预期：all_frames 生效：跨域/同源子框架 real=2.0、visible=1、媒体时钟斜率≈2、兜底恢复 ≤1500ms
- 实测：iframeTags=["iframe-cross-127.0.0.1","iframe-same-origin","iframe-cross-jwc.hust.edu.cn"]; jwc real=2 visible=1 ctSlope=1.98; sameOriginIframe real=2; outOfBand=1; recovery=2ms

```json
{
  "id": "T9",
  "status": "PASS",
  "evidence": {
    "iframeTags": [
      "iframe-cross-127.0.0.1",
      "iframe-same-origin",
      "iframe-cross-jwc.hust.edu.cn"
    ],
    "jwcVisibleRate": {
      "rate": 1,
      "id": "early-audio",
      "tag": "iframe-cross-jwc.hust.edu.cn",
      "resets": 59
    },
    "jwcReals": [
      {
        "id": "early-audio",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 2.714188,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "sameReals": [
      {
        "id": "early-audio",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 2.716936,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "jwcOob": 1,
    "jwcRecovery": {
      "ok": true,
      "value": 2,
      "elapsedMs": 2
    },
    "jwcSlope": {
      "rate": 1.9810057615175003,
      "n": 12,
      "playing": true
    },
    "jwcFrame": {
      "id": "00B7032D8714BE429EA61267E55B0081",
      "url": "http://jwc.hust.edu.cn:50427/test/iframe?mode=both&tag=iframe-cross-jwc.hust.edu.cn",
      "securityOrigin": "http://jwc.hust.edu.cn:50427"
    }
  }
}
```

### T10 非匹配域跨域 iframe（127.0.0.1）不注入（与 manifest 生效范围一致，信息项） — ✅ PASS

- 预期：127.0.0.1 不在 *.hust.edu.cn / *.chaoxing.com / *.xuexitong.com 内 → 不注入，页面读=1（平台播放器 iframe 若换域名需自行加 matches）
- 实测：external iframe visible rate=1
- 备注：行为契约里的“跨域 iframe”用同平台的 jwc.hust.edu.cn 验证（见 T9）；完全外部域不在扩展匹配范围，属于设计限制。

```json
{
  "id": "T10",
  "status": "PASS",
  "evidence": {
    "externalState": {
      "rate": 1,
      "tag": "iframe-cross-127.0.0.1",
      "resets": 45
    }
  }
}
```

### T11 preservesPitch=true 时真实媒体保持音调（页面/真实均 true） — ✅ PASS

- 预期：audio.preservesPitch === true（真实与页面读取一致）
- 实测：real=true, visible=true

```json
{
  "id": "T11",
  "status": "PASS",
  "evidence": {
    "pitchEarly": {
      "id": "early-audio",
      "rate": 2,
      "def": 2,
      "pr": true,
      "ct": 10,
      "paused": true,
      "ready": 4,
      "err": null
    },
    "pitchVisibleEarly": {
      "id": "early-audio",
      "ct": 10,
      "rate": 1,
      "paused": true,
      "ready": 4,
      "pr": true,
      "dur": 10,
      "err": null
    }
  }
}
```

### T12 10s 播放稳定性：无 ratechange 风暴 / CPU 暴涨，真实倍速持续 2.0 — ✅ PASS

- 预期：10s 内 ratechange 增量 ≤120（后半段 ≤60，无持续风暴）、TaskDuration 增量 <8s、真实倍速偏离 ≤1.5s
- 实测：ratechange +0 (0→5s +0, 5→10s +0), TaskDuration +0.179s, ScriptDuration +0.148s, maxDeviation=0ms, page reset attempts=234

```json
{
  "id": "T12",
  "status": "PASS",
  "evidence": {
    "rc0": 0,
    "rc5": 0,
    "rc10": 0,
    "ratechangeBurst": 0,
    "ratechangeSecondHalf": 0,
    "taskDelta": 0.179,
    "scriptDelta": 0.148,
    "maxDeviationMs": 0,
    "pageResets": 234,
    "samples": [
      {
        "t": 0,
        "rate": 2
      },
      {
        "t": 1076,
        "rate": 2
      },
      {
        "t": 2159,
        "rate": 2
      },
      {
        "t": 3239,
        "rate": 2
      },
      {
        "t": 4316,
        "rate": 2
      },
      {
        "t": 323,
        "rate": 2
      },
      {
        "t": 1403,
        "rate": 2
      },
      {
        "t": 2481,
        "rate": 2
      },
      {
        "t": 3559,
        "rate": 2
      },
      {
        "t": 4631,
        "rate": 2
      }
    ]
  }
}
```

### T13 弹窗 UI 与 storage 同步（信息项；headless 下注入状态圆点无法代表真实活动标签） — ✅ PASS

- 预期：弹窗显示 storage 中的倍速/开关；状态圆点逻辑依赖 chrome.tabs active 标签，自动化场景不具代表性
- 实测：ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"safeCap":true,"spoof":true,"preservesPitch":true,"activeChip":"2.0×","rateWarningHidden":true,"rateWarningText":"⚠ 当前 2.25× 超过平台允许的 2× 上限，任务点记录可能受影响","rateWarningDisplay":"none","confirmMaskHidden":true,"confirmText":"即将切换到 2.25×，超过平台允许的 2× 上限。","statusText":"当前标签页不在生效范围（请打开课程视频页面）","statusDotClass":"dot warn"}

```json
{
  "id": "T13",
  "status": "PASS",
  "evidence": {
    "popupUi": {
      "rateValue": "2.0",
      "customRate": "2.0",
      "enabled": true,
      "safeCap": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.0×",
      "rateWarningHidden": true,
      "rateWarningText": "⚠ 当前 2.25× 超过平台允许的 2× 上限，任务点记录可能受影响",
      "rateWarningDisplay": "none",
      "confirmMaskHidden": true,
      "confirmText": "即将切换到 2.25×，超过平台允许的 2× 上限。",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    }
  }
}
```

## 已知限制 / 未覆盖项

0. **未使用 CDP 注入回退方案**：本报告全部用例都在“真实加载的 MV3 扩展”（CDP `Extensions.loadUnpacked`，manifest/content scripts/MAIN world/all_frames 均真实生效）下执行，不存在“只能通过 CDP 注入验证”的行为契约用例；不可自动验证的只有：浏览器 UI 安装动作本身、真实平台服务端判定、真实平台前端改版后的实际适配。
1. **浏览器 UI 安装路径未自动化验证**：本次通过 CDP 加载扩展；`chrome://extensions` 手动“加载已解压的扩展程序”属于浏览器 UI 操作，headless 无法点击原生文件选择框。但扩展加载后的运行机制完全一致。
2. **完全外部域的跨域 iframe 不注入**：manifest 只匹配 `*.hust.edu.cn` / `*.chaoxing.com` / `*.xuexitong.com`。用同平台跨域子域 `jwc.hust.edu.cn` 验证了跨域 iframe（T9）；`127.0.0.1` 外部 iframe 预期不注入（T10，信息项）。
3. **真实平台未访问**：按任务要求不做登录/不做真实平台请求；播放器防御逻辑用受控页面模拟（ratechange 重置、250ms 循环重置、defaultPlaybackRate+load、动态插入、同源/跨域 iframe）。
4. **服务端校验无法在本地验证**：扩展只能解除浏览器端倍速限制，若平台在服务端按“墙钟时间 vs 播放进度”判定异常，本地测试无法覆盖（README 已声明）。
5. **headless 音频输出**：无真实声卡；本报告用 `currentTime` 斜率（媒体时钟）证明真实播放速率，不依赖可听音频。
6. **安全上限提醒是前端提示，不是强制限制**：`safeCap` 只控制 popup 二次确认与页面内 toast，用户确认后仍允许 >2×；它不能改变服务端对“墙钟时间 vs 播放进度”的判定。确认框/警告/toast 的断言基于 DOM 可见性（`hidden` 属性）与关键文本（“2× 上限”、目标倍速），不校验视觉样式细节。
7. **popup 在 headless 中作为普通标签页打开**：`chrome.tabs.query({active:true})` 取到的是 popup 自身，因此状态圆点显示“不在生效范围”（warn），这是自动化场景的固有限制；不影响配置读写、确认框与警告逻辑的验证。
8. **toast 元素生命周期**：`#__smartcourse_speed_toast__` 显示后仅淡出（opacity=0）不删除，因此“不该出现 toast”的用例在断言前会先移除既有元素，再确认未重新创建。

## 一键复现

```powershell
cd D:\dsh\speed-test
node probe-load-extension.mjs    # 证据：Chrome 157 忽略 --load-extension / Edge 可用
node probe-cdp-load.mjs          # 证据：Chrome CDP Extensions.loadUnpacked 可用
node run-tests.mjs phase-a       # 基础设施自检
node run-tests.mjs phase-b-v110  # v1.1.0 新增功能验收 + 既有行为回归（生成本报告）
```

原始证据 JSON：`speed-test/results/v1.1.0-results.json`（含每项 evidence 与 Chrome 启动命令行）。
