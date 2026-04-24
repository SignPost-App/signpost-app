# SignPost — Agent Context

Community resource map for unhoused people in Greater Seattle. Mobile-first. Open source. No paid APIs.

## Commands

```
just dev       # start dev server (localhost:5173)
just build     # type-check + production build
just preview   # preview production build
just install   # npm install
```

## Design decisions

Before making architectural changes, adding dependencies, or modifying data structures, read the relevant doc in @docs/. The docs record *why* things were built the way they were — not just what exists. Key constraints that come up often:

- No paid map APIs (OpenStreetMap + react-leaflet only) — see @docs/map.md
- No user accounts or PII collection from regular users — see @docs/data-model.md and @docs/legal.md
- Mobile-first; every layout decision is evaluated on a phone screen first — see @docs/ux-and-layout.md
- Keep dependencies minimal — see @docs/architecture.md

## Project structure

```
src/
  App.tsx               # router: / /admin /poster
  types.ts              # ResourceTag union, TAG_CONFIG, Resource interface
  mockData.ts           # static mock resources (stands in for a real backend)
  index.css             # all styles; CSS variables in :root
  components/
    Header.tsx
    FilterBar.tsx
    MapView.tsx          # react-leaflet, custom divIcon markers
    ResourcePanel.tsx    # bottom sheet (mobile) / sidebar (desktop)
    AddResourceModal.tsx
    AdminPage.tsx        # moderator login + overview/resources/reports tabs
    PosterPage.tsx       # printable QR poster
    DisclaimerBanner.tsx
docs/                    # design decision records
```

## Current state

This is a non-functional UI prototype. `mockData.ts` is the only data source — there is no backend, no API, no persistence. The prototype exists to iterate on appearance and UX before any infrastructure is built.
