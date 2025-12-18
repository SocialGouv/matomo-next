<h1 align="center">
  <img src="https://github.com/SocialGouv/matomo-next/raw/master/.github/matomo.png" width="250"/>
  <p align="center">Matomo Next</p>
  <p align="center" style="font-size: 0.5em">Matomo analytics for Next.js applications</p>
</h1>

<p align="center">
  <a href="https://github.com/SocialGouv/matomo-next/actions/"><img src="https://github.com/SocialGouv/matomo-next/workflows/ci/badge.svg" alt="Github Master CI Build Status"></a>
  <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache--2.0-yellow.svg" alt="License: Apache-2.0"></a>
  <a href="https://github.com/SocialGouv/matomo-next/releases "><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/SocialGouv/matomo-next?sort=semver"></a>
  <a href="https://www.npmjs.com/package/@socialgouv/matomo-next"><img src="https://img.shields.io/npm/v/@socialgouv/matomo-next.svg" alt="Npm version"></a>
  <a href="https://codecov.io/gh/SocialGouv/matomo-next"><img src="https://codecov.io/gh/SocialGouv/matomo-next/branch/master/graph/badge.svg" alt="codecov"></a>
</p>

<br/>

A lightweight, TypeScript-ready Matomo analytics integration for Next.js applications with support for both Pages Router and App Router.

## Features

- ✅ **Pages Router & App Router Support** - Works with both Next.js routing systems
- ✅ **Automatic Page Tracking** - Tracks route changes and page views automatically
- ✅ **Search Tracking** - Built-in search query tracking
- ✅ **GDPR Compliant** - Cookie-less tracking option
- ✅ **Custom Events** - Type-safe event tracking API
- ✅ **Heatmap & Session Recording** - Optional user behavior visualization
- ✅ **TypeScript Support** - Full type safety and auto-completion

## Installation

```bash
npm install @socialgouv/matomo-next
```

## Quick Start

### Pages Router

Add the [`trackPagesRouter()`](./src/track-pages-router.ts) call in your `_app.js`:

```jsx
import { useEffect } from "react";
import { trackPagesRouter } from "@socialgouv/matomo-next";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    trackPagesRouter({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

### App Router

Create a client component for tracking with [`trackAppRouter()`](./src/track-app-router.ts):

```jsx
"use client";

import { trackAppRouter } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

export function MatomoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackAppRouter({
      url: MATOMO_URL,
      siteId: MATOMO_SITE_ID,
      pathname,
      searchParams,
    });
  }, [pathname, searchParams]);

  return null;
}
```

Add it to your root layout wrapped in a `Suspense` boundary:

```jsx
import { Suspense } from "react";
import { MatomoAnalytics } from "./matomo";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Suspense fallback={null}>
          <MatomoAnalytics />
        </Suspense>
      </body>
    </html>
  );
}
```

## Documentation

- **[Advanced Configuration](docs/advanced.md)** - All configuration options, HeartBeat timer, callbacks, and extensibility
- **[Event Tracking](docs/events.md)** - Track custom user interactions
- **[Heatmap & Session Recording](docs/heatmap-session-recording.md)** - User behavior tracking and visualization
- **[Security & Privacy](docs/security.md)** - CSP configuration and GDPR compliance

## Common Use Cases

### Track Custom Events

Use the [`sendEvent()`](./src/events.ts) helper for type-safe event tracking:

```js
import { sendEvent } from "@socialgouv/matomo-next";

// Track a button click
sendEvent({ category: "contact", action: "click phone" });

// Track with additional context
sendEvent({
  category: "video",
  action: "play",
  name: "intro-video",
  value: 120,
});
```

## Configuration Options

| Option                          | Type              | Description                         | Default                     | Docs                                                      |
| ------------------------------- | ----------------- | ----------------------------------- | --------------------------- | --------------------------------------------------------- |
| `url`                           | `string`          | Matomo instance URL                 | -                           | Required                                                  |
| `siteId`                        | `string`          | Matomo site ID                      | -                           | Required                                                  |
| `pathname`                      | `string`          | Current pathname (App Router only)  | -                           | Required for App Router                                   |
| `searchParams`                  | `URLSearchParams` | URL search params (App Router only) | -                           | Required for App Router                                   |
| `jsTrackerFile`                 | `string`          | Custom JS tracker filename          | `"matomo.js"`               | [Advanced](docs/advanced.md)                              |
| `phpTrackerFile`                | `string`          | Custom PHP tracker filename         | `"matomo.php"`              | [Advanced](docs/advanced.md)                              |
| `excludeUrlsPatterns`           | `RegExp[]`        | URLs to exclude from tracking       | `[]`                        | [Advanced](docs/advanced.md#exclude-url-patterns)         |
| `disableCookies`                | `boolean`         | Cookie-less tracking                | `false`                     | [Advanced](docs/advanced.md#disable-cookies)              |
| `cleanUrl`                      | `boolean`         | Remove query params from URLs       | `false`                     | [Advanced](docs/advanced.md#clean-urls)                   |
| `searchKeyword`                 | `string`          | Search query parameter name         | `"q"`                       | [Advanced](docs/advanced.md#search-tracking)              |
| `searchRoutes`                  | `string[]`        | Custom search route paths           | `["/recherche", "/search"]` | [Advanced](docs/advanced.md#search-tracking)              |
| `enableHeartBeatTimer`          | `boolean`         | Track time on page                  | `false`                     | [Advanced](docs/advanced.md#heartbeat-timer)              |
| `heartBeatTimerInterval`        | `number`          | HeartBeat timer interval (seconds)  | `15` (Matomo default)       | [Advanced](docs/advanced.md#heartbeat-timer)              |
| `enableHeatmapSessionRecording` | `boolean`         | Enable session recording            | `false`                     | [Heatmap](docs/heatmap-session-recording.md)              |
| `heatmapConfig`                 | `HeatmapConfig`   | Heatmap configuration object        | `{}`                        | [Heatmap](docs/heatmap-session-recording.md)              |
| `debug`                         | `boolean`         | Enable debug logs                   | `false`                     | [Advanced](docs/advanced.md#debug-mode)                   |
| `nonce`                         | `string`          | CSP nonce value                     | -                           | [Security](docs/security.md)                              |
| `trustedPolicyName`             | `string`          | Trusted Types policy name           | `"matomo-next"`             | [Security](docs/security.md)                              |
| `onInitialization`              | `() => void`      | Callback on init                    | -                           | [Advanced](docs/advanced.md#extensibility-with-callbacks) |
| `onRouteChangeStart`            | `(path) => void`  | Callback on route change start      | -                           | [Advanced](docs/advanced.md#extensibility-with-callbacks) |
| `onRouteChangeComplete`         | `(path) => void`  | Callback on route change complete   | -                           | [Advanced](docs/advanced.md#extensibility-with-callbacks) |
| `onScriptLoadingError`          | `() => void`      | Callback on script loading error    | -                           | [Advanced](docs/advanced.md#extensibility-with-callbacks) |

See [complete configuration options](docs/advanced.md) for full details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [Matomo Official Documentation](https://matomo.org/docs/)
- [Matomo JavaScript Tracker API](https://developer.matomo.org/api-reference/tracking-javascript)
- [Next.js Documentation](https://nextjs.org/docs)
