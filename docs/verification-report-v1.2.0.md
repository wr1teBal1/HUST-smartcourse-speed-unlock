# SmartCourse 倍速解锁 — 独立验收报告（v1.2.0 · 播放恢复助手 + 全量回归）

- 生成时间：2026-11-16T14:38:08.350Z
- 扩展版本：**1.2.0**（extensionId `jdakeggaeemgneckbpfhlfkhhhoaging`，Chrome Chrome/157.0.8103.51）
- 结论：**所有可执行用例 PASS**（共 46 项：46 PASS / 0 FAIL / 0 SKIP|BLOCKED）
  - v1.2.0 新增功能用例（R 用例）：11 项，11 PASS / 0 FAIL
  - v1.1.0 安全上限用例（F0–F8，回归的一部分）：9 项，9 PASS / 0 FAIL
  - 既有行为回归（P/T 用例）：26 项，26 PASS / 0 FAIL

## 环境与加载方式

| 项目 | 值 |
| --- | --- |
| OS / Node | win32 x64 / Node v24.22.1（零 npm 依赖，原生 http + WebSocket） |
| 浏览器 | Chrome/157.0.8103.51（CDP protocol 1.3） |
| 扩展 | `D:\dsh\smartcourse-speed-unlock` → extensionId `jdakeggaeemgneckbpfhlfkhhhoaging`，manifest version **1.2.0** |
| 扩展加载方式 | CDP Extensions.loadUnpacked；启动参数含 `--enable-unsafe-extension-debugging` |
| 命令行 --load-extension | Chrome 157 **被禁用**（stderr: `--load-extension is not allowed in Google Chrome, ignoring.`）；Edge 157 可用。详见 Phase A 证据 |
| 测试域名 | `--host-resolver-rules="MAP smartcourse.hust.edu.cn 127.0.0.1, MAP jwc.hust.edu.cn 127.0.0.1, MAP cross.example 127.0.0.1"`，全部流量命中本机 Node 服务器，**未访问真实课程平台** |

> 说明：Chrome 137+ 的 branded 构建不再接受命令行 `--load-extension`（浏览器策略，非测试缺陷）。官方自动化替代方案是 `--enable-unsafe-extension-debugging` + CDP `Extensions.loadUnpacked`，它加载的是**真实 unpacked 扩展**，manifest 的 matches / `world: MAIN` / `all_frames` 全部生效，因此本次验收属于扩展层真实验证，而非 CDP 注入模拟。普通用户通过 `chrome://extensions` → “加载已解压的扩展程序” 安装，加载后的行为与本次验证一致。

## v1.2.0 新增功能用例（播放恢复助手）

