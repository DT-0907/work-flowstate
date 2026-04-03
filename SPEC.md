# FlowState — Technical Specification

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Vercel (Frontend)              │
│                                                  │
│  Next.js 16 (App Router)                        │
│  ├── Bottom Dock (6 tabs)                       │
│  │   ├── Today   (recommendations + CRUD)       │
│  │   ├── Week    (calendar + day planner)       │
│  │   ├── Grind   (motivational quote feed)      │
│  │   ├── Growth  (life map + journal)           │
│  │   ├── Focus   (pomodoro timer)               │
│  │   └── Settings (appearance + config)         │
│  ├── API Routes                                 │
│  │   ├── /api/recommendations   (AI engine)     │
│  │   ├── /api/habits            (CRUD)          │
│  │   ├── /api/assignments       (CRUD)          │
│  │   ├── /api/embeddings        (generate/sync) │
│  │   ├── /api/growth/scores     (life area)     │
│  │   ├── /api/growth/mappings   (habit→area)    │
│  │   ├── /api/journal           (CRUD)          │
│  │   ├── /api/journal/dates     (calendar)      │
│  │   ├── /api/settings          (user prefs)    │
│  │   └── /api/auth/callback     (Supabase)      │
│  └── proxy.ts (auth middleware)                  │
│                                                  │
│  UI: shadcn/ui + Tailwind + Geist font          │
│  AI: Transformers.js (embeddings) + @ai-sdk/anthropic │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│              Supabase (Backend)                  │
│                                                  │
│  PostgreSQL 15+ with pgvector                    │
│  ├── habits (+ embedding vector)                │
│  ├── assignments (+ embedding vector)           │
│  ├── habit_completions                          │
│  ├── skipped_recommendations                    │
│  ├── profiles                                   │
│  ├── life_area_scores                           │
│  ├── habit_area_mappings                        │
│  ├── score_changes                              │
│  ├── journal_entries                            │
│  ├── user_settings                              │
│  │                                              │
│  Auth (magic link / Google OAuth)                │
│  Row Level Security on all tables                │
│  RPC functions for vector similarity search      │
└─────────────────────────────────────────────────┘
```

Embeddings run locally via **Transformers.js** (`@huggingface/transformers`) — free, no API key needed. The Claude fallback uses **Anthropic** (`@ai-sdk/anthropic`) with `ANTHROPIC_API_KEY` stored in `.env.local` locally and in Vercel environment variables for production.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Styling | Tailwind CSS 4 + shadcn/ui + Geist Sans/Mono |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (magic link + Google OAuth) |
| AI - Embeddings | all-MiniLM-L6-v2 (384 dims) via `@huggingface/transformers` — free, no API key |
| AI - Fallback | Claude claude-sonnet-4-6 via `@ai-sdk/anthropic` |
| AI SDK | `ai` + `@ai-sdk/react` + `@ai-sdk/anthropic` |
| Deployment | Vercel (frontend + API routes) |
| Package manager | pnpm |

---

## Database Schema

See `setup.sql` for the full executable script. Summary:

### Tables

**profiles**
- `id` (uuid, FK → auth.users) — primary key
- `display_name`, `email`, `timezone`
- `created_at`, `updated_at`

**habits**
- `id` (uuid), `user_id` (FK → profiles)
- `name`, `description`
- `time_of_day` (enum: morning / midday / night)
- `frequency` (enum: daily / weekdays / weekends / custom)
- `custom_days` (int[] — 0=Sun through 6=Sat)
- `streak` (int, maintained by trigger)
- `is_active` (boolean)
- `embedding` (vector(384))
- `embedding_text` (text — the string that was embedded)
- timestamps

**assignments**
- `id` (uuid), `user_id` (FK → profiles)
- `name`, `description`, `course`
- `due_date` (timestamptz)
- `estimated_minutes` (int)
- `priority` (enum: low / medium / high / urgent)
- `status` (enum: pending / in_progress / completed)
- `completed_at` (timestamptz)
- `embedding` (vector(384))
- `embedding_text` (text)
- timestamps

**habit_completions**
- `id` (uuid), `habit_id` (FK), `user_id` (FK)
- `completed_date` (date)
- Unique constraint on (habit_id, completed_date)

**skipped_recommendations**
- `id` (uuid), `user_id` (FK)
- `task_type` (habit / assignment)
- `task_id` (uuid)
- `skipped_date` (date)

**life_area_scores**
- `id` (uuid), `user_id` (FK → profiles)
- `area` (enum: intellectual / mental / spiritual / financial / physical / social)
- `score` (int, default 50, clamped 0–100)
- `updated_at` (timestamptz)
- Unique constraint on (user_id, area)

**habit_area_mappings**
- `id` (uuid), `habit_id` (FK → habits), `user_id` (FK → profiles)
- `area` (enum: intellectual / mental / spiritual / financial / physical / social)
- `auto_mapped` (boolean — true if assigned via keyword matching, false if user-overridden)
- Unique constraint on (habit_id, area)

**score_changes**
- `id` (uuid), `user_id` (FK → profiles)
- `area` (enum)
- `delta` (int — positive or negative point change)
- `reason` (text — e.g., "Completed habit: Meditate", "Missed habit: Read", "Completed assignment: CS189 HW5")
- `source_type` (enum: habit_completion / habit_miss / assignment_completion)
- `source_id` (uuid — habit or assignment id)
- `created_at` (timestamptz)

**journal_entries**
- `id` (uuid), `user_id` (FK → profiles)
- `entry_date` (date, unique per user)
- `goals` (text[] — up to 3 goals for the day)
- `appreciation` (text)
- `learned` (text)
- `improvement` (text — what you could've done better)
- `created_at`, `updated_at` (timestamptz)

**user_settings**
- `id` (uuid), `user_id` (FK → profiles, unique)
- `theme` (enum: dark / light, default dark)
- `pomodoro_work_minutes` (int, default 25)
- `pomodoro_break_minutes` (int, default 5)
- `created_at`, `updated_at` (timestamptz)

### RPC Functions (in Supabase)

**match_habits(query_embedding, threshold, count, user_id, time_of_day)**
- Cosine similarity search on habits
- Filters: correct time_of_day, not completed today, not skipped today, is_active
- Returns: id, name, description, time_of_day, streak, similarity score

**match_assignments(query_embedding, threshold, count, user_id)**
- Cosine similarity search on assignments
- Filters: not completed, not skipped today
- Returns: id, name, course, due_date, estimated_minutes, priority, similarity, urgency_score
- `urgency_score` = 1 / max(hours_until_due / 24, 0.5), capped at 2.0

**get_recommendations(user_id, time_of_day, context_embedding)**
- Orchestrator function combining habit + assignment matches
- Applies the time-of-day slot distribution
- Returns final 3 ranked recommendations

---

## AI Recommendation Engine

### Embedding Strategy

Each habit and assignment gets an embedding generated from a constructed text string:

**Habit embedding text:**
```
[Morning/Midday/Night] habit: [name]. [description]. Frequency: [frequency]. Current streak: [N] days.
```

**Assignment embedding text:**
```
Assignment for [course]: [name]. [description]. Due: [date]. Estimated time: [N] minutes. Priority: [priority].
```

Embeddings are generated via `POST /api/embeddings` when a task is created or updated. Uses `all-MiniLM-L6-v2` via `@huggingface/transformers` — runs in Node.js, no API key, completely free.

### Context Query

When requesting recommendations, the API builds a context string:

```
It's [day of week] [time_of_day] at [HH:MM]. 
Looking for productive [morning/midday/night] tasks.
Upcoming deadlines: [list of assignments due within 3 days].
Active streaks to maintain: [habits with streak > 3].
Recently completed today: [list].
```

This context string is embedded and used as the query vector for similarity search.

### Scoring

```
final_score = (0.35 * similarity) + (0.30 * urgency) + (0.20 * streak_bonus) + (0.15 * freshness)
```

- `similarity` — cosine similarity from pgvector (0–1)
- `urgency` — for assignments: `min(1.0 / max(hours_until_due / 24, 0.5), 2.0)`, normalized to 0–1; for habits: 0.5 (neutral)
- `streak_bonus` — for habits: `min(streak / 30, 1.0)`; for assignments: 0
- `freshness` — `1.0 / (1 + days_since_created)`, capped at 1.0

### Claude Fallback

Triggers when:
- Vector search returns fewer than 3 candidates
- All similarity scores are below 0.25
- User has skipped 5+ times in current session

Sends a structured prompt to Claude (`claude-sonnet-4-6`) via `@ai-sdk/anthropic` with the user's full task list and context. Claude returns a JSON array of 3 recommended task IDs with reasoning.

### Skip Mechanism

1. User clicks "Skip" on a recommendation card
2. `POST /api/recommendations/skip` records the skip in `skipped_recommendations`
3. Client refetches recommendations — the skipped item is excluded
4. Skips reset at midnight (local timezone)

---

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/recommendations` | Get 3 AI-recommended tasks |
| POST | `/api/recommendations/skip` | Skip a recommended task |
| GET | `/api/habits` | List user's habits |
| POST | `/api/habits` | Create habit (+ generate embedding) |
| PATCH | `/api/habits/[id]` | Update habit |
| DELETE | `/api/habits/[id]` | Delete habit |
| POST | `/api/habits/[id]/complete` | Mark habit complete for today |
| DELETE | `/api/habits/[id]/complete` | Unmark habit completion |
| GET | `/api/assignments` | List user's assignments |
| POST | `/api/assignments` | Create assignment (+ generate embedding) |
| PATCH | `/api/assignments/[id]` | Update assignment |
| DELETE | `/api/assignments/[id]` | Delete assignment |
| POST | `/api/embeddings/sync` | Regenerate all embeddings (admin) |
| GET | `/api/calendar/week` | Get week overview (habits + assignments + AI suggestions per day) |
| GET | `/api/growth/scores` | Get all 6 life area scores for user |
| PATCH | `/api/growth/scores` | Recalculate / manually adjust a life area score |
| GET | `/api/growth/mappings` | Get habit-to-area mappings for user |
| POST | `/api/growth/mappings` | Create or update a habit-to-area mapping |
| GET | `/api/journal` | Get journal entry for a date (query param `?date=`) |
| POST | `/api/journal` | Create or update a journal entry |
| GET | `/api/journal/dates` | Get list of dates that have journal entries (for calendar popup) |
| GET | `/api/settings` | Get user settings |
| PATCH | `/api/settings` | Update user settings (theme, pomodoro durations) |
| DELETE | `/api/settings/data` | Wipe all user data (danger zone) |
| GET | `/api/auth/callback` | Supabase OAuth callback |

