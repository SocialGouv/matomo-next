# Advanced Configuration

Complete reference of all configuration options and advanced features.

## Required Options

```js
{
  url: string,        // Your Matomo instance URL
  siteId: string,     // Your Matomo site ID
}
```

**App Router additional required options:**

```js
{
  pathname: string,           // From usePathname()
  searchParams: URLSearchParams, // From useSearchParams()
}
```

## URL Filtering

### Exclude URL Patterns

Exclude specific URLs from tracking using regex patterns:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  excludeUrlsPatterns: [/^\/login.php/, /\?token=.+/],
});
```

### Clean URLs

Remove query parameters and hash fragments from tracked URLs:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  cleanUrl: true,
});
```

**Examples:**

```js
// With cleanUrl: false (default)
// /products?id=123#section → tracked as /products?id=123#section

// With cleanUrl: true
// /products?id=123#section → tracked as /products

// Search routes preserve query params even with cleanUrl: true
// /search?q=keyword&page=2 → tracked as /search?q=keyword&page=2
```

## Search Tracking

### Custom Search Keyword Parameter

By default, searches look for a `q` parameter. Customize it:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  searchKeyword: "query", // Tracks /search?query=...
});
```

### Custom Search Routes

Default search routes are `/recherche` and `/search`. Define custom ones:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  searchRoutes: ["/find", "/discover", "/rechercher"],
  searchKeyword: "q",
});
```

## Privacy

### Disable Cookies

Enable cookie-less tracking for GDPR compliance:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true,
});
```

## HeartBeat Timer

**Note:** This feature is **disabled by default**. You must explicitly enable it.

Measure how long visitors spend on pages by sending periodic pings to Matomo:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeartBeatTimer: true,
  heartBeatTimerInterval: 15, // Optional: interval in seconds (default: 15)
});
```

This is particularly useful for tracking engagement on single-page applications.

## Debug Mode

Enable debug logging for troubleshooting:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  debug: true,
});
```

When enabled, you'll see console logs for:

- Matomo initialization warnings
- Excluded URL tracking
- Heatmap & Session Recording operations
- Script loading errors

**Note:** Disable in production.

## Extensibility with Callbacks

### Available Callbacks

- `onInitialization() => void`: Triggered when Matomo is first initialized
- `onRouteChangeStart(path: string) => void`: Triggered when route change begins
- `onRouteChangeComplete(path: string) => void`: Triggered when route change completes
- `onScriptLoadingError() => void`: Triggered when script fails to load

### Example (Pages Router)

```jsx
import { trackPagesRouter } from "@socialgouv/matomo-next";

trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onInitialization: () => {
    console.log("Matomo initialized");
  },
  onRouteChangeStart: (path) => {
    console.log("Route change started:", path);
  },
  onRouteChangeComplete: (path) => {
    console.log("Route change completed:", path);
  },
  onScriptLoadingError: () => {
    console.error("Failed to load Matomo script");
  },
});
```

### Example (App Router)

```jsx
"use client";

import { trackAppRouter } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function MatomoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackAppRouter({
      url: MATOMO_URL,
      siteId: MATOMO_SITE_ID,
      pathname,
      searchParams,
      onInitialization: () => {
        console.log("Matomo initialized");
      },
      onRouteChangeStart: (path) => {
        console.log("Route change started:", path);
      },
      onRouteChangeComplete: (path) => {
        console.log("Route change completed:", path);
      },
      onScriptLoadingError: () => {
        console.error("Failed to load Matomo script");
      },
    });
  }, [pathname, searchParams]);

  return null;
}
```

## Complete Configuration Example

```js
trackPagesRouter({
  // Required
  url: process.env.NEXT_PUBLIC_MATOMO_URL,
  siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,

  // URL Filtering
  excludeUrlsPatterns: [/^\/admin/, /\?token=/],
  cleanUrl: true,

  // Search Tracking
  searchRoutes: ["/search", "/recherche"],
  searchKeyword: "q",

  // Privacy
  disableCookies: true,

  // Performance (disabled by default)
  enableHeartBeatTimer: true,
  heartBeatTimerInterval: 15,

  // Advanced Features (disabled by default)
  enableHeatmapSessionRecording: true,
  heatmapConfig: {
    captureKeystrokes: false,
    captureVisibleContentOnly: false,
  },

  // Security
  nonce: "your-nonce-value",
  trustedPolicyName: "matomo-next",

  // Development
  debug: process.env.NODE_ENV === "development",

  // Callbacks
  onInitialization: () => {},
  onRouteChangeStart: (path) => {},
  onRouteChangeComplete: (path) => {},
  onScriptLoadingError: () => {},
});
```

## Next Steps

- [Events](./events.md) - Track custom events
- [Heatmap & Session Recording](./heatmap-session-recording.md) - User behavior tracking
- [Security](./security.md) - CSP and privacy