| # | 用例 | 状态 | 关键证据 |
| --- | --- | --- | --- |
| R10 | v1.2.0 版本与 popup 新控件：#toggleAutoRecover / #fixPlay / #copyDiag，footer 含 v1.2.0 | ✅ PASS | version=1.2.0; hasFixPlay=true; hasCopyDiag=true; autoRecover=true; footer=v1.2.0 · 本地扩展，不上传任何数据 |
| R1 | 播放按钮无响应：真实点击 .vjs-play-control（handler 为空）→ ~1.6s 后自动恢复播放，页面读倍速仍为 1 | ✅ PASS | click={"x":95,"y":195.5,"w":108,"h":58,"visible":true,"text":"播放"}; attemptDelay=1604ms; paused=false; pageRead=1; realRate=2; playEvent=true; events=["click.play-control","recover.attempt:play-control-click"] |
| R2 | 非播放控件不触发恢复：点击普通按钮 #other 后 3s 仍暂停、无 recover.attempt；play/pause 包装不改变返回值语义 | ✅ PASS | click={"x":216.84375,"y":196.5,"w":112,"h":52,"visible":true,"text":"其他按钮"}; pausedAfter3s=true; recoverAttempts=0; wrapper={"pauseReturnType":"undefined","playReturnsPromise":true}; otherClick=true |
| R3 | 尊重用户暂停：play() 播放中页面调用 pause() 后 3.5s+ 保持暂停、currentTime 冻结，不被抢回 | ✅ PASS | playing=true; pause={"paused":true,"ct":1.130014}; after3.5s.paused=true; ctDelta=0; recoverAfterPause=0; recoverTotal=0 |
| R4 | play() 调用无效：扩展视角 paused 持续 true 且页面未 pause() → ~2.4s 后 recover.attempt(reason=play-ineffective)，不得抛错 | ✅ PASS | delay=2412ms; throws=0; rejects=0; events=["play.call","play.ok","recover.attempt:play-ineffective"] |
| R5 | 播放中卡死：currentTime 冻结 >4s → stall.detected + recover.attempt(reason=stalled) | ✅ PASS | playing=true; freeze={"frozen":0.379387}; stallDelay=4551ms; stalledMs=4369; attemptReason=stalled |
| R6 | 手动修复：Alt+R 与 popup #fixPlay（SC_SPEED_FIX 链路）均能恢复播放，诊断事件含 manual.fix | ✅ PASS | altR: playing=true manualFix=true attempt=manual-fix pageRead=1 real=2 console=true; popupFix: tabFound=true (http://smartcourse.hust.edu.cn:57450/test/recover?tag=r6b-popup-fix) playing=true manualFix=true |
| R7 | 诊断：MAIN world __SMARTCOURSE_SPEED_DIAG__.snapshot()/events、bridge SC_SPEED_STATUS.diag.media、popup #copyDiag 输出 JSON（version=1.2.0） | ✅ PASS | diagApi=true; bridgeMedia=1; copyOk=true; copiedKeys=extensionVersion,time,config,injected,mediaCount,realRate,page; console=true |
| R8 | autoRecover=false：R1 场景不再自动恢复（3.5s 仍暂停、无 recover.attempt）；Alt+R 手动修复仍有效；重新开启后自动恢复恢复工作 | ✅ PASS | offCfg={"autoRecover":false,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; offAfter3.5s.paused=true; offAutoAttempts=0; manual=true/true/true; onCfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate |
| R9 | v1.1.0 全量回归：安全上限 9 项（F0–F8）+ 既有行为 26 项全部执行且无 FAIL（storage 断言含 autoRecover） | ✅ PASS | v110Features=9 (F0,F1,F2,F3,F4,F5,F6,F7,F8); regression=26 (P0,P0b,P1,P2,P3,T1,T2,T3,T4a,T4b,T4c,T4d,T4e,T5,T5b,T6a,T6b,T7,T8a,T8b,T8c,T9,T10,T11,T12,T13); FAIL=none |
| R-EXC | 恢复助手运行期间 MAIN world 无未捕获异常（play/pause 包装与恢复路径不得抛错） | ✅ PASS | exceptions=0 |

## v1.1.0 安全上限功能用例（回归的一部分）

| # | 用例 | 状态 | 关键证据 |
| --- | --- | --- | --- |
| F0 | 旧配置缺失 safeCap 时按默认 true：默认配置下 Alt+↑ 2→2.25 出现上限 toast（#__smartcourse_speed_toast__） | ✅ PASS | cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; toast={"present":true,"text":"已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响","opacity":"1"}; real=2.25 |
| F1 | popup 安全上限 DOM：#toggleSafeCap / #rateWarning / #confirmMask-#confirmText-#confirmOk-#confirmCancel 均存在 | ✅ PASS | dom={"hasToggleSafeCap":true,"hasRateWarning":true,"hasConfirmMask":true,"hasConfirmText":true,"hasConfirmOk":true,"hasConfirmCancel":true}; ui.safeCap=true; ui.rateWarningHidden=true; ui.confirmMaskH |
| F2 | 旧配置（storage 中无 safeCap）按默认 true 处理：rate=2.5 时 #toggleSafeCap 勾选、#rateWarning 可见 | ✅ PASS | stored={"enabled":true,"preservesPitch":true,"rate":2.5,"spoof":true}; ui.safeCap=true; warningHidden=false; text=⚠ 当前 2.5× 超过平台允许的 2× 上限，任务点记录可能受影响; real=2.5 |
| F3 | #rateWarning 可见性矩阵：safeCap=true 且 rate>2 可见（文本含“2× 上限”），其余 hidden | ✅ PASS | safeCap=true rate=2.5: hidden=false; safeCap=false rate=2.5: hidden=true; safeCap=true rate=2: hidden=true |
| F4 | safeCap=true 点 .chip[data-rate="2.5"] → #confirmMask 显示、#confirmText 含 2.5×；点 #confirmCancel 取消且 rate 不变 | ✅ PASS | confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cancelHidden=true; rateBefore=2; rateAfterCancel=2; realAfterCancel=2; visible=1 |
| F5 | safeCap=true 自定义输入 3.5 + #applyCustom → 确认框；取消不改；#confirmOk 后 rate=3.5 实时生效、页面读 1、storage 含 safeCap、警告显示 | ✅ PASS | confirmText=即将切换到 3.5×，超过平台允许的 2× 上限。; afterCancel rate=2 real=2; afterOk cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":3.5,"safeCap":true,"spoof":true} real=3.5 visible=1 warnin |
| F6 | ≤2×（1.5/2.0 档位、自定义 1.75）直接生效，不出现确认框 | ✅ PASS | chip:1.5 confirmHidden=true cfg=true real=1.5; chip:2 confirmHidden=true cfg=true real=2; custom:1.75 confirmHidden=true cfg=true real=1.75 |
| F7 | safeCap=false：点 2.5× 无确认框、无警告、直接生效；重新开启 safeCap 后（rate 仍 2.5）警告恢复 | ✅ PASS | off cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":false,"spoof":true}; snapshotHidden=true; rate=2.5; real=2.5; warningHidden=true; afterReenable warningHidden=false |
| F8 | 快捷键上限提示矩阵：safeCap=true 且 >2× 出现 toast；safeCap=false 或 ≤2× 不出现 | ✅ PASS | A cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} toast={"present":true,"text":"已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响","opacity":"1"}; B cfg={"autoR |

## 回归用例（既有行为，v1.0.0/v1.1.0 基线）

| # | 用例 | 状态 | 关键证据 |
| --- | --- | --- | --- |
| P0 | 扩展加载层（Chrome 157）：CDP Extensions.loadUnpacked 加载真实扩展 | ✅ PASS | extensionId=jdakeggaeemgneckbpfhlfkhhhoaging, popupPageLoads=true |
| P0b | 扩展 manifest 版本与 content_scripts 匹配范围（真实加载的扩展） | ✅ PASS | version=1.2.0; name=SmartCourse 倍速解锁; matches=["*://smartcourse.hust.edu.cn/*","*://*.hust.edu.cn/*","*://*.chaoxing.com/*","*://*.xuexitong.com/*"] |
| P1 | content script 注入范围：匹配域（*.hust.edu.cn）注入 MAIN-world Hook，非匹配域不注入 | ✅ PASS | matched.hooked=true, outside.hooked=false |
| P2 | 测试流量全部命中本地服务器（host-resolver-rules），未访问真实课程平台 | ✅ PASS | location.host=smartcourse.hust.edu.cn:57450; server-seen host=smartcourse.hust.edu.cn:57450 |
| P3 | 测量通道准备：隔离世界 real rate + MAIN world spoof read + currentTime 斜率 | ✅ PASS | mainCtx=8; sameIframeCtx=9; jwcIframeCtx=10; media=[{"id":"early-audio","ct":0,"rate":1,"paused":true,"ready":4,"pr":true,"dur":10,"err":null}] |
| T1 | 未写入配置时默认行为：enabled=true/rate=2/spoof=true/safeCap=true/autoRecover=true（真实 2.0，页面读 1，无警告） | ✅ PASS | storageCfg=null; real=2; visible=all 1; ui.safeCap=true; ui.autoRecover=true; ui.rateWarningHidden=true |
| T2 | 契约配置 chrome.storage.local["sc_speed_cfg_v1"] 写入并生效（经扩展页面，含 safeCap/autoRecover） | ✅ PASS | storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; ui.safeCap=true; ui.autoRecover=true; appliedIn=1ms |
| T3 | 页面设置 playbackRate=3 / defaultPlaybackRate=0.5 → 内部真实倍速保持 2，页面读到 1 | ✅ PASS | pageSet.readBack=1; real=2; visible=1; defaultReal=2 |
| T4a | 页面循环重置（setInterval + ratechange 监听，mode=both）期间真实倍速持续为 2.0 | ✅ PASS | maxDeviation=0ms; page reset attempts 24→32 |
| T4b | page: defaultPlaybackRate=1 + load() 重置后，内部倍速在 ≤1.5s 内恢复为 2 | ✅ PASS | recovery=0ms (ok=true), pageRead=1 |
| T4c | 动态插入的 <audio>/<video> 也被强制为 2.0，且页面读取为 1 | ✅ PASS | audioId=audio-dyn-1 real=2; videoId=video-dyn-2 real=2; visibleAll1=true |
| T4d | 带外（绕过 Hook）把真实倍速改回 1 后，700ms 兜底巡检在 ≤1.5s 内恢复为 2 | ✅ PASS | outOfBandWrite=1; recovery=1ms (ok=true) |
| T4e | 页面篡改 Hook（重定义 playbackRate 属性）后，扩展 ≤1.5s 自动重新接管 | ✅ PASS | tamperedVisibleRead=0.5; repairedIn=352ms; real=2 |
| T5 | spoof=false：页面读取到真实倍速 2.0（关闭伪装实时生效，无需刷新） | ✅ PASS | cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":false}; pageRead=2 in 1ms; real=2 |
| T5b | spoof 重新开启后页面读取立即恢复为 1.0（无需刷新） | ✅ PASS | pageRead=1 in 1ms; real=2 |
| T6a | enabled=false：内部倍速回到 1，页面可正常设置/读取 playbackRate（3.0 / 1.0） | ✅ PASS | hook=true; cfg={"autoRecover":true,"enabled":false,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; afterDisableReal=[1]; set3 real=3 visible=3; set1 real=1 |
| T6b | enabled=true 重新开启：已打开页面无需刷新即恢复强制倍速 2.0 + 页面读 1 | ✅ PASS | cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; real=2 in 0ms; visible=1 |
| T7 | 弹窗点击 2.5× → 安全上限二次确认 → 已打开页面无需刷新即生效（真实 2.5，页面读 1.0，storage 含 safeCap） | ✅ PASS | beforeCfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cfg={"autoRecover":true,"enabled":t |
| T8a | Alt+↑ / Alt+↓ 步进 0.25 并写入 chrome.storage（持久化） | ✅ PASS | AltUp: storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} real=2.25; AltDown: storage={"autoRecover":true,"enabled":true,"pre |
| T8b | Alt+↓ 在 0.25 下限 / Alt+↑ 在 16 上限均被钳制，不越界 | ✅ PASS | low: storage=0.25, real=0.25; high: confirmShown=true, storage=16, real=16 |
| T8c | 快捷键/配置写入 chrome.storage 持久化：新打开页面直接应用 2.25（storage 含 safeCap） | ✅ PASS | newPage real=2.25 in 2ms; storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; setViaConfirm=true |
| T9 | 跨域 iframe（jwc.hust.edu.cn）内媒体同样被强制：real=2.0、页面读=1、currentTime 斜率≈2、带外重置 ≤1.5s 恢复 | ✅ PASS | iframeTags=["iframe-same-origin","iframe-cross-jwc.hust.edu.cn","iframe-cross-127.0.0.1"]; jwc real=2 visible=1 ctSlope=1.98; sameOriginIframe real=2; outOfBand=1; recovery=1ms |
| T10 | 非匹配域跨域 iframe（127.0.0.1）不注入（与 manifest 生效范围一致，信息项） | ✅ PASS | external iframe visible rate=1 |
| T11 | preservesPitch=true 时真实媒体保持音调（页面/真实均 true） | ✅ PASS | real=true, visible=true |
| T12 | 10s 播放稳定性：无 ratechange 风暴 / CPU 暴涨，真实倍速持续 2.0 | ✅ PASS | ratechange +0 (0→5s +0, 5→10s +0), TaskDuration +0.194s, ScriptDuration +0.159s, maxDeviation=0ms, page reset attempts=242 |
| T13 | 弹窗 UI 与 storage 同步（信息项；headless 下注入状态圆点无法代表真实活动标签） | ✅ PASS | ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"safeCap":true,"autoRecover":true,"spoof":true,"preservesPitch":true,"hasFixPlay":true,"hasCopyDiag":true,"footerText":"v1.2 |


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
      "--user-data-dir=C:\\Users\\WR1TE_~1\\AppData\\Local\\Temp\\sc-speed-test-2KOIPW",
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

- 预期：version=1.2.0
- 实测：version=1.2.0; name=SmartCourse 倍速解锁; matches=["*://smartcourse.hust.edu.cn/*","*://*.hust.edu.cn/*","*://*.chaoxing.com/*","*://*.xuexitong.com/*"]

```json
{
  "id": "P0b",
  "status": "PASS",
  "evidence": {
    "manifest": {
      "name": "SmartCourse 倍速解锁",
      "version": "1.2.0",
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
    "mainUrl": "http://smartcourse.hust.edu.cn:57450/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main",
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

- 预期：页面与服务器 Host 头均为 smartcourse.hust.edu.cn:57450
- 实测：location.host=smartcourse.hust.edu.cn:57450; server-seen host=smartcourse.hust.edu.cn:57450

```json
{
  "id": "P2",
  "status": "PASS",
  "evidence": {
    "mappedInfo": {
      "host": "smartcourse.hust.edu.cn:57450",
      "href": "http://smartcourse.hust.edu.cn:57450/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main"
    },
    "echo": {
      "ok": true,
      "host": "smartcourse.hust.edu.cn:57450",
      "url": "/health",
      "ts": 1794839840014,
      "pid": 75848,
      "serverPort": 57450,
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
        "id": "8413189AD28C52506BD0ED1D0103F6BD",
        "url": "http://smartcourse.hust.edu.cn:57450/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main",
        "securityOrigin": "http://smartcourse.hust.edu.cn:57450"
      },
      {
        "id": "4D80A546DD6275087A43D68F3BF5545A",
        "url": "http://smartcourse.hust.edu.cn:57450/test/iframe?mode=both&tag=iframe-same-origin",
        "securityOrigin": "http://smartcourse.hust.edu.cn:57450"
      },
      {
        "id": "7B01C392C9A6EBD91CCF99E2C5F80A8A",
        "url": "http://jwc.hust.edu.cn:57450/test/iframe?mode=both&tag=iframe-cross-jwc.hust.edu.cn",
        "securityOrigin": "http://jwc.hust.edu.cn:57450"
      }
    ]
  }
}
```

### T1 未写入配置时默认行为：enabled=true/rate=2/spoof=true/safeCap=true/autoRecover=true（真实 2.0，页面读 1，无警告） — ✅ PASS

- 预期：storage 为空 → hook 使用默认 rate=2、spoof=1.0、safeCap=true、autoRecover=true；真实内部倍速=2；popup 无 rateWarning
- 实测：storageCfg=null; real=2; visible=all 1; ui.safeCap=true; ui.autoRecover=true; ui.rateWarningHidden=true

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
        "ct": 0.757366,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "visibleMedia": [
      {
        "id": "early-audio",
        "ct": 0.762986,
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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
- 实测：cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; toast={"present":true,"text":"已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响","opacity":"1"}; real=2.25

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
      "autoRecover": true,
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
      "elapsedMs": 5
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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
      "elapsedMs": 3
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
          "autoRecover": true,
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
          "autoRecover": true,
          "spoof": true,
          "preservesPitch": true,
          "hasFixPlay": true,
          "hasCopyDiag": true,
          "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
          "autoRecover": true,
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
          "autoRecover": true,
          "spoof": true,
          "preservesPitch": true,
          "hasFixPlay": true,
          "hasCopyDiag": true,
          "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
          "autoRecover": true,
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
          "autoRecover": true,
          "spoof": true,
          "preservesPitch": true,
          "hasFixPlay": true,
          "hasCopyDiag": true,
          "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
      "autoRecover": true,
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
      "autoRecover": true,
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
- 实测：confirmText=即将切换到 3.5×，超过平台允许的 2× 上限。; afterCancel rate=2 real=2; afterOk cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":3.5,"safeCap":true,"spoof":true} real=3.5 visible=1 warningHidden=false

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
      "autoRecover": true,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "f5StorageAfterCancel": {
      "autoRecover": true,
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
      "autoRecover": true,
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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
- 实测：off cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":false,"spoof":true}; snapshotHidden=true; rate=2.5; real=2.5; warningHidden=true; afterReenable warningHidden=false

```json
{
  "id": "F7",
  "status": "PASS",
  "evidence": {
    "f7OffCfg": {
      "autoRecover": true,
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
      "autoRecover": true,
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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
- 实测：A cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} toast={"present":true,"text":"已调整到 2.25×，超过平台允许的 2× 上限，任务点记录可能受影响","opacity":"1"}; B cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":false,"spoof":true} toastPresent=false; C cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":1.75,"safeCap":true,"spoof":true} toastPresent=false

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
        "autoRecover": true,
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
        "autoRecover": true,
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
        "autoRecover": true,
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

### T2 契约配置 chrome.storage.local["sc_speed_cfg_v1"] 写入并生效（经扩展页面，含 safeCap/autoRecover） — ✅ PASS

- 预期：{"enabled":true,"rate":2,"spoof":true,"preservesPitch":true,"safeCap":true,"autoRecover":true}；写入后已打开页面真实倍速=2
- 实测：storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; ui.safeCap=true; ui.autoRecover=true; appliedIn=1ms

```json
{
  "id": "T2",
  "status": "PASS",
  "evidence": {
    "cfgWrite": {
      "autoRecover": true,
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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
        "ct": 7.523713,
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
- 实测：maxDeviation=0ms; page reset attempts 24→32

```json
{
  "id": "T4a",
  "status": "PASS",
  "evidence": {
    "maxDeviationMs": 0,
    "resetsBefore": 24,
    "resetsAfter": 32,
    "samples": [
      {
        "t": 0,
        "rate": 2
      },
      {
        "t": 51,
        "rate": 2
      },
      {
        "t": 97,
        "rate": 2
      },
      {
        "t": 144,
        "rate": 2
      },
      {
        "t": 191,
        "rate": 2
      },
      {
        "t": 239,
        "rate": 2
      },
      {
        "t": 285,
        "rate": 2
      },
      {
        "t": 332,
        "rate": 2
      },
      {
        "t": 378,
        "rate": 2
      },
      {
        "t": 424,
        "rate": 2
      },
      {
        "t": 485,
        "rate": 2
      },
      {
        "t": 531,
        "rate": 2
      },
      {
        "t": 576,
        "rate": 2
      },
      {
        "t": 622,
        "rate": 2
      },
      {
        "t": 669,
        "rate": 2
      },
      {
        "t": 716,
        "rate": 2
      },
      {
        "t": 763,
        "rate": 2
      },
      {
        "t": 809,
        "rate": 2
      },
      {
        "t": 855,
        "rate": 2
      },
      {
        "t": 901,
        "rate": 2
      },
      {
        "t": 946,
        "rate": 2
      },
      {
        "t": 992,
        "rate": 2
      },
      {
        "t": 1039,
        "rate": 2
      },
      {
        "t": 1100,
        "rate": 2
      },
      {
        "t": 1146,
        "rate": 2
      },
      {
        "t": 1193,
        "rate": 2
      },
      {
        "t": 1239,
        "rate": 2
      },
      {
        "t": 1287,
        "rate": 2
      },
      {
        "t": 1333,
        "rate": 2
      },
      {
        "t": 1379,
        "rate": 2
      },
      {
        "t": 1426,
        "rate": 2
      },
      {
        "t": 1473,
        "rate": 2
      },
      {
        "t": 1518,
        "rate": 2
      },
      {
        "t": 1563,
        "rate": 2
      },
      {
        "t": 1609,
        "rate": 2
      },
      {
        "t": 1656,
        "rate": 2
      },
      {
        "t": 1703,
        "rate": 2
      },
      {
        "t": 1749,
        "rate": 2
      },
      {
        "t": 1797,
        "rate": 2
      },
      {
        "t": 1843,
        "rate": 2
      },
      {
        "t": 1891,
        "rate": 2
      },
      {
        "t": 1938,
        "rate": 2
      },
      {
        "t": 1984,
        "rate": 2
      }
    ]
  }
}
```

### T4b page: defaultPlaybackRate=1 + load() 重置后，内部倍速在 ≤1.5s 内恢复为 2 — ✅ PASS

- 预期：恢复耗时 ≤ 1500ms，恢复后页面读取仍为 1
- 实测：recovery=0ms (ok=true), pageRead=1

```json
{
  "id": "T4b",
  "status": "PASS",
  "evidence": {
    "resetCall": true,
    "t4b": {
      "ok": true,
      "value": 2,
      "elapsedMs": 0
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
        "ct": 1.095579,
        "paused": false,
        "ready": 4,
        "err": null
      },
      {
        "id": "audio-dyn-1",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.095543,
        "paused": false,
        "ready": 4,
        "err": null
      },
      {
        "id": "video-dyn-2",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.095513,
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
- 实测：outOfBandWrite=1; recovery=1ms (ok=true)

```json
{
  "id": "T4d",
  "status": "PASS",
  "evidence": {
    "outOfBandWrite": 1,
    "t4d": {
      "ok": true,
      "value": 2,
      "elapsedMs": 1
    }
  }
}
```

### T4e 页面篡改 Hook（重定义 playbackRate 属性）后，扩展 ≤1.5s 自动重新接管 — ✅ PASS

- 预期：篡改后页面读到 0.5（异常值）；≤1500ms 恢复为伪装值 1，真实倍速仍为 2
- 实测：tamperedVisibleRead=0.5; repairedIn=352ms; real=2
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
      "elapsedMs": 352
    },
    "repairedReal": 2
  }
}
```

### T5 spoof=false：页面读取到真实倍速 2.0（关闭伪装实时生效，无需刷新） — ✅ PASS

- 预期：storage.spoof=false 后 ≤1.5s 页面读 =2.0，真实 =2.0
- 实测：cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":false}; pageRead=2 in 1ms; real=2

```json
{
  "id": "T5",
  "status": "PASS",
  "evidence": {
    "spoofOffCfg": {
      "autoRecover": true,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": false
    },
    "pageRead": {
      "ok": true,
      "value": 2,
      "elapsedMs": 1
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
- 实测：hook=true; cfg={"autoRecover":true,"enabled":false,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; afterDisableReal=[1]; set3 real=3 visible=3; set1 real=1

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
      "autoRecover": true,
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
- 实测：cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; real=2 in 0ms; visible=1

```json
{
  "id": "T6b",
  "status": "PASS",
  "evidence": {
    "onCfg": {
      "autoRecover": true,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "onReal": {
      "ok": true,
      "value": 2,
      "elapsedMs": 0
    },
    "onVisible": 1
  }
}
```

### T7 弹窗点击 2.5× → 安全上限二次确认 → 已打开页面无需刷新即生效（真实 2.5，页面读 1.0，storage 含 safeCap） — ✅ PASS

- 预期：点 2.5× 出现确认框（文本含 2.5×）→ 点“仍然使用”后 mask 隐藏、storage/UI=2.5 且含 safeCap、页面 real=2.5、visible=1.0，≤1.5s
- 实测：beforeCfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.5,"safeCap":true,"spoof":true}; real=2.5 in 2ms; visible=1; ui.rateValue=2.5

```json
{
  "id": "T7",
  "status": "PASS",
  "evidence": {
    "t7BeforeCfg": {
      "autoRecover": true,
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
      "autoRecover": true,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.5,
      "safeCap": true,
      "spoof": true
    },
    "real25": {
      "ok": true,
      "value": 2.5,
      "elapsedMs": 2
    },
    "vis25": 1,
    "ui25": {
      "rateValue": "2.5",
      "customRate": "2.5",
      "enabled": true,
      "safeCap": true,
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
- 实测：AltUp: storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} real=2.25; AltDown: storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true} real=2; ui=2.25

```json
{
  "id": "T8a",
  "status": "PASS",
  "evidence": {
    "backTo2": {
      "autoRecover": true,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "altUpCfg": {
      "autoRecover": true,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.25,
      "safeCap": true,
      "spoof": true
    },
    "altUpReal": {
      "ok": true,
      "value": 2.25,
      "elapsedMs": 59
    },
    "altUpUi": {
      "rateValue": "2.25",
      "customRate": "2.25",
      "enabled": true,
      "safeCap": true,
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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
      "autoRecover": true,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "altDownReal": {
      "ok": true,
      "value": 2,
      "elapsedMs": 90
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
      "autoRecover": true,
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
      "autoRecover": true,
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
- 实测：newPage real=2.25 in 2ms; storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; setViaConfirm=true

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
      "elapsedMs": 2
    },
    "persistCfg": {
      "autoRecover": true,
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
- 实测：iframeTags=["iframe-same-origin","iframe-cross-jwc.hust.edu.cn","iframe-cross-127.0.0.1"]; jwc real=2 visible=1 ctSlope=1.98; sameOriginIframe real=2; outOfBand=1; recovery=1ms

```json
{
  "id": "T9",
  "status": "PASS",
  "evidence": {
    "iframeTags": [
      "iframe-same-origin",
      "iframe-cross-jwc.hust.edu.cn",
      "iframe-cross-127.0.0.1"
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
        "ct": 2.729345,
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
        "ct": 2.734855,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "jwcOob": 1,
    "jwcRecovery": {
      "ok": true,
      "value": 2,
      "elapsedMs": 1
    },
    "jwcSlope": {
      "rate": 1.9788721804511273,
      "n": 12,
      "playing": true
    },
    "jwcFrame": {
      "id": "7B01C392C9A6EBD91CCF99E2C5F80A8A",
      "url": "http://jwc.hust.edu.cn:57450/test/iframe?mode=both&tag=iframe-cross-jwc.hust.edu.cn",
      "securityOrigin": "http://jwc.hust.edu.cn:57450"
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
      "resets": 48
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
- 实测：ratechange +0 (0→5s +0, 5→10s +0), TaskDuration +0.194s, ScriptDuration +0.159s, maxDeviation=0ms, page reset attempts=242

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
    "taskDelta": 0.194,
    "scriptDelta": 0.159,
    "maxDeviationMs": 0,
    "pageResets": 242,
    "samples": [
      {
        "t": 0,
        "rate": 2
      },
      {
        "t": 1099,
        "rate": 2
      },
      {
        "t": 2181,
        "rate": 2
      },
      {
        "t": 3269,
        "rate": 2
      },
      {
        "t": 4355,
        "rate": 2
      },
      {
        "t": 429,
        "rate": 2
      },
      {
        "t": 1510,
        "rate": 2
      },
      {
        "t": 2610,
        "rate": 2
      },
      {
        "t": 3694,
        "rate": 2
      },
      {
        "t": 4780,
        "rate": 2
      }
    ]
  }
}
```

### T13 弹窗 UI 与 storage 同步（信息项；headless 下注入状态圆点无法代表真实活动标签） — ✅ PASS

- 预期：弹窗显示 storage 中的倍速/开关；状态圆点逻辑依赖 chrome.tabs active 标签，自动化场景不具代表性
- 实测：ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"safeCap":true,"autoRecover":true,"spoof":true,"preservesPitch":true,"hasFixPlay":true,"hasCopyDiag":true,"footerText":"v1.2.0 · 本地扩展，不上传任何数据","activeChip":"2.0×","rateWarningHidden":true,"rateWarningText":"⚠ 当前 2.25× 超过平台允许的 2× 上限，任务点记录可能受影响","rateWarningDisplay":"none","confirmMaskHidden":true,"confirmText":"即将切换到 2.25×，超过平台允许的 2× 上限。","statusText":"当前标签页不在生效范围（请打开课程视频页面）","statusDotClass":"dot warn"}

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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
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

### R10 v1.2.0 版本与 popup 新控件：#toggleAutoRecover / #fixPlay / #copyDiag，footer 含 v1.2.0 — ✅ PASS

- 预期：manifest version=1.2.0；popup 有「暂停/切屏自动恢复」开关与「修复卡住的播放」「复制诊断信息」按钮；footer 文本含 v1.2.0
- 实测：version=1.2.0; hasFixPlay=true; hasCopyDiag=true; autoRecover=true; footer=v1.2.0 · 本地扩展，不上传任何数据

```json
{
  "id": "R10",
  "status": "PASS",
  "evidence": {
    "manifest": {
      "name": "SmartCourse 倍速解锁",
      "version": "1.2.0",
      "manifestVersion": 3,
      "matches": [
        "*://smartcourse.hust.edu.cn/*",
        "*://*.hust.edu.cn/*",
        "*://*.chaoxing.com/*",
        "*://*.xuexitong.com/*"
      ]
    },
    "footerText": "v1.2.0 · 本地扩展，不上传任何数据",
    "hasFixPlay": true,
    "hasCopyDiag": true,
    "autoRecoverChecked": true
  }
}
```

### R1 播放按钮无响应：真实点击 .vjs-play-control（handler 为空）→ ~1.6s 后自动恢复播放，页面读倍速仍为 1 — ✅ PASS

- 预期：点击后 diag 出现 recover.attempt(reason=play-control-click)，延时 1200–3500ms；媒体开始播放；页面读 rate=1、真实=2
- 实测：click={"x":95,"y":195.5,"w":108,"h":58,"visible":true,"text":"播放"}; attemptDelay=1604ms; paused=false; pageRead=1; realRate=2; playEvent=true; events=["click.play-control","recover.attempt:play-control-click"]

```json
{
  "id": "R1",
  "status": "PASS",
  "evidence": {
    "before": {
      "paused": true,
      "ended": false,
      "ct": 0,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "click": {
      "x": 95,
      "y": 195.5,
      "w": 108,
      "h": 58,
      "visible": true,
      "text": "播放"
    },
    "attempt": {
      "t": 1794839863288,
      "type": "recover.attempt",
      "hidden": false,
      "reason": "play-control-click",
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "paused": true,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0,
        "duration": 10,
        "rateReal": 2,
        "rateVisible": 1,
        "error": null
      }
    },
    "attemptDelayMs": 1604,
    "after": {
      "paused": false,
      "ended": false,
      "ct": 0.227112,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "pageRead": 1,
    "realRate": 2,
    "pageEvents": [
      {
        "t": 1794839861615,
        "ev": "media-loadedmetadata",
        "data": null
      },
      {
        "t": 1794839861639,
        "ev": "media-loadeddata",
        "data": null
      },
      {
        "t": 1794839861639,
        "ev": "media-canplay",
        "data": null
      },
      {
        "t": 1794839861684,
        "ev": "vjs-play-click",
        "data": null
      },
      {
        "t": 1794839863289,
        "ev": "media-play",
        "data": null
      },
      {
        "t": 1794839863289,
        "ev": "media-waiting",
        "data": null
      },
      {
        "t": 1794839863289,
        "ev": "media-canplay",
        "data": null
      },
      {
        "t": 1794839863289,
        "ev": "media-playing",
        "data": null
      }
    ],
    "diagEvents": [
      {
        "t": 1794839861684,
        "type": "click.play-control",
        "hidden": false
      },
      {
        "t": 1794839863288,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "play-control-click",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 10,
          "rateReal": 2,
          "rateVisible": 1,
          "error": null
        }
      }
    ]
  }
}
```

### R2 非播放控件不触发恢复：点击普通按钮 #other 后 3s 仍暂停、无 recover.attempt；play/pause 包装不改变返回值语义 — ✅ PASS

- 预期：3s 后 paused=true、无 recover.attempt；pause() 返回 undefined、play() 返回 Promise；页面记录 other-click
- 实测：click={"x":216.84375,"y":196.5,"w":112,"h":52,"visible":true,"text":"其他按钮"}; pausedAfter3s=true; recoverAttempts=0; wrapper={"pauseReturnType":"undefined","playReturnsPromise":true}; otherClick=true

```json
{
  "id": "R2",
  "status": "PASS",
  "evidence": {
    "before": {
      "paused": true,
      "ended": false,
      "ct": 0,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "click": {
      "x": 216.84375,
      "y": 196.5,
      "w": 112,
      "h": 52,
      "visible": true,
      "text": "其他按钮"
    },
    "after": {
      "paused": true,
      "ended": false,
      "ct": 0,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "recoverAttempts": [],
    "wrapperSem": {
      "pauseReturnType": "undefined",
      "playReturnsPromise": true
    },
    "pageEvents": [
      {
        "t": 1794839863509,
        "ev": "media-loadedmetadata",
        "data": null
      },
      {
        "t": 1794839863532,
        "ev": "media-loadeddata",
        "data": null
      },
      {
        "t": 1794839863532,
        "ev": "media-canplay",
        "data": null
      },
      {
        "t": 1794839863563,
        "ev": "other-click",
        "data": null
      }
    ],
    "diagEvents": []
  }
}
```

### R3 尊重用户暂停：play() 播放中页面调用 pause() 后 3.5s+ 保持暂停、currentTime 冻结，不被抢回 — ✅ PASS

- 预期：pause() 后 3.5s 仍 paused=true；currentTime 不再前进（800ms 内变化 <0.05s）；无任何 recover.attempt
- 实测：playing=true; pause={"paused":true,"ct":1.130014}; after3.5s.paused=true; ctDelta=0; recoverAfterPause=0; recoverTotal=0

```json
{
  "id": "R3",
  "status": "PASS",
  "evidence": {
    "playCall": {
      "isPromise": true
    },
    "pause": {
      "paused": true,
      "ct": 1.130014
    },
    "after": {
      "paused": true,
      "ended": false,
      "ct": 1.130014,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "ct1": 1.130014,
    "ct2": 1.130014,
    "pauseAt": 1794839867411,
    "recoverAfterPause": [],
    "diagEvents": [
      {
        "t": 1794839866790,
        "type": "play.call",
        "hidden": false,
        "paused": true,
        "ended": false
      },
      {
        "t": 1794839866792,
        "type": "play.ok",
        "hidden": false
      },
      {
        "t": 1794839867411,
        "type": "pause.call",
        "hidden": false
      }
    ]
  }
}
```

### R4 play() 调用无效：扩展视角 paused 持续 true 且页面未 pause() → ~2.4s 后 recover.attempt(reason=play-ineffective)，不得抛错 — ✅ PASS

- 预期：play() 后 ~2400ms 内出现 recover.attempt reason=play-ineffective；无 play.throw / recover.play-throw / play.reject
- 实测：delay=2412ms; throws=0; rejects=0; events=["play.call","play.ok","recover.attempt:play-ineffective"]
- 备注：受控模拟：play() 后给 media 实例 shadow paused getter 使扩展视角判定“未播放”，扩展因此走 play-ineffective 恢复路径；恢复动作由扩展内部原生 play 完成。

```json
{
  "id": "R4",
  "status": "PASS",
  "evidence": {
    "playCall": {
      "t0": 1794839871969,
      "isPromise": true
    },
    "attempt": {
      "t": 1794839874381,
      "type": "recover.attempt",
      "hidden": false,
      "reason": "play-ineffective",
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "paused": true,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 4.56,
        "duration": 10,
        "rateReal": 2,
        "rateVisible": 1,
        "error": null
      }
    },
    "delayMs": 2412,
    "throws": [],
    "rejects": [],
    "diagEvents": [
      {
        "t": 1794839871969,
        "type": "play.call",
        "hidden": false,
        "paused": true,
        "ended": false
      },
      {
        "t": 1794839871970,
        "type": "play.ok",
        "hidden": false
      },
      {
        "t": 1794839874381,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "play-ineffective",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 4.56,
          "duration": 10,
          "rateReal": 2,
          "rateVisible": 1,
          "error": null
        }
      }
    ]
  }
}
```

### R5 播放中卡死：currentTime 冻结 >4s → stall.detected + recover.attempt(reason=stalled) — ✅ PASS

- 预期：冻结后 3–7.5s 内记录 stall.detected（stalledMs>3800）并尝试 recover，reason=stalled
- 实测：playing=true; freeze={"frozen":0.379387}; stallDelay=4551ms; stalledMs=4369; attemptReason=stalled
- 备注：受控模拟：播放中给 media 实例 shadow currentTime getter 使其冻结，扩展 1s 巡检依据 4s 无进度判定 stall 并恢复。

```json
{
  "id": "R5",
  "status": "PASS",
  "evidence": {
    "playing": {
      "paused": false,
      "ended": false,
      "ct": 0.373691,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "freeze": {
      "frozen": 0.379387
    },
    "stall": {
      "t": 1794839879618,
      "type": "stall.detected",
      "hidden": false,
      "stalledMs": 4369,
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "paused": false,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0.38,
        "duration": 10,
        "rateReal": 2,
        "rateVisible": 1,
        "error": null
      }
    },
    "stallDelayMs": 4551,
    "stalledMs": 4369,
    "attempt": {
      "t": 1794839879619,
      "type": "recover.attempt",
      "hidden": false,
      "reason": "stalled",
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "paused": false,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0.38,
        "duration": 10,
        "rateReal": 2,
        "rateVisible": 1,
        "error": null
      }
    }
  }
}
```

### R6 手动修复：Alt+R 与 popup #fixPlay（SC_SPEED_FIX 链路）均能恢复播放，诊断事件含 manual.fix — ✅ PASS

- 预期：Alt+R 后媒体播放、diag 含 manual.fix + recover.attempt(manual-fix)、页面读 1；popup 激活课程页后点 #fixPlay 同样恢复并产生 manual.fix；控制台含 [SC-SPEED] 日志
- 实测：altR: playing=true manualFix=true attempt=manual-fix pageRead=1 real=2 console=true; popupFix: tabFound=true (http://smartcourse.hust.edu.cn:57450/test/recover?tag=r6b-popup-fix) playing=true manualFix=true

```json
{
  "id": "R6",
  "status": "PASS",
  "evidence": {
    "altR": {
      "before": {
        "paused": true,
        "ended": false,
        "ct": 0,
        "rateVisible": 1,
        "ready": 4,
        "error": null
      },
      "playing": true,
      "manualFix": {
        "t": 1794839879867,
        "type": "manual.fix",
        "hidden": false
      },
      "attempt": {
        "t": 1794839879866,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "manual-fix",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 10,
          "rateReal": 2,
          "rateVisible": 1,
          "error": null
        }
      },
      "pageRead": 1,
      "realRate": 2,
      "console": true
    },
    "popupFix": {
      "before": {
        "paused": true,
        "ended": false,
        "ct": 0,
        "rateVisible": 1,
        "ready": 4,
        "error": null
      },
      "tab": {
        "tabId": 1558980983,
        "media": 1,
        "href": "http://smartcourse.hust.edu.cn:57450/test/recover?tag=r6b-popup-fix",
        "diag": {
          "href": "http://smartcourse.hust.edu.cn:57450/test/recover?tag=r6b-popup-fix",
          "hidden": false,
          "media": [
            {
              "tag": "AUDIO",
              "paused": true,
              "ended": false,
              "currentTime": 0,
              "duration": 10,
              "readyState": 4,
              "networkState": 1,
              "rateReal": 2,
              "error": null
            }
          ]
        },
        "realRate": 2,
        "config": {
          "enabled": true,
          "rate": 2,
          "spoof": true,
          "preservesPitch": true,
          "safeCap": true,
          "autoRecover": true
        }
      },
      "playing": true,
      "manualFix": {
        "t": 1794839880579,
        "type": "manual.fix",
        "hidden": false
      }
    }
  }
}
```

### R7 诊断：MAIN world __SMARTCOURSE_SPEED_DIAG__.snapshot()/events、bridge SC_SPEED_STATUS.diag.media、popup #copyDiag 输出 JSON（version=1.2.0） — ✅ PASS

- 预期：snapshot 含 media/config/events；bridge 响应 diag.media 数组；#copyDiag 剪贴板 JSON 含 extensionVersion=1.2.0/injected/page.media/config.autoRecover；控制台有 [SC-SPEED]
- 实测：diagApi=true; bridgeMedia=1; copyOk=true; copiedKeys=extensionVersion,time,config,injected,mediaCount,realRate,page; console=true

```json
{
  "id": "R7",
  "status": "PASS",
  "evidence": {
    "mainWorldDiag": {
      "url": "http://smartcourse.hust.edu.cn:57450/test/recover?tag=r7-diag",
      "hidden": false,
      "config": {
        "enabled": true,
        "rate": 2,
        "spoof": true,
        "autoRecover": true
      },
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "paused": true,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0,
        "duration": 10,
        "rateReal": 2,
        "rateVisible": 1,
        "error": null
      },
      "events": []
    },
    "bridgeDiag": {
      "href": "http://smartcourse.hust.edu.cn:57450/test/recover?tag=r7-diag",
      "hidden": false,
      "media": [
        {
          "tag": "AUDIO",
          "paused": false,
          "ended": false,
          "currentTime": 0.61,
          "duration": 10,
          "readyState": 4,
          "networkState": 1,
          "rateReal": 2,
          "error": null
        }
      ]
    },
    "copiedJson": {
      "extensionVersion": "1.2.0",
      "time": "2026-11-16T14:38:01.338Z",
      "config": {
        "enabled": true,
        "rate": 2,
        "spoof": true,
        "preservesPitch": true,
        "safeCap": true,
        "autoRecover": true
      },
      "injected": true,
      "mediaCount": 1,
      "realRate": 2,
      "page": {
        "href": "http://smartcourse.hust.edu.cn:57450/test/recover?tag=r7-diag",
        "hidden": false,
        "media": [
          {
            "tag": "AUDIO",
            "paused": false,
            "ended": false,
            "currentTime": 0.63,
            "duration": 10,
            "readyState": 4,
            "networkState": 1,
            "rateReal": 2,
            "error": null
          }
        ]
      }
    },
    "clipboardStub": {
      "ok": true
    },
    "console": true,
    "snapshotEvents": []
  }
}
```

### R8 autoRecover=false：R1 场景不再自动恢复（3.5s 仍暂停、无 recover.attempt）；Alt+R 手动修复仍有效；重新开启后自动恢复恢复工作 — ✅ PASS

- 预期：关闭后点击播放控件 3.5s 仍暂停且无 recover.attempt；手动 Alt+R 仍恢复（manual.fix/manual-fix）；重新开启后点击控件自动恢复（play-control-click）
- 实测：offCfg={"autoRecover":false,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; offAfter3.5s.paused=true; offAutoAttempts=0; manual=true/true/true; onCfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; onAutoAttempt=true playing=true

```json
{
  "id": "R8",
  "status": "PASS",
  "evidence": {
    "offCfg": {
      "autoRecover": false,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "autoOffScenario": {
      "before": {
        "paused": true,
        "ended": false,
        "ct": 0,
        "rateVisible": 1,
        "ready": 4,
        "error": null
      },
      "after": {
        "paused": true,
        "ended": false,
        "ct": 0,
        "rateVisible": 1,
        "ready": 4,
        "error": null
      },
      "attempts": [],
      "manualPlaying": true,
      "manualFix": {
        "t": 1794839885179,
        "type": "manual.fix",
        "hidden": false
      },
      "manualAttempt": {
        "t": 1794839885178,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "manual-fix",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 10,
          "rateReal": 2,
          "rateVisible": 1,
          "error": null
        }
      }
    },
    "reenabledCfg": {
      "autoRecover": true,
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "safeCap": true,
      "spoof": true
    },
    "autoOnScenario": {
      "before": {
        "paused": true,
        "ended": false,
        "ct": 0,
        "rateVisible": 1,
        "ready": 4,
        "error": null
      },
      "attempt": {
        "t": 1794839887013,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "play-control-click",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 10,
          "rateReal": 2,
          "rateVisible": 1,
          "error": null
        }
      },
      "playing": true
    }
  }
}
```

### R9 v1.1.0 全量回归：安全上限 9 项（F0–F8）+ 既有行为 26 项全部执行且无 FAIL（storage 断言含 autoRecover） — ✅ PASS

- 预期：v1.1.0 的 35 项：9 项安全上限用例 + 26 项既有行为回归，本轮全部 PASS；新增 play/pause 包装、timeupdate 监听、1s 巡检、点击监听不改变既有行为
- 实测：v110Features=9 (F0,F1,F2,F3,F4,F5,F6,F7,F8); regression=26 (P0,P0b,P1,P2,P3,T1,T2,T3,T4a,T4b,T4c,T4d,T4e,T5,T5b,T6a,T6b,T7,T8a,T8b,T8c,T9,T10,T11,T12,T13); FAIL=none

```json
{
  "id": "R9",
  "status": "PASS",
  "evidence": {
    "v110FeatureIds": [
      "F0",
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
      "F8"
    ],
    "regressionIds": [
      "P0",
      "P0b",
      "P1",
      "P2",
      "P3",
      "T1",
      "T2",
      "T3",
      "T4a",
      "T4b",
      "T4c",
      "T4d",
      "T4e",
      "T5",
      "T5b",
      "T6a",
      "T6b",
      "T7",
      "T8a",
      "T8b",
      "T8c",
      "T9",
      "T10",
      "T11",
      "T12",
      "T13"
    ],
    "failIds": []
  }
}
```

### R-EXC 恢复助手运行期间 MAIN world 无未捕获异常（play/pause 包装与恢复路径不得抛错） — ✅ PASS

- 预期：所有恢复测试页（R1–R8）运行期间 Runtime.exceptionThrown 数量为 0
- 实测：exceptions=0

```json
{
  "id": "R-EXC",
  "status": "PASS",
  "evidence": {
    "exceptions": []
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
9. **真实“切屏/最小化”无法在 headless 中完全复现**：没有真实 GPU/窗口最小化与浏览器挂起；本次用扩展自身的三条可复现触发路径验证——①播放控件点击 1.6s 未播放（R1，真实 CDP 鼠标点击 `.vjs-play-control`，其 handler 为空）、②play() 已调用且未 pause() 但 2.4s 未播放（R4）、③播放中 currentTime 冻结 >4s（R5）。`document.hidden` 等真机可见性变化未覆盖，但恢复逻辑与之解耦。
10. **R4/R5 是受控 DOM 模拟**：在页面媒体实例上 shadow `paused`（R4）/`currentTime`（R5）getter，使扩展从自身视角看到“未暂停但未播放 / 播放中无进度”，从而触发对应恢复路径；未修改扩展源码，恢复动作由扩展内部原生 `play` 完成，诊断事件（`recover.attempt` 的 reason）与媒体实际状态作为证据。
11. **popup 手动修复/复制诊断的 active tab 处理**：扩展无 `tabs`/host 权限，popup 的 `chrome.tabs.query` 拿不到 URL；测试在扩展页面内用 `chrome.tabs.sendMessage` 探测哪一标签页的 content script 有响应（按 `diag.href` 匹配测试页），再用 `chrome.tabs.update` 激活它，然后点击 `#fixPlay` / `#copyDiag`，从而真实验证 `SC_SPEED_FIX` 与 `SC_SPEED_STATUS` 消息链路。
12. **console 日志断言方式**：通过 CDP `Runtime.consoleAPICalled` 捕获 `[SC-SPEED]` 前缀日志，而非匹配控制台文本输出。
13. **autoRecover 关闭不等于禁用恢复能力**：关闭后自动路径（点击/play 无效/卡死）全部停用，但 Alt+R 与 popup `#fixPlay` 的强制路径仍有效（R8 已覆盖），这是设计约定而非缺陷。

## 一键复现

```powershell
cd D:\dsh\speed-test
node probe-load-extension.mjs    # 证据：Chrome 157 忽略 --load-extension / Edge 可用
node probe-cdp-load.mjs          # 证据：Chrome CDP Extensions.loadUnpacked 可用
node run-tests.mjs phase-a       # 基础设施自检
node run-tests.mjs phase-b-v120  # v1.2.0 播放恢复助手验收 + v1.1.0 全量回归（生成本报告）
```

原始证据 JSON：`speed-test/results/v1.2.0-results.json`（含每项 evidence 与 Chrome 启动命令行）。