---

## Frontend Structure

```
app/
├── layout.tsx              — Root layout (dark mode, Geist font, glass theme)
├── page.tsx                — Redirects to /today (or serves as shell)
├── (tabs)/                 — Route group for tabbed views (shared dock layout)
│   ├── layout.tsx          — Tab shell: content area + bottom dock
│   ├── today/
│   │   └── page.tsx        — Tab 1: AI recommendations + habits + assignments
│   ├── week/
│   │   └── page.tsx        — Tab 2: 7-day calendar + day detail panel
│   ├── grind/
│   │   └── page.tsx        — Tab 3: Full-screen motivational quote feed
│   ├── growth/
│   │   └── page.tsx        — Tab 4: Life growth map + daily journal
│   ├── focus/
│   │   └── page.tsx        — Tab 5: Pomodoro timer
│   └── settings/
│       └── page.tsx        — Tab 6: Appearance, pomodoro config, danger zone
├── login/
│   └── page.tsx            — Auth (magic link / Google)
├── api/
│   ├── recommendations/
│   │   ├── route.ts        — GET recommendations (+ optional ?day= for week view)
│   │   └── skip/route.ts   — POST skip
│   ├── habits/
│   │   ├── route.ts        — GET/POST habits
│   │   └── [id]/
│   │       ├── route.ts    — PATCH/DELETE habit
│   │       └── complete/route.ts  — POST/DELETE (date param for backfill)
│   ├── assignments/
│   │   ├── route.ts        — GET/POST assignments
│   │   └── [id]/route.ts   — PATCH/DELETE assignment
│   ├── calendar/
│   │   └── week/route.ts   — GET week overview
│   ├── embeddings/
│   │   └── sync/route.ts   — POST sync all embeddings
│   ├── growth/
│   │   ├── scores/route.ts — GET/PATCH life area scores
│   │   └── mappings/route.ts — GET/POST habit-to-area mappings
│   ├── journal/
│   │   ├── route.ts        — GET/POST journal entries
│   │   └── dates/route.ts  — GET dates with entries
│   ├── settings/
│   │   ├── route.ts        — GET/PATCH user settings
│   │   └── data/route.ts   — DELETE wipe all data
│   └── auth/
│       └── callback/route.ts
├── proxy.ts                — Auth guard (redirect unauthenticated)
components/
├── ui/                     — shadcn/ui primitives
├── dock.tsx                — Bottom dock bar (3 tab icons, glass blur)
├── recommendation-card.tsx — Glass card for each recommendation
├── recommendation-row.tsx  — 3-card hero row with skip/complete
├── habit-checkbox.tsx      — Single habit with check + streak
├── habit-list.tsx          — Habit section with inline add form + grouped list
├── assignment-list.tsx     — Assignment section with inline add form + sorted list
├── assignment-row.tsx      — Assignment with deadline + progress
├── time-badge.tsx          — Morning/midday/night pill badge
├── urgency-indicator.tsx   — Color-coded deadline proximity
├── stats-bar.tsx           — Compact stats row (streaks, rate, due count)
├── week-strip.tsx          — Horizontal 7-day selector with dot indicators
├── day-detail.tsx          — Expanded day view (AI suggestion + habits + assignments)
├── quote-card.tsx          — Full-screen motivational quote with gradient bg
├── quote-feed.tsx          — Vertical snap-scroll feed of quote cards
├── growth-map.tsx          — 6-area life growth grid with score indicators
├── area-detail.tsx         — Drill-down view for a single life area (associated habits, score history)
├── journal-entry.tsx       — Journal entry form (goals, appreciation, learned, improvement)
├── journal-calendar.tsx    — Calendar popup showing dates with past entries
└── pomodoro-timer.tsx      — Circular countdown timer with work/break modes + session counter
lib/
├── supabase/
│   ├── client.ts           — Browser Supabase client
│   ├── server.ts           — Server-side Supabase client
│   └── middleware.ts        — Supabase auth helpers for proxy.ts
├── ai/
│   ├── embeddings.ts       — Generate embeddings via Transformers.js (free, local)
│   └── recommendations.ts  — Recommendation engine logic
├── quotes.ts               — Curated list of ~100 motivational quotes
├── utils.ts                — cn(), date helpers, time-of-day detection
└── types.ts                — TypeScript types for all entities
```

