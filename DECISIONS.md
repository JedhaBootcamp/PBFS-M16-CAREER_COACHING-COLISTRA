# Decisions

> **Teacher reference.** This is what a strong 2-hour submission looks like. It describes the cut at 2 hours: ALN-44, ALN-36, ALN-41, ALN-33 and part of ALN-45. To give teachers a reference implementation of everything, this branch *also* implements ALN-38, ALN-29 and the full end-to-end suite in later commits. Sections 3 and 5 describe how those were done.

**Deployed URL:** https://atelier-lune-shipping.vercel.app _(example)_

**Time spent:** 2 h: 30 min reading and planning, 1 h 20 building, 10 min writing this.

## 1. Plan (written before coding)

| Order | Ticket | Why now |
| ----- | ------ | ------- |
| 1 | ALN-44 Charged twice | Non-negotiable. Real money lost, invisible until the monthly invoice. Must come **before** any retry logic (ALN-36), otherwise retries make it worse. |
| 2 | ALN-36 White page | Non-negotiable. Happens daily, and a white page right after *Create label* hides whether a label was bought. |
| 3 | ALN-41 Costs ×100 | A few minutes for a very visible bug that scares the accountant. |
| 4 | ALN-33 Filter & search | The most time Inès loses: every single morning, looking for problem parcels. |
| 5 | ALN-45 Safety net | Done along the way: a test with each fix, then CI green if time allows. |
| — | ALN-38 Pagination | Later: partly covered by the search in ALN-33. |
| — | ALN-29 Rate comparison | Later: biggest feature, and Inès has a workaround (the Colistra website). |

**Plan changes:** I moved the CI fix (part of ALN-45) before ALN-33. While doing ALN-36 I found that two of the three CI failures were 2-minute fixes (a `null` date type and a missing `returned` status), and I wanted CI to check my next commits.

## 2. Tasks done

### ALN-44: Charged twice for the same label

- **What I did:** every `labels.create()` call now sends an `idempotencyKey` built from the order and the carrier choice: `label:{orderId}:carrier:colissimo` (later `label:{orderId}:rate:{rateId}`). It lives in one pure function, `labelIdempotencyKey()`, used by `useCreateLabel`. I also disable the row's buttons while the purchase is pending.
- **Why first:** it's money lost for good, and nobody sees it until the end of the month. It also has to come before ALN-36: retrying failed requests automatically without a key would *increase* double charges, since a "failed" purchase may have been charged (the SDK README warns about this and the mock simulates it).
- **Trade-offs:**
  - **Deterministic key versus a random UUID.** A random key generated on each click protects nothing. A UUID generated once per "purchase intent" and kept in state would work, but it's lost on reload. The order + choice key survives a reload and a second tab.
  - **Downside:** buying a *second* label on purpose for the same order with the same carrier within 24 h returns the first label. That's rare for Atelier Lune (one parcel per order). With rate quotes it doesn't happen at all, since a new quote means new rate ids.
  - **Disabling the button is UX, not the protection.** It doesn't cover SDK retries, lost responses or two tabs.
- **How I tested it:** unit tests for the key (same input gives the same key; different orders or choices give different keys; 255 characters max). Manually, with `?chaos=flaky`: one click gives one label, even though the first response is lost.

### ALN-36: The page sometimes goes white

- **What I did:**
  - **Root cause:** `useColistraQuery` rethrows errors during render "so they reach the nearest error boundary", but there is no error boundary, so React unmounts the whole app. On top of that, `maxRetries` defaults to 0, so any 429 or 5xx kills the page.
  - **Hook:** `useColistraQuery` now returns `error`, and pages render it with a new `ErrorState` component. `describeError()` turns each typed Colistra error into plain language: how long to wait after a rate limit, "Colistra is having trouble", "can't reach Colistra", expired prices…
  - **Label purchases:** errors show a banner that says it's safe to try again (it is, thanks to ALN-44).
  - **Retries:** the client is created with `maxRetries: 2`, so most rate limits and transient errors never reach Inès.
  - **Safety net:** an `ErrorBoundary` around the pages as a last resort.
- **Why second:** non-negotiable, and it happens every day. The worst case (white page after *Create label*) is linked to ALN-44.
- **Trade-offs:**
  - **2 retries:** I kept the existing hook and its API (`data`, `isLoading`, `reload`, plus `error`) instead of switching to TanStack Query. That's less churn in a codebase I just inherited. With 2 retries, a rate limit can make a page wait up to about 10 s before showing an error. I preferred that to showing errors that would fix themselves.
  - **Not done:** an automatic "retry in N seconds" countdown; the message gives the delay instead.
- **How I tested it:** unit tests for `describeError`. In the browser with `?chaos=down`, `?chaos=ratelimit` and `?chaos=flaky` on both pages and in the detail panel.

### ALN-41: Absurd shipping costs

- **What I did:** the shipments table rendered `cost.amount.toFixed(2) + ' €'`, treating cents as euros (SDK 2.0 switched to integer cents; see the SDK changelog). I replaced it with the existing shared `formatMoney()`, already used everywhere else.
- **Why third:** 5 minutes for a very visible bug.
- **Trade-offs:** none. Dividing by 100 inline would also "work", but it would duplicate the formatting logic and drop the French format (`20,30 €`).
- **How I tested it:** e2e check that every cost matches `12,34 €`. In the browser, the table and the detail panel now show the same amount.

### ALN-45: The safety net is broken (partly)

