# Elsewhere

A live travel concierge built with TinyFish. Enter a destination anywhere, origin, dates, adults, budget, interests and pace. Elsewhere discovers public providers and sends browser agents to interact with their real search forms, calendars and booking flows.

## What works

- Destination-independent source discovery through TinyFish Search for stays, transport, experiences, rentals and restaurants.
- Anonymous TinyFish browser research with date/party selection, up to two provider sources per run, structured evidence and actual provider URLs. No saved grocery profiles are used.
- Live activity, stop controls, provider fallback selection and partial results when individual websites fail.
- Saved trip board, itinerary draft from date-checked available options, editable day/time assignments, overlap and changed-date warnings, calendar/JSON export and print.
- Separate totals for each currency. Indicative prices, missing prices and unchecked dates are excluded from observed totals. There is no invented exchange rate or all-inclusive budget claim.
- Booking preparation: reopen a selected result, inspect dates/party/terms and stop before submitting or paying.
- Explicitly approved **free reservations only** can be submitted when the inspected provider supports it without deposits, card guarantees, fees or cancellation liability. A confirmation requires a provider reference. Enquiries are not auto-submitted.
- Paid bookings, login, OTP, identity documents and unsupported checkout flows require the user on the provider website. Browser checkout state is not assumed to transfer to the user's browser.

## Run locally

Node 22.18+ or Node 24+ is recommended. Dependencies are already installed in this checkout.

```sh
npm install
# Configure the keys below in a gitignored .env.local file.
# An inherited stale key overrides Node's env-file loading; unset it first.
unset TINYFISH_API_KEY
npm run dev -- --host 127.0.0.1 --port 3004
```

Open http://127.0.0.1:3004. The keys remain server-side:

```text
TINYFISH_API_KEY
VERRO_SIGNING_SECRET
VERRO_LIVE_ENABLED=true
```

The VERRO-prefixed configuration names are retained for compatibility with the existing local setup. No Browser Context Profile is needed for travel research. Never put secrets in goals, public variables or frontend code.

## Database and deployment

`.openai/hosting.json` retains the existing Site ID and declares a D1 binding named `DB`. Jobs are owner-scoped and stored in `travel_jobs`. Unique action IDs prevent replaying the same submitted action. Ambiguous starts stay uncertain rather than being retried automatically. A 40-run/day/user cap limits unintended usage; provider wallet limits also apply.

Generate migrations with `npm run db:generate`. For a new local database, build and apply each unapplied migration once:

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_furry_the_hand.sql
```

Sites provisions production D1 and applies migrations on deployment. Configure the three runtime keys as Sites secrets before publishing. Production write endpoints require the Sites-authenticated user; the existing owner-only audience is preserved. No separate travel-account sign-in is required for research.

Trip boards are saved in this browser's local storage; they do not sync across devices. Contact details for an approved free reservation are not saved in the trip board or D1 context, but are sent to TinyFish and the selected provider as disclosed in the approval form. Browser run history may contain submitted contact details.

## Evidence and limits

Global discovery does not mean every provider supports browser automation or anonymous checkout. Blocking sites return an explicit failure and can be replaced with another discovered source. A provider's successful run status alone is not an availability or booking confirmation.

- Dates must be valid, no earlier than today, and span 1–14 nights. The first version supports 1–12 adults; child fare/occupancy logic is not implemented.
- Research is bounded to 240 seconds per browser run, with no custom max_steps (the current TinyFish account rejects it).
- Prices are major currency units. `total` means an observed total for the selected party/duration; `from` prices are not treated as totals.
- Times are provider-local. Unknown duration, transfer time, timezone, taxes or cancellation rules remain unknown. Calendar events are planned events, not vouchers.
- Changing itinerary dates does not amend a reservation. Recheck the provider before booking.
- The agent is instructed to stop at financial commitments. There is no payment integration or universal transaction firewall. Only explicit, no-liability free reservations are eligible for agent submission.
- The app does not claim operator licensing, safety certification, lowest market price or guaranteed inventory.
- Starts and runs are not automatically repeated after uncertainty. Check the provider before another reservation attempt.

## Verification

Live check on 2026-11-01: Booking.com returned three Lisbon stay options after selecting 20–23 November 2026 and two adults. Prices were displayed in USD although the input budget was EUR; the UI keeps these currencies separate and labels unverified taxes. Desktop and 390px mobile layouts were checked, including adding a real returned offer to the itinerary. Kyoto research reached MAIKOYA’s date-specific tea ceremony booking form; pricing still needs confirmation because peak-period rates may apply. Hotel preparation reopened the Lisbon selection, selected a room and returned cancellation terms and excluded taxes, then stopped for the user to finish the paid booking. No reservation or payment has been made.

```sh
npm test
npx tsc --noEmit --incremental false
npm run build
```

Tests use isolated fixtures under `tests/`; they are never loaded by the application. Travel tests cover signed source authorization, ownership, replay prevention, supported TinyFish schemas, malformed evidence, exact-date availability, currency separation, itinerary conflicts, and approval/confirmation gates.

Live smoke tests use `scripts/check-travel-live.mjs` and store private run state in ignored `work/`. `start` incurs real browser usage; do not repeat it when existing runs are active. `poll` retrieves those runs without starting more. The script's fixed trips are test inputs only and are not imported by the app. Browser QA uses `scripts/check-travel-ui.mjs` against an existing local Chrome debugging endpoint and only the task's own tab.

## Source map

- `app/page.tsx`, `app/globals.css`: travel experience, discovery, activity, itinerary and booking approval.
- `lib/travel.ts`: shared contracts, dates, currency totals, URL checks and calendar export.
- `lib/travel-server.ts`: TinyFish discovery, browser tasks, signed sources, D1 job records and booking gates.
- `app/api/travel/`: configuration, discovery and job endpoints.
- `db/schema.ts`, `drizzle/`: durable job schema.
- `worker/index.ts`, `lib/server-env.ts`: request-scoped runtime secrets/bindings.

The previous Verro grocery source is preserved in `lib/verro.ts`, `lib/tinyfish.ts` and its tests. Its original page/styles/README are backed up under ignored `work/verro-preserved/`. Grocery endpoints are retired and cannot start new grocery runs. The existing max_steps fix is preserved.

Visual direction takes inspiration from Travel Productions: oversized condensed type, a dark cinematic canvas, layered imagery and editorial spacing. Photography is from Unsplash, stored in `public/images/`. Destination inspiration tiles are starter inputs, not fabricated search results. Antonio, DM Sans and Instrument Serif are self-hosted with their licenses in `public/fonts/`. Motion supports pause and reduced-motion preferences.

Local visual update: INR budgets and Indian number formatting are now the planner default. Browser goals request provider-side INR pricing where available; existing foreign-currency quotes retain their original currency. Full-bleed travel photography and labelled local inspiration images replace empty photo blocks when provider images fail. Changes after the cinematic deployment are local only.