### Bottom Dock Component

The dock is a fixed bar at the bottom of the viewport, shared across all 6 tab routes via the `(tabs)/layout.tsx` route group.

```
┌──────────────────────────────────────────────────────────────────┐
│                        [content area]                            │
│                                                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  ⚡ Today  📅 Week  🔥 Grind  📈 Growth  ⏱ Focus  ⚙ Settings  │  ← glass blur, fixed bottom
└──────────────────────────────────────────────────────────────────┘
```

- Uses `backdrop-blur-xl bg-white/5 border-t border-white/10`
- Active tab: accent color icon + label. Inactive: `zinc-500` icon, no label.
- Icons from Lucide: `Zap`, `Calendar`, `Flame`, `TrendingUp`, `Timer`, `Settings`
- Navigation via Next.js `<Link>` with `usePathname()` for active state
- Height: `h-16` on mobile, `h-14` on desktop. Content area has `pb-16`/`pb-14` to avoid overlap.

### Week View

The `/api/calendar/week` endpoint returns a 7-day overview:

```ts
// Response shape
{
  days: [
    {
      date: "2026-03-31",
      dayName: "Mon",
      habits: { total: 5, completed: 3 },
      assignments: [
        { id, name, course, due_date, priority, status }
      ],
      aiSuggestions: [
        // Same shape as /api/recommendations, but contextualized to that day
        { id, name, type, reason }
      ]
    },
    // ... 6 more days
  ]
}
```

