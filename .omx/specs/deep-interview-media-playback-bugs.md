# Deep Interview Spec — media-playback-bugs

## Metadata
- Profile: standard
- Rounds: 5
- Final ambiguity: 17.6%
- Threshold: 20%
- Context type: brownfield
- Context snapshot: `.omx/context/media-playback-bugs-20260403T045118Z.md`
- Transcript: latest `.omx/interviews/media-playback-bugs-*.md`

## Clarity breakdown
| Dimension | Score |
|---|---:|
| Intent | 0.84 |
| Outcome | 0.86 |
| Scope | 0.84 |
| Constraints | 0.72 |
| Success Criteria | 0.80 |
| Context | 0.76 |

## Intent
修复课程观看页中 PPT 与媒体联动的核心使用路径，避免全屏播放和媒体切换打断讲解流程；用户希望在演示过程中退出全屏或切换图片/视频时，不丢失当前课件上下文和播放进度。

## Desired Outcome
1. 视频全屏时显示完整画面，不再左右裁切。
2. 从任意支持的全屏入口按 `Esc` 退出后，仍停留在退出前的 PPT 当前页、当前媒体和当前播放位置。
3. 图片点击后能在与视频相同的主预览区域中展示，而不是只出现在补充卡片里。
4. 当用户从视频切到图片，再切回该视频时，视频从原先的播放位置继续。

## In scope
- 课程观看页的媒体预览行为修复。
- 图片和视频统一到同一个主预览区域的交互修正。
- 页面自定义全屏入口的退出行为修复。
- 浏览器/视频控件自带全屏入口的退出行为修复。
- 为保留视频进度而做的前端状态保持。
- 保证 PPT/PDF 课件在媒体全屏退出后不回到第一页。

## Out-of-scope / Non-goals
- 不改后台媒体管理。
- 不改超链接编辑器或课程管理后台的配置流程。
- 不改课程数据结构。
- 不重做整套课程页布局。
- 不以“铺满区域”为目标牺牲视频完整显示；允许使用 `contain` 带来黑边。

## Decision Boundaries
可以由 OMX 直接决定、无需再次确认：
- 为避免裁切，将视频展示策略从 `cover` 改为完整显示优先（如 `contain`）。
- 为了保留播放位置，引入前端局部状态缓存或避免组件重建。
- 为了防止退出全屏后 PPT 回首页，调整 resize/fullscreen 相关状态逻辑。
- 将图片从“补充图片区”合并进主预览区，只要不重做整体布局。

## Constraints
- 需要兼顾两类全屏入口：页面自定义按钮 + 浏览器/视频控件原生全屏。
- 修复应以课程观看页为主，不扩散到后台和数据模型。
- 退出全屏与媒体切换都不能破坏 PPT 当前页上下文。
- 图片与视频共享主预览区后，仍应保持现有 PPT 联动逻辑可用。

## Testable acceptance criteria
1. 选择任意视频进入主预览区，点击页面全屏按钮后，视频完整显示；左右内容不被裁切。
2. 使用页面全屏按钮进入全屏后按 `Esc` 退出：
   - PPT 仍停留在退出前的页码；
   - 当前选中媒体不变；
   - 视频继续停留在退出前时间点附近，而不是从头开始。
3. 使用浏览器/视频控件原生全屏后按 `Esc` 退出，也满足上述三点。
4. 点击任意图片资源后，主预览区切换为该图片；不再需要依赖单独的“补充图片”卡片才能看到图片。
5. 先播放视频到中间位置，切到图片，再切回该视频，继续从原时间点播放/待播。
6. 对于走 PDF 兜底渲染的课件，退出媒体全屏后不回到第一页。

## Assumptions exposed + resolutions
- 假设：图片“没打开”可能是资源失效。
  - 结论：否。代码证据显示图片被放到了单独补充卡片区，属于交互不符合预期，不是单纯资源加载失败。
- 假设：只修页面自定义全屏即可。
  - 结论：否。用户要求连浏览器/视频控件原生全屏一起修。
- 假设：只要退出全屏不报错即可。
  - 结论：否。必须同时保留 PPT 页、当前媒体、播放位置。
- 假设：图片与视频共享区域后，切换回视频可以从头播。
  - 结论：否。必须保留进度。

## Pressure-pass findings
- Revisited answer: “图片和视频共享一个区域”。
- Follow-up pressure: 如果共享一个区域，切走再切回视频时，是否也要保留播放进度？
- Outcome: 明确要求保留视频进度；因此后续修复不能只是切换 UI，还必须保住视频实例状态或时间状态。

## Brownfield evidence vs inference
### Direct evidence
- `src/feature/course/CourseViewer.tsx`
  - 视频 `<video>` 使用 `object-cover`，直接解释“全屏左右缺一块”。
  - 主预览区当前绑定 `activeVideoMedia`；图片单独走 `activeImageMedia` 补充卡片。
  - 自定义全屏与普通预览是不同渲染分支，存在重建媒体节点的风险。
- `src/feature/course/PdfViewer.tsx`
  - `resize` 监听里直接 `setCurrentPage(1)`；fullscreen 进出通常触发 resize，因此 PDF 兜底课件回首页有直接代码证据。

### Inference
- 对自定义全屏退出后视频进度丢失的现象，推断与 `renderMedia()` 的条件分支重建视频节点有关；需要在执行阶段实测确认。
- 如果部分 PPT 走 `PptxViewer` 而非 `PdfViewer`，其“回首页”成因可能不同；执行阶段需要分别验证 PDF fallback 与 PPTX render 两条路径。

## Technical context findings
- Primary files:
  - `src/feature/course/CourseViewer.tsx`
  - `src/feature/course/PdfViewer.tsx`
  - `src/feature/course/pptMedia.ts`
- Secondary file of interest:
  - `src/components/shared/SecureVideoPlayer.tsx`（存在全屏逻辑，但当前课程观看页主流程实际使用原生 `<video>`）

## Possible side effects / risks to carry into planning
- 将视频从 `cover` 改为 `contain` 后，视觉上会出现黑边；这是已接受取舍。
- 若用“隐藏但不销毁”的方式保留视频进度，可能增加页面内同时挂载的媒体节点数量，需要留意内存与自动播放行为。
- 若修改 `PdfViewer` 的 resize 逻辑，需要避免破坏现有横竖屏切换、滚动同步和页码显示。
- 图片与视频共区后，当前右侧“补充图片”卡片可能需要删除或降级为元信息卡，避免重复展示。

## Recommended handoff
### Recommended: `$ralplan`
- Input artifact: `.omx/specs/deep-interview-media-playback-bugs.md`
- Why: 需求已澄清，但仍有执行层面的技术取舍需要确认：
  - 视频进度保留采用“组件不卸载”还是“显式缓存 currentTime”；
  - PDF fallback 和 PPTX render 两条课件路径要如何一起验证；
  - 原生全屏与自定义全屏的事件同步策略。

## Condensed transcript
1. `Esc` 退出全屏后，保留 PPT 页、当前媒体、播放位置。
2. 图片和视频共享一个区域。
3. 从视频切到图片再切回视频时，也要保留进度。
4. 页面自定义全屏和浏览器/视频控件原生全屏都要修。
5. 非目标：不动后台/数据结构/整页布局；允许黑边以换取完整显示。
