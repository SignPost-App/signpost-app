# Map

## Tile provider: OpenStreetMap

The map uses OpenStreetMap tiles via react-leaflet. This is a hard requirement from the MVP spec: no paid APIs. The alternatives and why they were ruled out:

| Option | Why not |
|--------|---------|
| Google Maps JS API | Requires billing account, costs money at scale, terms restrict caching |
| Mapbox | Free tier (50k loads/mo) is fine for now but requires an API key and a paid account at growth |
| HERE / TomTom | Same problem — free tiers, API keys, vendor lock-in |
| OpenStreetMap (chosen) | Truly free, open data, no key, community-maintained |

One tradeoff: OSM tile servers have a [usage policy](https://operations.osmfoundation.org/policies/tiles/) that discourages heavy usage on the default tiles. At real scale we should self-host tiles or use a commercial OSM-compatible provider (Stadia Maps, Maptiler free tier) that still uses OSM data but has capacity SLAs. This doesn't require changing any code — just the TileLayer URL.

The app also uses [Nominatim](https://nominatim.openstreetmap.org/) — the OSMF's geocoding service — to reverse-geocode pin placements into human-readable addresses (see `architecture.md` and `src/geocode.ts`). At scale, the Nominatim usage policy applies here too; consider self-hosting or a commercial geocoder at that point.

## Map library: react-leaflet

Leaflet is the canonical open-source map library. react-leaflet wraps it with React lifecycle management. The alternative, MapLibre GL (via react-map-gl), is more powerful (vector tiles, WebGL rendering, better mobile performance) but heavier to set up and overkill for a pin-based resource map. If we ever need heatmaps, clustering, or offline tile packs, revisit MapLibre.

## Custom pin icons

Default Leaflet markers are generic blue teardrops. We use `L.divIcon` with inline HTML to render:

- **Color-coded circle** with tag-specific border color and emoji interior
- **Rotated square (diamond)** for "avoid" areas — visually distinct warning shape
- **Selection state** — selected pins grow slightly and show a colored glow ring

The primary tag determines the pin color when a resource has multiple tags. This is arbitrary but consistent — the tag order in `TAG_CONFIG` implies visual priority.

One known issue with `divIcon`: Leaflet's z-index management doesn't work the same way as standard markers, so overlapping pins may not stack in an intuitive order. This can be fixed with `pane` configuration if it becomes a problem.

## Default viewport

Center: `[47.6062, -122.3321]` (downtown Seattle), zoom 13. This puts the majority of mock resources in view on first load.

## Locate button (go to my location)

A crosshair button is overlaid on the bottom-right of the map (above the FAB). On mount, `MapView` immediately calls `navigator.geolocation.getCurrentPosition()` in the background, which triggers the browser permission prompt on first visit and pre-fetches the user's position. The button shows a spinning arc icon while the position is being resolved.

When tapped:
- If the position is already known, the map flies there immediately.
- If the background fetch is still in progress, the map will fly to the position as soon as it arrives (no second fetch needed).
- If geolocation failed or was denied, a fresh `getCurrentPosition()` call is made.

On success the map flies to the user's position at zoom 15 and a blue dot marker is dropped there. The blue dot uses `L.divIcon` styled as a filled circle with a white border and a faint blue halo ring, matching the visual convention of Google Maps / Apple Maps. It is NOT a standard resource pin and has no click handler.

## Scope: Seattle and Greater Seattle Area

The MVP is intentionally scoped to Seattle. This affects:
- Default map center and zoom
- Mock data coverage
- Any future geographic filtering or search radius logic

The codebase has no hard geographic restriction — someone could add resources anywhere. "Seattle scope" is a product and moderation decision, not a technical one. If expansion is desired, the main thing to reconsider is the default viewport and how moderators are organized by region.

## Leaflet attribution

The Leaflet/CARTO attribution control is required for OSM tile usage compliance. At higher UI zoom levels the attribution text is scaled down in font size via CSS (e.g. `8px` at level 1, `7px` at level 2, `6px` at level 3) so it does not consume a disproportionate share of the narrower effective viewport. It remains visible and legible at these sizes. Do not remove it.
