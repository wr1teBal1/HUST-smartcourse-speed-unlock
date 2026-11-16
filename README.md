# HUST SmartCourse 倍速解锁

<img src="icons/icon128.png" width="72" align="right" alt="扩展图标">

Chrome / Edge 扩展（Manifest V3），解除 **HUST 智慧课程平台**（`smartcourse.hust.edu.cn`，超星泛雅 / 学习通内核）视频的「不看完不能倍速」限制：强制倍速播放、拦截播放器把倍速改回 1.0、可选伪装倍速状态，并支持快捷键调速。

> ⚠️ **非官方项目**：与华中科技大学及其课程平台无任何关联，仅供学习交流，请自行承担使用风险。
>
> ⚠️ **合理使用**：本扩展只解除**浏览器端**的播放速度控制，**不修改任何课程进度数据、不代刷、不伪造完成状态**。请遵守课程与学校规定，仅用于个人学习加速。平台服务端可能检测倍速并影响进度记录（详见「已知限制」）。

---

## 一、安装（约 1 分钟）

> 适用于 Chrome / Edge 桌面版（Chrome ≥ 111）。Safari、手机浏览器不支持。

1. 打开扩展管理页：
   - Chrome：地址栏输入 `chrome://extensions/`
   - Edge：地址栏输入 `edge://extensions/`
2. 打开右上角（Edge 为左下角）的 **开发者模式 / 开发人员模式** 开关。
3. 点击 **加载已解压的扩展程序**（Edge：**加载解压缩的扩展**）。
4. 选择本仓库**根目录**（即包含 `manifest.json` 的那一层，**不要**选中里面的 `src` 或 `popup` 子目录）：
   - 从 GitHub 安装：点仓库右上角 **Code → Download ZIP**，解压后选择解压出的文件夹（如 `HUST-smartcourse--speed-unlock-main`）；
   - 本地安装：直接选择本项目所在文件夹。
5. 加载成功后，点击浏览器工具栏的拼图图标 📎，把 **SmartCourse 倍速解锁** 固定到工具栏。
6. 回到课程视频页面，**刷新一次页面**（安装前已打开的页面不会自动注入），然后点击工具栏图标即可使用。

在 `chrome://extensions/` 里如果看到「开发者模式扩展」提示，选择保留/忽略即可。

---

## 二、使用

- 打开扩展图标，在弹窗里点选倍速档位（1.0×–16×），或输入自定义倍速。
- 修改**立即生效**于已打开的课程页面，无需刷新（安装后的首次生效需刷新一次）。
- 页面内快捷键：`Alt` + `↑` / `↓` 每次 ±0.25×（范围 0.25×–16×）。
- 三个开关：
  - **启用倍速解锁**：总开关。关闭后恢复页面原本的倍速控制。
  - **伪装倍速状态**（默认开）：页面代码读取倍速时会得到 `1.0`，用于降低播放器/平台前端「检测到倍速异常」的概率。副作用：播放器自己的倍速 UI 可能始终显示 1.0×，不影响实际播放。
  - **保持音调**（默认开）：倍速播放时声音不变调。
- 弹窗顶部小圆点表示当前标签页的注入状态：
  - 绿点：已生效（可能显示已接管的媒体数量与实际倍速）；
  - 黄点：当前标签页不在生效范围（不是课程平台页面）。

---

## 三、适用范围

扩展只在以下域名的页面与 iframe 中注入：

- `*.hust.edu.cn`（智慧课程平台本体）
- `*.chaoxing.com`（超星泛雅 / 视频播放器 iframe，例如 `mooc1-1.chaoxing.com`）
- `*.xuexitong.com`（学习通相关）

如果学校平台之后更换了播放器域名，可自行在 `manifest.json` 的 `content_scripts[].matches` 中追加一条 `"*://*.新域名/*"`，重新加载扩展即可。

---

## 四、工作原理（技术说明）

