# SmartCourse 倍速解锁 — 独立验收报告（Phase B）

- 生成时间：2026-11-16T12:05:11.428Z
- 结论：**所有可执行用例 PASS**（共 25 项：25 PASS / 0 FAIL / 0 SKIP|BLOCKED）

## 环境与加载方式

| 项目 | 值 |
| --- | --- |
| OS / Node | win32 x64 / Node v24.22.1（零 npm 依赖，原生 http + WebSocket） |
| 浏览器 | Chrome/157.0.8103.51（CDP protocol 1.3） |
| 扩展 | `D:\dsh\smartcourse-speed-unlock` → extensionId `jdakeggaeemgneckbpfhlfkhhhoaging` |
| 扩展加载方式 | CDP Extensions.loadUnpacked；启动参数含 `--enable-unsafe-extension-debugging` |
| 命令行 --load-extension | Chrome 157 **被禁用**（stderr: `--load-extension is not allowed in Google Chrome, ignoring.`）；Edge 157 可用。详见 Phase A 证据 |
| 测试域名 | `--host-resolver-rules="MAP smartcourse.hust.edu.cn 127.0.0.1, MAP jwc.hust.edu.cn 127.0.0.1, MAP cross.example 127.0.0.1"`，全部流量命中本机 Node 服务器，**未访问真实课程平台** |

> 说明：Chrome 137+ 的 branded 构建不再接受命令行 `--load-extension`（浏览器策略，非测试缺陷）。官方自动化替代方案是 `--enable-unsafe-extension-debugging` + CDP `Extensions.loadUnpacked`，它加载的是**真实 unpacked 扩展**，manifest 的 matches / `world: MAIN` / `all_frames` 全部生效，因此本次验收属于扩展层真实验证，而非 CDP 注入模拟。普通用户通过 `chrome://extensions` → “加载已解压的扩展程序” 安装，加载后的行为与本次验证一致。

## 结果总览

