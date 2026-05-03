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
- Location (same interactive Leaflet pin picker used in Add, initialized at the resource's current coordinates — drag or tap to reposition)
- Directions (optional text input for contextual navigation help, separate from the coordinate-derived address)
- Hours / Availability (the same HoursPicker component used in the Add modal, pre-populated by parsing the resource's stored hours string)
- Wi-Fi Networks (shown only when the Wi-Fi tag is selected)
- Description / Notes (textarea)

**Save Changes** is disabled until at least one field differs from the saved resource (dirty-state check). Clicking it transitions to a **Review changes** screen rather than saving immediately.

**Review changes screen:** The panel header updates to "Review changes" and the scroll area shows a styled diff card for every modified field:

- **Text fields** (name, location, directions, description): a word-level LCS diff is applied. Removed words are shown in red strikethrough; added words are highlighted in green. For short values the whole diff is rendered inline. For longer values (combined before + after > 80 chars) the card shows a stacked Before / After layout — each line shows the full text with only its relevant changes marked (removals in Before, additions in After).
- **Tags**: removed tags appear as faded, struck-through colored badges; added tags appear with a `+` prefix and a colored border.
- **Hours**: only the days whose times or open/closed state actually changed are shown in a compact table (day label · old hours → new hours via word diff). Unchanged days are omitted entirely.
- **Wi-Fi networks**: networks are matched by SSID. Added networks show with a `+` prefix; removed networks show struck through. Changed networks (same SSID, different properties) show the SSID unchanged and then diff the specific property that changed: password type is shown as a word diff, and if the password value changed the old and new password strings are shown inline (old struck through, new highlighted) in monospace.

The footer in review mode shows **Go back** (returns to the edit form without losing changes) and **Save** (applies all changes). Saving writes the updated resource back to state; the panel returns to view mode and the map pin reflects any tag changes immediately. Cancel reverts without saving. The ✕ button closes the panel entirely (does not just cancel the edit).

## Filter bar

Horizontal chip row, positioned just below the header. Chips can be multi-selected — a user might want to see both shelters and food banks at once. Selecting "All" deselects everything and shows the full map (including clearing "Open Now").

Each chip uses the tag's color when active so the visual feedback is immediate and matches the map pin colors.

A "More …" button always appears at the right edge of the chip row. Tapping it expands the filter bar into a wrapping layout that shows every chip on screen at once, without scrolling — including the "Open Now" filter, which is only visible in the expanded state. This keeps all filters reachable in two taps on any screen size, including very small phones.

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

### Location: Pin only

The location field is always a pin-based picker — there is no free-text address input. An interactive Leaflet map (200px tall) is shown centered on Seattle. Tapping anywhere on the map drops a 📍 marker; the map flies to the tapped position. The marker is draggable for fine-tuning. Raw coordinates are shown below the map alongside a "Remove pin" link and a "Use my location" button (GPS). A "Use my location" button requests the device's GPS and places the pin at the user's current position.

After the pin stops moving, the app calls the Nominatim reverse-geocoding API (debounced 900 ms) and displays the resolved address as a hint below the coordinates — e.g. "318 2nd Ave Ext S, Pioneer Square, Seattle, WA". This address is what gets stored on submit; it falls back to raw `"lat, lng"` if geocoding fails. The field is never user-typed.

If the form is submitted without placing a pin, the resource is assigned a randomized location near Seattle (mockup behavior until geocoding is wired up).

### Directions

A **Directions** field (optional text input) appears below Location. It is for human-readable navigation context that coordinates alone cannot convey — entrance details, landmarks, staff to ask, which side of the building, etc. It is separate from Description, which covers what the resource offers rather than how to find it.

### Hours / Availability picker

The hours field is a structured UI rather than a free-text input:

- Two preset toggle buttons: **24/7** and **Closed**. Tapping an active preset toggles it off and returns to custom mode.
- When neither preset is active (custom mode): a row of day-of-week toggles (Mon–Sun), each with two `<select>` dropdowns for open and close times (15-minute increments). Time is displayed in the system's preferred format: 12-hour with AM/PM if the user's locale uses it, 24-hour otherwise.
- Times default to unset ("--") for all days. When the user first sets a time for any day and all other days have no time yet, that time is automatically applied to all seven days — reducing tedium when hours are the same every day.
- A **×** button on each day (shown only when times are set) clears that day's time back to unset, while leaving the day's toggle on or off unchanged.
- Time is only changeable via the dropdown selects — there is no manual text entry.
- A live summary line (e.g. "Mon–Fri 8am–5pm") updates as the user makes selections.
- The structured value is serialized to a human-readable string (e.g. "Mon–Fri 9am–5pm") on submit and stored on the Resource.

### Draft persistence

If the user dismisses the Add dialog via the ✕ button, the Escape key, or clicking the backdrop — without pressing Cancel or Submit Resource — all form inputs are preserved. Reopening the dialog restores the draft. Pressing **Cancel** explicitly discards the draft. Pressing **Submit Resource** also clears it.

### Clear button

A **Clear** button in the modal footer resets all fields to their empty defaults without closing the modal.

### Submit creates a map pin

Submitting a valid form (name + at least one type required) immediately adds the resource to the in-memory resource list. A pin appears on the map and the resource panel opens for the new entry. In production this would persist to the backend; in the current prototype it is stored in React state for the session.

## Navigation structure

The app has two pages: map (`/`) and admin (`/admin`). Navigation is intentionally minimal:
- Header has a link to About; the About modal contains the "Print a poster" entry point
- The Admin panel (`/admin`) is not linked from the header — it is accessible by direct URL only. This keeps it invisible to end users and reduces curiosity-clicks from people who have no reason to be there.
- No bottom navigation bar — the map is the entire experience, not one of several tabs

A bottom nav bar was considered but rejected. It would take up vertical space permanently, pushing the map content up. Given that the map is ~95% of the user's time in the app, the tradeoff is wrong. Poster printing is accessed infrequently enough that a link inside the About modal is fine.

## About modal

An "About" button in the header (between the language selector and the "+ Add" button) opens a modal that explains what SignPost is, how to use it, and the app's privacy posture. It is aimed at first-time users who arrive via a poster QR scan and have no other context. The modal is dismissed with the ✕ button, a click outside it, or Escape.

The About modal also contains the "Print a poster →" entry point. Clicking it opens the language-selection dialog directly — the user never navigates away from the map. After selecting languages and confirming, the browser print dialog opens (the poster is rendered as a React portal into `document.body`). The About modal remains open throughout and after printing.

## Poster / downloadable PDF

The poster page produces a printable flyer intended to be posted in physical locations (laundromats, shelters, community centers) so people without smartphone data can still discover the map by scanning or typing the URL.

### Language selection

Before the browser print dialog opens, a modal asks which languages to include on the poster (1–3 languages). The modal defaults to whichever language the app is currently set to. Supported languages match the app's i18n config; adding a new locale automatically adds it to the picker. The option list scrolls to accommodate the full set of languages. The order of selection is preserved in the printed layout.

The app currently ships with 26 language options: Amharic, Arabic, Chinese, Dutch, English, French, German, Haitian Creole, Hindi, Igbo, Italian, Japanese, Korean, Oromo, Polish, Portuguese, Russian, Somali, Spanish, Tagalog (Filipino), Tigrinya, Twi, Ukrainian, Urdu, Vietnamese, and Yoruba. Languages without a full translation fall back to English for app UI text; the poster column header (`langLabel`) is always rendered in the native language.

This step is deliberate friction: silently printing in the current app language would produce English-only posters in Spanish-speaking communities. Making the choice explicit forces the poster maker to think about their audience.

### Print design constraints

The PDF output is designed for a standard US letter sheet (8.5 × 11 in, 0.5 in margins) on any black-and-white printer. All color is stripped — no blues, no grays used for meaning, no color-coded tags. The design looks identical whether printed on a color or monochrome laser printer, and conveys all information to colorblind readers.

The font stack is Arial → Helvetica Neue → Helvetica. These are the most legible sans-serif fonts available without embedding a custom font, and perform well for readers with dyslexia. Additional dyslexia-friendly choices applied: `line-height: 1.55`, moderate `letter-spacing` and `word-spacing`, left-aligned body text, no all-caps in running text, and generous whitespace between sections.

The QR code is generated at print time using the `qrcode` library (`QRCode.create()`, synchronous), encoding the site origin URL. It renders as an inline SVG. The hostname is printed in large type to the right of the QR code so the poster remains useful even if the QR cannot be scanned. All QR codes in the poster — both the main code and the tab codes — are real and scannable.

### Multi-language layout

When two or three languages are selected, the feature list is split into equal-width columns (one per language), each headed by a language label. The scan prompt is shown once per language to the right of the QR code. Legal text is repeated per language in small type.

A single language produces a spacious single-column layout. Two languages produces a side-by-side split. Three columns is compact but readable at 11pt. The poster is constrained to one page; the layout has been verified to fit all three-language combinations on US letter paper with standard printer margins.

### Tear-off tabs

Eight tear-off tabs run along the bottom of the page, separated from the body by a dashed cut line with a scissors symbol (✂). Each tab contains a small scannable QR code (same URL as the main code) plus the hostname in small type. The QR code makes the tab immediately actionable once torn off, without requiring the recipient to manually type a URL.

The tabs are always pinned to the physical bottom of the printed page using flex layout (`margin-top: auto` on the tabs container) and `min-height: 11in` on the page.

### Print margins and date

The `@page` margin is set to zero to suppress the browser's built-in header/footer text (page number, tab title, and origin URL) that would otherwise appear in the printed margins and collide with the tear tabs and poster title. Content padding is handled by `.pp-page` (0.5 in on all sides, matching standard printer margin assumptions).

The current date is printed at the upper left of the poster header, within the content padding, so volunteers know when the poster was generated and the date falls in a reliably printable area.

### Demo mode watermark

When `VITE_DEMO_MODE=true`, the printed poster renders a large diagonal "DEMO — DO NOT PRINT" watermark across the page. The text is translated into the app's current UI language via the `demo.posterWatermark` i18n key (all 26 locales are covered). The watermark renders at 28% red opacity so the underlying poster content remains readable. The font size (46pt) is calibrated so the full text fits within the page bounds at a −40° angle for the longest supported translations.

### Implementation note

The printable poster is rendered into a React portal directly on `document.body` (separate from the `#root` div) and hidden with `display: none` on screen. The `@media print` rule shows `#print-poster-root` and hides the app UI by targeting specific classes (`.app-shell`, `.page-container`, `.skip-link`) rather than hiding `#root` itself. This keeps React's DOM tree intact during the print transition so that any open modals (e.g. the About modal) do not flash hidden and reappear when the print dialog opens and closes.

## Disclaimer banner

The disclaimer is a dismissible banner at the top of the main view, not a modal that blocks use. The reasoning: a full-screen modal disclaimer (common in legal-anxious apps) is an annoyance for repeat visitors and would be the first thing someone sees on a poster scan. Show it prominently but don't block the map. After dismissal it's gone for the session.

The banner shows a short summary by default with an expand link to the full legal text, so it doesn't dominate the screen on first load.
