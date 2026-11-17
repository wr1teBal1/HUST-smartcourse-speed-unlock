# SmartCourse 倍速解锁 — 独立验收报告（v1.2.1 · 低干扰版 + 全量回归）

- 生成时间：2026-11-17T04:17:22.521Z
- 扩展版本：**1.2.1**（extensionId `jdakeggaeemgneckbpfhlfkhhhoaging`，Chrome Chrome/157.0.8103.51）
- 结论：**所有可执行用例 PASS**（共 59 项：59 PASS / 0 FAIL / 0 SKIP|BLOCKED）
  - v1.2.1 新增功能用例（S1–S9）：13 项，13 PASS / 0 FAIL
  - v1.2.0 播放恢复/诊断用例（回归）：11 项，11 PASS / 0 FAIL
  - v1.1.0 安全上限用例（F0–F8，回归的一部分）：9 项，9 PASS / 0 FAIL
  - 既有行为回归（P/T 用例）：26 项，26 PASS / 0 FAIL

## 环境与加载方式

| 项目 | 值 |
| --- | --- |
| OS / Node | win32 x64 / Node v24.22.1（零 npm 依赖，原生 http + WebSocket） |
| 浏览器 | Chrome/157.0.8103.51（CDP protocol 1.3） |
| 扩展 | `D:\dsh\smartcourse-speed-unlock` → extensionId `jdakeggaeemgneckbpfhlfkhhhoaging`，manifest version **1.2.1** |
| 扩展加载方式 | CDP Extensions.loadUnpacked；启动参数含 `--enable-unsafe-extension-debugging` |
| 命令行 --load-extension | Chrome 157 **被禁用**（stderr: `--load-extension is not allowed in Google Chrome, ignoring.`）；Edge 157 可用。详见 Phase A 证据 |
| 测试域名 | `--host-resolver-rules="MAP smartcourse.hust.edu.cn 127.0.0.1, MAP jwc.hust.edu.cn 127.0.0.1, MAP lib.hust.edu.cn 127.0.0.1, MAP mooc1.chaoxing.com 127.0.0.1, MAP mooc2.chaoxing.com 127.0.0.1, MAP mooc1.xuexitong.com 127.0.0.1, MAP cross.example 127.0.0.1"`，全部流量命中本机 Node 服务器，**未访问真实课程平台** |

> 说明：Chrome 137+ 的 branded 构建不再接受命令行 `--load-extension`（浏览器策略，非测试缺陷）。官方自动化替代方案是 `--enable-unsafe-extension-debugging` + CDP `Extensions.loadUnpacked`，它加载的是**真实 unpacked 扩展**，manifest 的 matches / `world: MAIN` / `all_frames` 全部生效，因此本次验收属于扩展层真实验证，而非 CDP 注入模拟。普通用户通过 `chrome://extensions` → “加载已解压的扩展程序” 安装，加载后的行为与本次验证一致。

## v1.2.1 新增功能用例（低干扰版：范围收窄 / 媒体过滤 / 后台低干扰 / 音调 / 诊断）

