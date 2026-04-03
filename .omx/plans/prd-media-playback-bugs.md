# PRD — media-playback-bugs

## Requirements Summary
Fix the course viewer's PPT/media-linked preview flow so that media interaction preserves teaching context instead of resetting it. The current implementation splits video and image state in PPT layout (`src/feature/course/CourseViewer.tsx:1010-1045`), updates video and image selections asymmetrically (`src/feature/course/CourseViewer.tsx:1146-1174`), renders fullscreen through a separate branch with `object-cover` media rendering (`src/feature/course/CourseViewer.tsx:1258-1325`), and reserves the right rail main area for video while showing images in a separate card (`src/feature/course/CourseViewer.tsx:1667-1794`). On PDF-backed decks, `PdfViewer` resets `currentPage` to 1 on any resize (`src/feature/course/PdfViewer.tsx:225-234`), which is a strong candidate for “Esc 退出全屏回首页”.

The approved behavior is:
- image and video share one main preview region,
- fullscreen must not crop media,
- exiting fullscreen via either the page button or native video fullscreen must preserve current PPT page, current media, and current playback position,
- switching from video → image → same video must resume that video's prior position,
- no backend/data-model/layout redesign, and black bars are acceptable.

## RALPLAN-DR Summary

### Principles
1. Preserve user context over visual fill: PPT page, selected media, and playback state are first-class state.
2. Prefer a single source of truth for preview selection in PPT layout.
3. Fix root causes in the owning component instead of adding cross-component patch logic.
4. Keep the change bounded to course-viewing behavior; do not widen into admin/config/data work.
5. Make verification explicit across both PPT render paths (PDF fallback and PPTX render) and both fullscreen paths.

### Decision Drivers
1. State continuity: current PPT page + current media + per-video playback position must survive fullscreen exit and media switches.
2. UX correctness: image/video must share the same primary preview area, and fullscreen must show the whole frame.
3. Bounded risk: changes should stay inside the course viewer / PDF viewer surface and be testable without redesigning course data or admin tools.

### Viable Options
#### Option A — Unify preview state + explicit per-video progress cache + fullscreen-aware page preservation **(recommended)**
- **Approach:** Replace the PPT-layout split preview model with a unified active preview selection, track per-video playback position by media id, and stop `PdfViewer` from forcing page 1 on fullscreen-triggered resizes.
- **Pros:** Directly matches approved UX; easiest to reason about; isolates fixes to the two components that own the bugs; supports both custom and native fullscreen paths.
- **Cons:** Requires touching multiple state paths in `CourseViewer`; needs careful event wiring around video/fullscreen behavior.

#### Option B — Keep split state model and add compatibility shims
- **Approach:** Preserve separate video/image state, but mirror image clicks into the main rail, patch fullscreen exits, and store only “last video position” outside the main render path.
- **Pros:** Smaller apparent diff in layout code; preserves more of the current structure.
- **Cons:** Keeps the mismatch between `selectedMedia`, `selectedVideoMedia`, and `selectedImageMedia`; easier to regress later; brittle for multiple videos because “last video” is weaker than per-media state.

#### Option C — Preserve DOM instances by keeping media nodes mounted off-screen
- **Approach:** Retain media elements across switches/fullscreen so browser state survives naturally.
- **Pros:** Native playback state retention can be simple for a single video.
- **Cons:** Higher memory/UI complexity; harder to keep native fullscreen and hidden nodes consistent; overkill for this scoped fix.

### Recommendation
Choose **Option A**. It best aligns with the user-approved behavior and cleanly separates the two proven problem areas:
- `CourseViewer` owns preview selection/fullscreen/media state,
- `PdfViewer` owns page retention during resize/fullscreen transitions.

## Acceptance Criteria
1. In PPT layout, clicking an image resource or PPT hyperlink renders that image in the same main preview area currently used for video; the dedicated “补充图片 / Reference Image” card is removed or no longer required for normal viewing (`src/feature/course/CourseViewer.tsx:1667-1794`).
2. Main preview media uses full-frame display semantics (no left/right crop in fullscreen); letterboxing is acceptable (`src/feature/course/CourseViewer.tsx:1275-1296`).
3. Exiting fullscreen via the page fullscreen button returns to the same PPT page, same selected media, and same video time.
4. Exiting fullscreen via native video controls/fullscreen returns to the same PPT page, same selected media, and same video time.
5. Switching video → image → same video resumes the prior playback position for that video.
6. On PDF-backed PPT rendering, fullscreen exit does not reset the deck to page 1 (`src/feature/course/PdfViewer.tsx:225-234`).
7. PPT-linked navigation still works: `linkedMediaId` / `linkedMediaNonce`-driven synchronization continues to highlight and navigate correctly (`src/feature/course/CourseViewer.tsx:1640-1653`; `src/feature/course/PdfViewer.tsx:329-353`).

