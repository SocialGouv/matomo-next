# A/B Testing

Integrate Matomo's [A/B Testing plugin](https://plugins.matomo.org/AbTesting) with your Next.js application.

## Prerequisites

- Matomo instance with the **A/B Testing** plugin enabled
- Experiments configured in your Matomo dashboard

## Quick Start

### 1. Define your tests

Create a configuration file for your experiments:

```ts
// config/ab-tests.ts
import type { ABTestDefinition } from "@socialgouv/matomo-next";

export const AB_TESTS: ABTestDefinition[] = [
  {
    name: "homepage-hero",          // Must match Matomo experiment name
    percentage: 100,                // % of visitors included
    variations: [
      { name: "original" },
      { name: "new-hero" },
    ],
  },
];
```

### 2. Initialize during Matomo setup

```tsx
// app/MatomoProvider.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackAppRouter, initABTesting } from "@socialgouv/matomo-next";
import { AB_TESTS } from "@/config/ab-tests";

export function MatomoProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackAppRouter({
      url: process.env.NEXT_PUBLIC_MATOMO_URL!,
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID!,
      pathname,
      searchParams,
      onInitialization: () => {
        initABTesting({
          enabled: true,
          pathname: pathname ?? "",
          tests: AB_TESTS,
        });
      },
    });
  }, [pathname, searchParams]);

  return null;
}
```

### 3. Use the variant in your components

```tsx
"use client";

import { useABTestVariant } from "@socialgouv/matomo-next";

export function HeroSection() {
  const variant = useABTestVariant("homepage-hero");

  if (variant === "new-hero") {
    return <NewHeroSection />;
  }

  // Default / original / loading state
  return <OriginalHeroSection />;
}
```

## API Reference

### `initABTesting(params)`

Registers A/B tests with Matomo. Call this inside `onInitialization`.

| Parameter              | Type              | Required | Description                                    |
| ---------------------- | ----------------- | -------- | ---------------------------------------------- |
| `enabled`              | `boolean`         | ✅        | Master switch                                  |
| `pathname`             | `string`          | ✅        | Current pathname                               |
| `tests`                | `ABTestDefinition[]` | ✅     | Array of experiment definitions                |
| `excludeUrlsPatterns`  | `RegExp[]`        | ❌        | URL patterns to skip                           |

### `ABTestDefinition`

| Field            | Type                  | Required | Description                                    |
| ---------------- | --------------------- | -------- | ---------------------------------------------- |
| `name`           | `string`              | ✅        | Experiment name (must match Matomo dashboard)   |
| `percentage`     | `number`              | ✅        | Percentage of visitors included (0–100)         |
| `variations`     | `ABTestVariation[]`   | ✅        | Array of `{ name: string }`                    |
| `startDateTime`  | `string`              | ❌        | ISO 8601 start date                            |
| `endDateTime`    | `string`              | ❌        | ISO 8601 end date                              |
| `trigger`        | `() => boolean`       | ❌        | Custom participation rule (default: all visitors) |

### `useABTestVariant(testName, timeoutMs?)`

React hook that returns the activated variant name.

- Returns `null` while the test is loading or the visitor isn't participating
- Returns the variant `string` once Matomo activates a variation
- `timeoutMs` defaults to `5000` ms

```ts
const variant = useABTestVariant("homepage-hero");
// variant: "original" | "new-hero" | null
```

### `useABTestVariantSync(testName)`

React 18+ hook using `useSyncExternalStore` for synchronous reads. Same API as `useABTestVariant` but without polling — it uses a small interval-based subscription internally.

### `getABTestState(testName)`

Non-hook utility to read the A/B test state imperatively.

```ts
const state = getABTestState("homepage-hero");
// { abTest: "homepage-hero", variant: "new-hero", isReady: true }
```

### `readABTestState(testName)`

Alias for `getABTestState` — reads the full `MatomoABTestState` object.

## Advanced Usage

### Scheduled experiments

```ts
{
  name: "summer-sale",
  percentage: 100,
  variations: [{ name: "original" }, { name: "sale-banner" }],
  startDateTime: "2025-06-01T00:00:00Z",
  endDateTime: "2025-08-31T23:59:59Z",
}
```

### Custom triggers

Only include logged-in users:

```ts
{
  name: "premium-feature",
  percentage: 100,
  variations: [{ name: "original" }, { name: "new-feature" }],
  trigger: () => {
    return document.cookie.includes("logged_in=true");
  },
}
```

### Excluding URLs

Skip experiments on admin pages:

```ts
initABTesting({
  enabled: true,
  pathname,
  excludeUrlsPatterns: [/^\/admin/, /^\/api/],
  tests: AB_TESTS,
});
```

### Multiple concurrent experiments

You can run multiple experiments simultaneously — each test gets its own entry in the global store:

```ts
const heroVariant = useABTestVariant("homepage-hero");
const ctaVariant = useABTestVariant("cta-color");
```

## How It Works

1. `initABTesting()` pushes `AbTesting::create` commands to Matomo's `_paq` queue
2. Matomo's A/B Testing plugin evaluates participation and assigns a variant
3. The assigned variant is stored in `window.__MATOMO_AB_TEST__`
4. `useABTestVariant()` polls this store until a variant is ready (or timeout)
5. Your component re-renders with the correct variant
