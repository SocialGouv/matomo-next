# Configuration Options

This guide covers all configuration options available for both Pages Router and App Router implementations.

## Basic Configuration

### Required Options

```js
{
  url: string,        // Your Matomo instance URL
  siteId: string,     // Your Matomo site ID
}
```

### App Router Additional Required Options

```js
{
  pathname: string,           // From usePathname()
  searchParams: URLSearchParams, // From useSearchParams()
}
```

## URL Filtering & Exclusion

### Exclude URL Patterns

Exclude specific URLs from tracking using regex patterns:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  excludeUrlsPatterns: [/^\/login.php/, /\?token=.+/],
});
```

**Examples:**

- `/^\/admin/` - Excludes all admin routes
- `/\?token=.+/` - Excludes URLs with token parameters
- `/^\/api\//` - Excludes all API routes

### Clean URLs

Remove query parameters and hash fragments from tracked URLs:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  cleanUrl: true,
});
```

**Behavior:**

- With `cleanUrl: false` (default): `/products?id=123#section` → tracked as-is
- With `cleanUrl: true`: `/products?id=123#section` → tracked as `/products`

**Important:** Search routes automatically preserve query parameters even when `cleanUrl` is enabled.

## Search Tracking

### Custom Search Keyword Parameter

Change the default search parameter from `q` to a custom value:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  searchKeyword: "query", // Tracks searches from /search?query=...
});
```

### Custom Search Routes

Define which routes should be tracked as search pages:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  searchRoutes: ["/find", "/discover", "/rechercher"],
  searchKeyword: "q", // Optional: customize the parameter
});
```

**Default search routes:** `/recherche` and `/search`

When a user visits a search route, the library automatically uses [`trackSiteSearch`](https://developer.matomo.org/api-reference/tracking-javascript#internal-search-tracking) instead of [`trackPageView`](https://developer.matomo.org/api-reference/tracking-javascript#page-views).

## Privacy & GDPR

### Disable Cookies

Enable cookie-less tracking for better GDPR compliance:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true,
});
```

**Benefits:**

- No cookies stored on user's browser
- Better GDPR compliance
- No cookie consent banner needed (depending on your use case)

**Trade-offs:**

- Reduced visitor uniqueness tracking
- Cannot track returning visitors across sessions

## Performance Options

### HeartBeat Timer

Accurately measure time spent on pages:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeartBeatTimer: true,
  heartBeatTimerInterval: 15, // Optional: interval in seconds (default: 15)
});
```

**Use case:** Track engagement on single-page applications

The HeartBeat Timer sends periodic pings to Matomo to measure active time on page. Learn more about [HeartBeat Timer](./advanced.md#heartbeat-timer).

## Debug Mode

Enable debug logging for troubleshooting:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  debug: true,
});
```

**Logs include:**

- Matomo initialization warnings
- Excluded URL tracking
- Heatmap & Session Recording operations
- Script loading errors

**Warning:** Disable in production to avoid console clutter.

## Complete Configuration Example

### Pages Router

```js
import { trackPagesRouter } from "@socialgouv/matomo-next";

trackPagesRouter({
  // Required
  url: process.env.NEXT_PUBLIC_MATOMO_URL,
  siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,

  // URL Filtering
  excludeUrlsPatterns: [/^\/admin/, /\?token=.+/],
  cleanUrl: true,

  // Search Tracking
  searchRoutes: ["/search", "/recherche", "/find"],
  searchKeyword: "q",

  // Privacy
  disableCookies: true,

  // Performance
  enableHeartBeatTimer: true,
  heartBeatTimerInterval: 15,

  // Advanced Features
  enableHeatmapSessionRecording: true,
  heatmapConfig: {
    recordMovements: true,
    maxCaptureTime: 600,
  },

  // Security
  nonce: "your-nonce-value",
  trustedPolicyName: "matomo-next",

  // Development
  debug: process.env.NODE_ENV === "development",

  // Callbacks
  onInitialization: () => console.log("Matomo ready"),
  onRouteChangeStart: (path) => console.log("Navigating to:", path),
  onRouteChangeComplete: (path) => console.log("Tracked:", path),
  onScriptLoadingError: () => console.error("Matomo script failed"),
});
```

### App Router

```js
"use client";

import { trackAppRouter } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function MatomoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackAppRouter({
      // Required
      url: process.env.NEXT_PUBLIC_MATOMO_URL,
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
      pathname,
      searchParams,

      // URL Filtering
      excludeUrlsPatterns: [/^\/admin/, /\?token=.+/],
      cleanUrl: true,

      // Search Tracking
      searchRoutes: ["/search", "/recherche", "/find"],
      searchKeyword: "q",

      // Privacy
      disableCookies: true,

      // Performance
      enableHeartBeatTimer: true,
      heartBeatTimerInterval: 15,

      // Advanced Features
      enableHeatmapSessionRecording: true,
      heatmapConfig: {
        recordMovements: true,
        maxCaptureTime: 600,
      },

      // Security
      nonce: "your-nonce-value",
      trustedPolicyName: "matomo-next",

      // Development
      debug: process.env.NODE_ENV === "development",

      // Callbacks
      onInitialization: () => console.log("Matomo ready"),
      onRouteChangeStart: (path) => console.log("Navigating to:", path),
      onRouteChangeComplete: (path) => console.log("Tracked:", path),
      onScriptLoadingError: () => console.error("Matomo script failed"),
    });
  }, [pathname, searchParams]);

  return null;
}
```

## TypeScript Support

All configuration options are fully typed. Use your IDE's auto-completion to explore available options.

## Next Steps

- [Event Tracking](./events.md) - Track custom events and interactions
- [Heatmap & Session Recording](./heatmap-session-recording.md) - User behavior tracking
- [Advanced Features](./advanced.md) - Callbacks and extensibility
- [Security](./security.md) - CSP and privacy considerations
