# Olympus Dashboard — Redesign Brief
## "Billionaire Persona" — Luxury Personal Command Center

---

## 1. Concept & Vision

This is your personal command center — not a technical dashboard, not a startup's SaaS product. Think: a private banker's morning briefing, Bloomberg Terminal meets a luxury fintech app (Robinhood, Mercury, Carta). Every piece of data should feel like it was curated for one person who values their time and attention.

The dashboard must communicate: **"I have everything under control. This is effortless."**

- Calm, not aggressive
- Editorial, not industrial
- Personal, not generic
- Scannable at a glance, not dense with data

---

## 2. Design Language

### Aesthetic Direction
**Reference:** Mercury Bank + Bloomberg Terminal + luxury editorial print
- Warm, light background — feels like quality paper
- White cards with whisper-light shadows — lifted off the surface
- Refined serif for brand moments (Fraunces) — distinguished, not flashy
- Clean sans-serif for everything else (DM Sans) — readable, modern
- Monospace sparingly for timestamps/data (JetBrains Mono) — precise, not "hacker"

### Color Palette

```
BACKGROUND
--color-bg:              #F8F7F4   /* Warm off-white, like fine paper */
--color-surface:         #FFFFFF   /* Pure white cards */
--color-surface-hover:   #FAFAF8   /* Subtle lift on hover */
--color-surface-secondary:#F2F1EE   /* Inset areas, secondary surfaces */

TEXT
--color-text-primary:    #1A1A1A   /* Near-black, high contrast headings */
--color-text-secondary:  #6B6B6B   /* Muted body text */
--color-text-tertiary:    #9B9B9B   /* Captions, timestamps, placeholders */

BORDERS
--color-border:          #E8E6E1   /* Soft warm gray — subtle definition */
--color-border-strong:   #D4D1C9   /* Emphasized borders, dividers */

STATUS COLORS (muted, sophisticated — NOT neon)
--color-success:         #2D7D4A   /* Deep forest green */
--color-success-bg:      #E8F5ED   /* Soft green tint for badges */
--color-warning:         #9A7006   /* Warm amber */
--color-warning-bg:      #FEF3CD   /* Soft amber tint */
--color-error:           #C0412D   /* Muted brick red */
--color-error-bg:        #FDECEA   /* Soft red tint */
--color-neutral:         #6B6B6B   /* Neutral gray */
--color-neutral-bg:      #F0F0EE   /* Soft gray tint */
--color-info:            #2B5CE6   /* Refined blue */
--color-info-bg:         #EBF0FD   /* Soft blue tint */

SHADOWS
--shadow-card:           0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-card-hover:     0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)
--shadow-toast:          0 4px 12px rgba(0,0,0,0.15)
```

### Typography

#### Typefaces
- **Brand/Headlines:** `Fraunces` (Google Fonts) — elegant optical serif, weight 600
  - Use for: Logo/brand name, section headline moments, large display numbers
- **Body/UI:** `DM Sans` (Google Fonts) — clean geometric sans, weights 400/500/600
  - Use for: All UI text, labels, body copy, buttons, navigation
- **Data/Timestamps:** `JetBrains Mono` (Google Fonts) — weight 400 only
  - Use for: Timestamps, dates, numeric data, code-like values

#### Font Specifications (EXACT)