The AI suggestions per day reuse the same recommendation engine but with a modified context string: "If it were [target day] [morning], what should I focus on?" — useful for planning ahead.

### Grind Feed

The quote feed uses CSS `scroll-snap-type: y mandatory` for the TikTok-style card snapping.

Quotes are stored in `lib/quotes.ts` as a typed array:

```ts
type Quote = {
  text: string
  author: string | null  // null = unattributed
  gradient: string       // tailwind gradient class, e.g. "from-blue-950 via-zinc-950 to-zinc-900"
}
```

~100 curated quotes, shuffled on mount with `crypto.getRandomValues()` for true randomness. The feed loops infinitely by appending the array to itself when the user nears the bottom.

---

## Design System

**Theme**: Dark glassmorphism (Apple-inspired)

- **Background**: Deep dark (`zinc-950`) with subtle gradient mesh
- **Cards**: Semi-transparent (`bg-white/5`) with `backdrop-blur-xl`, 1px `border-white/10`
- **Accent**: Single color — electric blue (`#3B82F6`) for active states and CTAs
- **Text**: `zinc-100` primary, `zinc-400` secondary, Geist Sans
- **Mono**: Geist Mono for streaks, timestamps, estimated times
- **Radius**: `rounded-2xl` for cards, `rounded-xl` for buttons
- **Shadows**: None (glassmorphism uses blur, not shadow)
- **Animations**: `transition-all duration-300` on interactive elements, subtle `scale-[1.02]` on card hover
- **Recommendation cards**: Larger glass cards with glow effect on the border (1px gradient border using `bg-gradient-to-r`)

**States**:
- Empty: Friendly illustration + CTA to add first habit/assignment
- Loading: Skeleton shimmer with glass effect
- Error: Inline toast, not modal

---

## Deployment

| Component | Host | Notes |
|-----------|------|-------|
| Next.js app | Vercel | Auto-deploy from GitHub `main` branch |
| Database | Supabase | Free tier sufficient for single user |
| Vector search | Supabase (pgvector) | Runs inside PostgreSQL, no separate service |
| Embeddings | Transformers.js (runs in Node.js) | $0 (free, open-source) |
| Claude fallback | Anthropic API (direct) | Used sparingly, ~$0.003 per recommendation |

No additional backend hosting needed — everything runs on Vercel serverless functions + Supabase.

**Theme support:** The app ships with dark mode as the default but supports a light mode toggle via the Settings tab. Theme preference is stored in the `user_settings` table and applied via a `data-theme` attribute on the root `<html>` element. Tailwind CSS `dark:` variants are used throughout; light mode uses appropriate lighter glass effects (`bg-black/5` instead of `bg-white/5`, `zinc-100` backgrounds, `zinc-800` text).