| # | 用例 | 状态 | 关键证据 |
| --- | --- | --- | --- |
| P0 | 扩展加载层（Chrome 157）：CDP Extensions.loadUnpacked 加载真实扩展 | ✅ PASS | extensionId=jdakeggaeemgneckbpfhlfkhhhoaging, popupPageLoads=true |
| P1 | content script 注入范围：匹配域（*.hust.edu.cn）注入 MAIN-world Hook，非匹配域不注入 | ✅ PASS | matched.hooked=true, outside.hooked=false |
| P2 | 测试流量全部命中本地服务器（host-resolver-rules），未访问真实课程平台 | ✅ PASS | location.host=smartcourse.hust.edu.cn:60271; server-seen host=smartcourse.hust.edu.cn:60271 |
| P3 | 测量通道准备：隔离世界 real rate + MAIN world spoof read + currentTime 斜率 | ✅ PASS | mainCtx=8; sameIframeCtx=9; jwcIframeCtx=10; media=[{"id":"early-audio","ct":0,"rate":1,"paused":true,"ready":4,"pr":true,"dur":10,"err":null}] |
| T1 | 未写入配置时默认行为：enabled=true/rate=2/spoof=true（真实 2.0，页面读 1） | ✅ PASS | storageCfg=null; real=2; visible=all 1 |
| T2 | 契约配置 chrome.storage.local["sc_speed_cfg_v1"] 写入并生效（经扩展页面） | ✅ PASS | storage={"enabled":true,"preservesPitch":true,"rate":2,"spoof":true}; ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"spoof":true,"preservesPitch":true,"activeChip":"2.0×" |
| T3 | 页面设置 playbackRate=3 / defaultPlaybackRate=0.5 → 内部真实倍速保持 2，页面读到 1 | ✅ PASS | pageSet.readBack=1; real=2; visible=1; defaultReal=2 |
| T4a | 页面循环重置（setInterval + ratechange 监听，mode=both）期间真实倍速持续为 2.0 | ✅ PASS | maxDeviation=0ms; page reset attempts 7→15 |
| T4b | page: defaultPlaybackRate=1 + load() 重置后，内部倍速在 ≤1.5s 内恢复为 2 | ✅ PASS | recovery=0ms (ok=true), pageRead=1 |
| T4c | 动态插入的 <audio>/<video> 也被强制为 2.0，且页面读取为 1 | ✅ PASS | audioId=audio-dyn-1 real=2; videoId=video-dyn-2 real=2; visibleAll1=true |
| T4d | 带外（绕过 Hook）把真实倍速改回 1 后，700ms 兜底巡检在 ≤1.5s 内恢复为 2 | ✅ PASS | outOfBandWrite=1; recovery=0ms (ok=true) |
| T4e | 页面篡改 Hook（重定义 playbackRate 属性）后，扩展 ≤1.5s 自动重新接管 | ✅ PASS | tamperedVisibleRead=0.5; repairedIn=180ms; real=2 |
| T5 | spoof=false：页面读取到真实倍速 2.0（关闭伪装实时生效，无需刷新） | ✅ PASS | cfg={"enabled":true,"preservesPitch":true,"rate":2,"spoof":false}; pageRead=2 in 0ms; real=2 |
| T5b | spoof 重新开启后页面读取立即恢复为 1.0（无需刷新） | ✅ PASS | pageRead=1 in 1ms; real=2 |
| T6a | enabled=false：内部倍速回到 1，页面可正常设置/读取 playbackRate（3.0 / 1.0） | ✅ PASS | hook=true; cfg={"enabled":false,"preservesPitch":true,"rate":2,"spoof":true}; afterDisableReal=[1]; set3 real=3 visible=3; set1 real=1 |
| T6b | enabled=true 重新开启：已打开页面无需刷新即恢复强制倍速 2.0 + 页面读 1 | ✅ PASS | cfg={"enabled":true,"preservesPitch":true,"rate":2,"spoof":true}; real=2 in 1ms; visible=1 |
| T7 | 弹窗点击 2.5× → 已打开页面无需刷新即生效（真实 2.5，页面读 1.0，UI 同步） | ✅ PASS | cfg={"enabled":true,"preservesPitch":true,"rate":2.5,"spoof":true}; real=2.5 in 1ms; visible=1; ui.rateValue=2.5 |
| T8a | Alt+↑ / Alt+↓ 步进 0.25 并写入 chrome.storage（持久化） | ✅ PASS | AltUp: storage={"enabled":true,"preservesPitch":true,"rate":2.25,"spoof":true} real=2.25; AltDown: storage={"enabled":true,"preservesPitch":true,"rate":2,"spoof":true} real=2; ui=2 |
| T8b | Alt+↓ 在 0.25 下限 / Alt+↑ 在 16 上限均被钳制，不越界 | ✅ PASS | low: storage=0.25, real=0.25; high: storage=16, real=16 |
| T8c | 快捷键/配置写入 chrome.storage 持久化：新打开页面直接应用 2.25 | ✅ PASS | newPage real=2.25 in 1ms |
| T9 | 跨域 iframe（jwc.hust.edu.cn）内媒体同样被强制：real=2.0、页面读=1、currentTime 斜率≈2、带外重置 ≤1.5s 恢复 | ✅ PASS | iframeTags=["iframe-cross-127.0.0.1","iframe-same-origin","iframe-cross-jwc.hust.edu.cn"]; jwc real=2 visible=1 ctSlope=2.03; sameOriginIframe real=2; outOfBand=1; recovery=0ms |
| T10 | 非匹配域跨域 iframe（127.0.0.1）不注入（与 manifest 生效范围一致，信息项） | ✅ PASS | external iframe visible rate=1 |
| T11 | preservesPitch=true 时真实媒体保持音调（页面/真实均 true） | ✅ PASS | real=true, visible=true |
| T12 | 10s 播放稳定性：无 ratechange 风暴 / CPU 暴涨，真实倍速持续 2.0 | ✅ PASS | ratechange +0 (0→5s +0, 5→10s +0), TaskDuration +0.141s, ScriptDuration +0.108s, maxDeviation=0ms, page reset attempts=219 |
| T13 | 弹窗 UI 与 storage 同步（信息项；headless 下注入状态圆点无法代表真实活动标签） | ✅ PASS | ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"spoof":true,"preservesPitch":true,"activeChip":"2.0×","statusText":"当前标签页不在生效范围（请打开课程视频页面）","statusDotClass":"dot warn"} |

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
      "--user-data-dir=C:\\Users\\WR1TE_~1\\AppData\\Local\\Temp\\sc-speed-test-m0zKJf",
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

