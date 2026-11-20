# Mock Colistra API

The dashboard never talks to a real server. [Mock Service Worker](https://mswjs.io) intercepts every request to `https://api.colistra.test/v1` in the browser and answers it from an in-memory database. This runs in development **and** in production, so the app deploys as a static site.

| File          | What it does                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| `handlers.ts` | The API routes (`/orders`, `/rates`, `/labels`, `/shipments`, `/account`).    |
| `seed.ts`     | Generates 120 orders and 95 shipments with a fixed seed (same data every load). |
| `db.ts`       | The in-memory database.                                                       |
| `faults.ts`   | Latency, rate limiting and random failures.                                   |
| `pricing.ts`  | Carrier services and prices.                                                  |

You shouldn't need to change these files. Treat the mock as the real Colistra API: if something looks wrong, the fix almost certainly belongs in the app.

## Behaviour

- Every response takes **200–600 ms**.
- **Rate limit:** more than 10 requests in 5 seconds returns `429` with a `Retry-After` header.
- `POST /rates` fails with a `503` about **5%** of the time (a carrier didn't answer).
- About **3%** of `POST /labels` calls buy the label but the response is lost (`502`), like a real network timeout.
- The data lives as long as the page. A full reload resets everything to the seed.
- A *hard* reload (Shift + reload, or "Empty cache and hard reload") bypasses the service worker: requests then fail with a network error. Use a normal reload.

## Simulating failures: `?chaos=`

Add `?chaos=<mode>` to the URL when you **load** the page (it is read once, at startup):

| Mode        | Effect                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------- |
| *(none)*    | Normal behaviour, described above.                                                        |
| `off`       | No random failures. Latency and the 10 req / 5 s rate limit stay. Handy for tests.         |
| `ratelimit` | The rate limit drops to 3 requests per 5 seconds.                                          |
| `flaky`     | Every other request fails (the 1st, 3rd, 5th…). Failed `POST /labels` calls still buy the label. |
| `down`      | Every request fails with `503`.                                                            |

Example: <http://localhost:5173/shipments?chaos=down>
