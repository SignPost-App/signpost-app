# Architecture

## Build tooling: Vite + TypeScript

Vite was chosen over Create React App (unmaintained) and Next.js (see below). It has near-instant cold starts, native ESM, and no configuration needed for a project this size. TypeScript is included from the start because the resource model has enough shape to benefit from types — tag unions, resource interfaces — and catching mistakes at compile time matters when volunteers may be modifying the code infrequently.

**Why not Next.js:** This is a client-side map app. There's no content that benefits from server-side rendering, no SEO requirement for individual resource pages, and no need for a Node.js deployment target. Next.js would add complexity (server/client component boundaries, a runtime) for zero benefit here. A plain SPA deployed as static files is simpler to host, cheaper to run, and easier for volunteers to redeploy.

## Routing

Three routes via react-router-dom v6:

- `/` — main map view (the primary experience)
- `/admin` — moderation panel, gated by access code
- `/poster` — printable QR code poster

The router is client-side only (BrowserRouter). Static hosting needs a rewrite rule that serves `index.html` for all paths. This is one line in Netlify/Vercel/nginx and is documented in the deployment notes.

## Styling: plain CSS with variables

No Tailwind, no CSS-in-JS. Reasons:

1. **Portability** — a volunteer picking this up should be able to read the styles without learning a utility framework.
2. **No build-time dependency** — plain CSS works everywhere, is trivially debuggable in DevTools.
3. **Design token discipline** — all colors, radii, shadows are CSS custom properties in `:root`. Changing the visual theme means editing ~15 lines, not grep-replacing utility classes.

The single `index.css` file is large but organized in clearly labeled sections. If it grows further it should be split by component, not by framework abstraction.

## No backend (yet)

The prototype uses `mockData.ts` — a static array of resources. There is no API, no database, no auth server. This was intentional for the prototyping phase: it lets the UI be developed and iterated without infrastructure decisions locking in the data model prematurely.

When a backend is added, the constraint is: it must be simple to redeploy. That points toward a managed database (Supabase, PocketBase, or a simple SQLite file served via a small Go/Node API) over a complex microservice setup. The admin export feature (JSON/CSV) exists partly to ensure data is never locked into whichever backend is chosen.

## Dependency philosophy

Keep the dependency count low. Current runtime deps: React, ReactDOM, react-router-dom, Leaflet, react-leaflet. Each one carries real cost (update burden, breaking changes, supply chain surface). Before adding a new dependency, ask whether it can be done in ~20 lines of code first.