### P1 content script 注入范围：匹配域（*.hust.edu.cn）注入 MAIN-world Hook，非匹配域不注入 — ✅ PASS

- 预期：smartcourse.hust.edu.cn: hooked=true；127.0.0.1: hooked=false
- 实测：matched.hooked=true, outside.hooked=false

```json
{
  "id": "P1",
  "status": "PASS",
  "evidence": {
    "mainUrl": "http://smartcourse.hust.edu.cn:60271/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main",
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

- 预期：页面与服务器 Host 头均为 smartcourse.hust.edu.cn:60271
- 实测：location.host=smartcourse.hust.edu.cn:60271; server-seen host=smartcourse.hust.edu.cn:60271

```json
{
  "id": "P2",
  "status": "PASS",
  "evidence": {
    "mappedInfo": {
      "host": "smartcourse.hust.edu.cn:60271",
      "href": "http://smartcourse.hust.edu.cn:60271/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main"
    },
    "echo": {
      "ok": true,
      "host": "smartcourse.hust.edu.cn:60271",
      "url": "/health",
      "ts": 1794830692737,
      "pid": 63080,
      "serverPort": 60271,
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
        "id": "26A7B542E307E9FAED1AA43A0E96CC75",
        "url": "http://smartcourse.hust.edu.cn:60271/test/main?mode=both&crossHosts=jwc.hust.edu.cn%2C127.0.0.1&tag=main",
        "securityOrigin": "http://smartcourse.hust.edu.cn:60271"
      },
      {
        "id": "3CE617A122C7792FF5CA58093515FC35",
        "url": "http://smartcourse.hust.edu.cn:60271/test/iframe?mode=both&tag=iframe-same-origin",
        "securityOrigin": "http://smartcourse.hust.edu.cn:60271"
      },
      {
        "id": "E644BECD8387F626C3FBF6C2DB3507BE",
        "url": "http://jwc.hust.edu.cn:60271/test/iframe?mode=both&tag=iframe-cross-jwc.hust.edu.cn",
        "securityOrigin": "http://jwc.hust.edu.cn:60271"
      }
    ]
  }
}
```

### T1 未写入配置时默认行为：enabled=true/rate=2/spoof=true（真实 2.0，页面读 1） — ✅ PASS

- 预期：storage 为空 → hook 使用默认 rate=2、spoof=1.0；真实内部倍速=2
- 实测：storageCfg=null; real=2; visible=all 1

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
        "ct": 0.732083,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "visibleMedia": [
      {
        "id": "early-audio",
        "ct": 0.733525,
        "rate": 1,
        "paused": false,
        "ready": 4,
        "pr": true,
        "dur": 10,
        "err": null
      }
    ],
    "playStart": [
      {
        "ok": true
      }
    ]
  }
}
```

### T2 契约配置 chrome.storage.local["sc_speed_cfg_v1"] 写入并生效（经扩展页面） — ✅ PASS

