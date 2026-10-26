# Calcite book preview

## Platform
Web. Standalone preview under `design-previews/calcite-book`, with no production integration.

## Purpose and scope
The user requested a calcite experiment for PolarCraft in the visual style of https://iamtechartist.github.io/every-joule-lesson1/, then asked to prepend light-nature, polarization-type and Brewster-angle demos to the same preview book. The audience is introductory optics learners. Production integration waits for explicit approval of this preview.

## Constraints
All deliverables stay in `design-previews`. Existing source, routes, services, and other previews remain intact. Use local assets and the existing Three.js version. Explain the idealized image-position and polarization model; this is not the full production ray solver.

## Evidence
`src/feature/devices/calcite-sim/optics.ts`, `calcite.ts`, `public/devices/calcite-case/index.html`, `src/feature/demos/unit0/ElectromagneticWaveDemo.tsx`, and `PolarizationTypesDemo.tsx`. Reference design inspected from its public HTML, styles, and live browser render. Existing simulations remain separate; this seven-lesson preview is standalone.