```
BRAND / LOGO
  Font:       Fraunces
  Weight:     600
  Size:       20px
  Line-height: 1.2
  Letter-spacing: -0.01em
  Color:      var(--color-text-primary)

PAGE-LEVEL HEADINGS (e.g., "Active Missions" stat block heading)
  Font:       DM Sans
  Weight:     600
  Size:       11px
  Line-height: 1.4
  Letter-spacing: 0.08em
  Text-transform: uppercase
  Color:      var(--color-text-secondary)

SECTION TITLES (card titles like "Failed n8n Flows", "Missions Due")
  Font:       DM Sans
  Weight:     600
  Size:       13px
  Line-height: 1.4
  Letter-spacing: 0.01em
  Color:      var(--color-text-primary)

STAT NUMBERS (large numbers like "04", "12", "09")
  Font:       DM Sans
  Weight:     600
  Size:       44px
  Line-height: 1.0
  Letter-spacing: -0.03em
  Color:      var(--color-text-primary)
  (For secondary stat numbers): Size: 32px, letter-spacing: -0.02em

STAT LABELS (below stat numbers: "Active Missions", "Due Today")
  Font:       DM Sans
  Weight:     500
  Size:       11px
  Line-height: 1.4
  Letter-spacing: 0.08em
  Text-transform: uppercase
  Color:      var(--color-text-secondary)

BODY TEXT (task names, workflow names)
  Font:       DM Sans
  Weight:     500
  Size:       14px
  Line-height: 1.5
  Letter-spacing: 0
  Color:      var(--color-text-primary)

BODY TEXT SECONDARY (descriptions, error messages)
  Font:       DM Sans
  Weight:     400
  Size:       13px
  Line-height: 1.6
  Letter-spacing: 0
  Color:      var(--color-text-secondary)

CAPTIONS / METADATA (timestamps, due dates, monospace data)
  Font:       JetBrains Mono
  Weight:     400
  Size:       11px
  Line-height: 1.5
  Letter-spacing: 0
  Color:      var(--color-text-tertiary)

TAB LABELS (HOME, MISSIONS, N8N RUNS)
  Font:       DM Sans
  Weight:     600
  Size:       11px
  Line-height: 1
  Letter-spacing: 0.12em
  Text-transform: uppercase
  Color (active):   var(--color-text-primary)
  Color (inactive): var(--color-text-tertiary)

BUTTON TEXT
  Font:       DM Sans
  Weight:     600
  Size:       11px
  Line-height: 1
  Letter-spacing: 0.06em
  Text-transform: uppercase

STATUS BADGE TEXT
  Font:       DM Sans
  Weight:     600
  Size:       10px
  Line-height: 1
  Letter-spacing: 0.06em
  Text-transform: uppercase

FORM INPUTS
  Font:       DM Sans
  Weight:     400
  Size:       13px
  Line-height: 1.5
  Letter-spacing: 0
  Placeholder color: var(--color-text-tertiary)
```

### Spacing System

```
BASE UNIT: 4px

PAGE-LEVEL
  Header padding:          24px vertical, 32px horizontal
  Tab bar padding:         12px vertical, 32px horizontal
  Section gap:             0 (cards handle their own internal spacing)

CARD INTERNAL SPACING
  Card padding:            24px
  Card border-radius:     12px
  Card border:             1px solid var(--color-border)
  Card shadow:            var(--shadow-card)

CARD HEADER (section title + badge area)
  Padding:                20px 24px
  Border-bottom:          1px solid var(--color-border)
  Gap between title/badge: auto (flex justify-between)

CARD BODY / LIST ITEMS
  Item padding:           16px 24px
  Item border-bottom:     1px solid var(--color-border)
  Last item:             no border-bottom

STAT BLOCK (inside Overview)
  Card padding:           24px
  Number bottom margin:    8px
  Label margin-top:        0 (label sits below number)

SECTION DIVIDERS
  Use 1px border-bottom: var(--color-border) on card headers
  Do NOT use heavy dividers between major sections

GRID GAP
  Overview stats grid gap: 16px
  Home tab two-column gap:  0 (border separates)
  Missions tab gap:        0 (border separates)

FILTER TABS (inside TaskList)
  Tab padding:            8px 16px
  Tab gap:                8px
  Tab border-radius:      20px (pill shape)

CALENDAR
  Cell padding:           8px
  Day number font-size:   13px
  Weekday header padding:  12px 0
  Month nav padding:      16px 20px
```

### Component Specifications

#### Cards
```
Background:       var(--color-surface) (#FFFFFF)
Border:           1px solid var(--color-border)
Border-radius:    12px
Box-shadow:       var(--shadow-card)
Padding:          24px (all sides)
Hover state:      shadow-card-hover (for interactive cards)
```

