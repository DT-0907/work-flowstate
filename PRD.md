# FlowState — Product Requirements Document

## Overview

FlowState is a personal productivity web app built for students juggling heavy workloads. It combines a **habit tracker** and **assignment planner** into a single dashboard, topped by an **AI-powered task recommender** that surfaces the 3 most relevant things you should be doing right now based on time of day, deadlines, streaks, and semantic context.

## Problem

Students with overloaded schedules (classes, research, clubs, startups) waste decision energy figuring out *what to do next*. Existing tools are either pure planners (no intelligence) or pure habit trackers (no academic awareness). Nothing combines both and actively recommends what to work on.

## User Persona

- **Name**: Berkeley student (you)
- **Schedule**: 5 classes, startup, research lab, club leadership, personal life
- **Pain points**: Decision fatigue, forgotten assignments, broken habit streaks, context-switching overhead
- **Platforms**: Laptop (primary), phone browser (secondary) — must be responsive
- **Aesthetic preference**: Dark, minimal, glassmorphism (Apple-inspired)

---

## Core Features

### 1. AI Task Recommender (Hero Feature)

Displayed at the top of the dashboard. Shows **3 task cards** — a mix of habits and assignments chosen by time of day and relevance.

**Time-of-day distribution:**

| Period | Time | Slots |
|--------|------|-------|
| Morning | 5 AM – 12 PM | 2 habits, 1 assignment |
| Midday | 12 PM – 5 PM | 0–1 habits, 2–3 assignments |
| Night | 5 PM – 12 AM | 1 habit, 2 assignments |
| Late night | 12 AM – 5 AM | Same as night |

**Behavior:**
- Each card shows task name, type badge (habit/assignment), and context (streak count or due date)
- User can **skip** a card — it's replaced by the next best candidate
- Skipped items don't reappear for the rest of that day
- Completed items automatically cycle out
- If fewer than 3 candidates remain, show a "you're caught up" state

**Recommendation engine (priority order):**
1. **Vector similarity search** — embed each task + current context via pgvector in Supabase, rank by cosine similarity combined with urgency/streak scoring
2. **Claude API fallback** — if vector search returns < 3 results or all similarity scores are below threshold, send task list + context to Claude for ranked recommendations

### 2. Habit Tracker

- Create habits with: name, description (optional), **time of day** (morning / midday / night), frequency (daily / weekdays / weekends / custom days)
- Daily check-off: tap to mark complete, shows today's status
- Streak counter: consecutive days completed
- Visual grid/calendar showing completion history (GitHub-contribution-style heatmap)
- Habits filterable by time of day

### 3. Assignment Planner

- Create assignments with: name, description (optional), **course**, **due date**, **estimated time** (in minutes), priority (low / medium / high / urgent)
- Status flow: pending → in progress → completed
- Sort by due date, priority, or estimated time
- Visual urgency indicators (color-coded by proximity to deadline)
- Completed assignments move to an archive view

### 4. App Navigation — Bottom Dock

The app uses a **fixed bottom dock** (mobile-native feel, works on desktop too) with 6 tabs. The dock is a frosted glass bar with 6 icons:

| Tab | Icon | Label |
|-----|------|-------|
| Today | `Zap` (lightning bolt) | Today |
| Week | `Calendar` | Week |
| Grind | `Flame` | Grind |
| Growth | `TrendingUp` | Growth |
| Focus | `Timer` | Focus |
| Settings | `Settings` | Settings |

Active tab icon glows with the accent color. Inactive tabs are `zinc-500`.

---

### 5. Tab 1: Today (Default View)

The main productivity hub. Everything you need for right now.

**Layout (top to bottom):**

1. **AI Recommender (hero)** — 3 glass cards showing what to do right now (see Feature 1 above)
2. **Habits Section**
   - Section header: "Habits" with `+ Add` button
   - Inline add form (slides open): name, time of day selector, frequency
   - List of today's habits grouped by time of day (morning / midday / night)
   - Each habit: checkbox + name + streak badge
   - Swipe-left or delete icon to remove a habit
3. **Assignments Section**
   - Section header: "Assignments" with `+ Add` button
   - Inline add form (slides open): name, course, due date, estimated time, priority
   - List of active assignments sorted by due date
   - Each assignment: name + course badge + due date + urgency color bar
   - Swipe-left or delete icon to remove
4. **Stats Bar** — compact row: active streaks count, completion rate today, assignments due this week

---

### 6. Tab 2: Week (Calendar View)

A 7-day calendar showing the full picture of your week.

**Layout:**

