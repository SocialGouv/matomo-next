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
<br/>
<br/>
<br/>

## Features

- ✅ Basic SPA Matomo setup
- ✅ Supports Next.js **Pages Router** (automatic tracking with `next/router` events)
- ✅ Supports Next.js **App Router** (tracking with `usePathname` and `useSearchParams`)
- ✅ Tracks route changes and page views
- ✅ Tracks search queries on `/recherche` and `/search` routes
- ✅ Excludes URLs based on patterns
- ✅ GDPR compliant (optional cookie-less tracking)
- ✅ Custom event tracking
- ✅ TypeScript support

## Usage

### Pages Router

Add the `initPagesRouter` call in your `_app.js`:

```jsx
import React, { useEffect } from "react";
import App from "next/app";

import { initPagesRouter } from "@socialgouv/matomo-next";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    initPagesRouter({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

Will track routes changes by default.

### App Router

For Next.js App Router (Next.js 13+), create a client component to handle tracking. Use `initAppRouter` and pass both `pathname` and `searchParams` to track the full URL including query parameters:

```jsx
"use client";

import { initAppRouter } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

export function MatomoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAppRouter({
      url: MATOMO_URL,
      siteId: MATOMO_SITE_ID,
      pathname,
      searchParams, // Pass URLSearchParams object directly
      // Optional: Enable additional features
      enableHeatmapSessionRecording: true,
      enableHeartBeatTimer: true,
    });
  }, [pathname, searchParams]);

  return null;
}
```

**Notes**:

Add this component to your root layout wrapped in a `Suspense` boundary (required for `useSearchParams`):

```jsx
// app/layout.js
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

**Note**: The `Suspense` boundary is required when using `useSearchParams()` in the App Router.

#### App Router Features

The App Router implementation includes the following features:

- **Automatic route tracking**: Detects changes in both pathname and search parameters
- **Search tracking**: Automatically uses `trackSiteSearch` for `/recherche` and `/search` routes
- **Clean URLs**: Tracks only the pathname without query strings (Matomo best practice)
- **Referrer tracking**: Properly tracks the previous page as referrer
- **Custom callbacks**: Supports `onRouteChangeStart` and `onRouteChangeComplete` hooks

### Exclude tracking some routes

This wont track `/login.php` or any url containing `?token=`.

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  excludeUrlsPatterns: [/^\/login.php/, /\?token=.+/],
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  excludeUrlsPatterns: [/^\/login.php/, /\?token=.+/],
});
```

### Custom search tracking

#### Custom search keyword parameter

By default, the search tracking feature looks for a `q` parameter in the URL (e.g., `/search?q=my+query`). If your application uses a different parameter name for search queries, you can customize it:

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  searchKeyword: "query", // Will track searches from /search?query=my+search
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  searchKeyword: "query", // Will track searches from /search?query=my+search
});
```

#### Custom search routes

By default, search tracking is enabled for `/recherche` and `/search` routes. You can define custom routes that should be tracked as search pages:

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  searchRoutes: ["/find", "/discover", "/rechercher"], // Custom search routes
  searchKeyword: "q", // Optional: customize the search parameter
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  searchRoutes: ["/find", "/discover", "/rechercher"], // Custom search routes
  searchKeyword: "q", // Optional: customize the search parameter
});
```

When a user visits any of the defined search routes, the library will automatically use `trackSiteSearch` instead of `trackPageView`.

### Disable cookies

To disable cookies (for better GDPR compliance) set the `disableCookies` flag to `true`.

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true,
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  disableCookies: true,
});
```

### Track additional events

#### Type-safe event tracking (recommended)

Use the `sendEvent` helper for type-safe event tracking with auto-completion:

```js
import { sendEvent } from "@socialgouv/matomo-next";

// Basic event with category and action
sendEvent({ category: "contact", action: "click phone" });

// Event with optional name parameter
sendEvent({
  category: "video",
  action: "play",
  name: "intro-video",
});

// Event with optional name and value parameters
sendEvent({
  category: "purchase",
  action: "buy",
  name: "product-123",
  value: "99.99",
});
```

#### Advanced tracking with push

For advanced use cases or custom tracking, use the `push` function directly:

```js
import { push } from "@socialgouv/matomo-next";

// Track custom events
push(["trackEvent", "contact", "click phone"]);

// Track custom dimensions
push(["setCustomDimension", 1, "premium-user"]);

// Any other Matomo tracking method
push(["trackGoal", 1]);
```

### Enable Heatmap & Session Recording

