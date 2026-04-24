# UX and Layout

## Mobile-first

The primary users — people who are unhoused or in a crisis — are almost exclusively on phones, often with older hardware, potentially low battery, and in outdoor conditions (sun glare, wet hands, hurrying). Every layout decision is evaluated mobile-first. Desktop is a secondary surface used mainly by moderators and volunteers printing posters.

Practical implications:
- Touch targets are at minimum 44px tall
- The FAB sits in the bottom-right corner (thumb reachable on both hands)
- Text is large enough to read in sunlight
- No hover-only affordances for primary actions
- The viewport uses `100dvh` (dynamic viewport height) rather than `100vh` to account for mobile browser chrome (address bar, bottom nav) that can change height during scrolling

## Resource panel: bottom sheet on mobile, sidebar on desktop

When a map pin is selected, the resource detail opens as a bottom sheet that slides up from the bottom of the screen on mobile. On desktop (≥768px) it becomes a right sidebar. This is a standard pattern (Google Maps, Yelp) that mobile users recognize.

The bottom sheet covers ~65% of the viewport, leaving the map visible behind it. The map should remain pannable while the panel is open — this lets users orient themselves to the pin they tapped without closing the panel. (Current prototype does not yet implement this; the panel intercepts scroll events. Fix before launch.)

A drag handle is shown on mobile to suggest dismissibility. The panel closes on the ✕ button or can be dismissed by selecting another pin (which replaces it).

## Filter bar

Horizontal scrollable chip row, positioned just below the header. Chips can be multi-selected — a user might want to see both shelters and food banks at once. Selecting "All" deselects everything and shows the full map.

Each chip uses the tag's color when active so the visual feedback is immediate and matches the map pin colors. The bar is scrollable with `scrollbar-width: none` to avoid a visible scrollbar that would look awkward on mobile.

**What was considered and rejected:** A dropdown filter or a collapsible sidebar. Both require an extra tap to reach. The chip bar keeps filters one tap away at all times, which matters when someone is standing on a street corner trying to find the nearest bathroom.

## Add resource: FAB + modal

The FAB (floating action button) is the primary entry point for adding a resource. It's also accessible from the header "+ Add" button for users who have already scrolled past the map controls. Both open the same modal.

The modal slides up from the bottom on mobile (matching the bottom sheet pattern) and centers as a dialog on larger screens.

The location picker offers two modes: address input and "use my location." The map pin-drop mode (showing a map to tap) is stubbed in the prototype but should be implemented — many resources don't have a formal address (a covered spot under a bridge, a water fountain in a park).

## Navigation structure

The app has three pages: map (`/`), admin (`/admin`), and poster (`/poster`). Navigation is intentionally minimal:
- Header links to Admin and Poster
- Both pages have a back link to the map
- No bottom navigation bar — the map is the entire experience, not one of several tabs

A bottom nav bar was considered but rejected. It would take up vertical space permanently, pushing the map content up. Given that the map is ~95% of the user's time in the app, the tradeoff is wrong. Admin and Poster are accessed infrequently enough that header links are fine.

## Disclaimer banner

The disclaimer is a dismissible banner at the top of the main view, not a modal that blocks use. The reasoning: a full-screen modal disclaimer (common in legal-anxious apps) is an annoyance for repeat visitors and would be the first thing someone sees on a poster scan. Show it prominently but don't block the map. After dismissal it's gone for the session.

The banner shows a short summary by default with an expand link to the full legal text, so it doesn't dominate the screen on first load.