1. **Week strip** — horizontal row of 7 day cards (Mon–Sun), scrollable if needed. Current day is highlighted. Each day card shows:
   - Day name + date
   - Dot indicators: number of assignments due (blue dots) + habit completion ratio (green ring)
2. **Day detail panel** (shown below the strip when a day is tapped):
   - **AI Suggestion** — "If it were [day] [morning/midday/night], here's what you should do" — uses the same vector recommendation engine but projected to that day's context (e.g., assignments due near that day, habits for that time of day). Gives a preview of what the recommender would surface.
   - **Habits** — all daily habits listed with completion status for that day (checkable for past days too, so you can backfill)
   - **Assignments due** — assignments with due dates on or before that day, sorted by urgency
   - **Completed** — grayed-out section of anything already done that day

**Default state:** Today is pre-selected when you switch to the Week tab.

---

### 7. Tab 3: Grind (Motivation Feed)

A full-screen, vertically scrolling feed of motivational quotes designed to snap you out of procrastination. Borderline toxic productivity energy — by design.

**Behavior:**
- Full-screen cards, one quote per screen, swipe/scroll vertically (TikTok-style)
- Each card: large quote text centered on a dark glass card with subtle animated gradient background
- Attribution below the quote (author name, Geist Mono)
- Randomized order on each visit — never the same sequence
- Infinite scroll (loops back to start after exhausting the list)
- Quotes are hardcoded in the app (curated list of ~100, no external API dependency)

**Quote tone:**
- Aggressive motivation, not gentle affirmation
- "You're not tired, you're uninspired. Find something worth losing sleep over."
- "Someone busier than you is working right now."
- "Discipline is choosing between what you want now and what you want most."
- "The graveyard is full of people who had potential."
- Mix of attributed (Goggins, Jocko, Huberman, Kobe) and original/unattributed

**Design:**
- Each card has a different subtle gradient (rotating through 5–6 dark color schemes)
- Text fades in with a slight upward animation on scroll-snap
- Optional: haptic feedback on mobile when snapping to a new quote

---

### 8. Tab 4: Growth (Life Map + Journal)

A personal growth dashboard combining life area tracking with daily journaling.

**Top Section: Life Growth Map**

- Displays 6 life areas in a grid: **Intellectual**, **Mental**, **Spiritual**, **Financial**, **Physical**, **Social**
- Each area shows a score from 0–100 (new users start at 50)
- Click on any area to drill down and see the habits associated with it

**Scoring Rules:**
- Completing a habit adds points to the relevant life area(s). Habits are auto-mapped to areas via keyword matching (e.g., "meditate" maps to Mental/Spiritual, "gym" maps to Physical)
- Diminishing returns: after 30 completions of the same habit, point gains taper off
- Missing scheduled habits decreases the relevant area scores
- Completing assignments adds points to the Intellectual area
- All scores are capped at 0–100

**Bottom Section: Daily Journal**

- Three daily prompts:
  1. 3 goals for the day
  2. Something you appreciate
  3. What you learned
  4. What you could've done better
- "Create Entry" button to start a new journal entry
- Small calendar button opens a popup showing past entries — dates with entries are clickable, dates without entries are greyed out

---

### 9. Tab 5: Focus (Pomodoro Timer)

A distraction-free focus timer with work/break cycling.

**Layout:**
- Circular countdown timer displayed prominently in the center
- Two modes: **Work** and **Break**, auto-cycling between them
- Default durations: 25 min work / 5 min break
- Preset options: 25/5, 50/10, 90/15 (selectable buttons)
- Custom durations configurable in Settings (Tab 6)
- Session counter tracks how many work sessions completed today

---

### 10. Tab 6: Settings

App-wide configuration.

**Sections:**
- **Appearance**: Dark/light mode toggle
- **Pomodoro**: Custom work duration and break duration (overrides presets)
- **Danger Zone**: "Wipe All Data" button — clears all user data (habits, assignments, journal entries, scores) with a confirmation dialog

---

## Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Responsive | Desktop-first, fully usable on mobile Safari/Chrome |
| Performance | < 2s initial load, < 500ms recommendation refresh |
| Auth | Supabase Auth (magic link or Google OAuth) |
| Data privacy | RLS on all tables — users see only their own data |
| Hosting | Frontend on Vercel, backend on Supabase (hosted) |
| Embedding model | all-MiniLM-L6-v2 (384 dims) via Transformers.js — free, no API key |
| Fallback LLM | Claude claude-sonnet-4-6 via `@ai-sdk/anthropic` (only paid API) |

---

## Out of Scope (v1)

- Mobile native app (web responsive is sufficient)
- Collaboration / shared tasks
- Notifications / push alerts
- Recurring assignment templates

These are all good v2 candidates.
