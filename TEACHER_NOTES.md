# Teacher notes: Atelier Lune takeover challenge

These notes live on the `solution` branch only. **Don't merge `solution` into `main`**: `main` is the starter students fork.

- `main`: the starter, with the 7 problems planted.
- `solution`: one commit per ticket, in the reference order, plus the reference [`DECISIONS.md`](DECISIONS.md), these notes and [`exercise.mdx`](exercise.mdx).

```bash
git log --oneline main..solution   # the reference progression
git diff main solution -- apps     # the whole reference fix
```

## How the challenge is built

- **Colistra doesn't exist.** The SDK (`packages/colistra-sdk`) and its README are the only source of truth. An AI assistant that hasn't read them will guess, and its guesses are plausible but wrong: euros instead of cents, `page` instead of `cursor`, kilograms instead of grams, retries "on by default".
- **The mock is realistic on purpose** (`apps/dashboard/src/mocks`):
  - 200–600 ms of latency on every request;
  - a rate limit of 10 requests per 5 s;
  - 5% of quotes fail;
  - 3% of label purchases are **charged but answered with a 502** (lost response).

  Most of the traps only show up because of these behaviours.
- **Deterministic seed data:** 120 orders (25 awaiting a label) and 95 shipments. Of the shipments, **11 are `exception`** and only 2 of those are on the first page; 3 are `returned`. AL-10042 is a delivered shipment on page 3. The numbers don't depend on the date.
- **Failures on demand:** `?chaos=off | ratelimit | flaky | down`, read once when the page loads (see `src/mocks/README.md`). `flaky` makes every other request fail, and failed label purchases are still charged. That's the best way to check ALN-44 in a student's deployment.
- **Mock data lives in memory:** a full page reload resets it. Students sometimes think their fix "lost" a label; it's the reload. A *hard* reload bypasses the service worker, and every request then fails with a network error.

## Expected outcome in 2 hours

| Level | Typical result |
| ----- | -------------- |
| Weak | Starts with the most "fun" ticket (ALN-29), runs out of time, both non-negotiables untouched. Or "fixes" 6 tickets superficially (disabled button, `/100` inline, client-side filter). No plan before coding. |
| Solid | ALN-44 and ALN-36 done properly, ALN-41, one more ticket. Plan committed first. `DECISIONS.md` honest about what's missing. |
| Strong | The reference order: ALN-44 → ALN-36 → ALN-41 → (CI) → ALN-33, with tests for each, CI green, deployed. Explains the link between retries and idempotency. Shows concrete AI corrections. |

## Ticket by ticket

### ALN-41: Absurd shipping costs (cents displayed as euros)

- **Root cause:** the shipments table formats `cost.amount` (integer cents) as if it were euros. The previous developer wrote it for SDK v1 (decimal euros); SDK 2.0 switched to integer cents (see the SDK changelog). The rest of the app already uses the shared `formatMoney()`.
- **Where:** `apps/dashboard/src/features/shipments/ShipmentsTable.tsx:53`: `{shipment.cost.amount.toFixed(2)} €`
- **Correct fix:** `{formatMoney(shipment.cost)}`, the existing formatter in `src/shared/format/money.ts`. One line.
- **Typical wrong AI fix:**
  - `(shipment.cost.amount / 100).toFixed(2) + ' €'` inline. It shows the right number, but duplicates formatting logic, ignores `currency` and drops the French format, so `20.30 €` sits next to `20,30 €` in the detail panel.
  - Worse: changing `formatMoney` itself, or "fixing" the mock data.
- **What to look for:**
  - The student found and reused `formatMoney`.
  - The diff is one line.
  - The detail panel and the table now agree.
  - Bonus: they searched for other `.amount` usages.

### ALN-38: Only the first 20 shipments (no pagination)

- **Root cause:** `shipments.list()` returns one page of 20 plus a `nextCursor`; the app ignores `nextCursor`. The footer says "Showing 20 shipments", which looks like everything.
- **Where:**
  - `apps/dashboard/src/features/shipments/useShipments.ts:5`: `colistra.shipments.list()` with no follow-up;
  - `ShipmentsPage.tsx` renders `data.data`.
