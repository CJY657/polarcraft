---
name: Calcite experiment book
description: A tactile optics lesson printed into a small ochre book on a desk.
colors:
  cloth-ochre: "#d5a427"
  ink: "#28303a"
  accent: "#913e2c"
  paper: "#faf5e9"
  printed-paper: "#faf4e5"
  sage-mat: "#94a59c"
  wood: "#cec3af"
  ordinary-ray: "#3c819b"
  extraordinary-ray: "#b65032"
typography:
  body:
    fontFamily: "BookSerif, Noto Serif CJK SC, Georgia, serif"
    fontSize: "14px"
    lineHeight: 1.9
  title:
    fontFamily: "BookSerif, Noto Serif CJK SC, Georgia, serif"
    fontSize: "23px"
  control:
    fontFamily: "BookSerif, Noto Serif CJK SC, Georgia, serif"
    fontSize: "12px"
rounded:
  panel: "4px"
  contents: "8px"
  capsule: "30px"
components:
  open-book:
    backgroundColor: "rgba(250,245,233,.82)"
    textColor: "{colors.ink}"
    padding: "12px 24px"
  experiment-panel:
    backgroundColor: "#faf5e9ed"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "18px 17px 14px"
---

# Design System: Calcite experiment book

## Overview

**Creative North Star: "A small optics book on a quiet desk"**

The Every Joule reference informs the physical book composition: ochre cloth, warm paper, restrained printing, a sage desk mat and pale wood. The experiment rises from the right page; small HTML controls remain within easy reach. This document describes only the standalone preview in this directory, not PolarCraft's production design system.

**Key Characteristics:**
- A full-screen object with a readable printed interior.
- Seven short lessons progressing from electromagnetic waves, polarization and Brewster's angle to observation and explanation of calcite.
- A compact observation notebook, live polarization diagram, and progressive advanced controls.
- Local, procedural materials and restrained educational motion.

## Colors

Primary ochre belongs to the cover. The secondary rust accent marks instructions, selected controls and numerical outputs. Ink and the two paper tones support reading; sage and wood give the book a quiet setting. Blue and warm red distinguish the ordinary and extraordinary ray illustrations, reinforced by o/e labels and text.

**The Printed Contrast Rule.** Printed page and cover textures use unlit materials with tone mapping disabled, so scene illumination does not wash out their lettering. Keep the physical lighting on the surrounding objects.

## Typography

`BookSerif` is a local subset of Noto Serif CJK Regular, served from `assets/book-serif.woff2`; provenance and SIL Open Font License live beside it. The same serif stack is used for HTML and canvas printing, with synthesized weight for heavier headings. Canvas textures wait for font loading before their first draw.

Printed pages are authored at 1000 × 1400 pixels: lesson titles use 75 pixels, introductions 38, body text 31 and captions 29. These are texture coordinates, not CSS reading sizes. The HTML text view provides flowing, selectable lesson copy at the body size above; controls use compact labels and tabular numeric outputs.

## Layout

The orthographic Three.js scene fills the viewport. Desktop shows the opened spread, with explanation on the left and the crystal experiment on the right. A narrow control panel sits at the right edge; a centered navigation capsule remains near the bottom. The book starts closed with a direct opening action.

At widths of 700 pixels or less, the camera follows the right page. Controls become a two-column tray above the navigation; the top-right “阅读本页” action exposes the full lesson in an HTML panel (the closed-book label is “文字版”). This phone reading path is required because the spread is not legible at phone scale. At 1100 pixels or less the side panel narrows and the decorative credit disappears. The capsule respects the bottom safe area.

## Elevation & Depth

Book boards, stacked page edges, a ribbon, transparent crystal and a framed analyzer provide actual scene depth. In the foundation lessons, tubular mesh strokes and translucent ribbons replace one-pixel WebGL curves; the polarization assembly rotates as one coordinate system so its receiving plane stays perpendicular to propagation. A short eased lift reveals these diagrams from the paper after page changes. Procedural cloth and wood textures supply fine grain. Directional light and soft shadows anchor these objects to the desk; printed paper carries its own subtle gutter shading.

HTML panels use soft, low-opacity shadows. The navigation alone uses a translucent, blurred backing. Keep these controls subordinate to the book rather than turning them into a dashboard.

