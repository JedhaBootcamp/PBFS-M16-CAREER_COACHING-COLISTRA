# Atelier Lune: take over the shipping dashboard

## The situation

**Atelier Lune** is a small ceramics workshop in Lyon. Bowls, mugs, teapots and vases are thrown by hand and sold online. The shop ships **about 60 orders a day** across France.

**Inès** runs operations. Every morning she uses an internal dashboard to:

1. buy a shipping label for each new order, and
2. follow the shipments, especially the ones that ran into a problem.

The dashboard is built on **Colistra**, a shipping API that compares carriers (Colissimo, Chronopost, Mondial Relay, DHL), buys labels and tracks parcels. A freelance developer started building it, got the basics working, then **left mid-project**. There is no handover document. There's the code, the Colistra SDK and its README, and Inès.

You're taking over. You have **2 hours**.

## What Inès told us

> "In October I found two labels for the same order on our Colistra invoice. Then another pair a week later. I only noticed at the end of the month, when the bill arrived. That's money we'll never see again."

> "My mornings start with the parcels that have a problem: damaged, wrong address, nobody home. Customers call about those first. Right now I scroll through the shipments looking for red badges, and I'm never sure I've found them all."

> "Sometimes the page just goes white. I reload until it comes back. Once it went white right after I clicked *Create label*, and I had no idea whether the label had been bought or not."

> "For a single mug, Mondial Relay costs half the price of Colissimo. But the dashboard only does Colissimo, so I end up comparing prices on the Colistra website in another tab."

## Two non-negotiable requirements

Whatever you choose to work on, these two must hold when you hand over:

1. **Inès is never charged twice for the same label.** Not on a double click, not when the network fails halfway, not when something retries.
2. **The app never shows a blank screen.** Every error ends up as a clear message that tells Inès what happened and what she can do next.

## Getting started

Requirements: **Node.js 20+** and npm.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the dashboard with the mock API              |
| `npm run build`     | Production build (`apps/dashboard/dist`)           |
| `npm run preview`   | Serve the production build on http://localhost:4173 |
| `npm test`          | Unit tests (Vitest), SDK and dashboard             |
| `npm run typecheck` | TypeScript, SDK and dashboard                      |
| `npm run test:e2e`  | End-to-end tests (Playwright) on the production build |

**There is no backend and no API key to set up.** The Colistra API is simulated in the browser by a mock (Mock Service Worker), in development and in production. It behaves like a real API: latency, rate limits, occasional errors. You can force failures with `?chaos=` in the URL; see [`apps/dashboard/src/mocks/README.md`](apps/dashboard/src/mocks/README.md). Treat the mock as Colistra's servers: you're not expected to change it.

### Where things are

```
packages/colistra-sdk/     The Colistra SDK. Read its README.md.
apps/dashboard/
  src/features/orders/     Orders waiting for a label
  src/features/labels/     Buying labels
  src/features/shipments/  Shipments list and detail panel
  src/shared/colistra/     ColistraProvider and the hooks that call the API
  src/shared/              Formatting, UI components, layout
  src/mocks/               The mock Colistra API
  e2e/                     Playwright tests
.github/workflows/ci.yml   GitHub Actions
TASKS.md                   The backlog
DECISIONS.md               Your decisions (to fill in)
```

## The rules of the game

- **Time limit: 2 hours of focused work.** Stop when the time is up, even mid-task, and write down where you stopped.
- **You will not finish everything, and that's expected.** [`TASKS.md`](TASKS.md) has 7 tasks. A strong candidate finishes 3 or 4 *properly*. Choosing what to leave out is part of the exercise.
- **The backlog is not sorted.** Deciding the order is your job.
- **AI assistants are allowed and expected.** But the Colistra SDK only exists in this repository: your assistant has never seen it and will happily guess. Make it read the code and the docs. You are responsible for every line you commit.
- **Work with the existing code.** The previous developer left a consistent structure and patterns. Extending them is better than rewriting them.

## Deliverables

1. **Your fork of this repository**, with commits that show how your work progressed: small commits with clear messages, not one big "done" commit at the end.
2. **A deployed URL on Vercel.** Import your fork in Vercel; the settings in `vercel.json` work as is, with no environment variables. Put the URL at the top of `DECISIONS.md`.
3. **[`DECISIONS.md`](DECISIONS.md)**, filled in:
   - **Your plan**, written *before* you start coding: which tasks, in which order, and why.
   - For **each task you did**: what you did, why you prioritized it, and the trade-offs you made.
   - For **each task you skipped**: why, and what you would do with more time.
   - **How you used AI**: what you asked it, what it got wrong, and what you had to correct.

## How you'll be evaluated

| Criterion                         | What we look for                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Prioritization**                | You tackled what matters most to Inès and the business first, and your `DECISIONS.md` explains it. Three tasks done well beat seven half-done.                            |
| **Working with existing code**    | You followed the existing structure, hooks and components instead of rewriting them. Your changes are focused and easy to review.                                         |
| **Correct use of the SDK**        | You used the Colistra SDK the way its documentation says to: units, pagination, errors, retries, idempotency.                                                            |
| **Quality**                       | Tests that cover what you changed, CI green (or a clear note on why not), a working deployment.                                                                          |
| **Use of AI**                     | You used AI to go faster, but you understood its output, caught its mistakes and improved on them. Your `DECISIONS.md` shows where you had to correct it.               |

Good luck. Inès is counting on you.
