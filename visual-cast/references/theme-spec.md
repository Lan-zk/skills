# Theme Spec

Use this file when selecting a visual direction or building theme tokens for Satori render trees.

## Shared Layout Rules

- Prefer fixed card widths and predictable padding.
- Keep typography hierarchy explicit: title, summary, tags, metrics.
- Reserve safe space for long Chinese text and mobile preview crops.
- Use rounded corners and consistent gaps.
- Avoid CSS that depends on browser layout engines beyond Satori support.

## glassmorphism

Use for premium, shareable standalone cards.

Visual traits:

- semi-transparent cards
- blurred or gradient-rich background
- layered highlights
- soft borders and subtle shadows

Recommended tokens:

- background: high-saturation gradient with blurred light blobs
- card fill: translucent white or neutral tint
- border: low-alpha white
- radius: 24-32
- shadow: soft multi-layer shadows

Layout guidance:

- works best for `single_cards`
- keep information density moderate
- emphasize title, summary, and colorful tags

## linear_vercel

Use for technical or developer-centric outputs.

Visual traits:

- dark background
- thin borders
- high-contrast text
- restrained accent colors

Recommended tokens:

- background: near-black or charcoal
- card fill: dark neutral panels
- border: subtle gray line
- radius: 16-20
- accent: cyan, white, muted green, or muted orange

Layout guidance:

- suitable for release notes, changelogs, GitHub trends, and metrics-heavy cards
- allow more room for monospace metrics
- keep ornamentation minimal

## bento_ui

Use for modular long images and dashboard-like summaries.

Visual traits:

- grouped blocks with different spans
- large rounded corners
- efficient whitespace usage
- strong sectioning

Recommended tokens:

- background: light neutral or soft gradient base
- modules: varied but related surface colors
- radius: 24-28
- grid gap: 16-24

Layout guidance:

- best fit for `merged_long_image`
- treat each normalized item as a block in a vertical or mixed grid stack
- vary module emphasis by title length, metric importance, or content type

## Theme Selection Heuristic

- default to `glassmorphism`
- choose `linear_vercel` for engineering audiences or dense technical content
- choose `bento_ui` for long-image aggregation and mixed-content digests

## Satori Compatibility Notes

- Prefer gradients, borders, spacing, and shadows that can be represented statically.
- Test blur-like effects early because support may differ from browser rendering.
- Do not rely on runtime animation or DOM measurement.