- **Correct fix:** a "Load more" button that calls `list({ ...sameFilters, cursor: nextCursor })` and appends the results:
  - reset when the filters change;
  - ignore a page that arrives after the filters changed;
  - hide the button when `nextCursor` is `null`.

  An alternative is `autoPaginate({ limit: 100 })` to load everything in 1–2 requests. That's acceptable at 95 shipments if justified, but it won't scale at 60 orders a day.
- **Typical wrong AI fix:**
  - **`page` / `offset` parameters:** they don't exist (TypeScript catches it).
  - **`limit: 1000`:** rejected by the API (max 100) with a validation error, which the student must then notice.
  - **`autoPaginate()` with the default limit on every load:** 5 requests each time, plus filters and details, which hits the rate limit and brings back the white page if ALN-36 isn't done.
  - **Cursor sent without the filters:** the mock rejects it with `invalid_cursor` (the README says to resend the same filters).
- **What to look for:**
  - Filters are kept when loading more.
  - The list resets when the filters change.
  - Errors on "Load more" don't erase the rows already loaded.
  - The end of the list is handled.

### ALN-44: Charged twice for the same label (no idempotency key)

- **Root cause:**
  - `labels.create()` is called without an `idempotencyKey`, and the button stays clickable while the request is pending. A double click buys two labels.
  - Much worse, once retries exist (SDK `maxRetries`, a "Try again" button, or Inès clicking again after an error), a purchase whose response was lost (3% in the mock, 50% with `?chaos=flaky`) is bought again.
  - The README warns about this explicitly ("Retries and label creation").
- **Where:** `apps/dashboard/src/features/labels/useCreateLabel.ts:16`: `colistra.labels.create({ orderId: order.id, carrier: DEFAULT_CARRIER })`, plus `OrdersTable.tsx:59` (button never disabled).
- **Correct fix:** pass `{ idempotencyKey }` as the **second argument**. The key must identify **the purchase**, not the request: `label:{orderId}:{rateId or carrier}`, or a UUID created once per purchase intent and reused for every retry of it. Disabling the button while pending is a welcome UX addition.
- **Typical wrong AI fix:**
  - **Only disabling the button**, or a `isSubmitting` ref. This fixes the double click in the demo, but not lost responses, retries or two tabs. This is *the* classic, and the reason this ticket exists.
  - **`idempotencyKey` in the first argument** (request body): a TypeScript error, or an `as any` that silently sends no header.
  - **`crypto.randomUUID()` generated inside `createLabel()`** on every call: it looks right, but protects nothing.
  - **Debouncing the click handler.**
- **What to look for:**
  - Test their deployment: load `/orders?chaos=flaky`, note "Labels this month", click *Create label* once (with retries enabled), and check the count went up by exactly 1. Then double-click another order.
  - In `DECISIONS.md`, they explain why the key is shaped the way it is.
  - Strong students connect this ticket to ALN-36 (retries without keys make things worse) and do ALN-44 first.

### ALN-36: The page goes white (no error handling, no retries)

- **Root cause:** two things combined:
  1. `useColistraQuery` rethrows errors during render ("so they reach the nearest error boundary"), and `useCreateLabel` does the same, but there is **no error boundary**, so React unmounts the whole tree and leaves an empty `#root`.
  2. The client is created without `maxRetries`, which **defaults to 0**, so every 429 and 5xx is fatal.

  Triggers: clicking through about 10 shipments quickly (rate limit), the 5% quote failures, the 3% lost label responses, and `?chaos=down / ratelimit / flaky`.
- **Where:**
  - `apps/dashboard/src/shared/colistra/useColistraQuery.ts:39` (`setError(() => { throw error; })`);
  - `apps/dashboard/src/features/labels/useCreateLabel.ts:19`;
  - `apps/dashboard/src/shared/colistra/ColistraProvider.tsx:8` (no `maxRetries`).
- **Correct fix:**
  - Return `error` from the hook.
  - Render a clear message with a retry button on every page and in the detail panel.
  - Map the typed errors (`ColistraRateLimitError.retryAfter`, server versus network) to plain language.
  - Set `maxRetries` (2–3) on the client in `ColistraProvider`, which is safe only once ALN-44 is done.
  - Optionally add an error boundary as a safety net.
