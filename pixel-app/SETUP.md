# FlowState Mobile — Android Setup Guide

Complete instructions for building and installing the FlowState app on your Google Pixel.

## Prerequisites

- **Node.js 20+** (you likely have this already)
- **Android Studio** (for local builds) OR an **Expo/EAS account** (for cloud builds)
- Your existing **Supabase project** (same one the web app uses)

---

## Step 1: Install Dependencies

```bash
cd pixel-app
npm install
```

Install the EAS CLI globally if you haven't:

```bash
npm install -g eas-cli
```

---

## Step 2: Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` — all 3 values come straight from the web app's `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://pnizcinetcqtauhohxww.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<copy NEXT_PUBLIC_SUPABASE_ANON_KEY from web app>
EXPO_PUBLIC_ANTHROPIC_API_KEY=<copy ANTHROPIC_API_KEY from web app>
```

| Mobile env var | Copy from web app's `.env.local` |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY` — powers Claude recommendations. If omitted, recs fall back to local scoring. |

That's it for env vars. No Google client IDs needed — read on.

---

## Step 3: Google OAuth — Reuse Your Existing Setup

**You don't need to create any new Google Cloud credentials.** Here's why:

The web app's Google login works like this:
1. Your code calls `supabase.auth.signInWithOAuth({ provider: "google" })`
2. Supabase handles the entire OAuth flow using the Google client ID/secret stored **inside the Supabase dashboard** (Authentication → Providers → Google)
3. The user signs in via a browser, gets redirected back

The mobile app works the **exact same way** — it calls the same Supabase method, which opens the same OAuth URL in an in-app browser (Chrome Custom Tab). The Google client ID stored in Supabase is a **Web** type, and since the OAuth happens in a real browser on the phone, it works without any Android-specific client ID.

### The one thing you do need to add

Add the mobile app's deep link as a redirect URL in Supabase so the OAuth flow can redirect back to the app:

1. Go to your [Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration)
2. Under **Redirect URLs**, add:
   ```
   flowstate://
   ```
3. Save.

That's it. Same Google Cloud project, same credentials, no new client IDs.

---

## Step 4: Database — No Changes Needed

The mobile app connects to the **exact same Supabase database** as your web app. All tables, RLS policies, RPC functions, and triggers are shared. The anon key + RLS ensures each user only sees their own data.

**How it works:**
- Web app: `@supabase/ssr` with cookie-based auth → API routes → Supabase
- Mobile app: `@supabase/supabase-js` with AsyncStorage-based auth → Supabase **directly**

Both authenticate against the same Supabase Auth instance, so the same Google account works on both. Data syncs automatically since they share the same database.

---

## Step 5: Build the APK

### Option A: Cloud Build with EAS (Recommended — no Android Studio needed)

1. Log in to Expo/EAS:
   ```bash
   eas login
   ```

2. Configure the project (first time only):
   ```bash
   eas build:configure
   ```
   This updates `app.json` with your EAS project ID.

3. Build a preview APK:
   ```bash
   eas build -p android --profile preview
   ```
   This builds an `.apk` file in the cloud (~5-15 min). When done, it gives you a download URL.

4. Download the APK to your phone and install it.

### Option B: Local Build with Android Studio

1. Install Android Studio and set up the Android SDK
2. Generate the native project:
   ```bash
   npx expo prebuild --platform android
   ```
3. Build the APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
4. The APK will be at `android/app/build/outputs/apk/release/app-release.apk`

---

## Step 6: Install on Your Pixel

### From EAS (cloud build):
1. Open the download URL from step 5 on your Pixel's browser
2. Download the `.apk`
3. Tap the download notification → Install
4. If prompted, allow "Install from unknown sources" for your browser

### From your Mac via USB:
1. Enable **Developer Options** on your Pixel (Settings → About phone → tap Build number 7 times)
2. Enable **USB debugging** in Developer Options
3. Connect your Pixel via USB
4. Run:
   ```bash
   adb install path/to/app-release.apk
   ```

---

## Step 7: Development Mode (Optional)

For testing during development without building an APK every time:

1. Install Expo Go from the Play Store on your Pixel
2. Start the dev server:
   ```bash
   npx expo start
   ```
