# Maintenance Matchmaker

A Toyota service recommendation tool for dealership advisors. Enter a vehicle
year, model, and current mileage; the app returns the maintenance services due at
the next interval, priced and grouped by priority, with a customer-facing
presentation mode and an oil-package break-even calculator.

## Running it

There is no build step and no bundler. The app is a set of plain browser scripts
loaded by `index.html`, so any static file server will do:

```bash
npx serve .          # or: python3 -m http.server 8000
```

Opening `index.html` directly over `file://` works for the maintenance engine but
the VIN lookup will be blocked by CORS. Serve over HTTP if you need it.

## Architecture

Every file is an IIFE that publishes a namespace on `window`. Load order is fixed
by the `<script>` tags at the bottom of `index.html` — later files depend on
earlier ones.

| File                             | Responsibility                                                       |
| -------------------------------- | -------------------------------------------------------------------- |
| `data.js`                        | `window.MAINTENANCE_SCHEDULE` — intervals, services, prices, add-ons |
| `logic.js`                       | Pure recommendation engine over the schedule. No DOM.                |
| `validation.js`                  | Year / model / mileage input parsing. Also exports for Node tests.   |
| `customer-content.js`            | Customer-facing copy for each service                                |
| `presentation.js`                | Full-screen customer presentation mode                               |
| `oil-package.js`                 | Oil-change package break-even calculator                             |
| `nhtsa-vin.js`                   | Optional VIN decode via the free NHTSA vPIC API                      |
| `ui.js`                          | Advisor UI wiring                                                    |
| `advisor-presentation-bridge.js` | Connects the advisor view to presentation mode                       |

Business logic lives in `logic.js` and `validation.js` and is deliberately free
of DOM access, which is what makes it directly unit-testable.

### VIN lookup

`nhtsa-vin.js` calls the public [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/).
It needs no API key and is entirely optional — the maintenance engine works
without it. The endpoint carries no SLA, so lookups are bounded by a 10-second
timeout (`LOOKUP_TIMEOUT_MS`) and abort rather than leaving the UI wedged.
Non-Toyota VINs decode successfully but do not populate the vehicle fields, since
the schedule only covers Toyota.

## Development

```bash
npm ci
npm test              # lint + format check + unit tests
npm run format:write  # apply formatting
```

`npm test` is the same gate CI runs (`.github/workflows/ci.yml`). Tests live in
`tests/` and run under vitest in Node — the browser-facing modules are loaded
into a `vm` context with the handful of globals they expect, which keeps them
testable without a headless browser.

## Scope and caveats

- Toyota only. The schedule in `data.js` has no data for other makes.
- Model years 1984–2026 (`YEAR_RANGE` in `validation.js`).
- Prices in `data.js` are defaults. Advisors can override per-service prices in
  the UI, and the oil-package calculator is illustrative — verify real pricing,
  eligibility, taxes, and package terms before quoting a customer.
- Client-side only. There is no backend and nothing is persisted server-side.
