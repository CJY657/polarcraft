# RALPLAN Draft v1 — media-playback-bugs

## Requirements Summary
Source of truth: `.omx/specs/deep-interview-media-playback-bugs.md`.

The course viewing experience needs a bounded bug-fix pass in the media preview lane only:
- fullscreen video must show the full frame without left/right cropping;
- exiting fullscreen with `Esc` must preserve the current PPT page, current media selection, and current video playback position;
- image and video previews must share the same primary preview region;
- switching from video -> image -> the same video must preserve that video's playback position;
- both fullscreen entry paths are in scope: the page-level fullscreen affordance and the browser/native video-control fullscreen affordance.

Grounded code evidence:
- `src/feature/course/CourseViewer.tsx:1010-1045` keeps separate `selectedVideoMedia` / `selectedImageMedia` state and, in PPT layout, derives `activePreviewMedia` from `activeVideoMedia`, not the selected image.
- `src/feature/course/CourseViewer.tsx:1146-1174` updates selected video/image asymmetrically inside `handleMediaSelect`, reinforcing the split-preview behavior.
- `src/feature/course/CourseViewer.tsx:1258-1325` renders the media area from a per-call `renderMedia()` helper, uses `object-cover` for image/video media, and swaps to a distinct fullscreen branch when `isFullscreen` is true.
- `src/feature/course/CourseViewer.tsx:1667-1794` renders the right column as a video-first main panel plus a separate `activeImageMedia` card.
- `src/feature/course/PdfViewer.tsx:225-234` resets `currentPage` to `1` on every `resize`, which can fire on fullscreen transitions.
- `src/feature/course/PdfViewer.tsx:329-353` already exposes `goToPage(page)` and can preserve page state if resize behavior stops resetting it.

## RALPLAN-DR Summary

### Principles
1. Preserve teaching context first: media interactions must never throw the learner back to slide 1 or reset the selected media unexpectedly.
2. Prefer state continuity over view replacement: fullscreen and media switching should reuse or explicitly restore media session state instead of remounting blindly.
3. Fix within the viewer boundary: keep changes inside the course-viewing path unless a helper extraction clearly reduces risk.
4. Full-frame correctness beats edge-to-edge fill: allow letterboxing rather than cropping instructional content.
5. Verify both media pipelines: cover PDF-fallback decks and PPTX-render decks, plus page-level and native fullscreen paths.

### Decision Drivers
1. Preserve PPT page and playback position across fullscreen exits and media switches.
2. Keep the diff small and isolated to `CourseViewer` / `PdfViewer` behavior.
3. Support both fullscreen entry paths without regressing existing deck-link navigation.

### Viable Options

#### Option A — Minimal patch on current split-preview structure
**Approach:** Keep the current `selectedVideoMedia`/`selectedImageMedia` split, patch the main preview to branch between them, add a per-video time cache, and stop `PdfViewer` from resetting to page 1 on resize.
**Pros:**
- Smaller conceptual diff.
- Lower chance of unintended layout churn.
- Easier to land quickly if the right rail structure stays mostly intact.
**Cons:**
- Leaves the current state model asymmetrical and easier to regress.
- Requires more conditional logic everywhere the preview header, actions, and fullscreen state depend on media type.
- Still risks remount-related bugs because fullscreen/inline rendering remain separate branches.

#### Option B — Normalize to one active preview model with session persistence
**Approach:** Refactor `CourseViewer` so the right preview rail is driven by one active preview media state for both images and videos, add explicit video session persistence keyed by media id, and make fullscreen transitions observe/synchronize native fullscreen state instead of treating fullscreen as a separate media instance.
**Pros:**
- Aligns directly with the clarified requirement that images and videos share one region.
- Creates one place to preserve and restore playback time.
- Reduces future divergence between image/video behaviors in the preview lane.
**Cons:**
- Slightly larger refactor than a minimal patch.
- Needs careful review so header/actions/details still behave well for both media types.

#### Option C — Swap the preview lane to `SecureVideoPlayer` plus a new image viewer wrapper
**Approach:** Replace the current raw `<video>` path with `SecureVideoPlayer`, then build a parallel image wrapper to unify preview/fullscreen handling.
**Pros:**
- Could centralize fullscreen handling longer term.
- Opens a path toward stronger media-control consistency.
**Cons:**
- Highest change surface.
- `SecureVideoPlayer` is not the current course-viewer path and does not already solve PDF page retention or image/video shared-region behavior.
- Unnecessary for a bounded bug-fix pass.

### Recommendation
Choose **Option B**. It best matches the user’s clarified outcome while keeping changes inside the viewer boundary. It fixes the root mismatch (split preview state) instead of stacking special cases onto a video-first layout.