#### Status Badges (Pill Shape)
```
Shape:            Rounded pill (border-radius: 20px)
Padding:          4px 10px (vertical 4px, horizontal 10px)
Font:             DM Sans 600, 10px, uppercase, letter-spacing 0.06em

Badge Variants:
  SUCCESS/DONE:
    Background:   var(--color-success-bg) (#E8F5ED)
    Text color:   var(--color-success) (#2D7D4A)

  ERROR/FAILED/OVERDUE:
    Background:   var(--color-error-bg) (#FDECEA)
    Text color:   var(--color-error) (#C0412D)

  WARNING/IN PROGRESS:
    Background:   var(--color-warning-bg) (#FEF3CD)
    Text color:   var(--color-warning) (#9A7006)

  NEUTRAL/TODO:
    Background:   var(--color-neutral-bg) (#F0F0EE)
    Text color:   var(--color-neutral) (#6B6B6B)

  INFO/OTHER:
    Background:   var(--color-info-bg) (#EBF0FD)
    Text color:   var(--color-info) (#2B5CE6)
```

#### Buttons

**Primary Ghost Button (e.g., Refresh)**
```
Background:       transparent
Border:            1px solid var(--color-border)
Border-radius:     8px
Padding:           8px 16px
Font:              DM Sans 600, 11px, uppercase, letter-spacing 0.06em
Color:             var(--color-text-primary)
Hover:             background rgba(0,0,0,0.04), border-color var(--color-border-strong)
Active:            background rgba(0,0,0,0.06), scale(0.98)
Disabled:          opacity 0.5, cursor not-allowed
Icon size:         13px
Icon-text gap:     6px
```

**Filter Tabs (inside TaskList)**
```
Shape:             Pill/rounded (border-radius: 20px)
Padding:           8px 16px
Font:              DM Sans 600, 11px, letter-spacing 0.04em
Inactive:          background transparent, color var(--color-text-secondary)
Inactive hover:     background var(--color-surface-secondary), color var(--color-text-primary)
Active:             background var(--color-text-primary), color var(--color-surface)
```

#### Status Dot (Header)
```
Size:              6px × 6px
Border-radius:     50%
Nominal:           background var(--color-success)
Error:             background var(--color-error)
Syncing:           background var(--color-warning), pulse animation
```

#### Checkbox (Task completion)
```
Size:              16px × 16px
Border:            1.5px solid (border-color-strong when unchecked, success when checked)
Border-radius:     4px
Background:        transparent (unchecked), var(--color-success) (checked)
Icon:              white checkmark SVG, 10px × 8px
Transition:        all 0.15s ease
```

#### Custom Scrollbar
```
Width:             6px
Track:             transparent
Thumb:             var(--color-border), border-radius 3px
Thumb hover:       var(--color-border-strong)
```

### Shadows

```css
--shadow-card:       0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)
--shadow-toast:       0 4px 12px rgba(0,0,0,0.15)
```

---

## 3. Layout & Structure

### Overall Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  HEADER                                                  │
│  [Logo + Brand]              [Status]        [Refresh]  │
│  ─────────────────────────────────────────────────────── │
│  [HOME]    [MISSIONS]    [N8N RUNS]                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  TAB CONTENT (scrollable if needed)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### HOME Tab Layout

```
┌─────────────────────────────────────────────────────────┐
│  OVERVIEW STATS (4-column grid)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Active   │ │ Due      │ │ Completed│ │ Overdue  │    │
│  │ Missions │ │ Today    │ │          │ │          │    │
│  │   04     │ │   02     │ │   12     │ │   00     │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├───────────────────────────┬─────────────────────────────┤
│  FAILED N8N FLOWS         │  MISSIONS DUE               │
│  ─────────────────────    │  ─────────────────────      │
│  (scrollable list)        │  [date picker]              │
│                           │  (scrollable list)          │
│                           │                             │
└───────────────────────────┴─────────────────────────────┘
```

### MISSIONS Tab Layout

```
┌───────────────────────────┬─────────────────────────────┐
│  TASK LIST                 │  CALENDAR                   │
│  ─────────────────────     │  ─────────────────────      │
│  [All][Today][Upcoming]    │  < April 2026 >             │
│  [+ New Task]              │  S  M  T  W  T  F  S        │
│  ─────────────────────     │  [day grid with dots]      │
│  (scrollable task list)    │                             │
│                           │  ─────────────────────      │
│                           │  [legend: overdue/active/done]
└───────────────────────────┴─────────────────────────────┘
```

### N8N RUNS Tab Layout

