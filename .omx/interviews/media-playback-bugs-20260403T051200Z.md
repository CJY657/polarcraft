# Deep Interview Transcript Summary — media-playback-bugs

- Profile: standard
- Context type: brownfield
- Final ambiguity: 17.6%
- Threshold: 20%
- Context snapshot: `.omx/context/media-playback-bugs-20260403T045118Z.md`

## Condensed transcript

### Round 1 — Outcome / Scope
- Q: `Esc` 退出全屏后应该保留哪些状态？
- A: 保留当前 PPT 页、当前媒体、播放位置。

### Round 2 — Scope
- Q: 点击图片后的正确交互是什么？
- A: 图片和视频共享一个区域。

### Round 3 — Pressure pass / Decision boundary
- Q: 从视频切到图片，再切回视频时，是否也要保留该视频进度？
- A: 是的。

### Round 4 — Decision boundary / Constraints
- Q: 是只修页面自己的全屏按钮，还是连浏览器/视频控件自带全屏一起修？
- A: 都补。

### Round 5 — Non-goals
- Q: 是否接受本次只修课程观看页媒体预览行为，不改后台媒体管理/超链接编辑/课程数据结构/整页布局；视频允许出现黑边以避免裁切？
- A: 可以。

## Brownfield findings used during interview
- `src/feature/course/CourseViewer.tsx`
  - 视频预览和自定义全屏都使用 `object-cover`，会裁切左右内容。
  - 图片点击只更新 `selectedImageMedia`，主预览仍由 `activeVideoMedia` 驱动，因此表现为“点图没打开”。
  - 自定义全屏与普通预览分支是两套渲染路径，存在视频组件重建并丢失播放位置的风险。
- `src/feature/course/PdfViewer.tsx`
  - `window.resize` 时会执行 `setCurrentPage(1)`；退出浏览器/原生全屏会触发 resize，这很可能就是 PDF 兜底 PPT 返回首页的直接原因。