- **Typical wrong AI fix:**
  - **Only an error boundary at the root:** no more white page, but one failed request still replaces the whole page with an error, and there's no retry.
  - **Its own retry loop** (`for (let i = 0; i < 3; i++)`) or `setTimeout` reload, instead of the SDK's `maxRetries`. This ignores `retryAfter` and duplicates what the SDK does.
  - **Replacing the hook with TanStack Query:** a big rewrite, and its default 3 retries plus `maxRetries` multiply.
  - **`catch (e) { console.error(e) }`:** no white page, but an infinite spinner, so Inès still doesn't know what happened.
  - **Generic "Something went wrong" messages** for everything.
  - **Enabling `maxRetries` before fixing ALN-44:** this turns lost responses into double charges.
- **What to look for:**
  - `?chaos=down` on each page shows a message with the layout still visible.
  - `?chaos=ratelimit` with quick clicks recovers by itself.
  - The label failure message says whether it's safe to retry.
  - The existing hook API is kept.

### ALN-29: Rate comparison is missing

- **Root cause:** not built. *Compare rates* sets state that nothing reads, and labels are always bought with `{ carrier: 'colissimo' }`.
- **Where:** `apps/dashboard/src/features/orders/OrdersPage.tsx:19` (`// TODO: rate comparison` and the unused `setComparingOrder`), `OrdersTable.tsx:56`.
- **Correct fix:**
  - **Quote:** a panel or dialog that calls `rates.quote({ from: SHOP_ADDRESS, to: order.shippingAddress, parcel })` with `parcel = { weightGrams: Math.round(order.package.weight.value * 1000), lengthCm, widthCm, heightCm }`. `SHOP_ADDRESS` is already in `src/shared/shop.ts`.
  - **Choose:**
    - Sort the rates (the API returns them **unsorted**, in random order).
    - Highlight the cheapest and the fastest (Chronopost and DHL are both 1 day, so a tie-break is needed).
    - Let Inès pick a rate.
  - **Buy:** call `labels.create({ orderId, rateId }, { idempotencyKey })`.
  - **Errors:**
    - Handle the 5% quote failures (retry).
    - Handle expired rates after 15 min (`rate_expired`).
- **Typical wrong AI fix:**
  - **Wrong parcel units:**
    - `weightGrams: order.package.weight.value` (1.35): 422 "must be an integer";
    - `weight: 1.35` or `weightKg`: a TypeScript error, then often `as any`;
    - rounding kilograms to 1 gram: absurdly cheap prices;
    - dimensions in millimeters: rejected.
  - **Assuming the first rate is the cheapest**, because rates come back unsorted.
  - **Prices from the quote shown with `/100` inline** instead of `formatMoney` (the same mistake as ALN-41).
  - **Label still bought with `{ carrier }`**, which ignores the selected service and price (e.g. "Colissimo avec signature").
  - **No idempotency key on this new code path.**
- **What to look for:**
  - The units are converted in one named function.
  - The rates are sorted.
  - The chosen `rateId` is what gets bought, with a key.
  - Quote errors show a message.
  - The new component follows the existing panel style (`ShipmentDetailPanel`).

### ALN-33: No filter by status or search by order number

- **Root cause:** not built. The SDK supports `status` and `orderNumber` filters (server-side, before pagination); the app doesn't use them.
- **Where:** `apps/dashboard/src/features/shipments/ShipmentsPage.tsx:19` (`{/* TODO: filters */}`), `useShipments.ts:5`.
- **Correct fix:**
  - Pass `{ status, orderNumber }` to `shipments.list()`.
  - Add a status select (and ideally a one-click "problems only").
  - **Debounce** the search (about 300 ms) to stay under the rate limit.
  - Ideally keep the filters in the URL, and preserve them when opening a shipment (the detail panel is a route, so a naive `navigate('/shipments/' + id)` drops the query string).
- **Typical wrong AI fix:**
  - **`data.data.filter(s => s.status === status)`** in the browser. It only filters the 20 loaded rows: "problems only" shows 2 of the 11 exceptions, and searching `10042` finds nothing. This is the most common mistake.
  - **`autoPaginate()` everything then filter client-side:** it works, but it's heavy and fragile with the rate limit.
  - **No debounce:** typing `AL-10042` sends 8 requests, triggers 429s, and the white page returns if ALN-36 isn't done.
  - **Status labels typed by hand** instead of reusing `getStatusDisplay`.
