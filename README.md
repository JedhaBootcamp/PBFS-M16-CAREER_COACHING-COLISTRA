# Atelier Lune · Shipping dashboard

Internal dashboard used by Atelier Lune's ops team to buy shipping labels and follow parcels, built on the Colistra shipping API.

**Start with [`BRIEF.md`](BRIEF.md)**, then [`TASKS.md`](TASKS.md) and the [Colistra SDK README](packages/colistra-sdk/README.md).

```bash
npm install
npm run dev   # http://localhost:5173
```

| Path                     | Contents                                         |
| ------------------------ | ------------------------------------------------ |
| `apps/dashboard`         | React + TypeScript + Vite + Tailwind dashboard   |
| `packages/colistra-sdk`  | The Colistra TypeScript SDK (workspace package)  |
| `apps/dashboard/src/mocks` | Mock Colistra API (Mock Service Worker)        |

> Colistra, Atelier Lune and everyone mentioned here are fictional. This repository is a training exercise.