## Implementation Steps
1. **Refactor the PPT-layout preview state into one preview-selection model**
   - **Files:** `src/feature/course/CourseViewer.tsx`
   - **Why:** The current `selectedVideoMedia` + `selectedImageMedia` split (`1014-1017`) and `activePreviewMedia` derivation (`1040-1045`) force video to remain the main preview in PPT layout. Consolidate selection so the main preview follows the current media selection regardless of type.
   - **Key work:** prefer reusing `selectedMedia` (or a single equivalent canonical preview source) for PPT-layout preview ownership; keep video/image-specific state only as derived metadata if still needed for labels/download buttons.

2. **Add explicit per-video playback state retention keyed by media id**
   - **Files:** `src/feature/course/CourseViewer.tsx`
   - **Why:** The current render path can remount video during media switches/fullscreen transitions (`1258-1325`), and `previewPlaybackKey` (`1022`, `1160-1162`) is restart-oriented rather than persistence-oriented.
   - **Key work:** track progress in component state/ref map keyed by video media id; restore `currentTime` when re-entering a video; ensure custom fullscreen and shared-region switching use the same persisted state; keep the scope to playback position continuity unless preserving play/pause intent falls out naturally.

3. **Unify fullscreen behavior across custom and native paths without losing context**
   - **Files:** `src/feature/course/CourseViewer.tsx`
   - **Why:** Escape handling is currently limited to local fullscreen booleans (`1220-1234`), while native fullscreen is delegated to the browser's video controls.
   - **Key work:** listen for fullscreen lifecycle events (`fullscreenchange` and vendor-safe fallbacks if needed), preserve active preview identity and cached playback time on enter/exit, and ensure the page-button path does not rebuild the preview in a way that loses state.

4. **Fix `PdfViewer` resize behavior so fullscreen exit preserves page**
   - **Files:** `src/feature/course/PdfViewer.tsx`
   - **Why:** `handleResize` currently does `setCurrentPage(1)` on any resize (`225-234`), which conflicts with fullscreen exit expectations.
   - **Key work:** separate “recompute landscape/scale” from “reset page”; preserve current page on resize/fullscreen exit; keep `goToPage` (`329-353`) as the canonical way to move intentionally; if orientation changes to portrait scrolling, explicitly scroll back to the preserved page instead of snapping to page 1.

5. **Update the right-rail presentation to match the approved one-region behavior**
   - **Files:** `src/feature/course/CourseViewer.tsx`
   - **Why:** The current main rail heading/buttons are video-specific (`1667-1731`) and the image card is secondary (`1747-1794`).
   - **Key work:** make the title/actions follow the active preview media type, remove or demote the separate image card, and keep download/fullscreen affordances correct for the currently active media.

6. **Add regression coverage for state continuity and PDF page retention**
   - **Files:** new/updated tests near `src/feature/course/` and/or `src/pages/`
   - **Why:** The repo already uses Vitest/RTL (`package.json`, `src/pages/CourseViewerPage.test.tsx`), but this flow currently has no focused regression suite.
   - **Key work:** add targeted tests around preview selection and persistence; if direct `react-pdf` interaction is brittle in jsdom, extract narrow helper logic or mock the resize/fullscreen transitions and cover the rest with manual verification.

## Risks and Mitigations
- **Risk:** Unifying preview state accidentally breaks PPT hyperlink highlighting or linked navigation.
  - **Mitigation:** Keep `selectedMedia`/highlight semantics explicit and verify linked PPT navigation on both PDF fallback and PPTX paths.
- **Risk:** Per-video progress restoration is flaky across browsers/fullscreen APIs or duplicate fullscreen events.
  - **Mitigation:** Use `fullscreenchange` as the single source of truth for fullscreen transitions, keep the active media node stable where possible, and verify both fullscreen entry paths manually.
- **Risk:** Changing `PdfViewer` resize behavior could regress orientation/page behavior on small screens.
  - **Mitigation:** Preserve scale recalculation and keep page changes routed through `goToPage`; add a resize-focused regression test/manual check.
- **Risk:** One-region preview could leave duplicate or stale image UI in the right rail.
  - **Mitigation:** Explicitly remove or repurpose the separate image card and validate headings/actions against the active preview type.

## Verification Steps
1. `npm run test:run`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. Manual verification on at least:
   - one PPT course using PDF fallback,
   - one PPT course using PPTX render (if available),
   - both page-button fullscreen and native video-control fullscreen.
6. Manual scenario matrix:
   - open video → fullscreen → `Esc` → confirm same PPT page/media/time,
   - open image → confirm image occupies main preview region,
   - video → image → same video → confirm resume time,
   - fullscreen exit while a PDF-backed deck is open → confirm page does not reset.

