# Legal and Disclaimer

## Purpose of the disclaimer

The disclaimer serves two functions: limiting developer liability and communicating expectations to users. It is not intended to be adversarial toward the people using the app — many of whom are in a difficult situation and deserve straight talk, not legalese.

The short version shown by default in the banner:
> "This map is provided for informational purposes only. Conditions change — always use your own judgment and stay safe."

This is honest and practical. It tells users something true and useful: the app is community-maintained, data may be stale, don't rely on it blindly.

The full legal text is available via a "Full disclaimer" button that opens a modal popup. It covers:
- Community maintenance / no warranty on accuracy
- No endorsement of illegal activity
- Verify information before relying on it
- Developer contact

## Placement: dismissible banner, not blocking modal

The disclaimer is shown as a banner at the top of the main map view, not as a full-screen modal requiring acknowledgement before use. Reasons:
- A blocking modal is a dark pattern for an app serving people in crisis. It creates friction at exactly the wrong moment.
- Repeat visitors (people relying on the app regularly) shouldn't have to dismiss a modal every time.
- The legal protection from "user clicked OK on a modal" vs. "user saw a visible banner" is not meaningfully different.

After the user dismisses the banner for a session, it stays gone. A future implementation should persist this to localStorage so repeat visitors never see it again.

## "Not for illicit activity" framing

The app includes a clear statement that it is not intended for illegal use. This is:
1. Standard protective language for a platform with user-generated content
2. Genuine — the purpose is harm reduction and resource access, not facilitating crime
3. Not a practical enforcement mechanism. The statement signals intent and shifts responsibility to users who misuse it.

The disclaimer does not enumerate what counts as "illicit." Listing prohibited uses invites loophole arguments and is impossible to keep complete. The statement is intentionally general.

## Open source posture

The project is open source. This affects the legal posture in a few ways:
- Anyone can audit the code for privacy or security issues, which is a feature
- The license should be chosen carefully: MIT is permissive and common for community tools, GPL would require forks to remain open, AGPL extends that to network-deployed software. Given the mission (community benefit, not commercial), a copyleft license like AGPL is worth considering to prevent a commercial operator from taking the codebase without contributing back. **License choice is TBD and should be decided before public launch.**
- Contributors should be aware their contributions become part of a public codebase

## Privacy

No account system for regular users means no PII is collected from the people the app serves. This is intentional and should be maintained as a design constraint. If any future feature requires storing user data, it should go through explicit review against this principle.

For moderators, see [moderation.md](moderation.md).
