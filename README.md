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
      full artist bio
- [x] `Schedule` — today's show list via `/api/week-info`, day name in French
- [x] Real audio playback: persistent bottom player + fullscreen "Now Playing"
      overlay (Spotify-style open/close animation), lock screen artwork via
      the Media Session API
- [x] Network resilience: automatic stream reconnection with backoff on
      connection loss, explicit offline/error banners (important for a live
      audio stream used on mobile/roaming)
- [x] Deployed to production (see below)
- [ ] `Library` — disabled placeholder ("coming soon"), pending backend/auth
- [ ] User accounts, liked tracks / playlists (Phase 2, needs a dedicated
      backend)

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
- [Oxlint](https://oxc.rs/) for linting

## Getting started

```bash
npm install
npm run dev
```

The dev server proxies `/api`, `/stream.mp3` and `/feeds` to
`https://radio.yologaza.com` (see `vite.config.ts`), so the app works against
the live LibreTime data without any local backend.

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
    library/                # Placeholder for future "liked tracks" feature
    player/                 # Bottom player, fullscreen overlay, connection
                             # banner, Zustand store, live-info hook
  layouts/                  # AppLayout (shell combining nav + player + routes)
  lib/api.ts                 # Typed client for the LibreTime "legacy" API
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