## Shapes

The book and printed diagrams use mostly straight edges. Small panel corners soften the overlays; circular icon targets sit within the long navigation capsule. Fine rules and borders belong to printed matter and control boundaries.

## Components

- **Book and lessons:** open, close, previous/next and a seven-entry contents menu. Titles, current-page state and counts update with the active lesson. Page changes reset that lesson's controls; lesson six starts with the analyzer inserted. Each spread has three automatically checked observation tasks and an extended reading view.
- **Foundation diagrams:** the first spread raises two perpendicular, translucent field curtains from the page. Mesh strokes, sampled E/B arrows, a wavelength dimension and traveling light markers make the propagation direction and field relationship legible at book scale. The second turns the same Ex/Ey amplitude and phase parameters into a spatial polarization ribbon, two component curves and a tilted receiving screen with a live endpoint trace and rotating field vector. Dragging the canvas rotates the complete polarization assembly with bounded pitch, preserving the receiver's perpendicular relationship to propagation; reset restores its default view. Five presets and live polarization classification, ψ and χ remain synchronized. Paper-colored halo labels keep annotations readable without covering the geometry in panels.
- **Brewster experiment:** the third spread places a transparent dielectric slab, normal, angular guides and three live ray paths in one draggable assembly. Incident angle and medium controls drive Snell's law and the Fresnel power reflectances; a dedicated action sets the exact θB. At that angle the reflected p marker disappears, the s marker remains, and a right-angle marker confirms perpendicular reflected and refracted rays. Water, glass and diamond use explicitly approximate visible-light indices.
- **Experiment controls:** drag the crystal or use its 0–180° native slider. Insert the analyzer, adjust its 0–180° slider, or select 0°/45°/90°. Progressive controls switch wavelength, natural/linear input, input polarization angle, 4–12 mm thickness, optical-axis alignment, and ray/axis layers. A reset button restores the lesson state; a separate collapse action returns more of the scene to the reader.
- **Live explanation:** intensity bars remain explicitly relative to total incident light. The polarization dial separates o/e reference directions from the analyzer transmission direction. Readouts show principal indices, walk-off angle and image separation; the observation sentence states the current result in plain Chinese.
- **Navigation:** labeled icon buttons, disabled boundary actions, page title/count and an animation pause toggle. Arrow keys turn pages outside inputs, buttons, selects and the text view.
- **Reading panel:** selectable lesson text, ideal-model explanation and current control values. Opening moves focus to its close button; closing returns focus to the trigger. Escape closes the reading panel and contents. This is a non-modal panel, not a focus-trapped dialog.
- **Accessibility and motion:** native inputs, visible focus outlines, live page announcements and text alternatives accompany the canvas. Reduced-motion preference opens/closes immediately, skips the page-turn leaf and foundation lift, and initially pauses traveling light dots and foundation wave motion. The manual pause affects those animations. It does not disable ordinary user-triggered book opening or the immediate diagram reveal.

**The Honest Model Rule.** Foundation spreads use ideal vacuum plane waves and two-component polarization synthesis; their screen scales and animation speed are explanatory, not physical-time or field-strength simulations. Handedness is explicitly tied to the receiver view and stated phase convention. The Brewster spread uses Snell's law and Fresnel power reflectances for non-absorbing isotropic media with n₁ = 1, and labels its visible-light indices as approximate. The page turn is a flat rotating leaf, not a deforming paper simulation. The calcite optics use near-normal incidence on parallel faces: the uniaxial index ellipsoid determines e-ray walk-off and Δx = t·tanδ, while outgoing rays remain parallel to the input. Natural and linear inputs use their respective polarization components before ideal Malus-law analysis. Along the optic axis, walk-off and image separation are zero. This is not an arbitrary-geometry ray tracer or a production integration.

## Do's and Don'ts

### Do:
- Do retain the readable printed textures and the complete HTML reading alternative.
- Do keep material detail quiet enough for the lesson and experiment to lead.
- Do preserve local asset loading and the explicit ideal-model labels.

### Don't:
- Don't describe the illustrative geometry as quantitative crystal ray tracing.
- Don't rely on ray color or the canvas alone to convey the lesson.
- Don't treat this preview's tokens or composition as a replacement for the root design system.
