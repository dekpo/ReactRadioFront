# Radio Yologaza — Frontend

Modern, mobile-first React frontend for [Radio Yologaza](https://radio.yologaza.com/), a
Hip-Hop family radio station. This app is a from-scratch redesign of the current
legacy site (Spotify-inspired UI), built as a standalone SPA that consumes the
existing [LibreTime](https://libretime.org/) public API in read-only mode — no
custom backend required for the current phase.

## Status

Work in progress (early scaffolding phase). Current state:

- [x] Project bootstrap (Vite + React 19 + TypeScript, Tailwind CSS v4)
- [x] App shell: sidebar navigation (desktop) / bottom nav (mobile) + persistent
      bottom audio player
- [x] Routing: `Home`, `Schedule` (today's shows), `Library` (placeholder)
- [x] `Home` — station intro, social links (Instagram, Spotify, Apple Music,
      Shazam), artist bio
- [x] `Schedule` — today's show list via `/api/week-info`
- [ ] `Home` — full artist bio content (currently placeholder text)
- [ ] `Library` — disabled placeholder ("coming soon"), pending backend/auth
- [ ] Real audio playback wiring for the bottom player (`/stream.mp3` + live
      track/show info via `/api/live-info`)
- [ ] Deployment (staging first, before replacing the production homepage)

See `AI-Context/handoff-frontend-redesign/roadmap.md` (in the parent repo, not
committed here) for the full multi-phase plan, including future user accounts
and a "liked tracks" library backed by a dedicated backend.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) as build tool / dev server
- [React Router](https://reactrouter.com/) for routing
- [TanStack Query](https://tanstack.com/query) for server-state / data fetching
- [Zustand](https://zustand-demo.pmnd.rs/) for client-side state (player, etc.)
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- [lucide-react](https://lucide.dev/) for icons
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
    home/                  # Home page (station intro, links, bio)
    schedule/               # Today's schedule, powered by /api/week-info
    library/                # Placeholder for future "liked tracks" feature
    player/                 # Persistent bottom audio player + Zustand store
  layouts/                  # AppLayout (shell combining nav + player + routes)
  lib/api.ts                 # Typed client for the LibreTime "legacy" API
```

## Backend / API

No custom backend yet. The app consumes LibreTime's existing public, read-only
endpoints directly:

| Endpoint | Used for |
|---|---|
| `GET /api/live-info` | Current/next track & show (for the bottom player) |
| `GET /api/week-info` | Full weekly schedule (filtered to "today" in the Schedule page) |
| `GET /stream.mp3` | Live audio stream |

A dedicated backend (e.g. FastAPI) is planned for a later phase, to support user
accounts and a "liked tracks" library — see the roadmap referenced above.