## ADR
- **Decision:** Adopt a unified preview-selection model in `CourseViewer`, preserve per-video playback position explicitly, and remove `PdfViewer`'s unconditional page reset on resize.
- **Drivers:** Context continuity, correct shared preview UX, bounded fix scope.
- **Alternatives considered:**
  - Keep split image/video state with compatibility shims.
  - Preserve hidden media DOM nodes instead of explicit state.
- **Why chosen:** Explicit state is more maintainable than UI shims and less complex/risky than hidden always-mounted media nodes.
- **Consequences:**
  - `CourseViewer` state logic becomes more explicit and slightly broader.
  - `PdfViewer` resize behavior changes from “always reset” to “preserve current page unless user navigates”.
  - Preview visuals may show black bars instead of crop.
- **Follow-ups:**
  - Verify whether any mobile-only fullscreen quirks need a follow-up patch.
  - If tests around `react-pdf` prove too brittle, extract helper logic for more stable unit coverage.

## Available-Agent-Types Roster
Relevant available roles from the current catalog:
- `architect` — tradeoffs, boundaries, fullscreen/page-state design review
- `executor` — implementation of viewer state/refactor and fullscreen handling
- `debugger` — isolate fullscreen/native-control edge cases if progress/page retention misbehaves
- `test-engineer` — focused regression strategy for CourseViewer/PdfViewer flows
- `verifier` — completion evidence and acceptance-criteria validation
- `code-reviewer` — final comprehensive review if execution grows beyond the scoped files
- `code-simplifier` — optional post-implementation simplification if state refactor becomes noisy

## Follow-up Staffing Guidance
### If executed via `$ralph` (recommended for this size)
- **Lead lane:** `executor` at **high** reasoning
  - Own `CourseViewer.tsx` preview/fullscreen refactor and `PdfViewer.tsx` resize/page retention.
- **Evidence lane:** `test-engineer` at **medium** reasoning
  - Add/adjust targeted regression coverage and define manual verification matrix.
- **Sign-off lane:** `verifier` at **high** reasoning
  - Re-run acceptance criteria and confirm both fullscreen paths + both PPT render paths.
- **Why Ralph:** The change is concentrated in a small number of files with tight state coupling; a single persistent owner reduces merge churn.

### If executed via `$team`
Recommended headcount: **3 workers**, shared worker role prompt `executor`, with lane-specific assignments in worker inboxes.
- **Worker 1 — Delivery lane (high reasoning):** `CourseViewer.tsx` unified preview state, shared media area, custom/native fullscreen state handling.
- **Worker 2 — Viewer-state lane (medium reasoning):** `PdfViewer.tsx` resize/page preservation and any supporting helper extraction/tests.
- **Worker 3 — Verification lane (medium reasoning, verifier/test-engineer shaped assignment):** targeted tests, manual reproduction script, regression evidence.
- **Why team:** Viable if you want faster parallelization across `CourseViewer`, `PdfViewer`, and regression work, but leader integration discipline matters.

## Launch Hints
### Ralph path
- `\$ralph .omx/plans/prd-media-playback-bugs.md`

### Team path
- `omx team 3:executor "Implement prd-media-playback-bugs in /home/cjy/polarcraft with lanes: CourseViewer unified preview+fullscreen, PdfViewer page retention, tests+verification"`
- `\$team 3:executor "Implement prd-media-playback-bugs in /home/cjy/polarcraft with lanes: CourseViewer unified preview+fullscreen, PdfViewer page retention, tests+verification"`

## Team Verification Path
Before team shutdown, the leader should require:
1. Delivery lane proves the main preview is media-type agnostic and fullscreen no longer crops.
2. Viewer-state lane proves PDF-backed deck page is preserved across fullscreen exit and documents the resize-path change.
3. Verification lane produces test/build/typecheck evidence plus a manual scenario checklist covering both fullscreen entry paths.
4. After merge/integration, a final verifier (or a later Ralph follow-up only if needed) replays the acceptance criteria end-to-end.
5. The leader explicitly checks that URL/document changes still reset page intentionally while resize/fullscreen exits do not.

## Consensus Review Improvements Applied
- Added an explicit decision in favor of per-video progress caching over hidden always-mounted media nodes.
- Split the plan cleanly between `CourseViewer` ownership and `PdfViewer` ownership to reduce cross-component ambiguity.
- Strengthened verification to explicitly require both PDF fallback and PPTX render-path checks, plus both fullscreen entry paths.
- Narrowed the preview-state refactor around one canonical preview owner (`selectedMedia` or equivalent) instead of introducing unnecessary new parallel state.
- Clarified that the required persistence guarantee is playback position (`currentTime`) and that portrait-orientation resize handling must preserve/scroll to the current logical page rather than reset it.