## Acceptance Criteria
1. In the PPT layout, selecting an image from the left resource list or from deck hyperlinks shows that image in the same main preview panel currently used for video (`src/feature/course/CourseViewer.tsx:1667-1745` today uses video only).
2. No separate “补充图片 / Reference Image” card is required to see the active image.
3. When a video is shown in the preview panel or fullscreen, it renders without left/right cropping; full-frame visibility is prioritized over fill.
4. Exiting page-level fullscreen with `Esc` preserves:
   - the current deck page;
   - the currently selected preview media;
   - the current playback position for videos.
5. Exiting browser/native video-control fullscreen with `Esc` preserves the same three states.
6. If the user watches a video, switches to an image, then switches back to that same video, the preview resumes from the prior playback time instead of restarting.
7. PDF-fallback deck rendering no longer jumps to page 1 on fullscreen exit caused by resize events.
8. Existing hyperlink-driven media selection from `PptxViewer` / `PdfViewer` still highlights and opens the target media.

## Implementation Steps

### Step 1 — Normalize preview selection around one active media model
**Files:**
- `src/feature/course/CourseViewer.tsx` (`1010-1045`, `1146-1174`, `1667-1794`)

**Plan:**
- Replace the video-first preview derivation with one canonical preview selection for non-PPT media in the PPT layout.
- Collapse the current `activeVideoMedia` main-panel assumption so the preview header, action buttons, and main renderer derive from the actual active media.
- Remove or downgrade the separate `activeImageMedia` card so image/video genuinely share one region.

**Why:**
The current split state (`selectedVideoMedia` vs `selectedImageMedia`) is the root reason images feel broken even though selection technically changes.

### Step 2 — Preserve video session state across media switches and fullscreen transitions
**Files:**
- `src/feature/course/CourseViewer.tsx` (`1146-1174`, `1258-1325`)
- optionally a new local helper/hook under `src/feature/course/` if extraction reduces component sprawl

**Plan:**
- Add a per-video session cache keyed by media id (at minimum `currentTime`, and optionally paused/playing intent if needed).
- Ensure switching away from a video stores the current time before the DOM node disappears.
- When switching back to that video, restore `currentTime` before playback continues.
- Stop treating fullscreen as a separate media instance; either keep the same media element mounted across inline/fullscreen presentation or explicitly synchronize cached playback state on entry/exit.
- Add `fullscreenchange`-based synchronization so native fullscreen exit updates viewer state instead of relying only on the current `Escape` key listener (`1220-1234`).

**Why:**
The user explicitly requires playback continuity not only after `Esc`, but also after video -> image -> video switching.

### Step 3 — Correct fullscreen rendering and controls for both media types
**Files:**
- `src/feature/course/CourseViewer.tsx` (`1258-1325`, `1667-1718`)

**Plan:**
- Change video rendering from `object-cover` to full-frame display (`object-contain` or equivalent sizing rules) in both inline and fullscreen contexts.
- Review image sizing too so shared-region rendering behaves predictably in both inline and fullscreen states.
- Keep fullscreen affordances type-aware: videos retain download/fullscreen controls; images should expose a sensible download/fullscreen path only if already supported by the chosen shared preview shell.

**Why:**
Cropping is a direct rendering bug, and a shared preview panel needs consistent sizing semantics across media types.

### Step 4 — Preserve PDF page state across fullscreen-triggered resizes
**Files:**
- `src/feature/course/PdfViewer.tsx` (`225-234`, `329-353`, `386-410`)

**Plan:**
- Remove the unconditional `setCurrentPage(1)` from the resize effect.
- Recompute orientation and scale on resize, but preserve the current logical page.
- If needed, use the existing `goToPage()` helper after a layout mode change so the current page remains visible without resetting state.
- Verify this behavior for fullscreen enter/exit and normal window resizing.

**Why:**
Resize is the strongest code-backed explanation for “Esc exits fullscreen and returns to PPT home page” in the PDF path.

### Step 5 — Lock behavior with targeted tests and verification hooks
**Files:**
- `src/feature/course/CourseViewer.tsx`
- `src/feature/course/PdfViewer.tsx`
- `src/App.test.tsx` or a new targeted viewer test file under `src/feature/course/__tests__/`

**Plan:**
- Add focused component tests for the viewer-state transitions that do not depend on real fullscreen APIs more than necessary.
- Where DOM fullscreen behavior is awkward in jsdom, isolate logic into small testable helpers (e.g., page retention / media-session restoration helpers) and test those directly.
- Keep one lightweight manual verification checklist for native fullscreen because browser fullscreen APIs are only partially simulated in unit tests.

**Why:**
The bugs are state-transition bugs; regression protection matters more than snapshot coverage.

## Risks and Mitigations
- **Risk:** Preserving video instances could leave hidden media playing in the background.
  - **Mitigation:** Cache playback time explicitly and pause before switching away; do not rely on hidden autoplay.
- **Risk:** Removing the separate image card may inadvertently remove useful image metadata visibility.
  - **Mitigation:** Keep the metadata/detail card but drive it from the unified active preview media instead of a video-only assumption.