- 预期：{"enabled":true,"rate":2,"spoof":true,"preservesPitch":true}；写入后已打开页面真实倍速=2
- 实测：storage={"enabled":true,"preservesPitch":true,"rate":2,"spoof":true}; ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"spoof":true,"preservesPitch":true,"activeChip":"2.0×","statusText":"当前标签页不在生效范围（请打开课程视频页面）","statusDotClass":"dot warn"}; appliedIn=2ms

```json
{
  "id": "T2",
  "status": "PASS",
  "evidence": {
    "cfgWrite": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "spoof": true
    },
    "ui": {
      "rateValue": "2.0",
      "customRate": "2.0",
      "enabled": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.0×",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    },
    "apply2": {
      "ok": true,
      "value": 2,
      "elapsedMs": 2
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
        "ct": 1.950869,
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
- 实测：maxDeviation=0ms; page reset attempts 7→15

```json
{
  "id": "T4a",
  "status": "PASS",
  "evidence": {
    "maxDeviationMs": 0,
    "resetsBefore": 7,
    "resetsAfter": 15,
    "samples": [
      {
        "t": 0,
        "rate": 2
      },
      {
        "t": 43,
        "rate": 2
      },
      {
        "t": 89,
        "rate": 2
      },
      {
        "t": 135,
        "rate": 2
      },
      {
        "t": 181,
        "rate": 2
      },
      {
        "t": 228,
        "rate": 2
      },
      {
        "t": 274,
        "rate": 2
      },
      {
        "t": 321,
        "rate": 2
      },
      {
        "t": 365,
        "rate": 2
      },
      {
        "t": 412,
        "rate": 2
      },
      {
        "t": 458,
        "rate": 2
      },
      {
        "t": 504,
        "rate": 2
      },
      {
        "t": 550,
        "rate": 2
      },
      {
        "t": 597,
        "rate": 2
      },
      {
        "t": 644,
        "rate": 2
      },
      {
        "t": 691,
        "rate": 2
      },
      {
        "t": 737,
        "rate": 2
      },
      {
        "t": 782,
        "rate": 2
      },
      {
        "t": 829,
        "rate": 2
      },
      {
        "t": 875,
        "rate": 2
      },
      {
        "t": 922,
        "rate": 2
      },
      {
        "t": 969,
        "rate": 2
      },
      {
        "t": 1015,
        "rate": 2
      },
      {
        "t": 1061,
        "rate": 2
      },
      {
        "t": 1107,
        "rate": 2
      },
      {
        "t": 1152,
        "rate": 2
      },
      {
        "t": 1200,
        "rate": 2
      },
      {
        "t": 1246,
        "rate": 2
      },
      {
        "t": 1291,
        "rate": 2
      },
      {
        "t": 1338,
        "rate": 2
      },
      {
        "t": 1384,
        "rate": 2
      },
      {
        "t": 1431,
        "rate": 2
      },
      {
        "t": 1478,
        "rate": 2
      },
      {
        "t": 1524,
        "rate": 2
      },
      {
        "t": 1570,
        "rate": 2
      },
      {
        "t": 1616,
        "rate": 2
      },
      {
        "t": 1661,
        "rate": 2
      },
      {
        "t": 1708,
        "rate": 2
      },
      {
        "t": 1754,
        "rate": 2
      },
      {
        "t": 1800,
        "rate": 2
      },
      {
        "t": 1847,
        "rate": 2
      },
      {
        "t": 1895,
        "rate": 2
      },
      {
        "t": 1940,
        "rate": 2
      },
      {
        "t": 1986,
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
        "ct": 1.082788,
        "paused": false,
        "ready": 4,
        "err": null
      },
      {
        "id": "audio-dyn-1",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.082718,
        "paused": false,
        "ready": 4,
        "err": null
      },
      {
        "id": "video-dyn-2",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.082638,
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
- 实测：tamperedVisibleRead=0.5; repairedIn=180ms; real=2
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
      "elapsedMs": 180
    },
    "repairedReal": 2
  }
}
```

### T5 spoof=false：页面读取到真实倍速 2.0（关闭伪装实时生效，无需刷新） — ✅ PASS

- 预期：storage.spoof=false 后 ≤1.5s 页面读 =2.0，真实 =2.0
- 实测：cfg={"enabled":true,"preservesPitch":true,"rate":2,"spoof":false}; pageRead=2 in 0ms; real=2

```json
{
  "id": "T5",
  "status": "PASS",
  "evidence": {
    "spoofOffCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
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
- 实测：hook=true; cfg={"enabled":false,"preservesPitch":true,"rate":2,"spoof":true}; afterDisableReal=[1]; set3 real=3 visible=3; set1 real=1

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
- 实测：cfg={"enabled":true,"preservesPitch":true,"rate":2,"spoof":true}; real=2 in 1ms; visible=1

```json
{
  "id": "T6b",
  "status": "PASS",
  "evidence": {
    "onCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "spoof": true
    },
    "onReal": {
      "ok": true,
      "value": 2,
      "elapsedMs": 1
    },
    "onVisible": 1
  }
}
```

### T7 弹窗点击 2.5× → 已打开页面无需刷新即生效（真实 2.5，页面读 1.0，UI 同步） — ✅ PASS

- 预期：storage/UI=2.5，页面 real=2.5，visible=1.0，≤1.5s
- 实测：cfg={"enabled":true,"preservesPitch":true,"rate":2.5,"spoof":true}; real=2.5 in 1ms; visible=1; ui.rateValue=2.5

```json
{
  "id": "T7",
  "status": "PASS",
  "evidence": {
    "chipRes": {
      "ok": true
    },
    "cfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.5,
      "spoof": true
    },
    "real25": {
      "ok": true,
      "value": 2.5,
      "elapsedMs": 1
    },
    "vis25": 1,
    "ui25": {
      "rateValue": "2.5",
      "customRate": "2.5",
      "enabled": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.5×",
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    }
  }
}
```

### T8a Alt+↑ / Alt+↓ 步进 0.25 并写入 chrome.storage（持久化） — ✅ PASS

- 预期：2.00 →(Alt+↑) 2.25 →(Alt+↓) 2.00；storage 与弹窗 UI 同步
- 实测：AltUp: storage={"enabled":true,"preservesPitch":true,"rate":2.25,"spoof":true} real=2.25; AltDown: storage={"enabled":true,"preservesPitch":true,"rate":2,"spoof":true} real=2; ui=2.25

```json
{
  "id": "T8a",
  "status": "PASS",
  "evidence": {
    "backTo2": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "spoof": true
    },
    "altUpCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2.25,
      "spoof": true
    },
    "altUpReal": {
      "ok": true,
      "value": 2.25,
      "elapsedMs": 73
    },
    "altUpUi": {
      "rateValue": "2.25",
      "customRate": "2.25",
      "enabled": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": null,
      "statusText": "当前标签页不在生效范围（请打开课程视频页面）",
      "statusDotClass": "dot warn"
    },
    "altDownCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 2,
      "spoof": true
    },
    "altDownReal": {
      "ok": true,
      "value": 2,
      "elapsedMs": 73
    }
  }
}
```

### T8b Alt+↓ 在 0.25 下限 / Alt+↑ 在 16 上限均被钳制，不越界 — ✅ PASS

- 预期：下限 0.25 保持；上限 16 保持
- 实测：low: storage=0.25, real=0.25; high: storage=16, real=16

```json
{
  "id": "T8b",
  "status": "PASS",
  "evidence": {
    "lowCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 0.25,
      "spoof": true
    },
    "lowReal": 0.25,
    "highCfg": {
      "enabled": true,
      "preservesPitch": true,
      "rate": 16,
      "spoof": true
    },
    "highReal": 16
  }
}
```

### T8c 快捷键/配置写入 chrome.storage 持久化：新打开页面直接应用 2.25 — ✅ PASS

- 预期：新页面（未刷新前即已写入 storage）real=2.25
- 实测：newPage real=2.25 in 1ms

```json
{
  "id": "T8c",
  "status": "PASS",
  "evidence": {
    "persistReal": {
      "ok": true,
      "value": 2.25,
      "elapsedMs": 1
    }
  }
}
```

### T9 跨域 iframe（jwc.hust.edu.cn）内媒体同样被强制：real=2.0、页面读=1、currentTime 斜率≈2、带外重置 ≤1.5s 恢复 — ✅ PASS

- 预期：all_frames 生效：跨域/同源子框架 real=2.0、visible=1、媒体时钟斜率≈2、兜底恢复 ≤1500ms
- 实测：iframeTags=["iframe-cross-127.0.0.1","iframe-same-origin","iframe-cross-jwc.hust.edu.cn"]; jwc real=2 visible=1 ctSlope=2.03; sameOriginIframe real=2; outOfBand=1; recovery=0ms

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
      "resets": 42
    },
    "jwcReals": [
      {
        "id": "early-audio",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 2.722378,
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
        "ct": 2.724322,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "jwcOob": 1,
    "jwcRecovery": {
      "ok": true,
      "value": 2,
      "elapsedMs": 0
    },
    "jwcSlope": {
      "rate": 2.0272804603490377,
      "n": 12,
      "playing": true
    },
    "jwcFrame": {
      "id": "E644BECD8387F626C3FBF6C2DB3507BE",
      "url": "http://jwc.hust.edu.cn:60271/test/iframe?mode=both&tag=iframe-cross-jwc.hust.edu.cn",
      "securityOrigin": "http://jwc.hust.edu.cn:60271"
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
      "resets": 34
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
- 实测：ratechange +0 (0→5s +0, 5→10s +0), TaskDuration +0.141s, ScriptDuration +0.108s, maxDeviation=0ms, page reset attempts=219

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
    "taskDelta": 0.141,
    "scriptDelta": 0.108,
    "maxDeviationMs": 0,
    "pageResets": 219,
    "samples": [
      {
        "t": 0,
        "rate": 2
      },
      {
        "t": 1089,
        "rate": 2
      },
      {
        "t": 2166,
        "rate": 2
      },
      {
        "t": 3242,
        "rate": 2
      },
      {
        "t": 4322,
        "rate": 2
      },
      {
        "t": 321,
        "rate": 2
      },
      {
        "t": 1401,
        "rate": 2
      },
      {
        "t": 2477,
        "rate": 2
      },
      {
        "t": 3552,
        "rate": 2
      },
      {
        "t": 4633,
        "rate": 2
      }
    ]
  }
}
```

### T13 弹窗 UI 与 storage 同步（信息项；headless 下注入状态圆点无法代表真实活动标签） — ✅ PASS

- 预期：弹窗显示 storage 中的倍速/开关；状态圆点逻辑依赖 chrome.tabs active 标签，自动化场景不具代表性
- 实测：ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"spoof":true,"preservesPitch":true,"activeChip":"2.0×","statusText":"当前标签页不在生效范围（请打开课程视频页面）","statusDotClass":"dot warn"}

```json
{
  "id": "T13",
  "status": "PASS",
  "evidence": {
    "popupUi": {
      "rateValue": "2.0",
      "customRate": "2.0",
      "enabled": true,
      "spoof": true,
      "preservesPitch": true,
      "activeChip": "2.0×",
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

## 一键复现

```powershell
cd D:\dsh\speed-test
node probe-load-extension.mjs    # 证据：Chrome 157 忽略 --load-extension / Edge 可用
node probe-cdp-load.mjs          # 证据：Chrome CDP Extensions.loadUnpacked 可用
node run-tests.mjs phase-a       # 基础设施自检
node run-tests.mjs phase-b       # 全套行为契约验收（生成本报告）
```

原始证据 JSON：`speed-test/results/phase-b-results.json`（含每项 evidence 与 Chrome 启动命令行）。
