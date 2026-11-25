# Test the software and evaluate the science separately

Software checks, from the repository root:

```bash
npm ci
npm run typecheck
npm test
npm run build:pages
npm run check:package
npx playwright install chromium
npm run test:browser
```

Browser tests drive actual instructions, choices, feedback, and bills, then click
the CSV and JSON download buttons. They verify row counts, option reconstruction,
ledger conservation, seed replay, mobile export layout, and no JavaScript errors.
Runtime requests outside localhost are blocked during this test. Timings and
session IDs are expected to differ between runs. Artifacts go to `artifacts/`.

`npm run dev` serves the built cached assets on localhost:8000. The browser test
uses a separate port and does not need a running development server.

See [scientific status](README.md) before treating any task output as a measure.
Budget can rise after a payoff and fall after a bill; monotonic depletion is not
guaranteed. Hidden probabilities are hidden from the display, not from a
participant who inspects browser source/data.