- **Risk:** Adjusting `PdfViewer` resize handling could regress orientation changes.
  - **Mitigation:** Preserve current page while still recalculating `isLandscape` and scale; test both landscape and portrait flows.
- **Risk:** Native fullscreen events can behave differently across browsers.
  - **Mitigation:** Use standard `fullscreenchange` handling first, then verify at least Chrome-class browsers manually during execution.

## Verification Steps
1. Run viewer-focused automated tests for selection/session/page-retention behavior.
2. Run `pnpm test:run`.
3. Run `pnpm lint`.
4. Run `pnpm typecheck`.
5. Manual verification on a course with PPT + video + image assets:
   - select video, enter custom fullscreen, `Esc`, confirm page/media/time persist;
   - select video, enter native fullscreen, `Esc`, confirm page/media/time persist;
   - play video to mid-point, switch to image, switch back, confirm time restore;
   - select image and confirm it appears in the main preview region;
   - repeat on a deck path that uses `PdfViewer` fallback.

## ADR
### Decision
Refactor the course-viewer preview lane to one active non-PPT preview model, add explicit per-video playback-session persistence, and preserve PDF page state across resize/fullscreen transitions.

### Drivers
- Meet the clarified requirement that image and video share one region.
- Preserve teaching continuity across fullscreen exit and media switching.
- Keep the change bounded to the course-viewer surface.

### Alternatives considered
- Minimal patch on current split-preview state.
- Replace the path with `SecureVideoPlayer` plus a new shared wrapper.

### Why chosen
The unified preview model fixes the root UI/state mismatch with lower long-term complexity than patching special cases onto the existing split state.

### Consequences
- Slightly larger viewer refactor than a CSS-only fix.
- Full-frame video display may show letterboxing.
- Preview detail/header logic must become media-type aware.

### Follow-ups
- Consider whether `PptxViewer` itself also needs fullscreen-related state hardening after the immediate bug-fix lands.
- If similar preview logic exists elsewhere, consider extracting a reusable media-session helper only after this bug-fix proves the pattern.

## Available-Agent-Types Roster
Relevant available roles for execution/verification:
- `executor` — main implementation in viewer components
- `architect` — targeted review of state model and fullscreen event flow
- `debugger` — root-cause confirmation if native fullscreen behavior differs in runtime
- `test-engineer` — test design and regression coverage
- `verifier` — final validation of acceptance criteria and evidence
- `code-reviewer` — optional higher-rigor review before merge
- `explore` — quick repo lookup for adjacent viewer logic

## Follow-up Staffing Guidance
### Recommended `$ralph` path
- **Lane 1:** `executor` (high) — implement unified preview model + media session persistence in `CourseViewer.tsx`.
- **Lane 2:** `executor` or `debugger` (medium/high, sequential follow-up) — patch `PdfViewer.tsx` resize/page-retention logic and validate fullscreen event assumptions.
- **Lane 3:** `test-engineer` (medium) — add targeted tests and manual verification checklist.
- **Lane 4:** `verifier` (high) — run lint/typecheck/tests and manually confirm both fullscreen entry paths.

Why Ralph: the change touches a small number of tightly coupled files (`CourseViewer.tsx`, `PdfViewer.tsx`) and benefits from one owner preserving state-model coherence.

### Optional `$team` path
- **Worker A:** `executor` (high) — owns `src/feature/course/CourseViewer.tsx` unified preview + fullscreen/session changes.
- **Worker B:** `executor` or `debugger` (medium/high) — owns `src/feature/course/PdfViewer.tsx` page-retention adjustments and fullscreen/resize diagnostics.
- **Worker C:** `test-engineer` (medium) — owns viewer regression tests and verification scripts/checklist.
- **Leader follow-up:** `verifier` (high) — integrates evidence and checks acceptance criteria after workers finish.

Why Team: only worthwhile if native fullscreen behavior proves flaky enough that `PdfViewer` and `CourseViewer` debugging can proceed in parallel.

## Launch Hints
### Ralph
- `$ralph .omx/plans/prd-media-playback-bugs-<timestamp>.md`

### Team
- `$team .omx/plans/prd-media-playback-bugs-<timestamp>.md`
- `omx team run .omx/plans/prd-media-playback-bugs-<timestamp>.md`

## Team Verification Path
Before team shutdown:
1. Worker A demonstrates shared preview region and custom fullscreen state retention.
2. Worker B demonstrates PDF page retention on fullscreen/resize transitions.
3. Worker C demonstrates automated regression coverage and any manual-check harness notes.
4. Leader/verifier reruns `pnpm lint`, `pnpm typecheck`, `pnpm test:run`, then manually validates both fullscreen entry paths on one representative course.
5. If team hands off to Ralph afterward, Ralph’s only job is final fix-loop verification against the acceptance criteria, not replanning.
