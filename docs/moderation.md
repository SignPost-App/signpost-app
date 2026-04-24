# Moderation

## Admin access model

Moderators ("vetter volunteers") access the admin panel at `/admin` via a pre-shared access code. There is no username, no email, no password recovery flow. The code grants entry; the session lasts until the tab is closed or the user signs out.

Why this approach:
- **No personal data collected from moderators.** Accounts create a table of who moderated what and when. We don't want that liability, and moderators (who may themselves be in vulnerable situations) shouldn't have to hand over an email address to help.
- **Simple to manage.** Access codes can be rotated, shared with a new volunteer over Signal, revoked by changing the server-side accepted codes.
- **Anonymous but accountable.** Moderator actions are logged server-side by session token, not by identity. If a code is abused, it gets revoked. Legitimate moderators don't need to be named.

The tradeoff is that access codes can be shared or leaked. This is acceptable at small scale (a handful of trusted volunteers). At larger scale, a more robust but still anonymous system (e.g., time-limited tokens) could be introduced without changing the UX model.

## Moderator capabilities

| Action | Who |
|--------|-----|
| Edit any resource | Moderators |
| Remove any resource | Moderators |
| Remove any comment | Moderators |
| Resolve flagged reports | Moderators |
| Export all data (JSON/CSV) | Moderators |
| View site traffic/load stats | Moderators |

Regular users can: add resources, edit resources, add comments, and flag resources or comments for review. Flagging does not immediately remove content — it queues it for a moderator.

## Moderation workflow (Reports tab)

When a user flags a resource:
1. The flag appears in the Reports tab with the user's note about what's wrong
2. A moderator reviews: reads the flag, compares to current resource, decides to resolve (leave as-is), edit the resource, or remove it
3. Repeated flags on the same resource raise urgency

This is reactive moderation, not pre-publication review. The reason is the same as the community editing rationale: pre-approval creates a bottleneck that could delay or suppress accurate, urgent information. Moderators are a correction mechanism, not a gate.

## Data export

The export (JSON and CSV) exists for two reasons:
1. **Backup** — community-contributed data is valuable and should not be hostage to any particular hosting provider.
2. **Migration** — the backend will change as the project matures. Exportable data means no lock-in.

Export is moderator-only. The full dataset includes lat/lng of all resources, which is not sensitive (all resources are public locations), but bulk download of the full dataset doesn't need to be available to anyone with a browser.

## Traffic and server load monitoring

The admin overview panel shows visitor counts and basic load stats. The intent is to give moderators visibility into whether the app is getting real use (to justify continued hosting costs) and whether server load is spiking (e.g. a resource going viral on social media). This is not surveillance of individual users — aggregate counts only, no session tracking, no identifying information retained.

Specific tooling (Plausible, self-hosted analytics, server logs) is TBD and should be evaluated against the privacy posture of the project before deployment.