- **What to look for:**
  - "Problems only" shows 11 shipments.
  - `10042` and `AL-10042` both find AL-10042.
  - Rapid typing doesn't hit the rate limit.
  - Filters survive opening and closing a shipment.
  - Combined with ALN-38, "Load more" keeps the filters.

### ALN-45: Quality (failing test, skeleton e2e, red CI)

- **Root cause:** CI (`.github/workflows/ci.yml`) fails at three successive steps:
  1. **`npm run typecheck`:** `formatDate(iso: string)` (`src/shared/format/date.ts:13`) is called with `shipment.estimatedDelivery`, typed `string | null` (`ShipmentDetailPanel.tsx:49`). The function already handles empty values at runtime. Locally, nobody noticed because `npm run build` is `vite build` without `tsc` (`apps/dashboard/package.json:8`).
  2. **`npm test`:** `shipmentStatus.test.ts` checks that every SDK status has a display label. `returned` was added in SDK 2.3 and is missing from `STATUS_DISPLAY` (`src/features/shipments/shipmentStatus.ts:9`, typed `Record<string, …>` so TypeScript didn't catch it). In the UI, returned parcels show a grey raw `returned` badge.
  3. **`npm run test:e2e`:** the workflow never runs `npx playwright install --with-deps chromium`, so Playwright can't find a browser on the runner (`ci.yml:31`). Locally it passes if the student already has browsers installed.

  The e2e suite itself is one trivial test plus an empty `test.fixme`.
- **Correct fix:**
  - Accept `string | null` in `formatDate`, or handle null at the call site.
  - Add `returned` (ideally retype the map as `Record<ShipmentStatus, …>`).
  - Add the browser install step to CI.
  - Write meaningful e2e tests, using `?chaos=` to test the error and idempotency paths.
- **Typical wrong AI fix:**
  - **Deleting or `.skip`-ping the failing test**, or changing its expectation.
  - **`// @ts-ignore`, `as string` or `!`** on the call site.
  - **Removing the e2e or typecheck step from CI.**
  - **Adding `tsc` to the build:** fine in itself, but students sometimes then "fix" the build by loosening `strict`.
  - **E2e tests that hit Colistra without `?chaos=off`**, flaky because of the 5% and 3% random failures.
- **What to look for:**
  - A green CI run on their fork's last commit.
  - Each fix addresses the cause.
  - E2e tests cover a non-negotiable. A good test: `?chaos=flaky`, one click, labels count +1. Our reference suite shows this test fails when the idempotency key is removed.

## Reviewing a submission (15 minutes)

1. **Read `DECISIONS.md` first.** Was the plan committed before the code (check `git log`)? Are the two non-negotiables first, and is the order justified by impact on Inès? Is the AI section concrete (a specific wrong suggestion and how it was caught) or generic?
2. **Open the deployed URL:**
   - `/shipments`: costs in `€` with commas, filters, "Load more".
   - `/orders?chaos=flaky`: create one label, check the counter goes up by 1.
   - `/orders?chaos=down`: a message, not a white page.
3. **Check CI** on the last commit.
4. **Skim the diff** (`git diff <fork-point>..HEAD -- apps`): small, focused changes that reuse `useColistraQuery`, `formatMoney`, `ErrorState`-like components and the `features/` structure. Red flags:
   - new libraries for trivial things;
   - rewritten files;
   - `as any` around SDK calls;
   - client-side filtering;
   - `/ 100` scattered around.

## Answers to questions students ask

- **"Can I change the mock?"** No. Treat it as Colistra's servers. If a student "fixes" ALN-41 by changing the seed amounts, or ALN-36 by removing the rate limit, that's the wrong answer.
- **"Can I add a library?"** Yes if justified, but the expected solution needs none. Don't penalize a reasoned choice; do penalize a rewrite.
- **"The data reset!"** A full reload resets the in-memory mock. Navigate within the app.
- **"Everything fails after a hard reload."** Shift+reload bypasses the service worker. Do a normal reload.
