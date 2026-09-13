# Browser E2E tests

The Playwright suite builds the frontend with `VITE_DEMO_MODE=true`. It does
not create real orders, reserve inventory, contact CDEK, or open PayKeeper.

Install the Chromium runtime once:

```bash
npm run test:e2e:install
```

Run all desktop and mobile scenarios:

```bash
npm run test:e2e
```

Use `npm run test:e2e:headed` for local visual debugging. Failure traces,
screenshots, and videos are written to the ignored `test-results` directory.