- **What I did:** CI failed for three reasons:
  1. **Type error:** `formatDate()` was typed `string` but receives `estimatedDelivery: string | null`. I typed it `string | null`; it already handled the empty case.
  2. **Unit test:** the `returned` status (new in SDK 2.3) had no display label. I added it, and typed `STATUS_DISPLAY` with `Record<ShipmentStatus, …>` so the next new status fails the type check instead of a test.
  3. **Workflow:** the CI never installed the Playwright browser. I added `npx playwright install --with-deps chromium`.

  I also added unit tests with each fix.
- **Why:** cheap, and it makes CI useful for everything that follows.
- **Not done in the 2 hours:** real end-to-end tests (see section 3).

### ALN-33: Find problem parcels and specific orders quickly

- **What I did:**
  - **Filters:** a status filter, a "Show problems only" button and an order number search.
  - **Server-side:** the filters are sent to the API (`shipments.list({ status, orderNumber })`), not applied to the 20 rows already loaded.
  - **Debounce:** the search waits 300 ms after typing, so it doesn't burn through the rate limit (10 requests per 5 s).
  - **URL state:** filters live in the URL (`?status=exception&q=10042`). Inès can bookmark "problems only", and the filters survive opening a shipment.
- **Why fourth:** it's the daily pain: "every morning I look for red badges".
- **Trade-offs:**
  - Server-side filtering is the only correct option. Client-side filtering would only search the first page, and miss most exceptions.
  - The status filter is a single value, not multi-select. The SDK only takes one status, and "problems only" covers the main need.
- **How I tested it:** in the browser: "problems only" shows all 11 exceptions (only 2 were on the first page before); `10042` finds AL-10042.

## 3. Tasks skipped

### ALN-38: Older shipments are missing

- **Why I skipped it:** with the search from ALN-33, Inès can already find any shipment by order number, which covers the "customer calls about an old order" case. Browsing old shipments is rarer.
- **What I would do with more time (done after the 2 hours on this branch):**
  - A "Load more" button that follows `nextCursor`, sending the **same filters** with the cursor (the API rejects a cursor with different filters).
  - Reset the list when the filters change, and ignore a page that arrives after the filters changed.
  - **Not** `autoPaginate()` over everything: it would send 5+ requests on every page load and hit the rate limit.

### ALN-29: Compare carriers before buying a label

- **Why I skipped it:** it saves money on each label, but Inès has a workaround (the Colistra website). It's the biggest ticket (new panel, quotes, error cases) and needs ALN-44 and ALN-36 to be safe anyway.
- **What I would do with more time (done after the 2 hours on this branch):**
  - **Quote:** `rates.quote()` from `SHOP_ADDRESS` to the order's address, with the weight **converted from kg to integer grams**. `order.package.weight` is in kg; the API wants `weightGrams`.
  - **Choose:**
    - Sort the rates by price (the API returns them unsorted).
    - Highlight the cheapest and the fastest (ties broken by price).
    - Preselect the cheapest.
  - **Buy:** buy with `{ rateId }` and the idempotency key.
  - **Errors:**
    - Show the occasional quote failures (5%) with a retry.
    - Refresh expired quotes (15 min) instead of failing the purchase.

### ALN-45: the rest

- **What I would do with more time (done on this branch):** Playwright tests for:
  - one label per purchase, on a double click and on a lost response with `?chaos=flaky` (this test fails if the idempotency key is removed);
  - the error messages with `?chaos=down`;
  - automatic retries with `?chaos=ratelimit`;
  - costs, filters, search and "Load more".

## 4. How I used AI

- **Tools:** Claude Code in the terminal.
- **How I gave it context about the Colistra SDK:**
  - First prompt: "Read `packages/colistra-sdk/README.md` and `packages/colistra-sdk/src/` and summarize the rules for money, pagination, errors, retries and idempotency. Don't write code yet."
  - I checked the summary against the README. It had missed that `maxRetries` defaults to 0.
  - Then I gave it one ticket at a time, and asked it to reuse the existing hooks and components.
- **What it got wrong, and how I noticed:**
  - **ALN-41.** It proposed `(shipment.cost.amount / 100).toFixed(2)` inline in the table. That works, but it duplicates `formatMoney()` and drops the French format. I asked it to use the shared formatter.
  - **ALN-44.** Its first fix was to disable the button while the request was pending. I tested with `?chaos=flaky` and still got two labels, because the SDK retry re-sent the purchase. I pointed it to the "Idempotency" section of the README. Its second attempt passed `idempotencyKey` **in the request body** (`labels.create({ orderId, carrier, idempotencyKey })`), which TypeScript caught. Its third generated `crypto.randomUUID()` on every call, which protects nothing. I wrote the deterministic key myself.
  - **ALN-33.** It first filtered `data.data` in the browser with `.filter(s => s.status === 'exception')`, which only searches the first 20 shipments. The SDK's `list()` takes `status` and `orderNumber`.
  - **ALN-36.** It suggested replacing the hook with TanStack Query. That's a bigger change than needed, and TanStack's own default retries would hide the SDK's typed errors. I kept the hook and changed only how it reports errors.
- **What I changed or rewrote myself:** the idempotency key function and its tests, `describeError()` messages (I rewrote them in plain language for Inès), and this document.

## 5. If I had two more hours

1. ALN-38 pagination ("Load more", keeping filters).
2. ALN-29 rate comparison (details above).
3. End-to-end tests for the label flow and the error states, so the two non-negotiables are protected by CI.
4. Beyond the backlog: show the number of open problems on the navigation item, and warn Inès when an order already has a label before buying another.