1. **MAIN world 预注入**：扩展以 `run_at: document_start`、`world: "MAIN"`、`all_frames: true` 把 `src/main-world.js` 注入到页面（含跨域 iframe、about:blank/blob 子框架），执行时机早于页面任何脚本。
2. **属性接管**：立即重定义 `HTMLMediaElement.prototype.playbackRate` / `defaultPlaybackRate` 的 getter/setter：
   - 页面写入任何倍速 → 被重定向为扩展配置的倍速（播放器的“改回 1.0”逻辑失效）；
   - 页面读取倍速 → 开启伪装时恒返回 `1.0`（纯前端防倍速检测失效），关闭伪装时返回真实值。
3. **持续兜底**：监听 `ratechange / play / loadedmetadata …` 等媒体事件 + `MutationObserver` 监听动态插入的媒体 + 700ms 周期巡检；页面若重新定义/删除属性也会被重新接管。
4. **隔离世界桥接**：`src/bridge.js` 在扩展隔离世界运行，负责读写 `chrome.storage.local`、全局快捷键，并通过 `window.postMessage` 与主世界 Hook 通信。因此修改配置可实时同步到所有已打开页面与 iframe。
5. **配置项**：`chrome.storage.local["sc_speed_cfg_v1"] = { enabled, rate, spoof, preservesPitch }`，默认 `{ enabled: true, rate: 2, spoof: true, preservesPitch: true }`。

### HUST 播放器实测（2026-11 静态分析，公开资源）

- 播放器 iframe：`https://smartcourse.hust.edu.cn/ananas/modules/video/index.html`（与课程页同域，公开可访问），技术栈是 **videojs 7.2.2 + 超星 videojs-ext**（构建版本 `v=2026-07xx`）。
- 防倍速关键代码（`videojs-ext.min.js` 中 `ratechange` 监听，反混淆后逻辑）：
  ```js
  var cap = params.videoObj && params.videoObj.doublespeed ? 2 : 1; // 未通过任务点 → cap = 1
  player.on('ratechange', function () {
    var rate = player.playbackRate();
    if (rate > cap) { player.pause(); player.playbackRate(1); } // 超限就暂停并改回 1.0
    else Ext.setCookie('doubleSpeedValue', rate);
  });
  ```
- 也就是说，“不看完视频不能倍速”在浏览器端的实现 = **速率菜单被禁用 + ratechange 超限强制暂停/重置**，并不是真的在服务端锁死播放器。
- 本扩展的 hook 让 `player.playbackRate()`（videojs 最终读取的是 `video.playbackRate` DOM 属性，并会缓存到 `cache_.lastPlaybackRate`）看到的恒为 `1.0`，因此 `rate > cap` 判断永远不成立：**不会被暂停、不会被改回 1.0**，而真实播放速度由扩展强制保持。
- 平台自身允许的倍速上限就是 **2×**（`cap` 最大为 2），所以建议日常使用 **1.25×–2×**；设置超过 2× 虽然本扩展也能生效，但更容易触发平台服务端的异常判定（见下节风险）。

---

## 五、常见问题

**Q1：装了扩展，倍速没变化？**
- 安装扩展前就已打开的页面必须**刷新一次**；
- 确认弹窗绿点是否亮起、总开关是否打开；
- 部分课程视频在 iframe 中加载较慢，等视频加载出现后再点倍速；
- 若仍无效，打开 `chrome://extensions/` 确认扩展无报错，并在课程页按 F12 看 Console 是否有错误。

**Q2：进度条/学习时长会被平台发现吗？**
- 扩展只改播放速度，不改播放器上报的数据。如果平台**在服务端**根据“墙钟时间 vs 播放位置增量”判断异常，仍可能判定倍速并影响进度记录。这是客户端扩展无法控制的，请自行评估风险。

**Q3：播放器自己的倍速按钮/UI 还是 1.0×？**
- 这是「伪装倍速状态」的正常副作用（页面读到的是假值）。想让它显示真实倍速，可在弹窗里关掉伪装。

**Q4：老师允许倍速，我还需要它吗？**
- 如果平台本身已开放倍速，可以关闭本扩展或直接不用。

**Q5：我的 Chrome 提示“由贵单位管理”/ 开发者模式不可用？**
- 如果浏览器被学校策略禁止加载未打包扩展，本方式会失效。可在 `chrome://policy` 查看限制。可选择个人设备上的浏览器使用，或改用 Tampermonkey 用户脚本（如提供）。