To enable Matomo's Heatmap & Session Recording feature:

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeatmapSessionRecording: true,
  heatmapConfig: {
    // Optional: capture keystrokes (default: false)
    captureKeystrokes: false,
    // Optional: capture only visible content (default: false, captures full page)
    captureVisibleContentOnly: false,
  },
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  enableHeatmapSessionRecording: true,
  heatmapConfig: {
    // Optional: capture keystrokes (default: false)
    captureKeystrokes: false,
    // Optional: capture only visible content (default: false, captures full page)
    captureVisibleContentOnly: false,
  },
});
```

The Heatmap & Session Recording plugin will be automatically loaded and configured. It will:

- Load the `HeatmapSessionRecording/tracker.min.js` plugin
- Configure keystroke capture and visible content settings
- Enable the recording after page load

### Enable HeartBeat Timer

To accurately measure time spent on pages, enable the HeartBeat Timer:

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeartBeatTimer: true,
  heartBeatTimerInterval: 15, // Optional: interval in seconds (default: 15)
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  enableHeartBeatTimer: true,
  heartBeatTimerInterval: 15, // Optional: interval in seconds (default: 15)
});
```

The HeartBeat Timer sends periodic requests to Matomo to measure how long visitors stay on pages. This is particularly useful for tracking engagement on single-page applications.

### Debug Mode

Enable debug mode to see console logs for tracking events, excluded URLs, and Heatmap & Session Recording operations. This is useful for troubleshooting and development.

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  debug: true, // Enable debug logging
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  debug: true, // Enable debug logging
});
```

When `debug` is enabled, you will see console logs for:

- Matomo initialization warnings
- Excluded URL tracking (when URLs match `excludeUrlsPatterns`)
- Heatmap & Session Recording plugin loading and configuration
- Any errors during script loading

**Note:** Debug mode should be disabled in production to avoid cluttering the console.

### Content-Security-Policy

#### [Nonce](https://developer.mozilla.org/fr/docs/Web/HTML/Global_attributes/nonce)

If you use a `Content-Security-Policy` header with a `nonce` attribute, you can pass it to the initialization function to allow the script to be executed.

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  nonce: "123456789",
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  nonce: "123456789",
});
```

#### [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/trusted-types)

As the `matomo-next` injects a matomo script, if you use strict Trusted Types, you need to allow the `script` tag to be created by adding our policy name to your `trusted types` directive.

```txt
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types matomo-next;
```

You can set a custom policy name by passing it to the initialization function.

**Pages Router:**

```js
initPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  trustedPolicyName: "your-custom-policy-name",
});
```

**App Router:**

```js
initAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  trustedPolicyName: "your-custom-policy-name",
});
```

### Extensibility

The initialization functions have optional callback properties that allow for custom behavior to be added:

- `onRouteChangeStart(path: string) => void`: This callback is triggered when the route is about to change. For Pages Router, it uses Next Router event `routeChangeStart`. For App Router, it's called when the pathname or searchParams change. It receives the new path as a parameter.

- `onRouteChangeComplete(path: string) => void`: This callback is triggered when the route change is complete. For Pages Router, it uses Next Router event `routeChangeComplete`. For App Router, it's called after the page view is tracked. It receives the new path as a parameter.

- `onInitialization() => void`: This callback is triggered when the function is first initialized. It does not receive any parameters. **It could be useful to use it if you want to add parameter to Matomo when the page is render the first time.**

- `onScriptLoadingError() => void`: This callback is triggered when the script does not load. It does not receive any parameters. useful to detect ad-blockers.

#### Example with Pages Router:

```jsx
import React, { useEffect } from "react";
import { initPagesRouter } from "@socialgouv/matomo-next";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    initPagesRouter({
      url: process.env.NEXT_PUBLIC_MATOMO_URL,
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
      onRouteChangeStart: (path) => {
        console.log("Route change started:", path);
        // Your custom logic here
      },
      onRouteChangeComplete: (path) => {
        console.log("Route change completed:", path);
        // Your custom logic here
      },
      onInitialization: () => {
        console.log("Matomo initialized");
      },
      onScriptLoadingError: () => {
        console.error("Failed to load Matomo script");
      },
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

#### Example with App Router:

```jsx
"use client";

import { initAppRouter } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function MatomoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAppRouter({
      url: process.env.NEXT_PUBLIC_MATOMO_URL,
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
      pathname,
      searchParams, // Pass directly without .toString()
      onRouteChangeStart: (path) => {
        console.log("Route change started:", path);
        // Your custom logic here
      },
      onRouteChangeComplete: (path) => {
        console.log("Route change completed:", path);
        // Your custom logic here
      },
      onInitialization: () => {
        console.log("Matomo initialized");
      },
      onScriptLoadingError: () => {
        console.error("Failed to load Matomo script");
      },
    });
  }, [pathname, searchParams]);

  return null;
}
```
