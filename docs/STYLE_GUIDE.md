# ₿Quiz Live — Style Guide
> Two sections: **Website** (`docs/index.html` + `docs/styles.css` + `docs/script.js`) and **Quiz App** (`public/styles.css`, `public/index.html`, `public/host.html`).

---

## Color Palette

| Name | Variable | Hex | Used For |
|---|---|---|---|
| Electric Green | `--accent` | `#39ff14` | Logo, hero title "Bitcoin", links, step numbers, pre/code copied state, grid bg |
| Neon Orange | `--orange` | `#ff7700` | Section labels, NWC/LND titles, NWC/LND badge, step number circles |
| Electric Blue | `--blue` | `#4cc9f0` | Code block text, Características card text + modal text |
| Neon Purple | `--purple` | `#b044ff` | Nav links, "Cómo instalarlo" button, Características titles + modal titles, feature icon glow |
| Background | `--bg` | `#080b08` | Page background, demo card bg |
| Card | `--card` | `#0e1510` | All card backgrounds (demo, feature, ln-cards) |
| Border | `--border` | `#1a2e1c` | Default borders |
| Text | `--text` | `#dff5df` | Headings, NWC/LND body text, modal titles (non-feature) |
| Muted | `--muted` | `#8866cc` | Subtitles, footer text |

---

## Component Map

### Navigation Bar (`nav`)
| Element | Class | Color | Notes |
|---|---|---|---|
| Logo "₿Quiz Live" | `.nav-logo` | Green | Clickable — scrolls to top of page |
| "Live" in logo | `.nav-logo .live` | Green | Same as accent |
| Nav links | `.nav-links a` | Purple | Hover → white |
| Nav links hover | `.nav-links a:hover` | White | — |

---

### Hero Section
| Element | Class | Color | Notes |
|---|---|---|---|
| Badge "⚡ Open Source · GPL v3" | `.hero-badge` | Purple border + text | Pill shape |
| "Bitcoin" in h1 | `.hero h1 .bitcoin` | Orange with glow | — |
| Body paragraph | `.hero p` | Muted (purple-grey) | — |
| Primary button "Ver en GitHub" | `.btn-primary` | Green bg, dark text | Opens new tab |
| Secondary button "Cómo instalarlo" | `.btn-outline` | Purple border + text | Square corners |

---

### Hero Demo Cards wrapper (`demo-screen`)
| Element | Class | Color |
|---|---|---|
| Outer container glow | `.demo-screen` | Faded **purple** glow |

### Hero Demo Cards (Presentador, Jugadores, Tiempo Real, Recompensa)
| Element | Class | Color | Notes |
|---|---|---|---|
| Card border + glow | `.demo-card` | Faded green (always on) | — |
| Card hover | `.demo-card:hover` | Brighter green + lifts 3px + brightens | `filter: brightness(1.12)` |
| Icon | `.demo-card .icon` | Emoji | — |
| Title | `.demo-card strong` | White | — |
| Description | `.demo-card p` | Green (`rgba(57,255,20,.7)`) | — |
| **Modal glow** | JS `glowRgb` | Green (`57,255,20`) | — |
| **Modal title** | JS `titleColor` | White | — |
| **Modal text** | JS `textColor` | Green | — |

> Click any card → zooms into modal. Click outside or Esc to close.

---

### Características Cards (Features)
| Element | Class | Color | Notes |
|---|---|---|---|
| Card border + glow | `.feature` | Faded blue (always on) | — |
| Card hover | `.feature:hover` | Brighter blue + lifts 3px + brightens | `filter: brightness(1.12)` |
| Card active/click | `.feature:active` | Intense blue glow | — |
| Icon | `.feature .icon` | Emoji with purple drop-shadow glow | — |
| Title (h3) | `.feature h3` | Purple | — |
| Description | `.feature p` | Blue (`rgba(76,201,240,.8)`) | — |
| **Modal glow** | JS `glowRgb` | Blue (`76,201,240`) | Standard intensity |
| **Modal title** | JS `titleColor` | Purple | — |
| **Modal text** | JS `textColor` | Blue | — |

> Icons: 🟠 ⚡ ⚙️ 📡 🏆 💸 📲 🌐

---

### Instalación Steps
| Element | Class | Color |
|---|---|---|
| Step number circles | `.step-num` | Orange bg, dark text, orange glow |
| Step title | `.step-body h3` | White |
| Step description | `.step-body p` | Muted (purple-grey) |