3. Scan the QR code with your Pixel's camera

**Note:** Deep linking (the OAuth redirect) requires a development build instead of Expo Go:
```bash
eas build -p android --profile development
```

---

## Architecture Notes

### What's different from the web app

| Feature | Web App | Mobile App |
|---------|---------|------------|
| Framework | Next.js (App Router) | Expo (React Native) |
| Styling | Tailwind CSS | React Native StyleSheet |
| Navigation | File-based routing + Dock | Expo Router + Bottom Tabs |
| Auth storage | Cookies (SSR) | AsyncStorage |
| Auth flow | Supabase OAuth (browser redirect) | Supabase OAuth (in-app browser) |
| API calls | Next.js API routes → Supabase | Direct Supabase client calls |
| Recommendations | Vector search + Claude fallback | Claude API + local scoring fallback |
| Animations | Framer Motion | React Native Animated |
| Embeddings | Transformers.js (server-side) | Not needed (Claude handles ranking) |
| Google credentials | Stored in Supabase dashboard | Same — reuses Supabase's config |

### Recommendation engine

The mobile app calls the **Claude API directly** (same model as the web app — `claude-sonnet-4-6`) to pick 3 personalized tasks. The prompt sends all your habits + assignments to Claude and asks it to pick the best 3 for the current time of day — identical to the web app's `claudeFallback` logic.

If the API key is missing or the call fails, it falls back to a **local scoring algorithm** that ranks by urgency, streaks, time-of-day match, and priority.

The only difference from the web app is that vector search (pgvector embeddings) is skipped — Claude handles ranking directly instead of using embeddings as a first pass. In practice this works just as well since the web app already falls back to Claude when fewer than 3 vector results come back.

---

## Quick Start Summary

```bash
# 1. Copy env vars from web app
cd pixel-app
cp .env.example .env.local
# Edit .env.local — paste your Supabase URL, anon key, and Anthropic key

# 2. Add flowstate:// redirect URL in Supabase dashboard

# 3. Install + build
npm install
eas login
eas build:configure
eas build -p android --profile preview

# 4. Download APK → install on Pixel
```

---

## Troubleshooting

### "Google Sign-In failed"
- Verify `flowstate://` is in Supabase redirect URLs (Dashboard → Auth → URL Configuration)
- Make sure Google provider is enabled in Supabase (Dashboard → Auth → Providers → Google)
- Try clearing the app cache or reinstalling

### "Network error" or data not loading
- Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are correct
- Test the Supabase connection in Expo Go first before building an APK

### Recommendations showing "Suggested for you" instead of AI reasons
- Verify `EXPO_PUBLIC_ANTHROPIC_API_KEY` is set correctly
- Claude couldn't be reached — the app fell back to local scoring (still works, just less personalized reasons)

### Data not syncing between web and mobile
- Sign in with the **same Google account** on both platforms
- Pull-to-refresh on any screen to force a data reload

### APK won't install
- Enable "Install from unknown sources" in your Pixel settings
- If upgrading, uninstall the old version first (unless using the same signing key)

---

## File Structure

```
pixel-app/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout (auth guard)
│   ├── login.tsx               # Google OAuth login
│   └── (tabs)/                 # Bottom tab navigator
│       ├── _layout.tsx         # Tab bar config
│       ├── today.tsx           # Dashboard (recs + habits + assignments)
│       ├── week.tsx            # Week calendar view
│       ├── grind.tsx           # Quote feed
│       ├── growth.tsx          # Life areas + journal
│       ├── focus.tsx           # Pomodoro timer
│       └── settings.tsx        # Account + preferences
├── lib/
│   ├── supabase.ts             # Supabase client (AsyncStorage sessions)
│   ├── types.ts                # TypeScript types (shared with web)
│   ├── api.ts                  # All data ops + Claude recommendations
│   ├── auth-context.tsx        # Auth state provider
│   ├── quotes.ts               # Motivational quotes data
│   ├── utils.ts                # Date formatting, time-of-day, etc.
│   └── theme.ts                # Colors, spacing, typography constants
├── app.json                    # Expo config
├── eas.json                    # EAS Build profiles
├── package.json                # Dependencies
└── SETUP.md                    # This file
```
