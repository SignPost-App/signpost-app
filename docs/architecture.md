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

## Feedback collection (prototype)

The About modal includes a feedback form. Because there is no backend, feedback is handled by a Vite dev-server plugin (`vite.config.ts`) that:

- Registers a `POST /api/feedback` middleware during `npm run dev` only
- Writes each submission to `./feedback/<timestamp>_<id>.txt`
- Applies basic sanitization (strips non-printable control chars, enforces 10,000-char limit) and per-IP rate limiting (5 submissions / hour)
- Returns 404 in production builds (handled gracefully in the UI)

**This is intentionally temporary.** When the app has a real API, replace `submitFeedback()` in `AboutModal.tsx` and remove the plugin from `vite.config.ts`. The `./feedback/` directory is local-only and should be in `.gitignore`.

## Reverse geocoding: Nominatim

When a pin is placed or moved in the Add or Edit form, the app calls the [Nominatim reverse-geocoding API](https://nominatim.openstreetmap.org/reverse) to resolve the coordinates to a human-readable street address. The call is debounced 900 ms after the pin stops moving. The resolved address (e.g. `"318 2nd Ave Ext S, Pioneer Square, Seattle, WA"`) is displayed as a hint in the form and stored in `resource.address` on submit.

Nominatim is operated by the OpenStreetMap Foundation and is free with no API key. Its [usage policy](https://operations.osmfoundation.org/policies/nominatim/) requires:
- No more than 1 request per second (the 900 ms debounce satisfies this)
- A descriptive `User-Agent` header (sent as `SignPostApp/1.0`)
- Caching where possible (not yet implemented; acceptable at prototype scale)

At real scale, self-hosting Nominatim or switching to a commercial OSM-compatible geocoding service (Photon, Stadia Maps, Geoapify) is preferred. The logic lives in `src/geocode.ts` and is isolated from the rest of the app — swapping the implementation requires touching only that file.

## Dependency philosophy

Keep the dependency count low. Current runtime deps: React, ReactDOM, react-router-dom, Leaflet, react-leaflet. Each one carries real cost (update burden, breaking changes, supply chain surface). Before adding a new dependency, ask whether it can be done in ~20 lines of code first.

Nominatim is a runtime network call rather than a package dependency. It is the only external service the client contacts beyond the OSM tile server.
