# Design Decisions

This directory records the *why* behind decisions made in this project — not what the code does (the code does that), but why it was built this way instead of some other way. The goal is to prevent future contributors (or future us) from having to re-derive reasoning, accidentally undoing something intentional, or bikeshedding over settled questions.

A decision documented here doesn't mean it's permanent — it means anyone who wants to revisit it should read the rationale first.

## Documents

| File | What it covers |
|------|----------------|
| [architecture.md](architecture.md) | Tech stack, build tooling, routing, CSS approach, why no backend yet |
| [map.md](map.md) | Map library and tile provider choice, custom marker design, Seattle scope |
| [ux-and-layout.md](ux-and-layout.md) | Mobile-first rationale, responsive layout patterns, navigation structure |
| [data-model.md](data-model.md) | Resource schema, tag taxonomy, community-editing model, anonymity |
| [moderation.md](moderation.md) | Admin access model, moderator workflow, export and data portability |
| [legal.md](legal.md) | Disclaimer design, intended-use framing, open source posture |
| [deploy.md](deploy.md) | VPS deployment, nginx config, least-privilege user setup, HTTPS |

## How to update these docs

Add a new file when a genuinely new category of decision comes up. Update an existing file when a decision changes — include what changed and why the earlier decision no longer holds. Don't delete old reasoning; mark it superseded so there's a record.

If a decision is still being debated, don't document it here yet — use a PR comment or issue thread. This directory is for things that are settled enough to act on.
