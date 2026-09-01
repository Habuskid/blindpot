---
name: Bureau Document System
colors:
  surface: '#fcf9f1'
  surface-dim: '#dcdad2'
  surface-bright: '#fcf9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f4eb'
  surface-container: '#f0eee6'
  surface-container-high: '#eae8e0'
  surface-container-highest: '#e4e2db'
  on-surface: '#1b1c17'
  on-surface-variant: '#47464b'
  inverse-surface: '#30312c'
  inverse-on-surface: '#f3f1e9'
  outline: '#78767b'
  outline-variant: '#c8c5cb'
  surface-tint: '#5f5e61'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1e'
  on-primary-container: '#858387'
  inverse-primary: '#c8c5ca'
  secondary: '#795919'
  on-secondary: '#ffffff'
  secondary-container: '#fdd185'
  on-secondary-container: '#785818'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#3f0300'
  on-tertiary-container: '#de5841'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e1e6'
  primary-fixed-dim: '#c8c5ca'
  on-primary-fixed: '#1b1b1e'
  on-primary-fixed-variant: '#47464a'
  secondary-fixed: '#ffdea9'
  secondary-fixed-dim: '#ebc076'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4100'
  tertiary-fixed: '#ffdad3'
  tertiary-fixed-dim: '#ffb4a6'
  on-tertiary-fixed: '#3f0300'
  on-tertiary-fixed-variant: '#8a1b0b'
  background: '#fcf9f1'
  on-background: '#1b1c17'
  surface-variant: '#e4e2db'
typography:
  headline-lg:
    fontFamily: IBM Plex Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: IBM Plex Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  value-mono:
    fontFamily: IBM Plex Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1'
  stamp-text:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  ledger-gap: 8px
---

## Brand & Style

This design system is rooted in **Print Brutalism**, drawing inspiration from declassified government dossiers, archival ledger books, and cold-war era bureaucracy. The aesthetic avoids the "playful" tropes of modern neubrutalism, opting instead for a raw, utilitarian, and high-stakes atmosphere.

The interface should feel physical—like ink on uncoated, recycled paper. It evokes a sense of urgency and confidentiality through the use of redaction marks, rubber stamps, and rigid structural hairlines. The user is positioned as an operative or an auditor, processing high-value data within a strict, uncompromising framework.

## Colors

The palette is strictly limited to mimic mechanical printing processes:

- **Paper (#EDEBE3):** The foundational surface. A cool, desaturated beige that suggests uncoated, low-grade photocopy stock.
- **Ink (#0F0F12):** Used for all structural elements, borders, and primary text. It should feel heavy and permanent.
- **Brass (#C9A15A):** A muted, metallic gold reserved exclusively for monetary success, prize values, and primary action triggers.
- **Oxide Red (#C1432E):** A flat, "rubber stamp" red used for status alerts, urgent indicators, and "DECRYPTED" markings.
- **Redaction Gray (#B7B3A6):** Used for inactive states and the background of encrypted/redacted data blocks.

## Typography

The system utilizes a dual-font strategy to balance mechanical precision with legibility.

- **IBM Plex Mono:** The "Operational" typeface. Used for headlines, data values, and stamps. Headlines must be set in **All Caps** with tight tracking to mimic typewriter headers. All numeric values must use **tabular figures** to ensure vertical alignment in ledger views.
- **IBM Plex Sans:** The "Informational" typeface. Used for long-form descriptions and body copy to ensure rapid scanning and readability.
- **Text Styling:** Avoid italics. Use bolding and underlining (1px) sparingly for emphasis.

## Layout & Spacing

The layout is governed by a **Fixed Ledger Grid**. It relies on visible structural lines rather than implied white space.

- **Grid Model:** A 12-column system for desktop, 4-column for mobile.
- **Visible Structure:** 1px ink hairlines (#0F0F12 at 20-40% opacity) should separate rows and columns, creating a "form" or "ledger" feel.
- **Label/Value Alignment:** Use a ledger-style alignment where labels are left-aligned and their corresponding values are right-aligned, connected by a dotted leader or a solid hairline.
- **Density:** High density. Elements should be packed efficiently to reflect the utilitarian nature of a dense document.

## Elevation & Depth

This system rejects soft shadows and blurs. Depth is achieved through **Hard Offsets**:

- **Hard-Edged Shadows:** Use solid `#0F0F12` offsets (e.g., `4px 4px` or `6px 6px`) with 0 blur. This creates a "cut-out" or "stacked paper" effect.
- **Tactile Interaction:** Buttons and interactive cards do not "glow." On hover, they may increase their shadow offset. On press (active), the element translates exactly by the shadow's offset (e.g., `translate(6px, 6px)`), making the shadow disappear as the element "meets" the paper.
- **Layering:** Use 2px solid ink borders to define all container boundaries.

## Shapes

The shape language is strictly **Geometric and Sharp**.

- **Corners:** 0px radius is the default for all containers, buttons, and input fields. A maximum of 2px may be used if required by specific technical rendering constraints to prevent "pixel-bleeding," but the visual intent is a perfect right angle.
- **Redaction Bars:** Rectangular blocks with sharp edges used to obscure text.
- **Stamps:** Angled containers (3-5 degree rotation) used for status badges like "DECRYPTED" or "URGENT."

## Components

### Buttons
- **Primary:** Brass background, Ink text, 2px solid Ink border. 6px hard shadow.
- **Secondary:** Paper background, Ink text, 2px solid Ink border. 4px hard shadow.
- **Action:** Sentence case for labels. On click, the button "sinks" into its shadow.

### Redaction & Reveal
- **Encrypted State:** Monetary values are covered by a solid Ink-Black bar. The width of the bar should be proportional to the estimated value.
- **Decryption Interaction:** On hover or click, the bar disappears. The value is displayed in Brass Mono digits, and a 1px-bordered Oxide Red "DECRYPTED" stamp appears at a slight angle nearby.

### Inputs & Ledger Rows
- **Fields:** 2px bottom-border only (ledger style) or a full 2px box.
- **Lists:** Every item is separated by a 1px horizontal rule. Alternate rows may have a very subtle tint of Redacted Gray (#B7B3A6 at 10% opacity) for row-tracking.

### Icons
- **Style:** 2px stroke weight, strictly geometric. No filled icons except for redaction bars.
- **Color:** Default to Ink. Use Oxide Red for critical warnings or delete actions.