#### Code Blocks (`pre`) and Inline Code (`code`)
| State | Border | Text |
|---|---|---|
| Default | Faded blue | Faded blue |
| Hover | Bright blue glow + lifts 2px | Bright blue |
| Clicked / copied | Green glow (1 second) | Green (1 second) |

> Click any `pre` block or inline `code` to copy to clipboard.

---

### Lightning Section (NWC & LND Cards)
| Element | Class | Color | Notes |
|---|---|---|---|
| Card border + glow | `.ln-card` | Faded orange (always on) | `rgba(255,119,0,.2)` border |
| Card hover | `.ln-card:hover` | Bright orange + lifts 3px + brightens | `filter: brightness(1.12)` |
| Card active/click | `.ln-card:active` | Intense orange glow | — |
| "Recomendado" badge | `.ln-badge` | Orange bg, dark text | — |
| Title (h3) | `.ln-card h3` | Orange | — |
| Description | `.ln-card p` | White | — |
| Wallet/option list | `.ln-card ul` | White | — |
| Code block inside card | `pre` | Same as install section | Click to copy |
| **Modal glow** | JS `glowRgb` | Orange (`255,119,0`) | **Bright** intensity (`.45`/`.2`) |
| **Modal title** | JS `titleColor` | Orange | — |
| **Modal text** | JS `textColor` | White | — |
| **Modal code block** | `.modal-code` | Faded blue → bright blue hover → green copied | Click to copy |

> Click any card → zooms into modal with full content (title, description, list, code).

---

### Footer
| Element | Class | Color |
|---|---|---|
| "₿Quiz Live" logo | `.footer-logo` | Green with glow |
| Right side text | — | Muted (purple-grey) |

---

## Modal System

Modals are built dynamically in JS when any card is clicked. The glow, title color, text color, and glow intensity all vary by card type:

| Card Type | Glow Color | Glow Intensity | Title | Body Text |
|---|---|---|---|---|
| Hero demo cards | Green | Normal | White | Green |
| Características cards | Blue | Normal | Purple | Blue |
| NWC / LND cards | Orange | **Bright** | Orange | White |

**To change modal colors:** edit `glowRgb`, `titleColor`, `textColor` in `openCardModal()` in the `<script>` at the bottom of `index.html`.

**To change modal glow brightness:** edit the opacity values in the inline `box-shadow` style — currently `isLn ? '.45' : '.18'` for outer glow.

---

## Hover Behavior (all interactive elements)

All cards, buttons, and code blocks share the same hover philosophy:
- **Lift**: `transform: translateY(-2px)` or `-3px`
- **Brighten**: `filter: brightness(1.12)` (cards only)
- **Glow intensifies**: border opacity and box-shadow increase
- **Transition**: `border-color`, `box-shadow`, `transform`, `filter` — all smooth

---

## Quick Reference: How to Change Things

| I want to change… | Find… |
|---|---|
| Main green accent | `--accent` in `:root` + update `rgba(57,255,20,…)` throughout |
| Orange color | `--orange` in `:root` + update `rgba(255,119,0,…)` throughout |
| Blue color | `--blue` in `:root` + update `rgba(76,201,240,…)` throughout |
| Purple color | `--purple` in `:root` + update `rgba(176,68,255,…)` throughout |
| Background grid | `background-image` on `body` |
| Hero wrapper glow color | `.demo-screen` box-shadow |
| Feature card glow | `.feature` and `.feature:hover` |
| Demo card glow | `.demo-card` and `.demo-card:hover` |
| NWC/LND card glow | `.ln-card` and `.ln-card:hover` |
| NWC/LND permanent glow | `.ln-card` base `border-color` and `box-shadow` |
| Card brightness on hover | `filter: brightness(…)` in each card's `:hover` rule |
| Copy flash duration | `setTimeout(…, 1000)` in `<script>` (1 second) |
| Modal animation speed | `cardZoomIn` keyframe — currently `.28s` |
| Nav link color | `.nav-links a { color: … }` |
| Section label color | `.section-label { color: … }` |
| GitHub links | Both have `target="_blank" rel="noopener noreferrer"` |

---

---

# ₿Quiz Live — Quiz App Style Guide
> Reference for `public/styles.css`, `public/index.html`, `public/host.html`