**Q6：如何卸载？**
- `chrome://extensions/` → 找到本扩展 → 移除，然后刷新课程页面即可恢复平台原始行为。

---

## 六、文件结构

```
smartcourse-speed-unlock/
├─ manifest.json            # MV3 清单：content scripts（MAIN + ISOLATED）、权限
├─ src/
│  ├─ main-world.js         # 播放器 Hook：接管 playbackRate、防重置、伪装、兜底
│  └─ bridge.js             # 隔离世界桥接：配置同步、快捷键、状态查询
├─ popup/
│  ├─ popup.html            # 弹窗 UI
│  ├─ popup.css
│  └─ popup.js
├─ icons/                   # 16/32/48/128 图标
└─ README.md
```

## 七、安全与隐私

- 扩展只申请 `storage` 权限，**不联网、不上传任何数据**；
- 不含任何远程代码，所有逻辑均可在上述源码中审阅；
- 不读取账号、不写入平台接口、不修改课程状态。

## 八、已知限制

- **无法绕过服务端校验**：平台会以约 60s 心跳向 `/keeper/api/receive-studylog`、`/pc/report/reportIndex` 等接口上报观看数据；若服务端按“实际耗时 vs 播放位置增量”判定异常，倍速仍可能被识别并影响进度记录。建议只开 1.25×–2×（平台自身上限就是 2×），先在不计分内容上验证；
- 页面若在服务端下发 `doublespeed=0` 后仍会周期性重新初始化播放器，本扩展会持续接管（有兜底巡检），但极端情况下可能出现短暂“暂停→恢复”；
- 无法绕过平台的“防挂机”交互（如弹题、随机暂停、切标签页暂停等）——这些不属于本扩展范围，也不建议绕过；
- 倍速上限受浏览器限制，最高 16×；超过约 2–4× 后音频可能被浏览器静音或压缩，属正常现象；
- 平台前端大改版后可能失效，届时需按新的播放器结构小幅调整 Hook。

## 九、验证记录（2026-11-16）

在 Windows + **Chrome 157.0.8103.51** 上做了独立自动化验收：通过 CDP `Extensions.loadUnpacked` 加载**真实的未打包扩展**（Chrome 157 起命令行 `--load-extension` 被官方禁用，但用户手动「加载已解压的扩展程序」不受影响），并用 `--host-resolver-rules` 把 `smartcourse.hust.edu.cn`、`jwc.hust.edu.cn` 映射到本地测试服务器（**全部流量在本机，未访问真实课程平台、未登录**）。

结果：**25/25 项全部 PASS，0 FAIL**。关键证据：

- 默认（storage 为空）真实倍速 2.0×，页面脚本读取为 1.0×；
- 页面写 `playbackRate=3` / `defaultPlaybackRate=0.5`、`ratechange`+250ms 循环重置、`defaultPlaybackRate=1 + load()`：真实倍速始终/立即恢复为配置值；
- 页面绕过 Hook 直接改属性、甚至篡改 Hook 本身：≤180ms 自动重新接管；
- 动态插入的 `<audio>/<video>`、跨域 iframe（`jwc.hust.edu.cn`）内的媒体同样生效，iframe 内 `currentTime` 斜率 ≈2.03（独立于倍速读取的验证通道）；
- 弹窗改 2.5×、Alt+↑/↓、关闭伪装、关闭/重开总开关均**实时生效、无需刷新**；快捷键写入 storage 后新页面直接应用；
- 10 秒播放稳定性：`ratechange` 增量 0，页面 219 次重置尝试被吸收，无事件风暴。

完整验收报告见 **[docs/verification-report.md](docs/verification-report.md)**（含逐项证据与复现方式；测试工程未随仓库分发）。**未验证项**：需统一认证的真实课程页最终效果、平台服务端的进度判定——这取决于学校/课程配置，请先在不计分内容上试。

---

## 许可证

[MIT License](LICENSE)。本项目仅供学习交流，请自行承担使用风险。
