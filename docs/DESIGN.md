<!-- Arsitektur sistem, database schema, dan API design -->

# DESIGN - Design System Reference & Implementation

> **IMPORTANT STRUCTURE:**
> - **Part 1 (Lines 1-287):** Apple Design System - Reference & Inspiration for web version
> - **Part 2 (Lines 288+):** Mobile-First Implementation - Primary guidelines for this project
> 
> Both desktop (Apple-inspired) and mobile (priority) are equally important.
> Mobile-first development approach, but desktop experience must be polished.

---

# PART 1: APPLE DESIGN SYSTEM REFERENCE
*This section documents Apple's design language as inspiration for the web/desktop version*


## Overview

Apple's web presence is a masterclass in **reverent product photography framed by near-invisible UI**. Every page is a stack of edge-to-edge product "tiles" â€” alternating light and dark canvases, each centered on a hero headline, a one-line tagline, two tiny blue pill CTAs, and an impossibly crisp product render. Nothing competes with the product. Typography is confident but quiet; color is either pure white, an off-white parchment, or a near-black tile; interactive elements are a single, quiet blue.

Density is unusually low even by contemporary SaaS standards. Each tile occupies roughly one viewport, and there is no decorative chrome â€” no borders, no gradients, no decorative frames, no shadows on headlines. Elevation appears only when a product image rests on a surface (a single soft `rgba(0, 0, 0, 0.22) 3px 5px 30px` drop for visual weight). The result is a catalog that feels more like a museum gallery: the wall disappears and the artifact takes over.

Store and shop surfaces retain the same chassis but switch modes. The product configurator (iPhone 17 Pro, accessories grid) introduces a tight grid of white utility cards at `{rounded.lg}` (18px) radius with a thin border, paired with a persistent thin sub-nav strip. The environment page leans darker and more editorial. Across all five surfaces the typographic system, spacing rhythm, and the single blue accent are consistent â€” this is one design language expressed at different volumes.

