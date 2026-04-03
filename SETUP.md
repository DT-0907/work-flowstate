# FlowState — Setup Guide

## Prerequisites

- **Node.js 20+** (check: `node -v`)
- **pnpm** (install: `npm i -g pnpm`)
- **Supabase account** — free tier at [supabase.com](https://supabase.com)
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com) (for Claude fallback only)
- **GitHub repo** — create one for this project, connect it to Vercel later

No Vercel CLI or OpenAI key needed. Embeddings are free (Transformers.js runs locally in Node.js).

---

## Step 1: Create the Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Name it `flowstate` (or whatever you want)
3. Set a strong database password — **save this somewhere**
4. Region: **West US (San Francisco)** (closest to Berkeley)
5. Wait for the project to spin up (~2 min)

### Run the SQL setup

1. Go to **SQL Editor** in the Supabase dashboard (left sidebar)
2. Click **New query**
3. Copy-paste the entire contents of `setup.sql` into the editor
4. Click **Run** (or Cmd+Enter)
5. You should see "Success. No rows returned" — that means it worked

### Enable auth providers

1. Go to **Authentication** → **Providers**
2. Enable **Email** (magic link is on by default)
3. (Optional) Enable **Google**:
   - You'll need a Google Cloud OAuth client ID + secret
   - Set the redirect URL to: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
4. Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to `http://localhost:3000`
   - Add `http://localhost:3000/api/auth/callback` to **Redirect URLs**

### Grab your keys

Go to **Settings** → **API** and note down:
- **Project URL** (looks like `https://abc123.supabase.co`)
- **anon public key** (safe for browser)
- **service_role key** (server-only, never expose to client)

---

## Step 2: Fill in `.env.local`

A placeholder `.env.local` file has been created in the project root. Fill in your values:

```bash
# Supabase (from Settings → API in your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Anthropic (from console.anthropic.com → API Keys)
ANTHROPIC_API_KEY=sk-ant-...your-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

That's it — only 5 variables. Embeddings are free (Transformers.js), so no OpenAI key needed.

---

## Step 3: Scaffold the Next.js App

```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
```

When prompted:
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **Yes**
- App Router: **Yes**
- Turbopack: **Yes**
- Import alias: `@/*`

### Install dependencies

```bash
# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# AI — Claude fallback + AI SDK
pnpm add ai @ai-sdk/react @ai-sdk/anthropic

# Embeddings — free, runs in Node.js
pnpm add @huggingface/transformers

# shadcn/ui
pnpm dlx shadcn@latest init
# Choose: New York style, Zinc color, CSS variables: yes

# Add key shadcn components
pnpm dlx shadcn@latest add button card dialog input label badge tabs separator skeleton toast sheet

# Geist font
pnpm add geist

# Lucide icons (for dock)
pnpm add lucide-react
```

### Verify it runs

```bash
pnpm dev
```

Open `http://localhost:3000` — you should see the Next.js starter page.

---

## Step 4: Deployment (When You're Done Building)

1. **Push to GitHub**
   ```bash
   git init && git add -A && git commit -m "initial commit"
   git remote add origin https://github.com/your-username/flowstate.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Vercel auto-detects Next.js — no config needed

3. **Add environment variables in Vercel dashboard**
   - Go to your project → **Settings** → **Environment Variables**
   - Add all 5 variables from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (set to Production + Preview only)
     - `ANTHROPIC_API_KEY`
     - `NEXT_PUBLIC_APP_URL` → set to your Vercel domain (e.g., `https://flowstate.vercel.app`)

4. **Redeploy** (Vercel may auto-redeploy, or hit "Redeploy" in the dashboard)

5. **Update Supabase auth URLs**
   - Go to Supabase → **Authentication** → **URL Configuration**
   - Update **Site URL** to your Vercel production domain
   - Add `https://your-domain.vercel.app/api/auth/callback` to **Redirect URLs**

From here on, every push to `main` auto-deploys to production.

---

## Architecture Recap

```
You (browser)
  → Vercel (Next.js frontend + API routes)
    → Supabase (database + auth + vector search)
    → Transformers.js (embeddings — runs inside Vercel serverless functions, free)
    → Anthropic API (Claude fallback — only when vector search is insufficient)
```

- **No separate backend server needed** — Next.js API routes handle all server logic
- **Only 1 paid API** — Anthropic (Claude fallback), used sparingly
- **Embeddings are free** — Transformers.js runs the model in Node.js, no API calls
- **Supabase free tier** covers a single-user productivity app easily
- **Vercel free tier** (Hobby) covers the frontend + API routes

---

## Estimated Costs (Single User)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Vercel | Hobby (free) | $0 |
| Supabase | Free | $0 |
| Embeddings (Transformers.js) | Free (runs locally) | $0 |
| Claude fallback (Anthropic) | Pay-as-you-go | ~$0.10 (occasional use) |
| **Total** | | **~$0.10/month** |

---

## What to Give Me Next

Once you've completed steps 1–2 above (Supabase + `.env.local`), come back and tell me:

1. "Supabase is set up and SQL is run"
2. "`.env.local` is filled in"

Then I'll build the full app.
