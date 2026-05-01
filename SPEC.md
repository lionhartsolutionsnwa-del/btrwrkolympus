# Olympus Dashboard — SPEC

## 1. Concept & Vision

A SpaceX-inspired mission control dashboard for managing Notion tasks — dark, cinematic, and minimal like a real spacecraft operations center. The interface treats task management like a mission briefing: stark black void, spectral white typography, uppercase tracked labels, ghost buttons, and full-viewport sections. Every element feels like it belongs on a rocket's control console, not a consumer SaaS app.

## 2. Design Language

**Aesthetic Direction:** SpaceX launch control — pure black canvas, industrial typography, full-bleed dark sections. No cards, no shadows, no color. Typography does all the work.

**Color Palette:**
- Background: `#000000` (Space Black)
- Surface: `#0a0a0a` (near-black for subtle depth)
- Text Primary: `#f0f0fa` (Spectral White — slight blue-violet tint)
- Text Secondary: `#8a8a9a` (muted spectral)
- Border: `rgba(240,240,250,0.15)` (ghost border)
- Accent: `#e63946` (Mission Red — for critical states, live indicators)
- Success: `#2d9f6f` (Nominal Green)
- Warning: `#f4a261` (Caution Amber)

**Typography:**
- Primary: `Inter` (CDN: Google Fonts) — clean, geometric, slightly industrial
- Mono: `JetBrains Mono` — for IDs, timestamps, data readouts
- All text uppercase with positive letter-spacing (0.5–1.5px)
- Display: 48–72px bold, tracked
- Labels: 10–13px, tracked 1–1.5px

**Spatial System:**
- Base unit: 8px
- Sections: full-viewport height or min 80vh
- No cards — content sections are dark panels with subtle borders
- Generous padding: 32–64px on desktop

**Motion Philosophy:**
- Minimal, purposeful — fade-in on load (300ms), subtle opacity transitions
- No bounces, no springs — everything feels precise and mechanical
- Status indicators: slow pulse animation (2s) for live status

**Visual Assets:**
- No decorative images — the darkness itself is the aesthetic
- Status dot indicators with pulse animation
- Thin horizontal rules as section dividers
- Mission status badge with monospace data readout feel

## 3. Layout & Structure

```
┌─────────────────────────────────────────────┐
│  HEADER: Logo + Mission Status + Refresh     │
├─────────────────────────────────────────────┤
│                                             │
│  MISSION OVERVIEW  (full-width panel)       │
│  — Active tasks count                       │
│  — Today's tasks count                      │
│  — Upcoming deadlines                       │
│                                             │
├──────────────────────┬──────────────────────┤
│                      │                      │
│  TASKS PANEL         │  CALENDAR PANEL      │
│  (scrollable list)   │  (month grid)         │
│                      │                      │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

**Responsive Strategy:**
- Desktop (≥1024px): Two-column layout — tasks left, calendar right
- Tablet (768–1023px): Same two-column, compact spacing
- Mobile (<768px): Single column — overview → tasks → calendar stacked

## 4. Features & Interactions

**Manual Refresh Button:**
- Prominent ghost button in header
- On click: fetches latest Notion data, updates all panels
- Loading state: button text changes to "SYNCING..." with pulse
- Success: brief green flash on status dot
- Error: red status dot + error toast message

**Notion Tasks (Read):**
- Fetch tasks from a Notion database
- Display as a list: checkbox | task name | due date | status badge
- Filter: All / Today / Upcoming / Completed
- Clicking a task row expands inline to show full description
- Empty state: "NO ACTIVE MISSIONS" in large tracked type

**Notion Tasks (Write):**
- "NEW TASK" ghost button opens an inline form
- Fields: Task name (required), Due date (optional), Status (select: Todo/In Progress/Done)
- On submit: POST to Notion API, optimistic UI update, refresh
- Cancel: closes form, no changes

**Calendar View:**
- Monthly grid showing current month
- Days with tasks show a dot indicator (color-coded by status)
- Clicking a day filters task list to that day's tasks
- Navigation: prev/next month arrows
- Today highlighted with subtle border

**Status Indicators:**
- Live status dot in header (pulsing green = connected)
- Task status badges: "TODO", "IN PROGRESS", "DONE", "OVERDUE"
- Overdue tasks: red text, red dot indicator

## 5. Component Inventory

### Header
- Logo: "MISSION CONTROL" in bold tracked type, left
- Status: pulsing green dot + "NOMINAL" or red dot + "ERROR"
- Refresh button: ghost button, right-aligned
- States: idle, syncing, error

### Mission Overview Panel
- Full-width dark panel with subtle top border
- Three stat blocks: "ACTIVE MISSIONS", "DUE TODAY", "COMPLETED"
- Each stat: large number (Inter Bold) + label (uppercase tracked)
- States: loading (skeleton), loaded, error

### Task List
- Scrollable panel, left side
- Filter tabs: ALL | TODAY | UPCOMING | COMPLETED
- Active filter: underlined with spectral white
- Task row: checkbox + name + due date + status badge
- Hover: subtle background lift `rgba(255,255,255,0.03)`
- Expanded state: description text below row
- Empty state: centered "NO ACTIVE MISSIONS"

### Task Form (inline, expands)
- Input: task name — dark input with spectral border
- Date picker: native date input styled dark
- Status select: ghost select dropdown
- Submit: ghost button "CONFIRM MISSION"
- Cancel: text button "ABORT"

### Calendar Panel
- Month/year header with prev/next arrows
- 7-column grid (S M T W T F S headers)
- Day cells: number + optional status dot
- Today: spectral border highlight
- Selected day: filled background `rgba(240,240,250,0.1)`
- States: loading, loaded, error

### Status Badge
- Small pill: "TODO" / "IN PROGRESS" / "DONE" / "OVERDUE"
- Color-coded: muted / amber / green / red
- All uppercase, 10px, tracked

### Toast Notification
- Bottom-right positioned
- Dark panel with colored left border (success/error/warning)
- Auto-dismiss after 4 seconds
- Manual dismiss: × button

## 6. Technical Approach

**Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS

**Styling:** Tailwind CSS with custom SpaceX theme tokens

**Data Fetching:**
- Client-side fetch to Notion API (via Next.js API routes to protect API key)
- SWR for caching and revalidation
- Manual refresh triggers revalidation

**API Routes:**
- `GET /api/tasks` — query Notion database, return tasks
- `POST /api/tasks` — create new task in Notion
- `PATCH /api/tasks/[id]` — update task status

**Notion Integration:**
- API key stored in `NOTION_API_KEY` env var
- Database ID stored in `NOTION_DATABASE_ID` env var
- Notion SDK: `@notionhq/client`

**Environment Variables:**
```
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx
```

**Deployment:** Vercel (zero-config)

**Key Dependencies:**
- `next` — framework
- `@notionhq/client` — Notion API client
- `swr` — data fetching/caching
- `date-fns` — date formatting/manipulation
- `lucide-react` — minimal icons (refresh, chevrons, status dots)