```
┌─────────────────────────────────────────────────────────┐
│  N8N RUNS (full-width section)                          │
│  ─────────────────────────────────────────────────────  │
│  OK: 12    FAIL: 02    [total count badge]              │
│  ─────────────────────────────────────────────────────  │
│  (scrollable list of all runs with status badges)      │
└─────────────────────────────────────────────────────────┘
```

### Visual Separation Between Sections

**Do NOT use heavy borders or harsh dividers.** Instead:

1. **Cards with subtle shadows** — cards naturally separate through elevation
2. **Warm background contrast** — white cards on #F8F7F4 background
3. **Soft internal borders** — 1px var(--color-border) within cards for list item separation
4. **Column dividers** — where two columns meet, use `border-right: 1px solid var(--color-border)` on the left column, NOT a visible divider line
5. **Section headers inside cards** — each card section has its own header with border-bottom

**For the HOME tab specifically:**
- The Overview stats row should have NO outer card — stats sit directly on the warm background
- The Failed N8n / Missions Due split uses a vertical border between columns (not a full-height card border)
- Each column has its own card styling internally

---

## 4. Typography Hierarchy

### Display Layer (Hero Numbers)
- Stat numbers: 44px, DM Sans 600, letter-spacing -0.03em
- These should dominate the viewport — scannable in milliseconds

### Section Layer
- Section titles: 13px DM Sans 600
- Tab labels: 11px DM Sans 600 uppercase, letter-spacing 0.12em

### Content Layer
- Task/workflow names: 14px DM Sans 500
- Body text: 13px DM Sans 400
- Secondary text: 13px DM Sans 400, color-text-secondary

### Metadata Layer
- Timestamps, dates: 11px JetBrains Mono, color-text-tertiary
- Labels, badges: 11px DM Sans 500 uppercase, letter-spacing 0.08em

### Visual Weight Distribution
- Numbers should feel LARGE and dominant — they carry the glanceable information
- Text should feel secondary — present but not loud
- Whitespace should dominate — data should feel like it's floating, not crammed

---

## 5. Section-by-Section Specifications

### 5.1 Header

**Layout:** Flex row, space-between, vertically centered

| Element | Specification |
|---------|--------------|
| Logo mark | 22×22px SVG circle with clock hands, stroke var(--color-text-primary) |
| Brand name | Fraunces 600, 20px, color: var(--color-text-primary) |
| Status dot | 6px circle, color varies by status |
| Status label | DM Sans 500, 12px, color: status-appropriate |
| Refresh button | Ghost button style |

**Spacing:** padding 24px vertical, 32px horizontal

### 5.2 Tab Bar

**Layout:** Horizontal row of text buttons

| Element | Specification |
|---------|--------------|
| Tab label (inactive) | DM Sans 600, 11px, uppercase, letter-spacing 0.12em, color: var(--color-text-tertiary) |
| Tab label (active) | DM Sans 600, 11px, uppercase, letter-spacing 0.12em, color: var(--color-text-primary), border-bottom: 2px solid var(--color-text-primary) |
| Tab hover | color: var(--color-text-primary) |

**Spacing:** padding 12px vertical, 32px horizontal. Gap between tabs: 0 (each tab has internal padding).

### 5.3 Overview Stats (HOME Tab)

**Layout:** 4-column CSS grid, NO outer card, stats sit on warm background

| Element | Specification |
|---------|--------------|
| Stat number | DM Sans 600, 44px, letter-spacing -0.03em, color varies by meaning |
| Stat label | DM Sans 500, 11px, uppercase, letter-spacing 0.08em, color: var(--color-text-secondary) |
| Stat card | background: var(--color-surface), border: 1px solid var(--color-border), border-radius: 12px, padding: 24px |
| Stat card shadow | var(--shadow-card) |

**Stat color logic:**
- Active Missions: var(--color-text-primary)
- Due Today: var(--color-warning) if > 0, else var(--color-success)
- Completed: var(--color-success)
- Overdue: var(--color-error) if > 0, else var(--color-text-tertiary)

### 5.4 Failed n8n Flows Panel (HOME Tab, Left Column)

