# Radio Yologaza — Frontend

Modern, mobile-first React frontend for [Radio Yologaza](https://radio.yologaza.com/), a
Hip-Hop family radio station. This app is a from-scratch, Spotify-inspired
redesign of the previous legacy homepage, built as a standalone SPA that
consumes the existing [LibreTime](https://libretime.org/) public API in
read-only mode — no custom backend required for the current phase.

**Live in production at https://radio.yologaza.com/** (static build served by
the existing nginx, see [Deployment](#deployment) below).

## Status

- [x] Project bootstrap (Vite + React 19 + TypeScript, Tailwind CSS v4)
- [x] App shell: sidebar navigation (desktop) / bottom nav (mobile) + persistent
      bottom audio player
- [x] Routing: `Home`, `Schedule` (today's shows), `Library` (placeholder)
- [x] `Home` — station intro, social links as icons (Instagram, YouTube,
      Spotify, Apple Music, Shazam), auto-playing/swipeable photo carousel,
      full artist bio, "about the radio" section with an Instagram
      contact link styled as a pill button
- [x] `Schedule` — today's show list via `/api/week-info`, day name in French
- [x] Real audio playback: persistent bottom player + fullscreen "Now Playing"
      overlay (Spotify-style open/close animation), lock screen artwork via
      the Media Session API (re-applied on every stream reconnect; live-info
      polling kept alive in the background via `refetchIntervalInBackground`
      so track changes still reach the lock screen while the phone is locked)
- [x] Network resilience: automatic stream reconnection with backoff on
      connection loss, explicit offline/error banners (important for a live
      audio stream used on mobile/roaming)
- [x] Robust French text rendering: all dynamic text from the LibreTime API
      (track/artist/show names) is HTML-entity-decoded, so accents, cedillas
      and apostrophes always display correctly
- [x] Deployed to production (see below)
- [x] **Phase 2 (deployed to production, 2026-08-08)** — Google Sign-In
      (via `@react-oauth/google`), GDPR consent modal before starting the
      OAuth flow, `/confidentialite` privacy policy page, connected/
      disconnected states in `Library` (profile, logout, delete account
      via a reusable `ConfirmDialog`, liked tracks list) — backed by the
      new [`ReactRadioBackend`](https://github.com/dekpo/ReactRadioBackend)
      FastAPI service (`/app-api/*`, proxied in dev via `vite.config.ts`,
      proxied by nginx in production)
- [x] Like/unlike the currently playing track (heart button in
      `BottomPlayer` and the fullscreen "Now Playing" overlay, all track
      types are likeable including jingles/interludes), confirmed working
      end-to-end in production against real LibreTime data
- [x] The fullscreen "Now Playing" overlay auto-collapses on route change
      or successful Google login (so the page navigated to is actually
      visible), but stays open if the consent modal is simply cancelled —
      or if the login was triggered by tapping the heart on a track (the
      like is performed automatically right after login instead)
- [x] Mobile swipe gestures: swipe down on the fullscreen overlay to
      dismiss it, swipe up on the bottom player to open it (both via
      Framer Motion drag, matching native bottom-sheet conventions)
- [x] No previous/next track controls anywhere on the live stream (removed
      2026-08-08 — there's no queue to navigate yet; showing them, even
      disabled or gated behind login, was more misleading than helpful)
- [x] Bottom player restyled with a dark red-to-black gradient (consistent
      with the home hero and overlay artwork placeholder) to read as more
      clearly interactive
- [x] **On-demand playback of liked tracks** (2026-08-09, closing out Phase
      2): a "play" button on each item in the Library plays that liked
      track outside the live stream (`playerStore`'s new `'live' |
      'ondemand'` mode), reusing the same `<audio>` element as the live
      stream — the live auto-reconnect logic is fully disabled while in
      `ondemand` mode. Previous/next controls reappear, but only in
      on-demand mode (queue = the liked tracks list at the moment playback
      started). An explicit "Revenir au direct" button switches back to
      live (no ambiguous close-to-resume-live behavior). At the end of the
      queue, a random jingle plays as a transition before falling back to
      live automatically (`GET /app-api/jingles/random/audio`, new
      backend endpoint); any playback error (missing jingle/file) fails
      safe by returning to live directly.
      **Known limitation, deferred**: no like/unlike button while playing
      on-demand (the track is definitionally already liked); persisted
      drag-and-drop reordering of the liked-tracks list is a separate,
      future piece of work (would need a backend migration).
- [x] **On-demand playback polish** (2026-08-10, after real-conditions
      testing): unlike button restored in the Library list (heart, left of
      the play button), now behind a confirmation dialog since a liked
      track can only be rediscovered by listening to the live stream again;
      seek bar with scrubbing for on-demand playback (full bar + time
      labels in the fullscreen overlay; a thinner, desktop-only draggable
      progress line in the collapsed bottom player — deliberately not
      draggable on mobile, where the overlay is the place to seek); default
      volume raised to 100% (no in-app volume control exists on mobile, by
      design — see the dev rule below — so starting below max made the
      stream needlessly quieter than a competing app at the same hardware
      volume); fixed a pre-existing (since 2026-08-08) desktop layout quirk
      where the like heart in `BottomPlayer` floated mid-bar instead of
      sitting next to the track title.
- [x] **Repeat mode** (2026-08-10): Spotify-style 3-state cycle button in
      the fullscreen overlay (right of "next", on-demand only) — off ->
      repeat queue -> repeat track -> off. Repeat-track replays the
      current track directly on natural end (not via the shared "next"
      action, which is also used for manual skip and must always move
      forward even with repeat-track on). Repeat-queue loops back to the
      first track at the end of the queue **without** playing the
      transition jingle (that's reserved for the natural, non-repeating
      end of a listening session).
- [x] **Further UI polish (2026-08-10, evening, requested explicitly by
      the user per `.cursor/rules/design-change-approval.mdc`), built and
      passing lint/build but not yet deployed**: heart moved again in
      `BottomPlayer` (now right next to play/pause on the right side,
      no longer next to the track title); `NowPlayingOverlay`'s vertical
      spacing reduced on mobile (and its central column capped at
      `min(22rem, 42vh)`) so "Revenir au direct" is reachable without
      scrolling on short phone screens, which the on-demand seek bar had
      pushed below the fold.
- [x] **Shuffle mode** (2026-08-10, evening, on branch
      `feature/shuffle-dragdrop`): Spotify-style toggle in the fullscreen
      overlay to the left of "previous" (on-demand only), independent of
      `repeatMode`. Each activation re-shuffles a `playOrder` permutation
      while keeping the current track playing; deactivating restores
      natural queue order without changing the current track. Also fixes
      the play button visually sitting off-center (5 symmetric controls:
      shuffle / prev / play / next / repeat). No remaining-count UI
      (matches Spotify). Not yet deployed.
- [ ] **Deferred (same branch, next)**: persisted drag-and-drop reordering
      of the liked-tracks queue (needs a backend `position` column +
      reorder endpoint). See
      `AI-Context/handoff-phase2-shuffle-dragdrop/PROMPT.md` and
      `AI-Context/journal/2026-08-10.md`.

See `backend/README.md` in
[`ReactRadioBackend`](https://github.com/dekpo/ReactRadioBackend) for the
API this frontend talks to.

See `AI-Context/handoff-frontend-redesign/roadmap.md` and
`AI-Context/journal/` (in the parent repo, not committed here) for the full
history and multi-phase plan.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) as build tool / dev server
- [React Router](https://reactrouter.com/) for routing
- [TanStack Query](https://tanstack.com/query) for server-state / data fetching
- [Zustand](https://zustand-demo.pmnd.rs/) for client-side state (player, etc.)
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations (fullscreen
  player, carousel swipe gestures)
- [lucide-react](https://lucide.dev/) + [react-icons](https://react-icons.github.io/react-icons/) (brand/social icons)
- [@react-oauth/google](https://github.com/MomenSherif/react-oauth) for Google Sign-In
- [Oxlint](https://oxc.rs/) for linting

## Getting started

```bash
npm install
npm run dev
```

The dev server proxies `/api`, `/stream.mp3` and `/feeds` to
`https://radio.yologaza.com` (see `vite.config.ts`), so the app works against
the live LibreTime data without any local backend.

For the Phase 2 features (Google Sign-In, likes), also:

1. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID`
   (get it from the project owner — see `ReactRadioBackend`'s README for
   how it's created in Google Cloud Console).
2. Run the `ReactRadioBackend` FastAPI service locally on port `8001` —
   `/app-api` is proxied there by `vite.config.ts`, same-origin, no CORS
   needed.

Other scripts:

```bash
npm run build    # type-check + production build
npm run preview  # preview the production build locally
npm run lint      # run Oxlint
```

## Project structure

```
src/
  components/navigation/   # Sidebar, BottomNav
  features/
    home/                  # Home page: intro, social icons, carousel, bio
    schedule/               # Today's schedule, powered by /api/week-info
    library/                # Connected/disconnected states, profile, logout,
                             # delete account, liked tracks list
    auth/                   # authStore (Zustand), GDPR consent modal + Google
                             # Sign-In button
    likes/                  # likesStore (Zustand), LikeButton (heart on the
                             # currently playing track)
    legal/                  # /confidentialite privacy policy page
    player/                 # Bottom player, fullscreen overlay, connection
                             # banner, Zustand store, live-info hook
  layouts/                  # AppLayout (shell combining nav + player + routes)
  components/ui/            # Shared, reusable UI (e.g. ConfirmDialog)
  lib/
    api.ts                  # Typed client for the LibreTime "legacy" API
    backendApi.ts            # Typed client for our own FastAPI backend (/app-api)
```

## Backend / API

No custom backend yet. The app consumes LibreTime's existing public, read-only
endpoints directly:

| Endpoint | Used for |
|---|---|
| `GET /api/live-info` | Current/next track & show (bottom player + overlay) |
| `GET /api/week-info` | Full weekly schedule (filtered to "today" in the Schedule page) |
| `GET /stream.mp3` | Live audio stream |

A dedicated backend (e.g. FastAPI) is planned for a later phase, to support user
accounts and a "liked tracks" library — see the roadmap referenced above.

LibreTime's legacy API returns some text fields HTML-escaped (e.g. an
apostrophe comes back as `&#039;`). Since all site content is French (accents,
cedillas, apostrophes are common), `src/lib/api.ts` decodes every dynamic text
field (track title, artist, show names) before it reaches the UI.

## Network resilience

Since this is a live audio stream primarily used on mobile (often on the
move / roaming), the player handles connectivity issues explicitly rather
than failing silently:

- On a stream error or stall, it automatically reconnects with an
  exponential backoff (up to 5 attempts).
- It listens to the browser's `online`/`offline` events: while genuinely
  offline it stops burning retries and shows a clear banner, then reconnects
  immediately once the network is back.
- After exhausting retries with the network actually available, it shows a
  "Retry" banner instead of spinning forever.

See `src/features/player/BottomPlayer.tsx` and `ConnectionBanner.tsx`.

## Deployment

The production build (`npm run build`, static files in `dist/`) needs no
Node.js runtime on the server — it's uploaded via `scp` to
`/srv/yologaza-frontend/dist` on the VPS and served directly by the existing
nginx, alongside the untouched LibreTime legacy admin backend. Full details,
the exact nginx config and the rollback procedure are documented in
`AI-Context/deployment-plan.md` (parent repo, not committed here).
