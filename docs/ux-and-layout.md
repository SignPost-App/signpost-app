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

### Community Notes: Post Note

The **Post Note** button is active (not disabled-only). Submitting a non-empty note appends it to the resource's comment list in state and clears the textarea. The new note appears immediately in the comments section with today's date. In production this would write to the backend.

### Edit mode

Tapping **✏️ Edit** transforms the panel into an inline edit form. The footer swaps to **Cancel** and **Save Changes** buttons. The edit form exposes:

- Name (text input)
- Type (same tag-checkbox grid as the Add modal)
- Location (address string only — pin coordinates are not editable here; a separate "move pin" flow should be added before launch)
- Hours / Availability (the same HoursPicker component used in the Add modal, pre-populated by parsing the resource's stored hours string)
- Description / Notes (textarea)

Saving writes the updated resource back to state; the panel returns to view mode and the map pin reflects any tag changes immediately. Cancel reverts without saving. The ✕ button closes the panel entirely (does not just cancel the edit).

## Filter bar

Horizontal chip row, positioned just below the header. Chips can be multi-selected — a user might want to see both shelters and food banks at once. Selecting "All" deselects everything and shows the full map (including clearing "Open Now").

Each chip uses the tag's color when active so the visual feedback is immediate and matches the map pin colors.

On narrow screens where not all chips fit in the single row, a "More …" button appears at the right edge. Tapping it expands the filter bar into a wrapping layout that shows every chip on screen at once, without scrolling. This keeps all filters reachable in two taps on any screen size, including very small phones.

The expanded chip panel is `position: absolute` and overlaps the map rather than pushing it down. The filter bar's height in the page layout never changes. This prevents the map from jumping when the panel opens or closes, which is disorienting on mobile. The panel animates via a `max-height` transition on a single DOM element — the same chips are visible in both the collapsed and expanded state, so there is no flash or misalignment between the two states.

### "Open Now" filter

An **Open Now** chip appears between the "All" button and the tag chips, separated by a thin vertical divider. It is styled in green (distinct from the tag-specific colors) to signal that it is a different kind of filter — time-based rather than category-based.

When active, "Open Now" filters the map to resources whose current hours indicate they are open. The logic uses `isOpenNow()` in `types.ts`, which calls `parseHoursString()` on each resource's `hours` field:

- `mode: 'always'` (24/7) → shown
- `mode: 'closed'` → hidden
- `mode: 'custom'` → checks the current day of week and time against the day's open/close window
- No hours set → shown (unknown hours, assume accessible)

"Open Now" is independent of the tag filters — both can be active simultaneously. Clicking "All" clears both tag filters and the "Open Now" state.

**What was considered and rejected:** A dropdown filter or a collapsible sidebar. Both require an extra tap to reach. The chip bar keeps filters one tap away at all times, which matters when someone is standing on a street corner trying to find the nearest bathroom.

## Add resource: FAB + modal

The FAB (floating action button) is the primary entry point for adding a resource. It's also accessible from the header "+ Add" button for users who have already scrolled past the map controls. Both open the same modal.

The modal slides up from the bottom on mobile (matching the bottom sheet pattern) and centers as a dialog on larger screens.

### Location: Address vs. Drop Pin

The location field offers two modes toggled by pill buttons:

- **Address** — text input for a street address or intersection, plus a "Use my location" button that requests the device's GPS and, if granted, switches to Drop Pin mode with the pin placed at the user's current coordinates.
- **Drop Pin** — renders a full interactive Leaflet map (200px tall) centered on Seattle. Tapping anywhere on the map drops a 📍 marker; the map flies to the tapped position. The marker is draggable for fine-tuning. Coordinates are shown below the map with a "Remove pin" link. If Drop Pin mode is active but no pin is placed, the submit flow falls back to a randomized location near Seattle (mockup behavior until geocoding is wired up).

Many resources don't have a formal address (a covered spot under a bridge, a park water fountain), so the Drop Pin path is the more important one for this use case.

### Hours / Availability picker

The hours field is a structured UI rather than a free-text input:

- Two preset toggle buttons: **24/7** and **Closed**. Tapping an active preset toggles it off and returns to custom mode.
- When neither preset is active (custom mode): a row of day-of-week toggles (Mo Tu We Th Fr Sa Su) and two `<input type="time">` fields for opening and closing time.
- A live summary line (e.g. "Mon–Fri 8am–5pm") updates as the user makes selections.
- The structured value is serialized to a human-readable string (e.g. "Daily 9am–6pm") on submit and stored on the Resource.

### Draft persistence

If the user dismisses the Add dialog via the ✕ button, the Escape key, or clicking the backdrop — without pressing Cancel or Submit Resource — all form inputs are preserved. Reopening the dialog restores the draft. Pressing **Cancel** explicitly discards the draft. Pressing **Submit Resource** also clears it.

### Clear button

A **Clear** button in the modal footer resets all fields to their empty defaults without closing the modal.

### Submit creates a map pin

Submitting a valid form (name + at least one type required) immediately adds the resource to the in-memory resource list. A pin appears on the map and the resource panel opens for the new entry. In production this would persist to the backend; in the current prototype it is stored in React state for the session.

## Navigation structure

The app has three pages: map (`/`), admin (`/admin`), and poster (`/poster`). Navigation is intentionally minimal:
- Header has a link to About; the About modal contains the "Print a poster" entry point
- Both non-map pages have a back link to the map
- The Admin panel (`/admin`) is not linked from the header — it is accessible by direct URL only. This keeps it invisible to end users and reduces curiosity-clicks from people who have no reason to be there.
- No bottom navigation bar — the map is the entire experience, not one of several tabs

A bottom nav bar was considered but rejected. It would take up vertical space permanently, pushing the map content up. Given that the map is ~95% of the user's time in the app, the tradeoff is wrong. Poster is accessed infrequently enough that a link inside the About modal is fine.

## About modal

An "About" button in the header (between the language selector and the "+ Add" button) opens a modal that explains what SignPost is, how to use it, and the app's privacy posture. It is aimed at first-time users who arrive via a poster QR scan and have no other context. The modal is dismissed with the ✕ button, a click outside it, or Escape.

The About modal also contains the "Print a poster →" entry point. Clicking it opens the language-selection dialog directly — the user never navigates away from the map. After selecting languages and confirming, the browser print dialog opens (the poster is rendered as a React portal into `document.body`). The About modal remains open throughout and after printing.

## Poster / downloadable PDF

The poster page produces a printable flyer intended to be posted in physical locations (laundromats, shelters, community centers) so people without smartphone data can still discover the map by scanning or typing the URL.

### Language selection

Before the browser print dialog opens, a modal asks which languages to include on the poster (1–3 languages). Supported languages match the app's i18n config; adding a new locale automatically adds it to the picker. The order of selection is preserved in the printed layout.

This step is deliberate friction: silently printing in the current app language would produce English-only posters in Spanish-speaking communities. Making the choice explicit forces the poster maker to think about their audience.

### Print design constraints

The PDF output is designed for a standard US letter sheet (8.5 × 11 in, 0.45 in margins) on any black-and-white printer. All color is stripped — no blues, no grays used for meaning, no color-coded tags. The design looks identical whether printed on a color or monochrome laser printer, and conveys all information to colorblind readers.

The font stack is Arial → Helvetica Neue → Helvetica. These are the most legible sans-serif fonts available without embedding a custom font, and perform well for readers with dyslexia. Additional dyslexia-friendly choices applied: `line-height: 1.55`, moderate `letter-spacing` and `word-spacing`, left-aligned body text, no all-caps in running text, and generous whitespace between sections.

The QR code is rendered as an inline SVG with correct QR finder patterns, timing patterns, and the required dark module — visually indistinguishable from a real QR code. The URL `signpost.app` is printed in large type directly below it so the poster remains useful even if the QR cannot be scanned.

### Multi-language layout

When two or three languages are selected, the feature list is split into equal-width columns (one per language), each headed by a language label. The title and scan prompt are stacked vertically for all selected languages. Legal text is repeated per language in small type.

A single language produces a spacious single-column layout. Two languages produces a side-by-side split. Three columns is compact but readable at 11pt. All three cases fit on one letter-size page without page breaks.

### Tear-off tabs

Eight tear-off tabs run along the bottom of the page, separated from the body by a dashed cut line with a scissors symbol (✂). Each tab contains `signpost.app` in vertical text (`writing-mode: vertical-rl`) so when the strip is torn off and held upright, the URL reads normally. This is the standard tear-off flyer convention.

The tabs are always pinned to the physical bottom of the printed page using flex layout (`margin-top: auto` on the tabs container) and `min-height: 11in` on the page. This ensures the cut line appears at the paper edge regardless of how much content is above it.

### Print margins and date

The `@page` margin is set to zero to suppress the browser's built-in header/footer text (page number, tab title, and origin URL) that would otherwise appear in the printed margins and collide with the tear tabs and poster title. Content padding is handled by `.pp-page` instead.

The current date is printed in small type in the poster header so volunteers know when the poster was generated. The time is not included — only the date — to avoid the poster appearing stale after a few hours.

### Implementation note

The printable poster is rendered into a React portal directly on `document.body` (separate from the `#root` div) and hidden with `display: none` on screen. The `@media print` rule shows `#print-poster-root` and hides the app UI by targeting specific classes (`.app-shell`, `.poster-page`, `.page-container`, `.skip-link`) rather than hiding `#root` itself. This keeps React's DOM tree intact during the print transition so that any open modals (e.g. the About modal) do not flash hidden and reappear when the print dialog opens and closes.

## Disclaimer banner

The disclaimer is a dismissible banner at the top of the main view, not a modal that blocks use. The reasoning: a full-screen modal disclaimer (common in legal-anxious apps) is an annoyance for repeat visitors and would be the first thing someone sees on a poster scan. Show it prominently but don't block the map. After dismissal it's gone for the session.

The banner shows a short summary by default with an expand link to the full legal text, so it doesn't dominate the screen on first load.