**Container:**
- Full height column with right border: `border-right: 1px solid var(--color-border)`
- Internal card with no top/bottom margin needed (it's the column itself)

**Header:**
- Title: "Failed n8n Flows" — DM Sans 600, 13px, color: var(--color-text-primary)
- Badge: status-badge overdue pill showing count
- Padding: 20px 24px
- Border-bottom: 1px solid var(--color-border)

**List items:**
- Workflow name: DM Sans 500, 14px, color: var(--color-text-primary), truncate
- Error message: DM Sans 400, 13px, color: var(--color-text-secondary), line-clamp-2
- FAILED badge: status-badge overdue pill
- Padding: 16px 24px
- Border-bottom: 1px solid var(--color-border)

**Empty state:**
- Message: DM Sans 400, 13px, color: var(--color-text-tertiary)
- Padding: 24px

### 5.5 Missions Due Panel (HOME Tab, Right Column)

**Container:** Full height column, no left border (already on right side)

**Header:**
- Title: "Missions Due" — DM Sans 600, 13px, color: var(--color-text-primary)
- Date input: styled dark-input, max-width 150px, font-size 11px
- Padding: 20px 24px
- Border-bottom: 1px solid var(--color-border)

**List items:**
- Task name: DM Sans 500, 14px, color: var(--color-text-primary), truncate
- Due date: JetBrains Mono 400, 11px, color: var(--color-text-tertiary)
- Status badge: status-badge with appropriate variant
- Padding: 16px 24px
- Border-bottom: 1px solid var(--color-border)

### 5.6 Task List (MISSIONS Tab, Left Column)

**Container:** Card with margin: 16px, flex-column, height 100%

**Filter bar:**
- Filter tabs: pill-shaped, 8px 16px padding
- "New Task" button: ghost button, right-aligned
- Padding: 16px 20px
- Border-bottom: 1px solid var(--color-border)

**New task form:**
- Background: var(--color-surface-secondary)
- Inputs: dark-input style
- Padding: 16px 20px

**Task rows:**
- Checkbox: 16×16px, border-radius 4px
- Task name: DM Sans 500, 14px (strike-through + muted if done)
- Status badge: status-badge pill
- Due date: JetBrains Mono 400, 11px, color: var(--color-text-tertiary)
- Expand chevron: 14px, color: var(--color-text-tertiary)
- Padding: 14px 20px
- Border-bottom: 1px solid var(--color-border)

### 5.7 Calendar (MISSIONS Tab, Right Column)

**Container:** Card with margin: 16px (left: 8px), flex-column, height 100%

**Month navigation:**
- Month/year: DM Sans 600, 12px, uppercase, letter-spacing 0.08em
- Nav arrows: 16px icon, ghost button style
- Padding: 16px 20px
- Border-bottom: 1px solid var(--color-border)

**Weekday headers:**
- Single letter each: S M T W T F S
- DM Sans 500, 11px, color: var(--color-text-secondary), letter-spacing 0.04em
- Padding: 10px 0

**Day grid:**
- 7-column grid, equal width
- Day number: DM Sans 400, 13px, color: var(--color-text-secondary)
- Today: DM Sans 600, border 2px solid var(--color-text-primary)
- Selected: background var(--color-text-primary), number white
- Future days: opacity 0.4
- Task dots: 4px circles, max 3 shown, then "+" indicator

**Legend:**
- Three items: Overdue (red dot), Active (amber dot), Done (green dot)
- Dot: 6px circle
- Label: DM Sans 500, 10px, uppercase, letter-spacing 0.06em
- Padding: 12px 20px
- Border-top: 1px solid var(--color-border)

### 5.8 N8n Runs (N8N Tab)

**Container:** Full-width section, border-left on parent

**Header:**
- Title: "n8n Runs" — DM Sans 600, 11px, uppercase, letter-spacing 0.08em
- OK/FAIL counts: JetBrains Mono, 11px
- Total badge: status-badge pill
- Padding: 16px 24px
- Border-bottom: 1px solid var(--color-border)

**List items:**
- Workflow name: DM Sans 500, 13px, truncate
- Timestamp: JetBrains Mono 400, 11px, color: var(--color-text-tertiary)
- Error message (if failed): DM Sans 400, 12px, color: var(--color-text-secondary), line-clamp-2
- Status badge: SUCCESS/FAILED/other pill
- Padding: 14px 24px
- Border-bottom: 1px solid var(--color-border)
- If has URL: entire row is clickable link with hover state

---

## 6. Information Density Guidance

### What to Show

**Always visible:**
- Overview stats (4 numbers)
- Failed n8n flows (show up to 10, then scroll)
- Missions due on selected date (show up to 10, then scroll)
- Task list (show up to 20, then scroll)
- Calendar month view with task dots

**Collapsed by default:**
- Task descriptions (shown on expand only)
- Full error messages (show first line, expand for more)
- n8n run details beyond workflow name + status

### Loading States

- Use skeleton pulses for initial load (same shape as content)
- Keep same layout space as loaded content to prevent jump

### Empty States

- Friendly, calm message
- Example: "No failed flows in the recent run window." (not "No data found")
- 24px vertical padding, centered text

### Scroll Behavior

- Each panel scrolls independently
- Scrollbars are subtle (6px, appears on hover)
- Content never overflows page — panels scroll internally

---

## 7. Responsive Behavior

**Desktop (primary):**
- Full layout as described
- Two-column grids where specified

**Tablet (768px–1024px):**
- Overview stats: 2×2 grid instead of 4-column
- Home tab: stacks to single column (Failed n8n above Missions Due)
- Missions tab: Task list full width, Calendar below

**Mobile (<768px):**
- Header: logo + refresh only, hamburger for status
- Tab bar: horizontally scrollable
- Overview stats: 2×2 grid, smaller numbers (32px)
- All columns stack vertically

---

## 8. Animation & Interaction

### Transitions
- All color/shadow transitions: 0.15s–0.2s ease
- No jarring animations — everything feels smooth and intentional

### Hover States
- Cards: subtle shadow lift
- Task rows: very subtle background tint (#FAFAF8)
- Buttons: background opacity shift
- n8n run rows (with links): subtle background highlight

### Loading
- Pulse animation on skeleton elements
- Spinning icon on sync button
- Pulse on status dot when syncing

### No Animation For:
- Tab switching (instant, no slide/fade)
- Panel borders
- Fixed elements

---

## 9. Accessibility

- All interactive elements have visible focus states
- Color is never the only indicator (badges have both color AND text)
- Touch targets minimum 44×44px on mobile
- Status messages announce to screen readers
- Contrast ratios meet WCAG AA (all text colors on backgrounds)

---

## 10. Summary of Changes from Current Design

### Typography
- **Increase stat numbers** from 42px to 44px, tighten letter-spacing to -0.03em
- **Remove uppercase tracking** from section headers (use normal case with 0.01em tracking)
- **Tab labels** — reduce tracking from 1.5px to 0.12em (0.12em ≈ 1.7px equivalent)
- **Body text** — slightly larger (14px for names, 13px for secondary)

### Spacing
- **Cards** — increase padding from ~16px to 24px
- **List items** — increase padding from 14px/20px to 16px/24px
- **Section headers** — increase padding from 16px to 20px 24px
- **Between stat cards** — increase gap from 16px to 20px

### Visual Refinements
- **Overview stats row** — remove card container, stats float on warm background
- **Home tab two-column** — use border-right separator, not two cards
- **Remove uppercase tracking** from body-level text
- **Numbers should dominate** — make them feel like the primary information

### Status Badges
- Current: 10px text with 10px horizontal padding
- Keep same but ensure pill shape is fully rounded (border-radius: 20px)

### Shadows
- Current: subtle shadow on cards
- Keep exactly as specified — cards float gently, not aggressively

---

## Implementation Checklist for Codex

- [ ] Update `globals.css` with new font imports if needed
- [ ] Restyle Header component with new typography specs
- [ ] Restyle Overview component (remove outer card, new stat number sizes)
- [ ] Restyle HomeOverviewTab (two-column with border separator, new padding)
- [ ] Restyle TaskList (new padding, typography)
- [ ] Restyle Calendar (new padding, typography)
- [ ] Restyle N8nFailedRuns (new padding, typography)
- [ ] Update page.tsx tab bar styling
- [ ] Ensure all status badges match pill spec
- [ ] Verify spacing matches 24px card padding standard
- [ ] Test responsive behavior
- [ ] Verify no breaking changes to functionality
