# Test Spec — media-playback-bugs

## Scope
Validate the approved PRD in `.omx/plans/prd-media-playback-bugs.md` for the course viewer media-preview regressions.

## Target files / surfaces
- `src/feature/course/CourseViewer.tsx`
- `src/feature/course/PdfViewer.tsx`
- any new focused tests under `src/feature/course/` or adjacent route/page tests

## Test strategy
Use a mixed strategy:
1. **Targeted automated regression tests** for deterministic state transitions.
2. **Manual browser verification** for fullscreen APIs and native media-control behavior that jsdom does not fully emulate.

## Automated tests
### A. CourseViewer preview-selection regression
**Goal:** prove that, in PPT layout, image/video share the same main preview area.
- Arrange a course fixture with at least one PPT, one video, and one image.
- Render the viewer in PPT layout.
- Trigger media selection via the same path used by the left rail / hyperlink handler.
- Assert that selecting an image changes the main preview content and visible title/actions to the image, rather than leaving video as the active main preview.
- Assert that the old dedicated image-only card is absent or no longer required for successful image viewing.

### B. Video progress persistence regression
**Goal:** prove that switching away from a video and back restores saved time.
- Mock `HTMLMediaElement.currentTime`, `play`, and related media APIs.
- Set video progress to a non-zero time.
- Switch preview to an image, then back to the same video.
- Assert that the video restore path uses the prior time for that media id instead of resetting to 0.
- Scope note: this regression only requires playback-position continuity (`currentTime`), not a stronger guarantee about paused/playing intent unless the implementation preserves that naturally.

### C. Fullscreen exit state regression (component-level where feasible)
**Goal:** prove fullscreen enter/exit keeps selected media and saved progress.
- Mock fullscreen APIs/events enough to simulate page-button fullscreen transitions.
- Assert that exiting fullscreen does not clear active preview selection or saved playback position.
- If native fullscreen cannot be reliably emulated in jsdom, cover page-button behavior automatically and mark native fullscreen for manual verification.

### D. PdfViewer resize/page-retention regression
**Goal:** prove that resize no longer forces page 1 after page navigation while URL/document changes still reset intentionally.
- Prefer a focused test around extracted resize/page-preservation logic if direct `react-pdf` component testing is too brittle.
- At minimum, verify that after the viewer reaches page N, a resize event does not blindly reset `currentPage` to 1.
- Preserve separate coverage for intentional navigation through `goToPage`.
- Add one assertion (or helper-level test) that document/url changes still reset page state intentionally, so the resize fix does not remove legitimate reset behavior.

## Manual verification matrix
### Environment prep
- Start the app locally.
- Open a course that uses PPT + linked media.
- If possible, choose one course path that renders PPT through PDF fallback and one that renders through PPTX directly.

### Scenario 1 — Page-button fullscreen crop fix
1. Open a linked video in the main preview.
2. Click the page fullscreen button.
3. Confirm the full video frame is visible; no left/right crop.
4. Press `Esc`.
5. Confirm same PPT page, same media, same playback time.

### Scenario 2 — Native video-control fullscreen
1. Open the same or another linked video.
2. Enter fullscreen using the native video-control fullscreen affordance.
3. Press `Esc`.
4. Confirm same PPT page, same media, same playback time.

### Scenario 3 — Image shares main preview area
1. Open a linked image from the PPT or left rail.
2. Confirm the image occupies the main preview area used by video.
3. Confirm the UI does not require a separate image card to see the image.

### Scenario 4 — Media switch preserves per-video progress
1. Play a video to a recognizable timestamp (for example 00:20).
2. Switch to an image.
3. Switch back to the same video.
4. Confirm resume near 00:20.

### Scenario 5 — PDF-backed PPT page retention
1. Navigate a PDF-backed deck to a non-first page.
2. Open linked media and enter/exit fullscreen.
3. Confirm the deck stays on the same page after exit.
4. Resize the window or cross an orientation breakpoint if practical.
5. Confirm the deck still preserves the current logical page instead of snapping to page 1.

## Verification commands
- `npm run test:run`
- `npm run typecheck`
- `npm run build`
- `npm run lint`

## Exit criteria
All of the following must hold before execution is considered complete:
1. Automated regression coverage exists for the main state transitions that are practical in Vitest/jsdom.
2. Manual verification passes for both fullscreen entry paths.
3. Manual verification passes for at least one PDF fallback deck; if a PPTX-direct deck exists, that path also passes.
4. No acceptance criterion from the PRD remains unproven.

## Known testability constraints
- Native fullscreen behavior is not fully trustworthy in jsdom, so browser manual verification is mandatory.
- `react-pdf` may be cumbersome to test end-to-end in unit tests; helper extraction or selective mocking is acceptable if it makes page-retention logic concretely testable.
