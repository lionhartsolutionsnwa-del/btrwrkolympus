# Olympus Dashboard

A SpaceX-themed mission control dashboard for managing Notion tasks. Built with Next.js 16, TypeScript, Tailwind CSS, and the Notion API.

![Olympus](https://img.shields.io/badge/status-NOMINAL-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Vercel](https://img.shields.io/badge/Vercel-Deploy-black)

## Features

- **Dark SpaceX aesthetic** — pure black canvas, spectral white typography, ghost buttons, no cards
- **Notion task management** — read/write tasks from any Notion database
- **Calendar view** — monthly grid with color-coded task indicators
- **Manual refresh** — SYNC button to pull latest Notion data on demand
- **Real-time stats** — active missions, due today, completed, overdue counts
- **Task filters** — All / Today / Upcoming / Completed views
- **Create tasks** — inline form to add new missions

## Setup

### 1. Create a Notion Integration

1. Go to [notion.so/my-integrations](https://notion.so/my-integrations)
2. Click **"New integration"**
3. Give it a name (e.g., "Olympus")
4. Select your workspace
5. Copy the **API key** (starts with `secret_`)

### 2. Create/Prepare Your Notion Database

Your database needs these properties:

| Property | Type |
|----------|------|
| `Name` | Title |
| `Status` | Select (options: `Todo`, `In Progress`, `Done`) |
| `Due Date` | Date |
| `Description` | Text (optional) |

Share the database with your integration: open the database → `...` menu → **Connect to** → select your integration.

### 3. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

Or via CLI:

```bash
npm i -g vercel
vercel login
vercel deploy --prod
```

### 4. Set Environment Variables

In Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NOTION_API_KEY` | `secret_xxx` from Step 1 |
| `NOTION_DATABASE_ID` | The ID from your database URL (after the `/` and before `?`) |

Database URL looks like:
```
https://notion.so/workspace/ DATABASE_ID ?v=...
                        ^^^^^^^^^^^^^^^^
```

## Local Development

```bash
git clone <repo>
cd mission-control
npm install

# Copy and fill in env vars
cp .env.local.example .env.local
# Edit .env.local with your NOTION_API_KEY and NOTION_DATABASE_ID

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 16** (App Router, API routes)
- **TypeScript**
- **Tailwind CSS v4**
- **Notion SDK** (`@notionhq/client`)
- **SWR** — data fetching/caching
- **date-fns** — date utilities
- **Lucide React** — minimal icons
- **Vercel** — deployment

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main dashboard page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # SpaceX theme CSS
│   └── api/
│       ├── tasks/route.ts       # GET (list) + POST (create)
│       └── tasks/[id]/route.ts  # PATCH (update status)
├── components/
│   ├── Header.tsx         # Logo, status dot, refresh button
│   ├── Overview.tsx       # Stats panel (active/today/done/overdue)
│   ├── TaskList.tsx       # Task list with filters + create form
│   ├── Calendar.tsx       # Monthly calendar with task dots
│   └── Toast.tsx          # Notification toasts
├── lib/
│   ├── api.ts             # Client-side fetch helpers
│   └── utils.ts           # Stats computation, date helpers
└── types/
    └── index.ts           # TypeScript interfaces
```

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| Space Black | `#000000` | Page background |
| Surface | `#0a0a0a` | Panel backgrounds |
| Spectral White | `#f0f0fa` | Primary text |
| Text Secondary | `#8a8a9a` | Muted labels |
| Ghost Border | `rgba(240,240,250,0.35)` | Button/input borders |
| Mission Red | `#e63946` | Overdue / error |
| Nominal Green | `#2d9f6f` | Success / done |
| Caution Amber | `#f4a261` | Active / warning |

## Design Notes

- Typography: **Inter** (Google Fonts) + **JetBrains Mono** for data readouts
- All labels uppercase with positive letter-spacing (SpaceX aerospace stencil voice)
- Zero shadows, zero cards — content floats on the black void
- Ghost buttons with spectral borders — barely visible, HUD-like
- Status dot pulses slowly to indicate "nominal" state