| # | 用例 | 状态 | 关键证据 |
| --- | --- | --- | --- |
| S7 | 版本/加载：manifest version=1.2.1、CDP Extensions.loadUnpacked 真实加载成功、popup footer 含 v1.2.1 | ✅ PASS | version=1.2.1; extensionId=jdakeggaeemgneckbpfhlfkhhhoaging; footer=v1.2.1 · 本地扩展，不上传任何数据; hasFixPlay=true; hasCopyDiag=true |
| S1 | 范围收窄：manifest matches 仅 3 条（smartcourse 任意路径 / chaoxing / xuexitong 的 /ananas/modules/*）+ 注入矩阵正确 | ✅ PASS | matches=[["*://smartcourse.hust.edu.cn/*","*://*.chaoxing.com/ananas/modules/*","*://*.xuexitong.com/ananas/modules/*"],["*://smartcourse.hust.edu.cn/*","*://*.chaoxing.com/ananas/modules/*","*://*.xuexitong.com/ananas/modules/*"]]; smartcourse=true; |
| S2 | 智能媒体过滤：非播放器页空/短/长 audio 不被接管、同页 video 被接管；播放器模块页长 audio + video 被接管 | ✅ PASS | plain={"empty-audio":1,"short-audio":1,"long-audio":1,"long-video":2} visibleVideo=1; player={"empty-audio":1,"short-audio":2,"long-audio":2,"long-video":2} |
| S3 | 后台低干扰：hidden 时原生 setter 改回 1 的 2s 内不被恢复、currentTime 冻结不产生 stall/recover；恢复可见后 ≤1.5s 恢复 2× | ✅ PASS | before=2; hidden=true; set=1; restoredIn2s=false; samples=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]; hiddenStalls=0; hiddenRecovers=0; visibleRestore=true in 1ms |
| S3b | 后台低干扰（MutationObserver）：hidden 时动态插入媒体不被扫描强制；恢复可见后 ≤1.5s 补强制到 2× | ✅ PASS | hiddenRate=1; visibleRestore=true (2) in 2ms |
| S4 | 保持音调：preservesPitch=false → 真实 media.preservesPitch === false（实时生效）；true → === true | ✅ PASS | initial={"audio":true,"video":true}; off={"audio":false,"video":false} (0ms); on={"audio":true,"video":true} (0ms) |
| S5 | 诊断改进：顶层只有空 audio 时延迟 ~350ms 回答（usefulCount=0）；iframe 内有真实 video 时子帧优先回答（usefulCount≥1、hasSrc=true） | ✅ PASS | topOnly: elapsed=356ms useful=0 media=[false]; childVideo: elapsed=1ms useful=1 href=http://mooc1.chaoxing.com:57323/ananas/modules/iframe?mode=off&media=video&autoplay=1&tag=s5-child mainDiag.hasSrc=true |
| S8 | 空 audio 不再被写入倍速（真实 rate 保持 1）+ 诊断可看到 hasSrc/inScope/playerModulePage/preservesPitch/muted/volume | ✅ PASS | emptyAudioRate=1; snapshotFields={"tag":"AUDIO","id":"long-audio","hasSrc":true,"inScope":true,"playerModulePage":true,"paused":true,"ended":false,"readyState":4,"networkState":1,"currentTime":0,"duration":30,"rateReal":2,"rateVisible":1,"preservesPi |
| S9.1 | 异常诊断：隔离世界改真实 rate → MAIN world 记录 rate.change(real/visible/pitch)；seek → seek.seeking/seek.seeked；bridge mainDiag 含 events | ✅ PASS | rateChanges=[{"real":2,"visible":1,"pitch":true},{"real":2,"visible":1,"pitch":true},{"real":2,"visible":1,"pitch":true},{"real":1,"visible":1,"pitch":true},{"real":2,"visible":1,"pitch":true}]; seeking={"ct":5,"real":2}; seeked={"ct":5,"real":2}; ma |
| S9.2 | 诊断改进：顶层空 audio + iframe 真实 video 时 SC_SPEED_STATUS.mainDiag 非 null（media.hasSrc=true）；popup「复制诊断信息」JSON 含 player(mainDiag)/config/events | ✅ PASS | activated=true; copyOk=true; version=1.2.1; playerHasSrc=true; playerEvents=2; pageUseful=1 |
| S9.3 | 后台低干扰（诊断）：hidden 时 3s 周期诊断不上报（mainDiag 事件不增长）；恢复可见后恢复上报 | ✅ PASS | m0events=1; hiddenUnchanged=true; visibleUpdated=true; m2events=3 |
| S6 | v1.2.0 全量回归：46 项（播放恢复/诊断 11 项 + 安全上限 9 项 + 既有行为 26 项）全部执行且无 FAIL | ✅ PASS | v120=11 (R10,R1,R2,R3,R4,R5,R6,R7,R8,R9,R-EXC); v110=9; regression=26; nonV121FAIL=none |
| S-EXC | S 用例运行期间 MAIN world 无未捕获异常 | ✅ PASS | exceptions=0 |

## v1.2.0 播放恢复/诊断用例（回归）

| # | 用例 | 状态 | 关键证据 |
| --- | --- | --- | --- |
| R10 | v1.2.1 版本与 popup 新控件：#toggleAutoRecover / #fixPlay / #copyDiag，footer 含 v1.2.1 | ✅ PASS | version=1.2.1; hasFixPlay=true; hasCopyDiag=true; autoRecover=true; footer=v1.2.1 · 本地扩展，不上传任何数据 |
| R1 | 播放按钮无响应：真实点击 .vjs-play-control（handler 为空）→ ~1.6s 后自动恢复播放，页面读倍速仍为 1 | ✅ PASS | click={"x":95,"y":195.5,"w":108,"h":58,"visible":true,"text":"播放"}; attemptDelay=1601ms; paused=false; pageRead=1; realRate=2; playEvent=true; events=["rate.change","click.play-control","recover.attempt:play-control-click","seek.seeking","s |
| R2 | 非播放控件不触发恢复：点击普通按钮 #other 后 3s 仍暂停、无 recover.attempt；play/pause 包装不改变返回值语义 | ✅ PASS | click={"x":216.84375,"y":196.5,"w":112,"h":52,"visible":true,"text":"其他按钮"}; pausedAfter3s=true; recoverAttempts=0; wrapper={"pauseReturnType":"undefined","playReturnsPromise":true}; otherClick=true |
| R3 | 尊重用户暂停：play() 播放中页面调用 pause() 后 3.5s+ 保持暂停、currentTime 冻结，不被抢回 | ✅ PASS | playing=true; pause={"paused":true,"ct":1.012888}; after3.5s.paused=true; ctDelta=0; recoverAfterPause=0; recoverTotal=0 |
| R4 | play() 调用无效：扩展视角 paused 持续 true 且页面未 pause() → ~2.4s 后 recover.attempt(reason=play-ineffective)，不得抛错 | ✅ PASS | delay=2402ms; throws=0; rejects=0; events=["rate.change","play.call","play.ok","recover.attempt:play-ineffective","seek.seeking","seek.seeked"] |
| R5 | 播放中卡死：currentTime 冻结 >4s → stall.detected + recover.attempt(reason=stalled) | ✅ PASS | playing=true; freeze={"frozen":0.409277}; stallDelay=4614ms; stalledMs=4415; attemptReason=stalled |
| R6 | 手动修复：Alt+R 与 popup #fixPlay（SC_SPEED_FIX 链路）均能恢复播放，诊断事件含 manual.fix | ✅ PASS | altR: playing=true manualFix=true attempt=manual-fix pageRead=1 real=2 console=true; popupFix: tabFound=true (http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r6b-popup-fix) playing=true manualFix=true |
| R7 | 诊断：MAIN world __SMARTCOURSE_SPEED_DIAG__.snapshot()/events、bridge SC_SPEED_STATUS.diag.media、popup #copyDiag 输出 JSON（version=1.2.0） | ✅ PASS | diagApi=true; bridgeMedia=1; copyOk=true; copiedKeys=extensionVersion,time,config,injected,mediaCount,realRate,page,player; console=true |
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
| P0b | 扩展 manifest 版本与 content_scripts 匹配范围（真实加载的扩展） | ✅ PASS | version=1.2.1; name=SmartCourse 倍速解锁; matches=["*://smartcourse.hust.edu.cn/*","*://*.chaoxing.com/ananas/modules/*","*://*.xuexitong.com/ananas/modules/*"] |
| P1 | content script 注入范围：smartcourse.hust.edu.cn 注入 MAIN-world Hook；lib.hust.edu.cn（非 smartcourse）不注入 | ✅ PASS | matched.hooked=true, outside.hooked=false, outsideUrl=http://lib.hust.edu.cn:57323/test/page.html?tag=outside |
| P2 | 测试流量全部命中本地服务器（host-resolver-rules），未访问真实课程平台 | ✅ PASS | location.host=smartcourse.hust.edu.cn:57323; server-seen host=smartcourse.hust.edu.cn:57323 |
| P3 | 测量通道准备：隔离世界 real rate + MAIN world spoof read + currentTime 斜率 | ✅ PASS | mainCtx=6; sameIframeCtx=7; crossIframeCtx=null; media=[{"id":"early-audio","ct":0,"rate":1,"paused":true,"ready":4,"pr":true,"dur":30,"err":null}] |
| T1 | 未写入配置时默认行为：enabled=true/rate=2/spoof=true/safeCap=true/autoRecover=true（真实 2.0，页面读 1，无警告） | ✅ PASS | storageCfg=null; real=2; visible=all 1; ui.safeCap=true; ui.autoRecover=true; ui.rateWarningHidden=true |
| T2 | 契约配置 chrome.storage.local["sc_speed_cfg_v1"] 写入并生效（经扩展页面，含 safeCap/autoRecover） | ✅ PASS | storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; ui.safeCap=true; ui.autoRecover=true; appliedIn=2ms |
| T3 | 页面设置 playbackRate=3 / defaultPlaybackRate=0.5 → 内部真实倍速保持 2，页面读到 1 | ✅ PASS | pageSet.readBack=1; real=2; visible=1; defaultReal=2 |
| T4a | 页面循环重置（setInterval + ratechange 监听，mode=both）期间真实倍速持续为 2.0 | ✅ PASS | maxDeviation=0ms; page reset attempts 104→112 |
| T4b | page: defaultPlaybackRate=1 + load() 重置后，内部倍速在 ≤1.5s 内恢复为 2 | ✅ PASS | recovery=2ms (ok=true), pageRead=1 |
| T4c | 动态插入的 <audio>/<video> 也被强制为 2.0，且页面读取为 1 | ✅ PASS | audioId=audio-dyn-1 real=2; videoId=video-dyn-2 real=2; visibleAll1=true |
| T4d | 带外（绕过 Hook）把真实倍速改回 1 后，700ms 兜底巡检在 ≤1.5s 内恢复为 2 | ✅ PASS | outOfBandWrite=1; recovery=1ms (ok=true) |
| T4e | 页面篡改 Hook（重定义 playbackRate 属性）后，扩展 ≤1.5s 自动重新接管 | ✅ PASS | tamperedVisibleRead=0.5; repairedIn=642ms; real=2 |
| T5 | spoof=false：页面读取到真实倍速 2.0（关闭伪装实时生效，无需刷新） | ✅ PASS | cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":false}; pageRead=2 in 3ms; real=2 |
| T5b | spoof 重新开启后页面读取立即恢复为 1.0（无需刷新） | ✅ PASS | pageRead=1 in 1ms; real=2 |
| T6a | enabled=false：内部倍速回到 1，页面可正常设置/读取 playbackRate（3.0 / 1.0） | ✅ PASS | hook=true; cfg={"autoRecover":true,"enabled":false,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; afterDisableReal=[1]; set3 real=3 visible=3; set1 real=1 |
| T6b | enabled=true 重新开启：已打开页面无需刷新即恢复强制倍速 2.0 + 页面读 1 | ✅ PASS | cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; real=2 in 0ms; visible=1 |
| T7 | 弹窗点击 2.5× → 安全上限二次确认 → 已打开页面无需刷新即生效（真实 2.5，页面读 1.0，storage 含 safeCap） | ✅ PASS | beforeCfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cfg={"autoRecover":true,"enabled":t |
| T8a | Alt+↑ / Alt+↓ 步进 0.25 并写入 chrome.storage（持久化） | ✅ PASS | AltUp: storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true} real=2.25; AltDown: storage={"autoRecover":true,"enabled":true,"pre |
| T8b | Alt+↓ 在 0.25 下限 / Alt+↑ 在 16 上限均被钳制，不越界 | ✅ PASS | low: storage=0.25, real=0.25; high: confirmShown=true, storage=16, real=16 |
| T8c | 快捷键/配置写入 chrome.storage 持久化：新打开页面直接应用 2.25（storage 含 safeCap） | ✅ PASS | newPage real=2.25 in 4ms; storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; setViaConfirm=true |
| T9 | 跨域 iframe（mooc1.chaoxing.com/ananas/modules/iframe，manifest 匹配）内媒体同样被强制：页面读=1、currentTime 斜率≈2；同源 iframe real=2 | ✅ PASS | iframeTags=["iframe-same-origin","iframe-cross-mooc1.chaoxing.com","iframe-nonmatch-mooc1.chaoxing.com"]; cross[iframe-cross-mooc1.chaoxing.com] hooked=true visible=1 ctSlope=2.04  |
| T10 | manifest 范围外的跨域 iframe（mooc1.chaoxing.com 普通路径 /test/iframe）不注入（信息项） | ✅ PASS | nonmatch iframe hooked=false visible=1 ctSlope=0.99 |
| T11 | preservesPitch=true 时真实媒体保持音调（页面/真实均 true） | ✅ PASS | real=true, visible=true |
| T12 | 10s 播放稳定性：无 ratechange 风暴 / CPU 暴涨，真实倍速持续 2.0 | ✅ PASS | ratechange +0 (0→5s +0, 5→10s +0), TaskDuration +0.59s, ScriptDuration +0.49s, maxDeviation=0ms, page reset attempts=316 |
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
      "--user-data-dir=C:\\Users\\WR1TE_~1\\AppData\\Local\\Temp\\sc-speed-test-WhrDMa",
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
      "--host-resolver-rules=MAP smartcourse.hust.edu.cn 127.0.0.1, MAP jwc.hust.edu.cn 127.0.0.1, MAP lib.hust.edu.cn 127.0.0.1, MAP mooc1.chaoxing.com 127.0.0.1, MAP mooc2.chaoxing.com 127.0.0.1, MAP mooc1.xuexitong.com 127.0.0.1, MAP cross.example 127.0.0.1",
      "--enable-unsafe-extension-debugging"
    ]
  }
}
```

### P0b 扩展 manifest 版本与 content_scripts 匹配范围（真实加载的扩展） — ✅ PASS

- 预期：version=1.2.1
- 实测：version=1.2.1; name=SmartCourse 倍速解锁; matches=["*://smartcourse.hust.edu.cn/*","*://*.chaoxing.com/ananas/modules/*","*://*.xuexitong.com/ananas/modules/*"]

```json
{
  "id": "P0b",
  "status": "PASS",
  "evidence": {
    "manifest": {
      "name": "SmartCourse 倍速解锁",
      "version": "1.2.1",
      "manifestVersion": 3,
      "matches": [
        "*://smartcourse.hust.edu.cn/*",
        "*://*.chaoxing.com/ananas/modules/*",
        "*://*.xuexitong.com/ananas/modules/*"
      ]
    },
    "extensionId": "jdakeggaeemgneckbpfhlfkhhhoaging",
    "popupUrl": "chrome-extension://jdakeggaeemgneckbpfhlfkhhhoaging/popup/popup.html"
  }
}
```

### P1 content script 注入范围：smartcourse.hust.edu.cn 注入 MAIN-world Hook；lib.hust.edu.cn（非 smartcourse）不注入 — ✅ PASS

- 预期：smartcourse.hust.edu.cn: hooked=true；lib.hust.edu.cn: hooked=false
- 实测：matched.hooked=true, outside.hooked=false, outsideUrl=http://lib.hust.edu.cn:57323/test/page.html?tag=outside

```json
{
  "id": "P1",
  "status": "PASS",
  "evidence": {
    "mainUrl": "http://smartcourse.hust.edu.cn:57323/ananas/modules/main?mode=both&tag=main&iframeSpecs=%5B%7B%22tag%22%3A%22iframe-same-origin%22%2C%22url%22%3A%22%2Fananas%2Fmodules%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-same-origin%22%7D%2C%7B%22tag%22%3A%22iframe-cross-mooc1.chaoxing.com%22%2C%22url%22%3A%22http%3A%2F%2Fmooc1.chaoxing.com%3A57323%2Fananas%2Fmodules%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-cross-mooc1.chaoxing.com%22%7D%2C%7B%22tag%22%3A%22iframe-nonmatch-mooc1.chaoxing.com%22%2C%22url%22%3A%22http%3A%2F%2Fmooc1.chaoxing.com%3A57323%2Ftest%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-nonmatch-mooc1.chaoxing.com%22%7D%5D",
    "outsideUrl": "http://lib.hust.edu.cn:57323/test/page.html?tag=outside",
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

- 预期：页面与服务器 Host 头均为 smartcourse.hust.edu.cn:57323
- 实测：location.host=smartcourse.hust.edu.cn:57323; server-seen host=smartcourse.hust.edu.cn:57323

```json
{
  "id": "P2",
  "status": "PASS",
  "evidence": {
    "mappedInfo": {
      "host": "smartcourse.hust.edu.cn:57323",
      "href": "http://smartcourse.hust.edu.cn:57323/ananas/modules/main?mode=both&tag=main&iframeSpecs=%5B%7B%22tag%22%3A%22iframe-same-origin%22%2C%22url%22%3A%22%2Fananas%2Fmodules%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-same-origin%22%7D%2C%7B%22tag%22%3A%22iframe-cross-mooc1.chaoxing.com%22%2C%22url%22%3A%22http%3A%2F%2Fmooc1.chaoxing.com%3A57323%2Fananas%2Fmodules%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-cross-mooc1.chaoxing.com%22%7D%2C%7B%22tag%22%3A%22iframe-nonmatch-mooc1.chaoxing.com%22%2C%22url%22%3A%22http%3A%2F%2Fmooc1.chaoxing.com%3A57323%2Ftest%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-nonmatch-mooc1.chaoxing.com%22%7D%5D"
    },
    "echo": {
      "ok": true,
      "host": "smartcourse.hust.edu.cn:57323",
      "url": "/health",
      "ts": 1794888931214,
      "pid": 39636,
      "serverPort": 57323,
      "wavBytes": 441044,
      "wav30Bytes": 1323044
    },
    "rules": "MAP smartcourse.hust.edu.cn 127.0.0.1, MAP jwc.hust.edu.cn 127.0.0.1, MAP lib.hust.edu.cn 127.0.0.1, MAP mooc1.chaoxing.com 127.0.0.1, MAP mooc2.chaoxing.com 127.0.0.1, MAP mooc1.xuexitong.com 127.0.0.1, MAP cross.example 127.0.0.1"
  }
}
```

### P3 测量通道准备：隔离世界 real rate + MAIN world spoof read + currentTime 斜率 — ✅ PASS

- 预期：主 frame 隔离世界上线、媒体 ready>=2、iframe 隔离世界可建立
- 实测：mainCtx=6; sameIframeCtx=7; crossIframeCtx=null; media=[{"id":"early-audio","ct":0,"rate":1,"paused":true,"ready":4,"pr":true,"dur":30,"err":null}]

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
          "dur": 30,
          "err": null
        }
      ]
    },
    "contexts": {
      "main": 6,
      "sameOriginIframe": 7,
      "crossIframe": null
    },
    "frames": [
      {
        "id": "279674F5605CC812E28CBBC3DC4BBEC1",
        "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/main?mode=both&tag=main&iframeSpecs=%5B%7B%22tag%22%3A%22iframe-same-origin%22%2C%22url%22%3A%22%2Fananas%2Fmodules%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-same-origin%22%7D%2C%7B%22tag%22%3A%22iframe-cross-mooc1.chaoxing.com%22%2C%22url%22%3A%22http%3A%2F%2Fmooc1.chaoxing.com%3A57323%2Fananas%2Fmodules%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-cross-mooc1.chaoxing.com%22%7D%2C%7B%22tag%22%3A%22iframe-nonmatch-mooc1.chaoxing.com%22%2C%22url%22%3A%22http%3A%2F%2Fmooc1.chaoxing.com%3A57323%2Ftest%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-nonmatch-mooc1.chaoxing.com%22%7D%5D",
        "securityOrigin": "http://smartcourse.hust.edu.cn:57323"
      },
      {
        "id": "5226512968307C47A61E8C8A722FC977",
        "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/iframe?mode=both&media=audio&autoplay=1&loop=1&tag=iframe-same-origin",
        "securityOrigin": "http://smartcourse.hust.edu.cn:57323"
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
        "ct": 0.643518,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "visibleMedia": [
      {
        "id": "early-audio",
        "ct": 0.64665,
        "rate": 1,
        "paused": false,
        "ready": 4,
        "pr": true,
        "dur": 30,
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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
      "autoRecover": true,
      "spoof": true,
      "preservesPitch": true,
      "hasFixPlay": true,
      "hasCopyDiag": true,
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
      "elapsedMs": 1
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
          "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
          "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
          "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
      "elapsedMs": 2
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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
      "elapsedMs": 2
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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
        "elapsedMs": 2
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
- 实测：storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; ui.safeCap=true; ui.autoRecover=true; appliedIn=2ms

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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
        "ct": 7.404449,
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
- 实测：maxDeviation=0ms; page reset attempts 104→112

```json
{
  "id": "T4a",
  "status": "PASS",
  "evidence": {
    "maxDeviationMs": 0,
    "resetsBefore": 104,
    "resetsAfter": 112,
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
        "t": 136,
        "rate": 2
      },
      {
        "t": 183,
        "rate": 2
      },
      {
        "t": 229,
        "rate": 2
      },
      {
        "t": 277,
        "rate": 2
      },
      {
        "t": 325,
        "rate": 2
      },
      {
        "t": 372,
        "rate": 2
      },
      {
        "t": 419,
        "rate": 2
      },
      {
        "t": 463,
        "rate": 2
      },
      {
        "t": 511,
        "rate": 2
      },
      {
        "t": 558,
        "rate": 2
      },
      {
        "t": 604,
        "rate": 2
      },
      {
        "t": 650,
        "rate": 2
      },
      {
        "t": 698,
        "rate": 2
      },
      {
        "t": 744,
        "rate": 2
      },
      {
        "t": 808,
        "rate": 2
      },
      {
        "t": 853,
        "rate": 2
      },
      {
        "t": 903,
        "rate": 2
      },
      {
        "t": 948,
        "rate": 2
      },
      {
        "t": 1011,
        "rate": 2
      },
      {
        "t": 1058,
        "rate": 2
      },
      {
        "t": 1104,
        "rate": 2
      },
      {
        "t": 1152,
        "rate": 2
      },
      {
        "t": 1198,
        "rate": 2
      },
      {
        "t": 1245,
        "rate": 2
      },
      {
        "t": 1291,
        "rate": 2
      },
      {
        "t": 1339,
        "rate": 2
      },
      {
        "t": 1385,
        "rate": 2
      },
      {
        "t": 1432,
        "rate": 2
      },
      {
        "t": 1479,
        "rate": 2
      },
      {
        "t": 1525,
        "rate": 2
      },
      {
        "t": 1573,
        "rate": 2
      },
      {
        "t": 1618,
        "rate": 2
      },
      {
        "t": 1665,
        "rate": 2
      },
      {
        "t": 1713,
        "rate": 2
      },
      {
        "t": 1759,
        "rate": 2
      },
      {
        "t": 1805,
        "rate": 2
      },
      {
        "t": 1851,
        "rate": 2
      },
      {
        "t": 1898,
        "rate": 2
      },
      {
        "t": 1944,
        "rate": 2
      }
    ]
  }
}
```

### T4b page: defaultPlaybackRate=1 + load() 重置后，内部倍速在 ≤1.5s 内恢复为 2 — ✅ PASS

- 预期：恢复耗时 ≤ 1500ms，恢复后页面读取仍为 1
- 实测：recovery=2ms (ok=true), pageRead=1

```json
{
  "id": "T4b",
  "status": "PASS",
  "evidence": {
    "resetCall": true,
    "t4b": {
      "ok": true,
      "value": 2,
      "elapsedMs": 2
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
        "ct": 1.101305,
        "paused": false,
        "ready": 4,
        "err": null
      },
      {
        "id": "audio-dyn-1",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.101263,
        "paused": false,
        "ready": 4,
        "err": null
      },
      {
        "id": "video-dyn-2",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 1.101191,
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
- 实测：tamperedVisibleRead=0.5; repairedIn=642ms; real=2
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
      "elapsedMs": 642
    },
    "repairedReal": 2
  }
}
```

### T5 spoof=false：页面读取到真实倍速 2.0（关闭伪装实时生效，无需刷新） — ✅ PASS

- 预期：storage.spoof=false 后 ≤1.5s 页面读 =2.0，真实 =2.0
- 实测：cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":false}; pageRead=2 in 3ms; real=2

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
      "elapsedMs": 3
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
- 实测：beforeCfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2,"safeCap":true,"spoof":true}; confirmText=即将切换到 2.5×，超过平台允许的 2× 上限。; cfg={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.5,"safeCap":true,"spoof":true}; real=2.5 in 1ms; visible=1; ui.rateValue=2.5

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
      "elapsedMs": 1
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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
      "elapsedMs": 65
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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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
      "elapsedMs": 76
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
- 实测：newPage real=2.25 in 4ms; storage={"autoRecover":true,"enabled":true,"preservesPitch":true,"rate":2.25,"safeCap":true,"spoof":true}; setViaConfirm=true

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
      "elapsedMs": 4
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

### T9 跨域 iframe（mooc1.chaoxing.com/ananas/modules/iframe，manifest 匹配）内媒体同样被强制：页面读=1、currentTime 斜率≈2；同源 iframe real=2 — ✅ PASS

- 预期：all_frames 生效（跨站 OOPIF 用 iframe 上报的页面可见值 + 媒体时钟交叉验证）：跨域 iframe hooked=true、visible=1、currentTime 斜率≈2；同源 iframe real=2.0
- 实测：iframeTags=["iframe-same-origin","iframe-cross-mooc1.chaoxing.com","iframe-nonmatch-mooc1.chaoxing.com"]; cross[iframe-cross-mooc1.chaoxing.com] hooked=true visible=1 ctSlope=2.04 real=undefined; sameOriginIframe real=2; crossCtx=OOPIF-unavailable; outOfBand=null; recovery=undefinedms
- 备注：v1.2.1 的跨域播放器 iframe 为 mooc1.chaoxing.com（跨站，OOPIF），隔离世界可能不可用；用 iframe 自身 postMessage 上报的页面可见倍速 + currentTime 斜率交叉验证真实倍速，同源 iframe 仍用隔离世界直读。

```json
{
  "id": "T9",
  "status": "PASS",
  "evidence": {
    "iframeTags": [
      "iframe-same-origin",
      "iframe-cross-mooc1.chaoxing.com",
      "iframe-nonmatch-mooc1.chaoxing.com"
    ],
    "crossTag": "iframe-cross-mooc1.chaoxing.com",
    "crossPosted": {
      "tag": "iframe-cross-mooc1.chaoxing.com",
      "href": "http://mooc1.chaoxing.com:57323/ananas/modules/iframe?mode=both&media=audio&autoplay=1&loop=1&tag=iframe-cross-mooc1.chaoxing.com",
      "hooked": true,
      "visible": 1,
      "slope": 2.044,
      "resets": 136,
      "samples": [
        {
          "t": 30431,
          "id": "early-audio",
          "ct": 4.594567,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30537.59999999986,
          "id": "early-audio",
          "ct": 4.854501,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30630.199999999953,
          "id": "early-audio",
          "ct": 5.024773,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30630.300000000047,
          "id": "early-audio",
          "ct": 5.024997,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30723.800000000047,
          "id": "early-audio",
          "ct": 5.192969,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30831.800000000047,
          "id": "early-audio",
          "ct": 5.442535,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30832,
          "id": "early-audio",
          "ct": 5.443055,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30926.399999999907,
          "id": "early-audio",
          "ct": 5.612568,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 31036.399999999907,
          "id": "early-audio",
          "ct": 5.818959,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 31036.59999999986,
          "id": "early-audio",
          "ct": 5.819347,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 31130.300000000047,
          "id": "early-audio",
          "ct": 6.000908,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 31238.800000000047,
          "id": "early-audio",
          "ct": 6.245371,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        }
      ],
      "playing": true
    },
    "crossReals": [],
    "sameReals": [
      {
        "id": "early-audio",
        "rate": 2,
        "def": 2,
        "pr": true,
        "ct": 6.644501,
        "paused": false,
        "ready": 4,
        "err": null
      }
    ],
    "crossOob": null,
    "crossRecovery": {
      "ok": false
    },
    "crossCtxAvailable": false
  }
}
```

### T10 manifest 范围外的跨域 iframe（mooc1.chaoxing.com 普通路径 /test/iframe）不注入（信息项） — ✅ PASS

- 预期：chaoxing 普通路径不在 /ananas/modules/ 下 → 不注入：hooked=false、页面读=1、currentTime 斜率≈1
- 实测：nonmatch iframe hooked=false visible=1 ctSlope=0.99
- 备注：跨域 iframe 的“匹配/不匹配”拆成 T9/T10：T9 用 /ananas/modules/ 播放器路径（注入生效），T10 用普通路径（不注入，符合收窄后的 matches）。

```json
{
  "id": "T10",
  "status": "PASS",
  "evidence": {
    "nonmatchPosted": {
      "tag": "iframe-nonmatch-mooc1.chaoxing.com",
      "href": "http://mooc1.chaoxing.com:57323/test/iframe?mode=both&media=audio&autoplay=1&loop=1&tag=iframe-nonmatch-mooc1.chaoxing.com",
      "hooked": false,
      "visible": 1,
      "slope": 0.992,
      "resets": 124,
      "samples": [
        {
          "t": 30430.699999999953,
          "id": "early-audio",
          "ct": 30,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30537.09999999986,
          "id": "early-audio",
          "ct": 0.039047,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30629.899999999907,
          "id": "early-audio",
          "ct": 0.122398,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30629.899999999907,
          "id": "early-audio",
          "ct": 0.122453,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30723.300000000047,
          "id": "early-audio",
          "ct": 0.208836,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30831.699999999953,
          "id": "early-audio",
          "ct": 0.329691,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30831.800000000047,
          "id": "early-audio",
          "ct": 0.329833,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 30926,
          "id": "early-audio",
          "ct": 0.420322,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 31036.09999999986,
          "id": "early-audio",
          "ct": 0.523273,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 31036.300000000047,
          "id": "early-audio",
          "ct": 0.523396,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 31129.800000000047,
          "id": "early-audio",
          "ct": 0.61016,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        },
        {
          "t": 31238.59999999986,
          "id": "early-audio",
          "ct": 0.73492,
          "rate": 1,
          "paused": false,
          "pr": true,
          "ready": 4
        }
      ],
      "playing": true
    },
    "nonmatchFrame": {
      "id": "279674F5605CC812E28CBBC3DC4BBEC1",
      "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/main?mode=both&tag=main&iframeSpecs=%5B%7B%22tag%22%3A%22iframe-same-origin%22%2C%22url%22%3A%22%2Fananas%2Fmodules%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-same-origin%22%7D%2C%7B%22tag%22%3A%22iframe-cross-mooc1.chaoxing.com%22%2C%22url%22%3A%22http%3A%2F%2Fmooc1.chaoxing.com%3A57323%2Fananas%2Fmodules%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-cross-mooc1.chaoxing.com%22%7D%2C%7B%22tag%22%3A%22iframe-nonmatch-mooc1.chaoxing.com%22%2C%22url%22%3A%22http%3A%2F%2Fmooc1.chaoxing.com%3A57323%2Ftest%2Fiframe%3Fmode%3Dboth%26media%3Daudio%26autoplay%3D1%26loop%3D1%26tag%3Diframe-nonmatch-mooc1.chaoxing.com%22%7D%5D",
      "securityOrigin": "http://smartcourse.hust.edu.cn:57323"
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
      "ct": 15.688333,
      "paused": false,
      "ready": 4,
      "err": null
    },
    "pitchVisibleEarly": {
      "id": "early-audio",
      "ct": 15.691691,
      "rate": 1,
      "paused": false,
      "ready": 4,
      "pr": true,
      "dur": 30,
      "err": null
    }
  }
}
```

### T12 10s 播放稳定性：无 ratechange 风暴 / CPU 暴涨，真实倍速持续 2.0 — ✅ PASS

- 预期：10s 内 ratechange 增量 ≤120（后半段 ≤60，无持续风暴）、TaskDuration 增量 <8s、真实倍速偏离 ≤1.5s
- 实测：ratechange +0 (0→5s +0, 5→10s +0), TaskDuration +0.59s, ScriptDuration +0.49s, maxDeviation=0ms, page reset attempts=316

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
    "taskDelta": 0.59,
    "scriptDelta": 0.49,
    "maxDeviationMs": 0,
    "pageResets": 316,
    "samples": [
      {
        "t": 0,
        "rate": 2
      },
      {
        "t": 1079,
        "rate": 2
      },
      {
        "t": 2180,
        "rate": 2
      },
      {
        "t": 3262,
        "rate": 2
      },
      {
        "t": 4346,
        "rate": 2
      },
      {
        "t": 427,
        "rate": 2
      },
      {
        "t": 1506,
        "rate": 2
      },
      {
        "t": 2603,
        "rate": 2
      },
      {
        "t": 3706,
        "rate": 2
      },
      {
        "t": 4806,
        "rate": 2
      }
    ]
  }
}
```

### T13 弹窗 UI 与 storage 同步（信息项；headless 下注入状态圆点无法代表真实活动标签） — ✅ PASS

- 预期：弹窗显示 storage 中的倍速/开关；状态圆点逻辑依赖 chrome.tabs active 标签，自动化场景不具代表性
- 实测：ui={"rateValue":"2.0","customRate":"2.0","enabled":true,"safeCap":true,"autoRecover":true,"spoof":true,"preservesPitch":true,"hasFixPlay":true,"hasCopyDiag":true,"footerText":"v1.2.1 · 本地扩展，不上传任何数据","activeChip":"2.0×","rateWarningHidden":true,"rateWarningText":"⚠ 当前 2.25× 超过平台允许的 2× 上限，任务点记录可能受影响","rateWarningDisplay":"none","confirmMaskHidden":true,"confirmText":"即将切换到 2.25×，超过平台允许的 2× 上限。","statusText":"当前标签页不在生效范围（请打开课程视频页面）","statusDotClass":"dot warn"}

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
      "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
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

### R10 v1.2.1 版本与 popup 新控件：#toggleAutoRecover / #fixPlay / #copyDiag，footer 含 v1.2.1 — ✅ PASS

- 预期：manifest version=1.2.1；popup 有「暂停/切屏自动恢复」开关与「修复卡住的播放」「复制诊断信息」按钮；footer 文本含 v1.2.1
- 实测：version=1.2.1; hasFixPlay=true; hasCopyDiag=true; autoRecover=true; footer=v1.2.1 · 本地扩展，不上传任何数据

```json
{
  "id": "R10",
  "status": "PASS",
  "evidence": {
    "manifest": {
      "name": "SmartCourse 倍速解锁",
      "version": "1.2.1",
      "manifestVersion": 3,
      "matches": [
        "*://smartcourse.hust.edu.cn/*",
        "*://*.chaoxing.com/ananas/modules/*",
        "*://*.xuexitong.com/ananas/modules/*"
      ]
    },
    "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
    "hasFixPlay": true,
    "hasCopyDiag": true,
    "autoRecoverChecked": true
  }
}
```

### R1 播放按钮无响应：真实点击 .vjs-play-control（handler 为空）→ ~1.6s 后自动恢复播放，页面读倍速仍为 1 — ✅ PASS

- 预期：点击后 diag 出现 recover.attempt(reason=play-control-click)，延时 1200–3500ms；媒体开始播放；页面读 rate=1、真实=2
- 实测：click={"x":95,"y":195.5,"w":108,"h":58,"visible":true,"text":"播放"}; attemptDelay=1601ms; paused=false; pageRead=1; realRate=2; playEvent=true; events=["rate.change","click.play-control","recover.attempt:play-control-click","seek.seeking","seek.seeked"]

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
      "t": 1794888973804,
      "type": "recover.attempt",
      "hidden": false,
      "reason": "play-control-click",
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "hasSrc": true,
        "inScope": true,
        "playerModulePage": true,
        "paused": true,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0,
        "duration": 30,
        "rateReal": 2,
        "rateVisible": 1,
        "preservesPitch": true,
        "muted": false,
        "volume": 1,
        "error": null
      }
    },
    "attemptDelayMs": 1601,
    "after": {
      "paused": false,
      "ended": false,
      "ct": 0.224548,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "pageRead": 1,
    "realRate": 2,
    "pageEvents": [
      {
        "t": 1794888972133,
        "ev": "media-loadedmetadata",
        "data": null
      },
      {
        "t": 1794888972146,
        "ev": "media-loadeddata",
        "data": null
      },
      {
        "t": 1794888972146,
        "ev": "media-canplay",
        "data": null
      },
      {
        "t": 1794888972202,
        "ev": "vjs-play-click",
        "data": null
      },
      {
        "t": 1794888973805,
        "ev": "media-play",
        "data": null
      },
      {
        "t": 1794888973805,
        "ev": "media-waiting",
        "data": null
      },
      {
        "t": 1794888973810,
        "ev": "media-canplay",
        "data": null
      },
      {
        "t": 1794888973810,
        "ev": "media-playing",
        "data": null
      }
    ],
    "diagEvents": [
      {
        "t": 1794888972122,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794888972202,
        "type": "click.play-control",
        "hidden": false
      },
      {
        "t": 1794888973804,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "play-control-click",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": true,
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
          "error": null
        }
      },
      {
        "t": 1794888973805,
        "type": "seek.seeking",
        "hidden": false,
        "ct": 0.2,
        "real": 2
      },
      {
        "t": 1794888973809,
        "type": "seek.seeked",
        "hidden": false,
        "ct": 0.2,
        "real": 2
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
        "t": 1794888973923,
        "ev": "media-loadedmetadata",
        "data": null
      },
      {
        "t": 1794888973937,
        "ev": "media-loadeddata",
        "data": null
      },
      {
        "t": 1794888973937,
        "ev": "media-canplay",
        "data": null
      },
      {
        "t": 1794888973953,
        "ev": "other-click",
        "data": null
      }
    ],
    "diagEvents": [
      {
        "t": 1794888973915,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      }
    ]
  }
}
```

### R3 尊重用户暂停：play() 播放中页面调用 pause() 后 3.5s+ 保持暂停、currentTime 冻结，不被抢回 — ✅ PASS

- 预期：pause() 后 3.5s 仍 paused=true；currentTime 不再前进（800ms 内变化 <0.05s）；无任何 recover.attempt
- 实测：playing=true; pause={"paused":true,"ct":1.012888}; after3.5s.paused=true; ctDelta=0; recoverAfterPause=0; recoverTotal=0

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
      "ct": 1.012888
    },
    "after": {
      "paused": true,
      "ended": false,
      "ct": 1.012888,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "ct1": 1.012888,
    "ct2": 1.012888,
    "pauseAt": 1794888977668,
    "recoverAfterPause": [],
    "diagEvents": [
      {
        "t": 1794888977033,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794888977058,
        "type": "play.call",
        "hidden": false,
        "paused": true,
        "ended": false
      },
      {
        "t": 1794888977059,
        "type": "play.ok",
        "hidden": false
      },
      {
        "t": 1794888977667,
        "type": "pause.call",
        "hidden": false
      }
    ]
  }
}
```

### R4 play() 调用无效：扩展视角 paused 持续 true 且页面未 pause() → ~2.4s 后 recover.attempt(reason=play-ineffective)，不得抛错 — ✅ PASS

- 预期：play() 后 ~2400ms 内出现 recover.attempt reason=play-ineffective；无 play.throw / recover.play-throw / play.reject
- 实测：delay=2402ms; throws=0; rejects=0; events=["rate.change","play.call","play.ok","recover.attempt:play-ineffective","seek.seeking","seek.seeked"]
- 备注：受控模拟：play() 后给 media 实例 shadow paused getter 使扩展视角判定“未播放”，扩展因此走 play-ineffective 恢复路径；恢复动作由扩展内部原生 play 完成。

```json
{
  "id": "R4",
  "status": "PASS",
  "evidence": {
    "playCall": {
      "t0": 1794888982080,
      "isPromise": true
    },
    "attempt": {
      "t": 1794888984482,
      "type": "recover.attempt",
      "hidden": false,
      "reason": "play-ineffective",
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "hasSrc": true,
        "inScope": true,
        "playerModulePage": true,
        "paused": true,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 4.57,
        "duration": 30,
        "rateReal": 2,
        "rateVisible": 1,
        "preservesPitch": true,
        "muted": false,
        "volume": 1,
        "error": null
      }
    },
    "delayMs": 2402,
    "throws": [],
    "rejects": [],
    "diagEvents": [
      {
        "t": 1794888982031,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794888982080,
        "type": "play.call",
        "hidden": false,
        "paused": true,
        "ended": false
      },
      {
        "t": 1794888982081,
        "type": "play.ok",
        "hidden": false
      },
      {
        "t": 1794888984482,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "play-ineffective",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": true,
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 4.57,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
          "error": null
        }
      },
      {
        "t": 1794888984483,
        "type": "seek.seeking",
        "hidden": false,
        "ct": 4.77,
        "real": 2
      },
      {
        "t": 1794888984483,
        "type": "seek.seeked",
        "hidden": false,
        "ct": 4.77,
        "real": 2
      }
    ]
  }
}
```

### R5 播放中卡死：currentTime 冻结 >4s → stall.detected + recover.attempt(reason=stalled) — ✅ PASS

- 预期：冻结后 3–7.5s 内记录 stall.detected（stalledMs>3800）并尝试 recover，reason=stalled
- 实测：playing=true; freeze={"frozen":0.409277}; stallDelay=4614ms; stalledMs=4415; attemptReason=stalled
- 备注：受控模拟：播放中给 media 实例 shadow currentTime getter 使其冻结，扩展 1s 巡检依据 4s 无进度判定 stall 并恢复。

```json
{
  "id": "R5",
  "status": "PASS",
  "evidence": {
    "playing": {
      "paused": false,
      "ended": false,
      "ct": 0.406799,
      "rateVisible": 1,
      "ready": 4,
      "error": null
    },
    "freeze": {
      "frozen": 0.409277
    },
    "stall": {
      "t": 1794888989532,
      "type": "stall.detected",
      "hidden": false,
      "stalledMs": 4415,
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "hasSrc": true,
        "inScope": true,
        "playerModulePage": true,
        "paused": false,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0.41,
        "duration": 30,
        "rateReal": 2,
        "rateVisible": 1,
        "preservesPitch": true,
        "muted": false,
        "volume": 1,
        "error": null
      }
    },
    "stallDelayMs": 4614,
    "stalledMs": 4415,
    "attempt": {
      "t": 1794888989533,
      "type": "recover.attempt",
      "hidden": false,
      "reason": "stalled",
      "media": {
        "tag": "AUDIO",
        "id": "media",
        "hasSrc": true,
        "inScope": true,
        "playerModulePage": true,
        "paused": false,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0.41,
        "duration": 30,
        "rateReal": 2,
        "rateVisible": 1,
        "preservesPitch": true,
        "muted": false,
        "volume": 1,
        "error": null
      }
    }
  }
}
```

### R6 手动修复：Alt+R 与 popup #fixPlay（SC_SPEED_FIX 链路）均能恢复播放，诊断事件含 manual.fix — ✅ PASS

- 预期：Alt+R 后媒体播放、diag 含 manual.fix + recover.attempt(manual-fix)、页面读 1；popup 激活课程页后点 #fixPlay 同样恢复并产生 manual.fix；控制台含 [SC-SPEED] 日志
- 实测：altR: playing=true manualFix=true attempt=manual-fix pageRead=1 real=2 console=true; popupFix: tabFound=true (http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r6b-popup-fix) playing=true manualFix=true

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
        "t": 1794888989686,
        "type": "manual.fix",
        "hidden": false
      },
      "attempt": {
        "t": 1794888989685,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "manual-fix",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": true,
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
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
        "tabId": 189195544,
        "media": 1,
        "href": "http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r6b-popup-fix",
        "diag": {
          "href": "http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r6b-popup-fix",
          "hidden": false,
          "usefulCount": 1,
          "media": [
            {
              "tag": "AUDIO",
              "id": "media",
              "hasSrc": true,
              "paused": true,
              "ended": false,
              "currentTime": 0,
              "duration": 30,
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
        },
        "mainDiag": {
          "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r6b-popup-fix",
          "hidden": false,
          "config": {
            "enabled": true,
            "rate": 2,
            "spoof": true,
            "preservesPitch": true,
            "autoRecover": true
          },
          "media": {
            "tag": "AUDIO",
            "id": "media",
            "hasSrc": true,
            "inScope": true,
            "playerModulePage": true,
            "paused": true,
            "ended": false,
            "readyState": 0,
            "networkState": 2,
            "currentTime": 0,
            "duration": "NaN",
            "rateReal": 2,
            "rateVisible": 1,
            "preservesPitch": true,
            "muted": false,
            "volume": 1,
            "error": null
          },
          "events": [
            {
              "t": 1794888990187,
              "type": "rate.change",
              "hidden": false,
              "real": 2,
              "visible": 1,
              "pitch": true
            }
          ]
        }
      },
      "playing": true,
      "manualFix": {
        "t": 1794888990257,
        "type": "manual.fix",
        "hidden": false
      }
    }
  }
}
```

### R7 诊断：MAIN world __SMARTCOURSE_SPEED_DIAG__.snapshot()/events、bridge SC_SPEED_STATUS.diag.media、popup #copyDiag 输出 JSON（version=1.2.0） — ✅ PASS

- 预期：snapshot 含 media/config/events；bridge 响应 diag.media 数组；#copyDiag 剪贴板 JSON 含 extensionVersion=1.2.0/injected/page.media/config.autoRecover；控制台有 [SC-SPEED]
- 实测：diagApi=true; bridgeMedia=1; copyOk=true; copiedKeys=extensionVersion,time,config,injected,mediaCount,realRate,page,player; console=true

```json
{
  "id": "R7",
  "status": "PASS",
  "evidence": {
    "mainWorldDiag": {
      "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r7-diag",
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
        "hasSrc": true,
        "inScope": true,
        "playerModulePage": true,
        "paused": true,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0,
        "duration": 30,
        "rateReal": 2,
        "rateVisible": 1,
        "preservesPitch": true,
        "muted": false,
        "volume": 1,
        "error": null
      },
      "events": [
        {
          "t": 1794888990450,
          "type": "rate.change",
          "hidden": false,
          "real": 2,
          "visible": 1,
          "pitch": true
        }
      ]
    },
    "bridgeDiag": {
      "href": "http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r7-diag",
      "hidden": false,
      "usefulCount": 1,
      "media": [
        {
          "tag": "AUDIO",
          "id": "media",
          "hasSrc": true,
          "paused": false,
          "ended": false,
          "currentTime": 0.68,
          "duration": 30,
          "readyState": 4,
          "networkState": 1,
          "rateReal": 2,
          "error": null
        }
      ]
    },
    "copiedJson": {
      "extensionVersion": "1.2.1",
      "time": "2026-11-17T04:16:30.893Z",
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
        "href": "http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r7-diag",
        "hidden": false,
        "usefulCount": 1,
        "media": [
          {
            "tag": "AUDIO",
            "id": "media",
            "hasSrc": true,
            "paused": false,
            "ended": false,
            "currentTime": 0.68,
            "duration": 30,
            "readyState": 4,
            "networkState": 1,
            "rateReal": 2,
            "error": null
          }
        ]
      },
      "player": {
        "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/recover?tag=r7-diag",
        "hidden": false,
        "config": {
          "enabled": true,
          "rate": 2,
          "spoof": true,
          "preservesPitch": true,
          "autoRecover": true
        },
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": true,
          "paused": false,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0.65,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
          "error": null
        },
        "events": [
          {
            "t": 1794888990450,
            "type": "rate.change",
            "hidden": false,
            "real": 2,
            "visible": 1,
            "pitch": true
          },
          {
            "t": 1794888990474,
            "type": "pause.call",
            "hidden": false
          },
          {
            "t": 1794888990474,
            "type": "play.call",
            "hidden": false,
            "paused": true,
            "ended": false
          },
          {
            "t": 1794888990474,
            "type": "play.ok",
            "hidden": false
          }
        ]
      }
    },
    "clipboardStub": {
      "ok": true
    },
    "console": true,
    "snapshotEvents": [
      {
        "t": 1794888990450,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      }
    ]
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
        "t": 1794888994512,
        "type": "manual.fix",
        "hidden": false
      },
      "manualAttempt": {
        "t": 1794888994511,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "manual-fix",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": true,
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
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
        "t": 1794888996235,
        "type": "recover.attempt",
        "hidden": false,
        "reason": "play-control-click",
        "media": {
          "tag": "AUDIO",
          "id": "media",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": true,
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
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

### S7 版本/加载：manifest version=1.2.1、CDP Extensions.loadUnpacked 真实加载成功、popup footer 含 v1.2.1 — ✅ PASS

- 预期：manifest 1.2.1；扩展真实加载（extensionId 非空）；popup footer 文本含 v1.2.1；#fixPlay/#copyDiag 均存在
- 实测：version=1.2.1; extensionId=jdakeggaeemgneckbpfhlfkhhhoaging; footer=v1.2.1 · 本地扩展，不上传任何数据; hasFixPlay=true; hasCopyDiag=true
- 备注：v1.2.1 初版 manifest 因 match_origin_as_fallback + 带路径 matches 被 Chrome 拒绝加载，已由 Lead 修复（删除该字段）。本报告基于修复后的最终磁盘代码。

```json
{
  "id": "S7",
  "status": "PASS",
  "evidence": {
    "manifest": {
      "name": "SmartCourse 倍速解锁",
      "version": "1.2.1",
      "manifestVersion": 3,
      "matches": [
        "*://smartcourse.hust.edu.cn/*",
        "*://*.chaoxing.com/ananas/modules/*",
        "*://*.xuexitong.com/ananas/modules/*"
      ]
    },
    "extensionId": "jdakeggaeemgneckbpfhlfkhhhoaging",
    "footerText": "v1.2.1 · 本地扩展，不上传任何数据",
    "mechanism": "CDP Extensions.loadUnpacked"
  }
}
```

### S1 范围收窄：manifest matches 仅 3 条（smartcourse 任意路径 / chaoxing / xuexitong 的 /ananas/modules/*）+ 注入矩阵正确 — ✅ PASS

- 预期：matches = [*://smartcourse.hust.edu.cn/*, *://*.chaoxing.com/ananas/modules/*, *://*.xuexitong.com/ananas/modules/*]；smartcourse 任意路径注入、lib.hust.edu.cn 不注入、chaoxing 普通路径不注入、chaoxing/xuexitong 的 /ananas/modules/ 路径注入
- 实测：matches=[["*://smartcourse.hust.edu.cn/*","*://*.chaoxing.com/ananas/modules/*","*://*.xuexitong.com/ananas/modules/*"],["*://smartcourse.hust.edu.cn/*","*://*.chaoxing.com/ananas/modules/*","*://*.xuexitong.com/ananas/modules/*"]]; smartcourse=true; libHust=false; chaoxingPlain=false; chaoxingModule=true; xuexitongModule=true

```json
{
  "id": "S1",
  "status": "PASS",
  "evidence": {
    "manifestContentScripts": [
      {
        "matches": [
          "*://smartcourse.hust.edu.cn/*",
          "*://*.chaoxing.com/ananas/modules/*",
          "*://*.xuexitong.com/ananas/modules/*"
        ],
        "match_origin_as_fallback": false,
        "all_frames": true,
        "world": "MAIN"
      },
      {
        "matches": [
          "*://smartcourse.hust.edu.cn/*",
          "*://*.chaoxing.com/ananas/modules/*",
          "*://*.xuexitong.com/ananas/modules/*"
        ],
        "match_origin_as_fallback": false,
        "all_frames": true,
        "world": null
      }
    ],
    "expectMatches": [
      "*://smartcourse.hust.edu.cn/*",
      "*://*.chaoxing.com/ananas/modules/*",
      "*://*.xuexitong.com/ananas/modules/*"
    ],
    "pages": {
      "smartcourseAnyPath": {
        "hooked": true,
        "href": "http://smartcourse.hust.edu.cn:57323/test/page.html?tag=s1-smartcourse",
        "title": "SC PROBE"
      },
      "libHust": {
        "hooked": false,
        "href": "http://lib.hust.edu.cn:57323/test/page.html?tag=s1-libhust",
        "title": "SC PROBE"
      },
      "chaoxingPlain": {
        "hooked": false,
        "href": "http://mooc1.chaoxing.com:57323/test/page.html?tag=s1-chaoxing-plain",
        "title": "SC PROBE"
      },
      "chaoxingModule": {
        "hooked": true,
        "href": "http://mooc1.chaoxing.com:57323/ananas/modules/player.html?tag=s1-chaoxing-module",
        "title": "SC PROBE"
      },
      "xuexitongModule": {
        "hooked": true,
        "href": "http://mooc1.xuexitong.com:57323/ananas/modules/player.html?tag=s1-xuexitong-module",
        "title": "SC PROBE"
      }
    }
  }
}
```

### S2 智能媒体过滤：非播放器页空/短/长 audio 不被接管、同页 video 被接管；播放器模块页长 audio + video 被接管 — ✅ PASS

- 预期：非播放器页：empty/short(10s)/long(30s) audio real=1、long-video real=2 且页面读=1（伪装）；播放器模块页：long audio/video real=2、空 audio real=1
- 实测：plain={"empty-audio":1,"short-audio":1,"long-audio":1,"long-video":2} visibleVideo=1; player={"empty-audio":1,"short-audio":2,"long-audio":2,"long-video":2}
- 备注：备注：播放器页 10s 短 audio 因元素插入瞬间 duration=NaN 被瞬时接管为 2×（元数据竞态，Lead 已确认不要求修复，按任务口径只判定长 audio+video 接管）。

```json
{
  "id": "S2",
  "status": "PASS",
  "evidence": {
    "plain": {
      "rates": {
        "empty-audio": {
          "rate": 1,
          "dur": null,
          "hasSrc": false,
          "ready": 0
        },
        "short-audio": {
          "rate": 1,
          "dur": 10,
          "hasSrc": true,
          "ready": 4
        },
        "long-audio": {
          "rate": 1,
          "dur": 30,
          "hasSrc": true,
          "ready": 4
        },
        "long-video": {
          "rate": 2,
          "dur": 30,
          "hasSrc": true,
          "ready": 4
        }
      },
      "visible": {
        "rate": 1,
        "pr": true
      },
      "diag": {
        "url": "http://smartcourse.hust.edu.cn:57323/test/scope?tag=s2-plain",
        "hidden": false,
        "config": {
          "enabled": true,
          "rate": 2,
          "spoof": true,
          "autoRecover": true
        },
        "media": {
          "tag": "VIDEO",
          "id": "long-video",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": false,
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
          "error": null
        },
        "events": [
          {
            "t": 1794888998972,
            "type": "rate.change",
            "hidden": false,
            "real": 2,
            "visible": 1,
            "pitch": true
          }
        ]
      }
    },
    "player": {
      "rates": {
        "empty-audio": {
          "rate": 1,
          "dur": null,
          "hasSrc": false,
          "ready": 0
        },
        "short-audio": {
          "rate": 2,
          "dur": 10,
          "hasSrc": true,
          "ready": 4
        },
        "long-audio": {
          "rate": 2,
          "dur": 30,
          "hasSrc": true,
          "ready": 4
        },
        "long-video": {
          "rate": 2,
          "dur": 30,
          "hasSrc": true,
          "ready": 4
        }
      },
      "visible": {
        "rate": 1,
        "pr": true
      },
      "diag": {
        "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/video/index.html?tag=s2-player",
        "hidden": false,
        "config": {
          "enabled": true,
          "rate": 2,
          "spoof": true,
          "autoRecover": true
        },
        "media": {
          "tag": "AUDIO",
          "id": "long-audio",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": true,
          "paused": true,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 0,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
          "error": null
        },
        "events": [
          {
            "t": 1794889000435,
            "type": "rate.change",
            "hidden": false,
            "real": 2,
            "visible": 1,
            "pitch": true
          },
          {
            "t": 1794889000435,
            "type": "rate.change",
            "hidden": false,
            "real": 2,
            "visible": 1,
            "pitch": true
          },
          {
            "t": 1794889000435,
            "type": "rate.change",
            "hidden": false,
            "real": 2,
            "visible": 1,
            "pitch": true
          }
        ]
      }
    }
  }
}
```

### S3 后台低干扰：hidden 时原生 setter 改回 1 的 2s 内不被恢复、currentTime 冻结不产生 stall/recover；恢复可见后 ≤1.5s 恢复 2× — ✅ PASS

- 预期：hidden 覆盖 + dispatch visibilitychange 后：隔离世界把真实 rate 改回 1，2s 采样全为 1；hidden 中播放并冻结 currentTime 5s 无 stall.detected/recover.attempt（hidden=true）；恢复可见后 ≤1500ms 真实 rate=2
- 实测：before=2; hidden=true; set=1; restoredIn2s=false; samples=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]; hiddenStalls=0; hiddenRecovers=0; visibleRestore=true in 1ms
- 备注：隐藏前等待 4s 让启动阶段 hook-ready 配置重放结束（该重放会 forceAll 一次，属启动竞态）；用户报告的“看一会之后后台异常”发生在稳定期，本用例覆盖稳定期行为。

```json
{
  "id": "S3",
  "status": "PASS",
  "evidence": {
    "before": 2,
    "hidden": true,
    "set": 1,
    "samples": [
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
    ],
    "restoredIn2s": false,
    "freeze": 0.368202,
    "hiddenStalls": [],
    "hiddenRecovers": [],
    "visibleRestore": {
      "ok": true,
      "value": 2,
      "elapsedMs": 1
    },
    "eventsAfter": [
      {
        "t": 1794889001890,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794889005929,
        "type": "visibility.hidden",
        "hidden": true
      },
      {
        "t": 1794889006236,
        "type": "rate.change",
        "hidden": true,
        "real": 1,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794889008400,
        "type": "play.call",
        "hidden": true,
        "paused": true,
        "ended": false
      },
      {
        "t": 1794889008402,
        "type": "play.ok",
        "hidden": true
      },
      {
        "t": 1794889014023,
        "type": "visibility.visible",
        "hidden": false
      },
      {
        "t": 1794889014024,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      }
    ]
  }
}
```

### S3b 后台低干扰（MutationObserver）：hidden 时动态插入媒体不被扫描强制；恢复可见后 ≤1.5s 补强制到 2× — ✅ PASS

- 预期：hidden 中插入 video（preload=none）：2s 后真实 rate 仍为 1（未被 MutationObserver/巡检强制）；可见后 ≤1500ms 变为 2
- 实测：hiddenRate=1; visibleRestore=true (2) in 2ms

```json
{
  "id": "S3b",
  "status": "PASS",
  "evidence": {
    "hiddenRate": 1,
    "visibleRestore": {
      "ok": true,
      "value": 2,
      "elapsedMs": 2
    }
  }
}
```

### S4 保持音调：preservesPitch=false → 真实 media.preservesPitch === false（实时生效）；true → === true — ✅ PASS

- 预期：开关关闭 ≤2.5s 内真实 audio/video 的 preservesPitch 均 false；重新开启 ≤2.5s 内均 true
- 实测：initial={"audio":true,"video":true}; off={"audio":false,"video":false} (0ms); on={"audio":true,"video":true} (0ms)

```json
{
  "id": "S4",
  "status": "PASS",
  "evidence": {
    "initial": {
      "audio": true,
      "video": true
    },
    "off": {
      "ok": true,
      "value": {
        "audio": false,
        "video": false
      },
      "elapsedMs": 0
    },
    "on": {
      "ok": true,
      "value": {
        "audio": true,
        "video": true
      },
      "elapsedMs": 0
    }
  }
}
```

### S5 诊断改进：顶层只有空 audio 时延迟 ~350ms 回答（usefulCount=0）；iframe 内有真实 video 时子帧优先回答（usefulCount≥1、hasSrc=true） — ✅ PASS

- 预期：顶层空 audio 页：响应延迟 ≥250ms、usefulCount=0、media[].hasSrc=false（popup 不显示“已接管”）；顶层+子帧真实 video：响应来自子帧（href 含 s5-child）、usefulCount≥1、media 中 hasSrc=true、mainDiag.media.hasSrc=true
- 实测：topOnly: elapsed=356ms useful=0 media=[false]; childVideo: elapsed=1ms useful=1 href=http://mooc1.chaoxing.com:57323/ananas/modules/iframe?mode=off&media=video&autoplay=1&tag=s5-child mainDiag.hasSrc=true
- 备注：popup refreshStatus 依据 usefulCount 分支（>0 才显示“已接管 N 个媒体”），见 popup.js；空 audio 的 usefulCount=0 即不会显示“已接管”。

```json
{
  "id": "S5",
  "status": "PASS",
  "evidence": {
    "topOnly": {
      "chosen": {
        "tabId": 189195565,
        "elapsedMs": 356,
        "href": "http://smartcourse.hust.edu.cn:57323/test/status?tag=s5-top",
        "usefulCount": 0,
        "media": [
          {
            "tag": "AUDIO",
            "id": "empty-audio",
            "hasSrc": false,
            "paused": true,
            "ended": false,
            "currentTime": 0,
            "duration": "NaN",
            "readyState": 0,
            "networkState": 0,
            "rateReal": 1,
            "error": null
          }
        ],
        "mainDiag": {
          "url": "http://smartcourse.hust.edu.cn:57323/test/status?tag=s5-top",
          "hidden": false,
          "config": {
            "enabled": true,
            "rate": 2,
            "spoof": true,
            "preservesPitch": true,
            "autoRecover": true
          },
          "media": null,
          "events": []
        },
        "resMedia": 1
      },
      "all": [
        {
          "tabId": 189195534,
          "elapsedMs": 1,
          "href": "http://smartcourse.hust.edu.cn:57323/ananas/modules/iframe?mode=both&media=audio&autoplay=1&loop=1&tag=iframe-same-origin",
          "usefulCount": 1,
          "media": [
            {
              "tag": "AUDIO",
              "id": "early-audio",
              "hasSrc": true,
              "paused": false,
              "ended": false,
              "currentTime": 8.38,
              "duration": 30,
              "readyState": 4,
              "networkState": 1,
              "rateReal": 2,
              "error": null
            }
          ],
          "mainDiag": {
            "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/iframe?mode=both&media=audio&autoplay=1&loop=1&tag=iframe-same-origin",
            "hidden": true,
            "config": {
              "enabled": true,
              "rate": 2,
              "spoof": true,
              "preservesPitch": true,
              "autoRecover": true
            },
            "media": {
              "tag": "AUDIO",
              "id": "early-audio",
              "hasSrc": true,
              "inScope": true,
              "playerModulePage": true,
              "paused": false,
              "ended": false,
              "readyState": 4,
              "networkState": 1,
              "currentTime": 5.54,
              "duration": 30,
              "rateReal": 2,
              "rateVisible": 1,
              "preservesPitch": true,
              "muted": false,
              "volume": 1,
              "error": null
            },
            "events": [
              {
                "t": 1794888930623,
                "type": "play.call",
                "hidden": false,
                "paused": true,
                "ended": false
              },
              {
                "t": 1794888930710,
                "type": "play.ok",
                "hidden": false
              },
              {
                "t": 1794888930745,
                "type": "visibility.hidden",
                "hidden": true
              },
              {
                "t": 1794888945975,
                "type": "seek.seeking",
                "hidden": true,
                "ct": 0,
                "real": 2
              },
              {
                "t": 1794888945976,
                "type": "seek.seeked",
                "hidden": true,
                "ct": 0,
                "real": 2
              },
              {
                "t": 1794888951799,
                "type": "rate.change",
                "hidden": true,
                "real": 2.25,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888951804,
                "type": "rate.change",
                "hidden": true,
                "real": 2,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888951812,
                "type": "rate.change",
                "hidden": true,
                "real": 2.5,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888951817,
                "type": "rate.change",
                "hidden": true,
                "real": 2,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888951820,
                "type": "rate.change",
                "hidden": true,
                "real": 2.5,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888951839,
                "type": "rate.change",
                "hidden": true,
                "real": 2,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888952420,
                "type": "rate.change",
                "hidden": true,
                "real": 3.5,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888952443,
                "type": "rate.change",
                "hidden": true,
                "real": 1.5,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888952454,
                "type": "rate.change",
                "hidden": true,
                "real": 2,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888952468,
                "type": "rate.change",
                "hidden": true,
                "real": 1.75,
                "visible": 1,
                "pitch": true
              },
              {
                "t": 1794888952481,
                "type": "rate.change",
                "hidden": true,
                "real": 2,
                "visible": 1,
```

### S8 空 audio 不再被写入倍速（真实 rate 保持 1）+ 诊断可看到 hasSrc/inScope/playerModulePage/preservesPitch/muted/volume — ✅ PASS

- 预期：非播放器页空 audio 真实 rate=1；MAIN world DIAG snapshot.media 含 hasSrc/inScope/playerModulePage/preservesPitch/muted/volume；bridge diag.media 含 hasSrc
- 实测：emptyAudioRate=1; snapshotFields={"tag":"AUDIO","id":"long-audio","hasSrc":true,"inScope":true,"playerModulePage":true,"paused":true,"ended":false,"readyState":4,"networkState":1,"currentTime":0,"duration":30,"rateReal":2,"rateVisible":1,"preservesPitch":true,"muted":false,"volume":1,"error":null}; bridgeMediaHasSrc=[true]

```json
{
  "id": "S8",
  "status": "PASS",
  "evidence": {
    "emptyAudioRate": 1,
    "mainWorldSnapshotMedia": {
      "tag": "AUDIO",
      "id": "long-audio",
      "hasSrc": true,
      "inScope": true,
      "playerModulePage": true,
      "paused": true,
      "ended": false,
      "readyState": 4,
      "networkState": 1,
      "currentTime": 0,
      "duration": 30,
      "rateReal": 2,
      "rateVisible": 1,
      "preservesPitch": true,
      "muted": false,
      "volume": 1,
      "error": null
    },
    "bridgeMedia": [
      {
        "tag": "VIDEO",
        "id": "early-audio",
        "hasSrc": true,
        "paused": false,
        "ended": false,
        "currentTime": 5.15,
        "duration": 30,
        "readyState": 4,
        "networkState": 1,
        "rateReal": 2,
        "error": null
      }
    ]
  }
}
```

### S9.1 异常诊断：隔离世界改真实 rate → MAIN world 记录 rate.change(real/visible/pitch)；seek → seek.seeking/seek.seeked；bridge mainDiag 含 events — ✅ PASS

- 预期：rate.change 事件含 real=1+visible=1+pitch 布尔（随后 real=2 恢复记录）；seek 事件含 ct≈5 与 real；SC_SPEED_STATUS.mainDiag.media.hasSrc=true 且 mainDiag.events 含 rate.change
- 实测：rateChanges=[{"real":2,"visible":1,"pitch":true},{"real":2,"visible":1,"pitch":true},{"real":2,"visible":1,"pitch":true},{"real":1,"visible":1,"pitch":true},{"real":2,"visible":1,"pitch":true}]; seeking={"ct":5,"real":2}; seeked={"ct":5,"real":2}; mainDiag=true mainDiagRateChanges=5
- 备注：rate.change 由隔离世界原生 setter 触发的真实 ratechange 事件产生（模拟平台/浏览器造成的倍速漂移）；扩展随后 forceMedia 恢复 2× 并产生第二条 rate.change(real=2)。

```json
{
  "id": "S9.1",
  "status": "PASS",
  "evidence": {
    "diagEvents": [
      {
        "t": 1794889026292,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794889026293,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794889026293,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794889027860,
        "type": "rate.change",
        "hidden": false,
        "real": 1,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794889027860,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794889028570,
        "type": "seek.seeking",
        "hidden": false,
        "ct": 5,
        "real": 2
      },
      {
        "t": 1794889028570,
        "type": "seek.seeked",
        "hidden": false,
        "ct": 5,
        "real": 2
      }
    ],
    "driftEntry": {
      "t": 1794889027860,
      "type": "rate.change",
      "hidden": false,
      "real": 1,
      "visible": 1,
      "pitch": true
    },
    "restoreEntry": {
      "t": 1794889026292,
      "type": "rate.change",
      "hidden": false,
      "real": 2,
      "visible": 1,
      "pitch": true
    },
    "seeking": {
      "t": 1794889028570,
      "type": "seek.seeking",
      "hidden": false,
      "ct": 5,
      "real": 2
    },
    "seeked": {
      "t": 1794889028570,
      "type": "seek.seeked",
      "hidden": false,
      "ct": 5,
      "real": 2
    },
    "mainDiag": {
      "url": "http://smartcourse.hust.edu.cn:57323/ananas/modules/video/index.html?tag=s9-frame",
      "hidden": false,
      "config": {
        "enabled": true,
        "rate": 2,
        "spoof": true,
        "preservesPitch": true,
        "autoRecover": true
      },
      "media": {
        "tag": "AUDIO",
        "id": "long-audio",
        "hasSrc": true,
        "inScope": true,
        "playerModulePage": true,
        "paused": true,
        "ended": false,
        "readyState": 4,
        "networkState": 1,
        "currentTime": 0,
        "duration": 30,
        "rateReal": 2,
        "rateVisible": 1,
        "preservesPitch": true,
        "muted": false,
        "volume": 1,
        "error": null
      },
      "events": [
        {
          "t": 1794889026292,
          "type": "rate.change",
          "hidden": false,
          "real": 2,
          "visible": 1,
          "pitch": true
        },
        {
          "t": 1794889026293,
          "type": "rate.change",
          "hidden": false,
          "real": 2,
          "visible": 1,
          "pitch": true
        },
        {
          "t": 1794889026293,
          "type": "rate.change",
          "hidden": false,
          "real": 2,
          "visible": 1,
          "pitch": true
        },
        {
          "t": 1794889027860,
          "type": "rate.change",
          "hidden": false,
          "real": 1,
          "visible": 1,
          "pitch": true
        },
        {
          "t": 1794889027860,
          "type": "rate.change",
          "hidden": false,
          "real": 2,
          "visible": 1,
          "pitch": true
        },
        {
          "t": 1794889028570,
          "type": "seek.seeking",
          "hidden": false,
          "ct": 5,
          "real": 2
        },
        {
          "t": 1794889028570,
          "type": "seek.seeked",
          "hidden": false,
          "ct": 5,
          "real": 2
        }
      ]
    }
  }
}
```

### S9.2 诊断改进：顶层空 audio + iframe 真实 video 时 SC_SPEED_STATUS.mainDiag 非 null（media.hasSrc=true）；popup「复制诊断信息」JSON 含 player(mainDiag)/config/events — ✅ PASS

- 预期：copyDiag JSON：extensionVersion=1.2.1、injected=true、player=mainDiag 且 player.media.hasSrc=true、player.config/events 完整、page.usefulCount≥1
- 实测：activated=true; copyOk=true; version=1.2.1; playerHasSrc=true; playerEvents=2; pageUseful=1

```json
{
  "id": "S9.2",
  "status": "PASS",
  "evidence": {
    "copyDiag": {
      "extensionVersion": "1.2.1",
      "time": "2026-11-17T04:17:10.167Z",
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
        "href": "http://mooc1.chaoxing.com:57323/ananas/modules/iframe?mode=off&media=video&autoplay=1&tag=s5-child",
        "hidden": false,
        "usefulCount": 1,
        "media": [
          {
            "tag": "VIDEO",
            "id": "early-audio",
            "hasSrc": true,
            "paused": false,
            "ended": false,
            "currentTime": 13.08,
            "duration": 30,
            "readyState": 4,
            "networkState": 1,
            "rateReal": 2,
            "error": null
          }
        ]
      },
      "player": {
        "url": "http://mooc1.chaoxing.com:57323/ananas/modules/iframe?mode=off&media=video&autoplay=1&tag=s5-child",
        "hidden": false,
        "config": {
          "enabled": true,
          "rate": 2,
          "spoof": true,
          "preservesPitch": true,
          "autoRecover": true
        },
        "media": {
          "tag": "VIDEO",
          "id": "early-audio",
          "hasSrc": true,
          "inScope": true,
          "playerModulePage": true,
          "paused": false,
          "ended": false,
          "readyState": 4,
          "networkState": 1,
          "currentTime": 5.15,
          "duration": 30,
          "rateReal": 2,
          "rateVisible": 1,
          "preservesPitch": true,
          "muted": false,
          "volume": 1,
          "error": null
        },
        "events": [
          {
            "t": 1794889023556,
            "type": "play.call",
            "hidden": false,
            "paused": true,
            "ended": false
          },
          {
            "t": 1794889023587,
            "type": "play.ok",
            "hidden": false
          }
        ]
      }
    },
    "activateTab": "http://mooc1.chaoxing.com:57323/ananas/modules/iframe?mode=off&media=video&autoplay=1&tag=s5-child",
    "mainDiagEvents": [
      {
        "t": 1794889023556,
        "type": "play.call",
        "hidden": false,
        "paused": true,
        "ended": false
      },
      {
        "t": 1794889023587,
        "type": "play.ok",
        "hidden": false
      }
    ]
  }
}
```

### S9.3 后台低干扰（诊断）：hidden 时 3s 周期诊断不上报（mainDiag 事件不增长）；恢复可见后恢复上报 — ✅ PASS

- 预期：hidden 4s 内 bridge 缓存的 mainDiag 不变（周期 postDiag 被跳过）；恢复可见 ≤1.8s 后 mainDiag.events 更新
- 实测：m0events=1; hiddenUnchanged=true; visibleUpdated=true; m2events=3
- 备注：hidden 期间 ratechange/play/pause 等关键事件仍会强制上报（设计如此，用于抓异常）；本用例在 hidden 期间不触发媒体事件，只验证 3s 周期诊断被跳过。

```json
{
  "id": "S9.3",
  "status": "PASS",
  "evidence": {
    "m0": [
      {
        "t": 1794889030244,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      }
    ],
    "m1": [
      {
        "t": 1794889030244,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      }
    ],
    "m2": [
      {
        "t": 1794889030244,
        "type": "rate.change",
        "hidden": false,
        "real": 2,
        "visible": 1,
        "pitch": true
      },
      {
        "t": 1794889035165,
        "type": "visibility.hidden",
        "hidden": true
      },
      {
        "t": 1794889039749,
        "type": "visibility.visible",
        "hidden": false
      }
    ],
    "hiddenUnchanged": true,
    "visibleUpdated": true
  }
}
```

### S6 v1.2.0 全量回归：46 项（播放恢复/诊断 11 项 + 安全上限 9 项 + 既有行为 26 项）全部执行且无 FAIL — ✅ PASS

- 预期：v1.2.0 的 46 项全部重跑 PASS；新增范围收窄/媒体过滤/后台门控/音调/诊断不得改变既有行为
- 实测：v120=11 (R10,R1,R2,R3,R4,R5,R6,R7,R8,R9,R-EXC); v110=9; regression=26; nonV121FAIL=none

```json
{
  "id": "S6",
  "status": "PASS",
  "evidence": {
    "v120Ids": [
      "R10",
      "R1",
      "R2",
      "R3",
      "R4",
      "R5",
      "R6",
      "R7",
      "R8",
      "R9",
      "R-EXC"
    ],
    "v110Ids": [
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

### S-EXC S 用例运行期间 MAIN world 无未捕获异常 — ✅ PASS

- 预期：S1–S9 涉及的测试页 Runtime.exceptionThrown 数量为 0
- 实测：exceptions=0

```json
{
  "id": "S-EXC",
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
14. **v1.2.1 初版 manifest 曾被 Chrome 拒绝加载（已修复）**：初版两个 content_scripts 同时使用 `match_origin_as_fallback: true` 与带路径 matches，Chrome 报 `The path component for scripts with 'match_origin_as_fallback' must be '*'`；最终磁盘代码已删除该字段（保留 all_frames/run_at/world:MAIN），本报告基于修复后代码，`Extensions.loadUnpacked` 加载成功。
15. **S3 后台测试的启动稳定期**：扩展启动阶段（0–2.5s 的 hook-ready 配置重放）会无条件 forceAll 一次，因此 S3 在页面加载后等待 4s 再模拟 hidden；启动竞态不属于用户报告的“看一会之后后台异常”场景，已在证据中标注。
16. **跨站 OOPIF 跨域 iframe 的测量方式**：v1.2.1 的跨域播放器 iframe（mooc1.chaoxing.com）与父页跨站，隔离世界不可用；用 iframe 自身 postMessage 上报的页面可见倍速 + currentTime 斜率交叉验证；同源 iframe 仍用隔离世界直读。
17. **播放器页短 audio 的 duration 元数据竞态**：元素插入瞬间 duration 尚为 NaN 时会被瞬时接管为 2×，之后不会回 1；Lead 已确认该竞态不要求修复，S2 按任务口径（非播放器页短/长 audio 不接管、播放器页长 audio+video 接管）判定并备注实测值。
18. **headless 无真实切屏/最小化**：S3 用 MAIN world 覆盖 `document.hidden` + dispatch `visibilitychange` 模拟，S9.3 同样方式验证周期诊断暂停；真实 GPU 挂起/最小化行为未覆盖。

## 一键复现

```powershell
cd D:\dsh\speed-test
node probe-load-extension.mjs    # 证据：Chrome 157 忽略 --load-extension / Edge 可用
node probe-cdp-load.mjs          # 证据：Chrome CDP Extensions.loadUnpacked 可用
node run-tests.mjs phase-a       # 基础设施自检
node run-tests.mjs phase-b-v121  # v1.2.1 低干扰版验收 + v1.2.0 全量回归（生成本报告）
```

原始证据 JSON：`speed-test/results/v1.2.1-results.json`（含每项 evidence 与 Chrome 启动命令行）。