---

## Color Palette

| Name | Variable | Hex | Used For |
|---|---|---|---|
| Electric Green | `--accent` | `#39ff14` | Logo, timer bar, correct answer, scores, input focus |
| Neon Orange | `--accent2` | `#ff7700` | Timer warning, Terminar Quiz button, player question card glow |
| Background | `--bg` | `#080b08` | Page background |
| Card | `--card` | `#0e1510` | Cards, question box |
| Card Dark | `--card2` | `#050805` | Input fields, inner boxes, leaderboard rows |
| Text | `--text` | `#dff5df` | Body text, headings |
| Muted | `--muted` | `#8866cc` | Labels, hints, secondary text |
| Border | `--border` | `#1a2e1c` | Card borders |
| Correct | `--correct` | `#39ff14` | Correct answer highlight |
| Incorrect | `--incorrect` | `#ff3300` | Wrong answer, danger button |

---

## Answer Buttons (`public/styles.css` + `public/index.html`)

| Slot | Variable | Gradient | Glow Color | Text Color |
|---|---|---|---|---|
| 0 | `--ans-0` | `#ffff00 → #cc8800` (yellow) | `rgba(255,230,0)` | `#1a1000` (dark warm) |
| 1 | `--ans-1` | `#00eeff → #0044dd` (cyan→blue) | `rgba(0,200,255)` | `#000d18` (dark cool) |
| 2 | `--ans-2` | `#dd55ff → #5500bb` (purple) | `rgba(190,50,255)` | `#0e0018` (dark purple) |
| 3 | `--ans-3` | `#39ff14 → #007700` (green) | `rgba(57,255,20)` | `#001800` (dark green) |

> **Color order is randomized per question** — `index.html` shuffles `[0,1,2,3]` with Fisher-Yates so no answer position always has the same color.

> **Dark text** is intentional — neon gradients pop more against dark/black text than white.

Each button has:
- A bright top border (`border-top`) for an edge-glow effect
- `box-shadow`: tight glow + drop shadow
- Hover: `translateY(-2px)` + `brightness(1.15)`

---

## Player Question Card

The `.question-text` card on the **player screen only** has an orange glow defined inline in `index.html`:

```css
border: 1px solid rgba(255,119,0,.55);
box-shadow: 0 0 28px rgba(255,119,0,.28), 0 0 60px rgba(255,100,0,.1), 0 4px 20px rgba(0,0,0,.4), inset 0 0 30px rgba(255,119,0,.07);
```

The host's question card has no colored glow (plain `.card` style).

---

## Host Screens

| Screen | Key elements |
|---|---|
| Setup | Green primary button, orange lightning status |
| Lobby | Room code in green dashed box, QR code, player chips |
| Question | Timer bar (green→orange→red), question card, live leaderboard from previous question, answered count |
| Results | Correct answer callout (green border), explanation, leaderboard, orange "Terminar Quiz" button (`max-width: 320px`) |
| Final | Winner card (green border/gradient), leaderboard card (`max-width: 480px`), "Nuevo Quiz" button (`max-width: 480px`) |

---

## Player Screens

| Screen | Key elements |
|---|---|
| Join | Logo, nickname + room code inputs |
| Waiting | Only shown on initial join — not shown between questions |
| Question | Orange-glowing question card, 4 randomized neon answer buttons |
| Result | Correct ✅ / Incorrect ❌ / Timeout ⏰, points earned, leaderboard |
| Final (winner) | 🎉 + "¡GANASTE!" with green↔orange pulsing glow |
| Final (others) | ⚡ + position message + winner announcement |

---

## Quick Reference: How to Change Things

| I want to change… | Find… |
|---|---|
| Answer button colors | `.answer-btn.ans-0/1/2/3` in `styles.css` |
| Answer button text color | `color:` on each `.answer-btn.ans-X` rule |
| Turn off color randomization | Remove `colorOrder` shuffle in `index.html` JS |
| Player question card glow | `.question-text` override in `index.html` `<style>` |
| Timer bar colors | `.timer-bar`, `.timer-bar.warning`, `.timer-bar.danger` |
| Logo glow | `text-shadow` on `.logo` |
| Correct answer color | `--correct` in `:root` |
| Winner animation | `@keyframes glow` in `styles.css` |
| Results delay | `RESULTS_DELAY` in `.env` (default 8, currently 7) |
