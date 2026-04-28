# Data Model

## Resource schema

```ts
interface Resource {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tags: ResourceTag[];       // at least one required
  address?: string;          // reverse-geocoded from pin; falls back to "lat, lng" if geocoding fails
  hours?: string;            // free-text, not structured — too many formats to normalize
  directions?: string;       // optional human-written text clarifying how to find the location
  description?: string;      // community-written free text
  comments: Comment[];       // ongoing notes, separate from description
  addedAt: string;           // display string, e.g. "2 weeks ago"
  verified?: boolean;        // moderator-affirmed accuracy
}

interface Comment {
  id: string;
  text: string;
  addedAt: string;
}
```

`address` is auto-populated when a resource is created or edited: the pin coordinates are sent to the Nominatim reverse-geocoding API (see `src/geocode.ts`), and the resulting street address (e.g. `"318 2nd Ave Ext S, Pioneer Square, Seattle, WA"`) is stored. If the geocoding request fails or returns no result, the fallback is the raw coordinates formatted as `"lat, lng"`. The field is never a user-typed text input. Legacy mock data entries carry readable text addresses that predate this convention.

`directions` is optional free text for clarifying *how* to reach the location — entrance details, landmarks, staff to ask, etc. It is separate from `address` (which is purely coordinate-derived) and `description` (which covers what the resource offers).

Hours are stored as a human-readable string (e.g. `"Mon–Fri 9am–5pm, Sat 10am–3pm"`) serialized from a structured `HoursValue` object by `hoursToString()`. The Add/Edit form uses `HoursPicker`, which produces this structure, and `parseHoursString()` parses it back when opening the Edit dialog. Days with times set are parsed individually per group, so "Mon 9am–5pm, Tue–Fri 8am–5pm" correctly round-trips without collapsing all days to the first group's times.

The `DayHours` type used internally:

```ts
interface DayHours {
  open: boolean;
  openTime: string | null;  // "HH:MM" in 24-hour format, or null when unset
  closeTime: string | null;
}
```

A day can be toggled open with `openTime`/`closeTime` still null — meaning "open, but hours unknown". Such days are shown without a time range in the summary, and `isOpenNow()` treats them as open.

## Tag taxonomy

Tags are the primary classification mechanism. A resource can have multiple tags. The full set:

| Tag | Use case |
|-----|----------|
| `food` | Food banks, pantries, meal programs |
| `water` | Drinking water fountains, water distribution |
| `shelter` | Emergency shelters, overnight facilities |
| `bathroom` | Public restrooms |
| `charging` | Electrical outlets for phone/device charging |
| `wifi` | Locations with publicly accessible Wi-Fi |
| `shower` | Shower access |
| `harm-reduction` | Needle exchanges, naloxone, crisis services |
| `propane` | Propane tank sale or refill locations |
| `park` | Parks where people aren't harassed |
| `covered` | Rain shelter: overhangs, awnings, covered walkways |
| `avoid` | Hostile areas, aggressive security, police sweeps |

`avoid` is a special-case tag. It does not represent a resource in the typical sense — it represents a warning. Visually it renders differently (red diamond pin, red-tinted description panel). The fact that it lives in the same data model as resource tags is a pragmatic simplification; in a future backend model it might be its own type.

Adding new tags requires updating `TAG_CONFIG` in `types.ts` (icon, label, color) and the `ResourceTag` union type. There is intentionally no way to create ad-hoc tags from the UI — the taxonomy is curated to stay legible on the filter bar.

## Community editing model

Anyone can add a resource. Anyone can edit a resource. Anyone can add a comment. No account is required for any of these actions.

This is a conscious choice to maximize accessibility: requiring login excludes people without a phone number for SMS verification, a working email address, or the patience for an account flow. It does mean the data is more vulnerable to spam and misinformation, which is addressed through moderation rather than access control.

The `verified` flag is the moderator's signal that a resource has been checked. Unverified resources are still shown — withholding unverified information would remove potentially life-saving resources. Verification is an additive trust signal, not a publication gate.

## Anonymity of contributors

Comments have no `author` field. The prototype originally included one, but it was removed: even "Anonymous" as a label creates the expectation that identity could be tracked. No author field means there's nothing to display, nothing to log, and no temptation to collect it server-side later. If abuse becomes a problem, rate-limiting by IP (server-side) is the tool, not user identity.
