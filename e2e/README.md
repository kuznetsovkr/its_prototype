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

## Gift certificate checkout

`certificate.e2e.js` covers purchase and email-status presentation;
`order-certificate.e2e.js` covers applying/removing a code, delivery exclusion,
zero-due completion, resuming the same order after reload, manual payment review
and the protected admin history. All API and bank responses in these scenarios
are intercepted; no real orders, emails or payments are created.

```bash
npm run test:e2e -- certificate.e2e.js order-certificate.e2e.js --workers=1
```

The ordinary demo build does not redeem certificates. The browser tests use the
existing explicit E2E flag to exercise the real client workflow with mock APIs.
The recipient form keeps scaled widths and upper-field geometry, while the new
checkout tail uses content-driven height for totals, errors and CAPTCHA.

## Compact autoscale regression checks

The autoscale suites cover proportional sizing, the 639/640 and 1199/1200
boundaries, rotation, preserved form/tab/FAQ state, native modal coordinates,
focus/scroll locks, and the 16px minimum for mobile text-entry controls.

```bash
npm run test:e2e -- e2e/compact-autoscale.e2e.js e2e/order-autoscale.e2e.js e2e/autoscale-final.e2e.js --workers=1
```

Optional Safari-engine checks use a separate WebKit profile:

```bash
npx playwright install webkit
npm run test:e2e:autoscale:webkit
```

Run the profiles sequentially: they share the build directory and preview port.
One worker is recommended on a busy local Windows machine. Width-matrix tests
run on the desktop profile, touch/rotation tests on the mobile profile. Only
the Chromium-CDP swipe test is omitted in WebKit; modal rotation is covered
separately there. WebKit/device emulation is not a physical iPhone Safari test:
the native keyboard, pinch zoom and real touch gestures still need a device check.