**Key Characteristics:**
- Photography-first presentation; UI recedes so the product can speak.
- Alternating full-bleed tile sections: white/parchment â†” near-black, with the color change itself acting as the section divider.
- Single blue accent (`{colors.primary}` â€” #56C1CD) carries every interactive element. No second brand color exists.
- Two button grammars: tiny blue pill CTAs (`{rounded.pill}`) and compact utility rects (`{rounded.sm}`).
- SF Pro Display + SF Pro Text â€” negative letter-spacing at display sizes for the signature "Apple tight" headline feel.
- Whisper-soft elevation used only when a product image needs to breathe â€” exactly one drop-shadow in the entire system.
- Tight two-row nav: slim `{component.global-nav}` + product-specific `{component.sub-nav-frosted}` with persistent right-aligned primary CTA.
- Section rhythm across multiple pages: light hero â†’ dark product tile â†’ light utility tile â†’ dark tile â†’ parchment footer â€” a predictable pulse.

## Colors

> **Source pages analyzed:** homepage, environment, store, iPhone 17 Pro buy page, accessories index. The color system is identical across all five surfaces; only the surface-mode mix differs.

### Brand & Accent
- **Action Tosca** (`{colors.primary}` â€” #56C1CD): The single brand-level interactive color. All text links, all blue pill CTAs ("Learn more", "Buy"), and the focus ring root. This is Apple's quiet but universal "click me" signal. Press state shifts to a slightly darker variant via the active scale transform rather than a hex change.
- **Focus Blue** (`{colors.primary-focus}` â€” #56C1CD): A marginally brighter sibling of Action Tosca, reserved for the keyboard focus ring on buttons (`outline: 2px solid`).
- **Sky Link Blue** (`{colors.primary-on-dark}` â€” #56C1CD): A brighter blue used on dark surfaces for in-copy links and inline callouts, where Action Tosca would disappear against the tile background.

### Surface
- **Pure White** (`{colors.canvas}` â€” #ffffff): The dominant canvas. Content, utility cards, store tiles, configurator grids.
- **Parchment** (`{colors.canvas-parchment}` â€” #f5f5f7): The signature Apple off-white. Used for alternating light tiles, footer region, and the default page canvas in store utility sections. Just different enough from white to create rhythm.
- **Pearl Button** (`{colors.surface-pearl}` â€” #fafafc): A near-white used as the fill for secondary "ghost" buttons â€” lighter than the parchment canvas so the button still reads as a button against `{colors.canvas-parchment}`.
- **Near-Black Tile 1** (`{colors.surface-tile-1}` â€” #002530): The primary dark-tile surface on the homepage product grid.
- **Near-Black Tile 2** (`{colors.surface-tile-2}` â€” #002530): A micro-step lighter â€” used where a dark tile sits directly above or below Tile 1 to create the faintest separation.
- **Near-Black Tile 3** (`{colors.surface-tile-3}` â€” #0A4D58): A micro-step darker â€” used at the bottom of the stack and in embedded video/player frames.
- **Pure Black** (`{colors.surface-black}` â€” #000000): Reserved for true void â€” video player backgrounds, edge-to-edge photographic overlays, the global nav bar background.
- **Translucent Chip Gray** (`{colors.surface-chip-translucent}` â€” #d2d2d7): The base hex of the translucent gray chip used over photography for circular control buttons. In production, applied at ~64% alpha as `rgba(210, 210, 215, 0.64)`.

### Text
- **Near-Black Ink** (`{colors.ink}` â€” #1d1d1f): The voice of every headline, every body paragraph, and the dark utility button's fill. Chosen instead of pure black to keep the page feeling photographic rather than printed.
- **Body** (`{colors.body}` â€” #1d1d1f): Same hex as ink â€” Apple uses one near-black tone for all text on light surfaces.
- **Body On Dark** (`{colors.body-on-dark}` â€” #ffffff): All text on dark tiles and on the global nav bar.
- **Body Muted** (`{colors.body-muted}` â€” #cccccc): Secondary copy on dark tiles where pure white would be too loud.
- **Ink Muted 80** (`{colors.ink-muted-80}` â€” #333333): Body text on the white Pearl Button surface â€” slightly softer than pure black.
- **Ink Muted 48** (`{colors.ink-muted-48}` â€” #7a7a7a): Disabled button text and legal fine-print.

### Hairlines & Borders
- **Divider Soft** (`{colors.divider-soft}` â€” #f0f0f0): The "border" tone on secondary buttons â€” functions as a ring shadow rather than a hard line. In production, often applied as `rgba(0, 0, 0, 0.04)`.
- **Hairline** (`{colors.hairline}` â€” #e0e0e0): The 1px hairline border on store utility cards and configurator chips.

### Brand Gradient
**No decorative gradients.** Atmospheric depth on product photography (the iPhone 17 Pro camera plate, the Apple Watch bands, AirPods reflections) is inherent to the imagery, not a CSS gradient overlay. The environment page's hero uses photographic atmosphere (mountain vista at dawn) but no gradient tokens are defined. Apple is the rare luxury-brand site with zero gradient-based design tokens.

## Typography

### Font Family
- **Display**: `SF Pro Display, system-ui, -apple-system, sans-serif` â€” Apple's proprietary display face, optimized for sizes â‰¥ 19px. Defines the voice of every headline.
- **Body / UI**: `SF Pro Text, system-ui, -apple-system, sans-serif` â€” the text-optimized variant used for body copy, captions, buttons, and links below 20px.
- **OpenType features**: `font-variant-numeric: numerator` is enabled on numeric links (pricing tables, spec sheets). Display sizes rely on tight tracking rather than contextual ligatures.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 56px | 600 | 1.07 | -0.28px | Hero headline; the signature "Apple tight" tracking |
| `{typography.display-lg}` | 40px | 600 | 1.10 | 0 | Tile headlines atop every product tile |
| `{typography.display-md}` | 34px | 600 | 1.47 | -0.374px | Section heads (SF Pro Text at display proportions) |
| `{typography.lead}` | 28px | 400 | 1.14 | 0.196px | Product tile subcopy |
| `{typography.lead-airy}` | 24px | 300 | 1.5 | 0 | Environment-page lead paragraphs (the rare weight 300) |
| `{typography.tagline}` | 21px | 600 | 1.19 | 0.231px | Sub-tile tagline; sub-nav category name |
| `{typography.body-strong}` | 17px | 600 | 1.24 | -0.374px | Inline strong emphasis |
| `{typography.body}` | 17px | 400 | 1.47 | -0.374px | Default paragraph |
| `{typography.dense-link}` | 17px | 400 | 2.41 | 0 | Footer / store utility link lists (relaxed leading) |
| `{typography.caption}` | 14px | 400 | 1.43 | -0.224px | Secondary captions, button text |
| `{typography.caption-strong}` | 14px | 600 | 1.29 | -0.224px | Emphasized captions |
| `{typography.button-large}` | 18px | 300 | 1.0 | 0 | Store hero CTAs (the rare weight 300) |
| `{typography.button-utility}` | 14px | 400 | 1.29 | -0.224px | Utility/nav button labels |
| `{typography.fine-print}` | 12px | 400 | 1.0 | -0.12px | Fine-print, footer body |
| `{typography.micro-legal}` | 10px | 400 | 1.3 | -0.08px | Micro legal disclaimers |
| `{typography.nav-link}` | 12px | 400 | 1.0 | -0.12px | Global nav menu items |

### Principles

- **Negative letter-spacing at display sizes.** Every headline at 17px and up carries a slight tracking tighten (`-0.12 â†’ -0.374px`). This produces the iconic "Apple tight" headline cadence. Never used at 12px or below.
- **Body copy at 17px, not 16px.** Apple breaks the SaaS convention and runs paragraph text at 17px. The extra pixel gives the page an unmistakable "reading, not scanning" pace.
- **Weight 300 is real and rare.** Used deliberately on a handful of large-size reads (`{typography.button-large}` at 18px/300 and `{typography.lead-airy}` at 24px/300). It's not an accident â€” it's a light-atmosphere cue reserved for moments where the content should feel airy.
- **Weight 600, not 700, for headlines.** Apple's headlines sit at weight 600. Weight 700 is used sparingly for `{typography.tagline}` (21px) when a touch more assertion is needed.
- **Line-height is context-specific.** Display sizes use 1.07â€“1.19 (tight). Body uses 1.47. Utility link stacks in the footer/store use an unusually relaxed 2.41 (`{typography.dense-link}`). The 2.41 is not a bug â€” it's how the footer's dense link columns breathe.
- **Weight 500 is deliberately absent.** The ladder is 300 / 400 / 600 / 700. Mid-weight readings always use 600.

### Note on Font Substitutes
SF Pro is Apple's proprietary system font. When building off-system:

- Use `system-ui, -apple-system, BlinkMacSystemFont` as the first stack entry â€” on macOS/iOS/Safari this resolves to the real SF Pro.
- For non-Apple platforms, **Inter** (Google Fonts, variable) is the closest open-source equivalent. Inter at weight 600 with `font-feature-settings: "ss03"` approximates SF Pro's rounded "a" character.
- Nudge `letter-spacing` down by `-0.01em` on display sizes to re-create the Apple tight feel; Inter's default tracking runs slightly wider than SF Pro.
- For body text, tighten line-height by `0.03` (from 1.47 â†’ 1.44) when substituting Inter â€” Inter's taller x-height needs less leading.

## Layout

### Spacing System
- **Base unit:** 8px. Sub-base values (2, 4, 5, 6, 7) are used for tight typographic adjustments; structural layout snaps to 8/12/16/20/24.
- **Tokens:** `{spacing.xxs}` 4px Â· `{spacing.xs}` 8px Â· `{spacing.sm}` 12px Â· `{spacing.md}` 17px Â· `{spacing.lg}` 24px Â· `{spacing.xl}` 32px Â· `{spacing.xxl}` 48px Â· `{spacing.section}` 80px.
- **Section vertical padding:** `{spacing.section}` (80px) inside a product tile; tiles stack edge-to-edge with 0 gap (the color change provides the break).
- **Card padding:** `{spacing.lg}` (24px) inside utility grid cards.
- **Button padding:** 8â€“11px vertical, 15â€“22px horizontal.
- **Universal rhythm constants:** the 17px body line-height multiplier (~25px line) and 21px tagline size show up on every analyzed page.

### Grid & Container
- **Max content width:** ~980px on text-heavy sections (environment), ~1440px on product grids (store, accessories), full-bleed for product tiles (homepage).
- **Column patterns:** 3 to 5 column utility card grid on store/accessories; 2-column side-by-side tiles on homepage occasional sections; single-column centered stack on product tile heroes.
- **Gutters:** 20â€“24px between cards in a utility grid.

### Whitespace Philosophy
Apple's whitespace is the product's pedestal. Every tile begins with at least 64px of air above its headline and 48â€“64px below. Product renders are never crowded; the nearest content to a product image is at least 40px away. The footer is the only area that breaks this â€” there, Apple goes deliberately dense to make the full information architecture visible at a glance.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Full-bleed tiles, global nav, footer, body sections |
| Soft hairline | 1px `rgba(0, 0, 0, 0.08)` border | Utility cards, sub-nav frosted-glass separator |
| Backdrop blur | `backdrop-filter: blur(N)` on Parchment 80% | Sub-nav and the iPhone buy floating sticky bar |
| Product shadow | `rgba(0, 0, 0, 0.22) 3px 5px 30px 0` | Product renders resting on a surface (the only true "shadow" in the system) |

**Shadow philosophy.** Apple uses **exactly one** drop-shadow, and it is applied to photographic product imagery â€” never to cards, never to buttons, never to text. Elevation in the UI comes from (a) surface-color change (light tile â†” dark tile) and (b) backdrop-blur on sticky bars. The single shadow is about giving the product weight, not about UI hierarchy.

### Decorative Depth
- **Atmospheric imagery** on the environment page (photographic vista) supplies mood; no CSS gradient involved.
- **Edge-to-edge tile alternation** creates rhythm without borders or shadows â€” the color change itself is the divider.
- **Backdrop-filter blur** on `{component.sub-nav-frosted}` and `{component.floating-sticky-bar}` creates a "floating over content" effect that's functional, not decorative.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed product tiles (no corner rounding) |
| `{rounded.xs}` | 5px | Inline links when styled as subtle chips (rare) |
| `{rounded.sm}` | 8px | Dark utility buttons (Sign In, Bag), inline card imagery |
| `{rounded.md}` | 11px | White Pearl Button capsules |
| `{rounded.lg}` | 18px | Store utility cards, accessories grid cards |
| `{rounded.pill}` | 9999px | Primary blue pill CTAs, sub-nav buy button, configurator option chips, search input â€” the signature Apple pill |
| `{rounded.full}` | 9999px / 50% | Circular control chips floating over photography |

### Photography Geometry
- **Hero imagery**: full-bleed, 21:9 or taller on the homepage; 16:9 on environment and shop pages. Product renders are photographic-realistic, often shot on a tinted surface that becomes the tile background.
- **Product renders**: PNG/WebP with transparency; rest on a surface tile and pick up the system shadow.
- **Accessory grid**: square 1:1 crops at `{rounded.lg}` (18px) radius, light neutral backgrounds, product centered with 20â€“40px internal padding.
- **No rounded imagery in hero tiles** â€” images are full-bleed rectangular. Rounding (`{rounded.sm}`, `{rounded.lg}`) appears only on inline card imagery.
- Lazy-loading via responsive `srcset` and `sizes` across all breakpoints; CDN-optimized WebP.

## Components

### Top Navigation

**`global-nav`** â€” Persistent, ultra-thin black nav bar pinned to the top of every page. Background `{colors.surface-black}`, height 44px, text `{colors.on-dark}` in `{typography.nav-link}` (12px / 400 / -0.12px tracking). Links are quiet, spaced ~20px apart, running edge-to-edge across the top. Right-aligned cluster: Search, Bag icons â€” always visible. On mobile, collapses to hamburger at ~834px and the Apple logo centers.

**`sub-nav-frosted`** â€” Surface-specific nav that sticks below the global nav. Background `{colors.canvas-parchment}` at 80% opacity with backdrop-filter blur, creating a frosted-glass effect. Height 52px. Content on left: product category name ("iPhone", "Store", "Accessories") in `{typography.tagline}` (21px / 600). Content right: inline nav links in `{typography.button-utility}` (14px), ending in a persistent `{component.button-primary}` ("Buy") or a utility link.

### Buttons

**`button-primary`** â€” The signature Apple action. Background `{colors.primary}` (Action Tosca #56C1CD), text `{colors.on-primary}` in `{typography.body}` (SF Pro Text 17px / 400), rounded `{rounded.pill}` (full pill â€” capsule-shaped), padding 11px Ã— 22px. The full-pill radius IS the brand action signal.
- Active state: `{component.button-primary-active}` â€” `transform: scale(0.95)` (the system-wide micro-interaction).
- Focus state: `{component.button-primary-focus}` â€” 2px solid `{colors.primary-focus}` outline.

**`button-secondary-pill`** â€” Used as the second CTA when two blue pills appear together ("Learn more" / "Buy"). Background transparent, text `{colors.primary}`, 1px solid `{colors.primary}` border, rounded `{rounded.pill}`, padding 11px Ã— 22px. Reads as a "ghost pill."

**`button-dark-utility`** â€” Global nav actions (Sign In, Bag, language selector). Background `{colors.ink}` (#1d1d1f), text `{colors.on-dark}` in `{typography.button-utility}` (14px / 400 / -0.224px tracking), rounded `{rounded.sm}` (8px), padding 8px Ã— 15px. Active state shrinks via `transform: scale(0.95)`.

**`button-pearl-capsule`** â€” Product-card secondary button. Background `{colors.surface-pearl}` (#fafafc), text `{colors.ink-muted-80}` in `{typography.caption}` (14px), 3px solid `{colors.divider-soft}` border (functions as a soft ring rather than a visible line), rounded `{rounded.md}` (11px), padding 8px Ã— 14px.

**`button-store-hero`** â€” A larger primary CTA used on store hero surfaces. Same Action Tosca + Paper White as `{component.button-primary}`, but with `{typography.button-large}` (18px / 300 â€” note the rare weight 300) and slightly more padding (14px Ã— 28px). Used sparingly on the store landing.

**`button-icon-circular`** â€” Floats over photography. 44 Ã— 44px, background `{colors.surface-chip-translucent}` at ~64% alpha, icon in `{colors.ink}`, rounded `{rounded.full}`. Used for carousel controls, close buttons, and in-image controls (product image thumbnails on the iPhone buy page).

**`text-link`** â€” Inline body links in `{colors.primary}` (Action Tosca). Underlined or non-underlined per context.

**`text-link-on-dark`** â€” Inline body links on dark tiles in `{colors.primary-on-dark}` (Sky Link Blue #56C1CD) â€” Action Tosca would disappear against `{colors.surface-tile-1}`.

### Cards & Containers

**`product-tile-light`** â€” Full-bleed light tile. Background `{colors.canvas}` (white), text `{colors.ink}`, rounded `{rounded.none}` (0 â€” tiles touch edges), vertical padding `{spacing.section}` (80px). Centered stack: product name in `{typography.display-lg}` (40px / 600) â†’ one-line tagline in `{typography.lead}` (28px / 400) â†’ two `{component.button-primary}` CTAs ("Learn more" / "Buy") â†’ product render resting on the surface with the system shadow.

**`product-tile-parchment`** â€” Same as `{component.product-tile-light}` but on `{colors.canvas-parchment}` (#f5f5f7). Used to break two consecutive white tiles.

**`product-tile-dark`** â€” Full-bleed dark tile. Background `{colors.surface-tile-1}` (#002530), text `{colors.on-dark}`, rounded `{rounded.none}`, vertical padding `{spacing.section}` (80px). Same content stack as the light tile but with `{component.text-link-on-dark}` for inline copy and `{component.button-primary}` (Action Tosca still works on the dark surface). Used on the homepage product grid as the alternating dark band.

**`product-tile-dark-2`** â€” Variant on `{colors.surface-tile-2}` (#002530). Used where a dark tile sits directly above or below `{component.product-tile-dark}` to create the faintest separation through micro-step lightness change.

**`product-tile-dark-3`** â€” Variant on `{colors.surface-tile-3}` (#0A4D58). Used at the bottom of the stack and in embedded video/player frames.

**`store-utility-card`** â€” Used in store grid and accessories grid. Background `{colors.canvas}` (white), 1px solid `{colors.hairline}` border, rounded `{rounded.lg}` (18px), padding `{spacing.lg}` (24px). Top: product image (1:1 crop with `{rounded.sm}` (8px) inner image radius). Below: product name in `{typography.body-strong}` (17px / 600), price in `{typography.body}` (17px / 400), and a `{component.text-link}` ("Buy" or "Learn more"). No shadow by default; product render itself carries the system product-shadow.

**`configurator-option-chip`** â€” Pill-shaped tappable cell used in the iPhone 17 Pro buy page. Background `{colors.canvas}`, text `{colors.ink}` in `{typography.caption}`, rounded `{rounded.pill}`, padding 12px Ã— 16px. Contains a small product thumbnail + label + price delta. Arranged in a grid of 4â€“5 options per row.

**`configurator-option-chip-selected`** â€” Selected state. Border upgrades to 2px solid `{colors.primary-focus}`. Same shape, same content.

**`environment-quote-card`** â€” A photographic-canvas hero specific to the environment page. Dark photographic backdrop (mountain vista at dawn) with `{colors.surface-tile-1}` as the fallback color, centered white-text headline in `{typography.display-lg}` (40px), small green "Apple 2030" pictographic logo above the headline, single `{component.button-primary}` below. Padding `{spacing.section}` (80px).

**`floating-sticky-bar`** â€” Floats at the bottom of the viewport on the iPhone 17 Pro buy page during scroll. Background `{colors.canvas-parchment}` at 80% opacity with `backdrop-filter: blur(N)`, height 64px, padding 12px Ã— 32px. Left: running price total in `{typography.body}`. Right: `{component.button-primary}` ("Add to Bag").

### Inputs & Forms

**`search-input`** â€” The accessories search input. Background `{colors.canvas}`, text `{colors.ink}` in `{typography.body}` (17px), 1px solid `rgba(0, 0, 0, 0.08)` border, rounded `{rounded.pill}` (full pill â€” search is also pill-shaped, matching the CTA grammar), padding 12px Ã— 20px, height 44px. Leading icon: search glyph at 14px, muted tint.

Error and validation states were not surfaced in the analyzed pages.

### Footer

**`footer`** â€” Background `{colors.canvas-parchment}` (#f5f5f7), text `{colors.ink-muted-80}`. Link columns in `{typography.dense-link}` (17px / 400 / 2.41 line-height â€” the relaxed leading is what makes the dense columns scannable). Column headings in `{typography.caption-strong}` (14px / 600). Legal row at the very bottom in `{typography.fine-print}` (12px / 400) with `{colors.ink-muted-48}` text. Vertical padding 64px.

## Do's and Don'ts

### Do
- Use `{colors.primary}` (Action Tosca #56C1CD) for every interactive element â€” links, pill CTAs, focus signals â€” and nothing else. The single accent is non-negotiable.
- Set headlines in `{typography.hero-display}` or `{typography.display-lg}` with negative letter-spacing (`-0.28 â†’ -0.374px`) to get the signature "Apple tight" cadence.
- Run body copy at `{typography.body}` (17px / 400 / 1.47 / -0.374px) â€” not 16px. The extra pixel defines the brand's reading pace.
- Alternate `{component.product-tile-light}` (or parchment) and `{component.product-tile-dark}` for full-bleed section rhythm. The color change IS the divider.
- Reserve `{rounded.pill}` for the primary blue CTA and any other element that should read as an "action" (configurator chips, search input, sticky bar CTA).
- Apply the single product-shadow (`rgba(0, 0, 0, 0.22) 3px 5px 30px`) only to product renders resting on a surface â€” never on cards, buttons, or text.
- Use `transform: scale(0.95)` as the active/press state on every button â€” it's the system-wide micro-interaction.
- Keep the global nav `{colors.surface-black}` (true black) â€” it's the only place pure black appears on most pages.

### Don't
- Don't introduce a second accent color; every "click me" signal is `{colors.primary}` (Action Tosca).
- Don't add shadows to cards, buttons, or text â€” shadow is reserved for product imagery.
- Don't use gradients as decorative backgrounds; atmosphere comes from photography.
- Don't set body copy at weight 500 â€” Apple's ladder is 300 / 400 / 600 / 700, with 500 deliberately absent. Body is always 400; strong inline is 600; display is 600.
- Don't round full-bleed tiles â€” tiles are rectangular and edge-to-edge; the color change is the divider.
- Don't tighten line-height below 1.47 for body copy â€” the editorial leading is part of the brand.
- Don't mix radii grammars â€” use `{rounded.sm}` for compact utility, `{rounded.lg}` for utility cards, `{rounded.pill}` for pills, and nothing in between (except the rare `{rounded.md}` Pearl Button).
- Don't use `{colors.primary-on-dark}` (Sky Link Blue) on light surfaces â€” it's the dark-tile-only variant. Action Tosca is for light surfaces.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Small phone | â‰¤ 419px | Single-column tiles; sub-nav collapses to category name + primary CTA only; hero typography drops to 28px |
| Phone | 420â€“640px | Single-column stack; product renders scale to 80% of tile width; hero h1 drops to 34px |
| Large phone | 641â€“735px | Tiles transition to tighter padding (48px vertical vs 80px); fine-print wraps |
| Tablet portrait | 736â€“833px | Global nav collapses to hamburger; sub-nav hides category chips, keeps primary CTA |
| Tablet landscape | 834â€“1023px | Global nav returns fully expanded; 3-column utility grids become 2-column |
| Small desktop | 1024â€“1068px | Product tiles use 2/3 width with margin gutters; hero h1 stays at 40px |
| Desktop | 1069â€“1440px | Full layout; 4â€“5 column store grids; 1440px content max |
| Wide desktop | â‰¥ 1441px | Content locks at 1440px, margins absorb extra width |

The structural breakpoints that matter for agents: 1440px (content lock), 1068px (small-desktop), 833px (tablet landscape switch), 734px (tablet portrait), 640px (phone), 480px (small phone).

### Touch Targets
- Minimum 44 Ã— 44px. `{component.button-primary}` lands at ~44 Ã— 100px (with the full-pill radius making the visible hit area more generous than the label suggests).
- `{component.button-icon-circular}` is exactly 44 Ã— 44px.
- Global nav utility links are smaller (~32 Ã— 80px) â€” they deliberately sit at a tighter target because they're precision desktop actions, and the mobile hamburger replaces them at â‰¤ 833px.

### Collapsing Strategy
- **Global nav**: full horizontal link row on desktop â†’ collapses to Apple logo + hamburger + bag icon at 834px and below.
- **Sub-nav**: category name + inline links + primary CTA â†’ category name + primary CTA only at mobile; inline links move into a hamburger tray.
- **Product tiles**: stack from 2-column to 1-column at 834px; vertical padding tightens from 80px â†’ 48px at small-phone.
- **Utility grids** (store, accessories): 5-col â†’ 4-col (1440px) â†’ 3-col (1068px) â†’ 2-col (834px) â†’ 1-col (640px).
- **Hero typography**: `{typography.hero-display}` (56px) â†’ `{typography.display-lg}` (40px) at 1068px â†’ 34px at 640px â†’ 28px at 419px.

### Image Behavior
- All product imagery uses responsive `srcset` with breakpoint-matched crops.
- Hero photography may switch art direction at mobile (e.g., the environment page's vista crops to a taller aspect ratio on mobile, framing the subject differently).
- Product renders maintain their 1:1 or 4:3 aspect ratios across breakpoints; only scale changes.
- Lazy-loading is default; the above-fold hero loads eagerly.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key directly (`{component.product-tile-dark}`, `{component.search-input}`).
2. Variants of an existing component (`-active`, `-focus`, `-2`, `-3`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere â€” never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay SF Pro Display 600 with negative letter-spacing. Body stays SF Pro Text 400 at 17px. The boundary is unbreakable.
6. The single drop-shadow (`rgba(0, 0, 0, 0.22) 3px 5px 30px`) is reserved for product photography only.
7. When in doubt about emphasis: alternate surface (light â†’ dark tile) before adding chrome.

## Known Gaps

- Form validation and error states were not surfaced on the analyzed pages; only the neutral search input is documented.
- The homepage's embedded video/player frame uses `{colors.surface-black}`; interior player controls are not documented (they're a platform widget, not a web-design token).
- Some component imagery is dynamic (rotating product hero) and its specific copy varies per surface â€” component specs name the structure, not the rotating content.
- Dark-mode counterparts for store and accessories utility cards were not surfaced on the analyzed pages; the system documented is the daytime/light-dominant variant Apple ships by default.
- Atmospheric photography (environment page mountain vista) is a content asset, not a design token; the documented `{component.environment-quote-card}` describes the structural surface only.
- The exact backdrop-filter blur radius on `{component.sub-nav-frosted}` and `{component.floating-sticky-bar}` is platform-dependent; production CSS uses `saturate(180%) blur(20px)` as a typical baseline but the value isn't formalized as a token.

---

## Mobile-First Design Principles (Budidaya Udang Project)

> **CRITICAL**: This project is **mobile-first**. Petambak udang primarily use smartphones in the field, not laptops. Mobile experience is the highest priority, with desktop as a secondary enhancement.

### 1. Mobile-First Philosophy

**Target Device:** Smartphone (Android/iOS, 5.5" - 6.7" screens)
**Usage Context:** Petambak use the app while walking around ponds, often with one hand, sometimes in bright sunlight, potentially with wet/dirty hands.

**Design Priorities:**
1. **Touch-first** — All interactive elements minimum 44×44px
2. **Thumb-friendly** — Primary actions within thumb reach (bottom 60% of screen)
3. **Glanceable** — Key info visible without scrolling
4. **One-handed operation** — Navigation and core actions accessible with thumb
5. **Offline-resilient** — Core features work with poor/no connectivity (future: PWA)

---

### 2. Mobile Layout Rules

#### Spacing & Touch Targets
`css
/* Minimum touch target */
min-height: 44px;
min-width: 44px;

/* Mobile spacing (tighter than desktop) */
--mobile-padding: 16px;
--mobile-gap: 12px;

/* Bottom navigation height */
--bottom-nav-height: 64px;
`

#### Thumb Zones
- **Easy reach:** Bottom 40% of screen (0-320px from bottom)
- **Stretch reach:** Middle 30% (320-550px from bottom)
- **Hard reach:** Top 30% (550px+ from bottom)

**Action Placement:**
- Primary CTAs (e.g., "Catat Pakan") ? Bottom 40%
- Navigation ? Bottom nav bar (fixed)
- Secondary info ? Top 30%

---

### 3. Responsive Breakpoints

`css
/* Mobile-first approach */
/* Base styles = mobile (320px+) */

@media (min-width: 640px) {
  /* Large phones / small tablets */
}

@media (min-width: 768px) {
  /* Tablets portrait */
  /* Switch to 2-column layouts */
}

@media (min-width: 1024px) {
  /* Tablets landscape / small desktop */
  /* Introduce sidebar navigation */
}

@media (min-width: 1280px) {
  /* Desktop */
  /* Max-width containers, margins */
}
`

**Layout Transformations:**
- **Mobile (320-639px):** Single column, bottom nav, stacked cards
- **Tablet (640-1023px):** 2-column grids, side drawer nav
- **Desktop (1024px+):** Sidebar, 3-column grids, max-width 1280px

---

### 4. Typography (Mobile-First)

`css
/* Mobile base sizes (smaller than desktop) */
--mobile-h1: 28px;  /* vs 56px desktop */
--mobile-h2: 24px;  /* vs 40px desktop */
--mobile-body: 16px; /* vs 17px desktop */
--mobile-caption: 14px;

/* Line heights optimized for mobile reading */
--mobile-heading-lh: 1.2;
--mobile-body-lh: 1.5;
`

**Mobile Typography Rules:**
- Body text minimum 16px (never smaller)
- Headlines scale down on mobile (28px max for h1)
- Line-height increased for mobile (1.5 vs 1.47 desktop)
- Letter-spacing relaxed on mobile (+0.01em vs desktop)

---

### 5. Navigation Patterns

#### Mobile (= 640px)
**Bottom Navigation Bar** (fixed, always visible)
`
+---------------------+
¦                     ¦
¦   Content Area      ¦
¦                     ¦
¦                     ¦
+---------------------¦
¦ [??] [??] [??] [??] ¦ ? Bottom nav (64px height)
+---------------------+
`

**Nav Items:**
- Dashboard (Home icon)
- Kolam (Ponds icon)
- Logbook (Document icon)
- Profile (User icon)

#### Tablet/Desktop (= 1024px)
**Collapsible Sidebar** (left side, 240px width)

---

### 6. Component Adaptations

#### Cards
**Mobile:**
`css
.card-mobile {
  padding: 16px;
  border-radius: 12px;
  margin: 0 16px 12px;
}
`

**Desktop:**
`css
.card-desktop {
  padding: 24px;
  border-radius: 18px;
  margin: 0 0 24px;
}
`

#### Forms
**Mobile:**
- Stacked labels (above input)
- Full-width inputs
- Large inputs (min 48px height)
- Numeric keyboard for number fields

**Desktop:**
- Inline labels (left of input) where appropriate
- Constrained input widths
- Standard input height (40px)

#### Tables
**Mobile:**
- Convert to card list
- Hide non-essential columns
- Show detail on tap/expand

**Desktop:**
- Full table layout
- All columns visible
- Sortable headers

---

### 7. Performance (Mobile Priority)

**Mobile Network Constraints:**
- Assume 3G/4G with occasional drops
- Image optimization critical (WebP, lazy load)
- CSS/JS bundle < 200KB gzipped
- First Contentful Paint < 1.5s on 3G

**Optimization Checklist:**
- [ ] Images: WebP format, responsive srcset
- [ ] Fonts: Preload critical, subset to Latin + Indonesian
- [ ] JS: Code-split per route
- [ ] CSS: Critical CSS inline, defer non-critical
- [ ] API: Debounce requests, cache aggressively

---

### 8. Interaction Patterns

#### Touch Gestures
- **Tap:** Primary action
- **Long-press:** Secondary menu (e.g., edit/delete pond)
- **Swipe:** Navigate between tabs, dismiss items
- **Pull-to-refresh:** Reload data
- **No hover:** All interactions must work without hover states

#### Loading States
**Mobile:**
- Skeleton screens for fast perceived load
- Inline spinners (24px) for actions
- Pull-to-refresh indicator

#### Empty States
**Mobile:**
- Centered icon + message
- Large primary CTA (full-width button)
- Example: "Belum ada kolam. Tambah kolam pertama Anda."

---

### 9. Form Input Optimization

**Mobile-specific attributes:**
`html
<!-- Numeric input with mobile keyboard -->
<input type="number" inputmode="numeric" pattern="[0-9]*">

<!-- Email with @ keyboard -->
<input type="email" inputmode="email">

<!-- Search with search keyboard -->
<input type="search" inputmode="search">

<!-- Date picker (native mobile) -->
<input type="date">
`

**Autofocus:**
- Avoid on mobile (causes keyboard to pop up unexpectedly)
- Use only when explicitly requested (e.g., search page)

---

### 10. Accessibility (Mobile)

**Touch Targets:**
- Minimum 44×44px (iOS HIG / Android Material)
- Spacing between targets: minimum 8px

**Contrast:**
- Text minimum 4.5:1 (AA standard)
- Large text (=18px) minimum 3:1
- Test in bright sunlight (increase contrast if needed)

**Screen Readers:**
- All interactive elements have labels
- Images have alt text
- Forms have associated labels

---

### 11. Testing Checklist

**Mobile Devices to Test:**
- [ ] iPhone SE (small screen, 375px width)
- [ ] iPhone 14 (standard, 390px width)
- [ ] Android mid-range (Samsung A-series, 412px width)
- [ ] Android budget (small screen, 360px width)

**Desktop Sizes:**
- [ ] 1024px (small laptop)
- [ ] 1440px (standard desktop)
- [ ] 1920px (large desktop)

**Orientations:**
- [ ] Portrait (primary)
- [ ] Landscape (secondary, ensure usable)

---

### 12. Mobile-First Development Workflow

**CSS Approach:**
`css
/* 1. Write mobile styles first (base) */
.button {
  width: 100%;
  padding: 16px;
  font-size: 16px;
}

/* 2. Add desktop enhancements with min-width */
@media (min-width: 1024px) {
  .button {
    width: auto;
    padding: 12px 24px;
    font-size: 14px;
  }
}
`

**Component Development Order:**
1. Design mobile layout first
2. Implement mobile styles
3. Test on mobile device/emulator
4. Enhance for tablet
5. Enhance for desktop
6. Test all breakpoints

---

### 13. Key Differences from Apple Design System

**Apple (desktop-first):**
- Large hero images (full viewport)
- Generous whitespace (80px vertical padding)
- Fine typography (17px body, negative tracking)
- Hover states everywhere

**Budidaya Udang (mobile-first):**
- Compact layouts (16px padding mobile)
- Touch-friendly (44px minimum targets)
- Larger base font (16px mobile)
- No hover dependency
- Bottom navigation (thumb-friendly)
- Glanceable cards (key info above fold)

---

### 14. Mobile-Specific Features (Future)

**Phase 2+ Enhancements:**
- [ ] PWA (offline support, install prompt)
- [ ] Push notifications (feeding reminders)
- [ ] Camera integration (photo log)
- [ ] GPS tagging (pond location)
- [ ] Voice input (hands-free logging)
- [ ] Biometric auth (fingerprint/face)

---

## Implementation Priority

1. **Core mobile screens** (Dashboard, Add Pond, Log Feed)
2. **Bottom navigation**
3. **Touch-optimized forms**
4. **Responsive breakpoints**
5. **Desktop enhancements**
6. **Performance optimization**
7. **PWA features** (future)



