# Advanced Features

This guide covers advanced features including HeartBeat Timer, debug mode, and extensibility through callbacks.

## HeartBeat Timer

The HeartBeat Timer measures how long visitors actively spend on pages by sending periodic pings to Matomo.

### Basic Setup

**Pages Router:**

```js
import { trackPagesRouter } from "@socialgouv/matomo-next";

trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeartBeatTimer: true,
  heartBeatTimerInterval: 15, // Optional: interval in seconds (default: 15)
});
```

**App Router:**

```js
import { trackAppRouter } from "@socialgouv/matomo-next";

trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  enableHeartBeatTimer: true,
  heartBeatTimerInterval: 15, // Optional: interval in seconds (default: 15)
});
```

### How It Works

1. Timer starts when page loads
2. Sends ping to Matomo every `heartBeatTimerInterval` seconds
3. Resets when user navigates to new page
4. Stops when user leaves site

### Use Cases

- **Engagement tracking**: Measure actual time spent reading content
- **Video content**: Track how long users watch videos
- **Documentation**: Understand which pages users spend most time on
- **E-learning**: Measure time spent on educational content

### Configuration

```js
{
  enableHeartBeatTimer: true,     // Enable the timer
  heartBeatTimerInterval: 15,     // Ping interval in seconds (default: 15)
}
```

**Recommended intervals:**

- **15 seconds** (default): Good balance for most sites
- **30 seconds**: Reduce server load, less precise
- **10 seconds**: More precise, higher server load

### Best Practices

1. **Choose appropriate interval**: Balance precision vs server load
2. **Consider page type**: Shorter intervals for interactive pages
3. **Monitor server load**: Adjust if needed based on traffic
4. **Combine with events**: Use with event tracking for complete picture

## Debug Mode

Enable comprehensive logging for troubleshooting and development.

### Enable Debug Mode

**Pages Router:**

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  debug: true,
});
```

**App Router:**

```js
trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  debug: true,
});
```

### What Gets Logged

When debug mode is enabled, you'll see console logs for:

1. **Initialization warnings**: Issues during Matomo setup
2. **Excluded URLs**: When URLs match `excludeUrlsPatterns`
3. **Page tracking**: When pages are tracked
4. **Search tracking**: When search queries are detected
5. **Heatmap operations**: Plugin loading and configuration
6. **Script errors**: Any errors during script loading

### Example Output

```
[Matomo] Matomo initialized
[Matomo] Tracking page view: /products
[Matomo] Excluded URL: /admin/dashboard
[Matomo] Heatmap & Session Recording plugin loaded
[Matomo] Search detected: query="nextjs"
```

### Environment-Based Debug

Enable debug mode only in development:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  debug: process.env.NODE_ENV === "development",
});
```

**Important:** Always disable debug mode in production to avoid console clutter and potential performance impact.

## Extensibility with Callbacks

Extend matomo-next functionality with custom callbacks at key lifecycle points.

### Available Callbacks

#### `onInitialization`

Triggered once when Matomo is first initialized.

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onInitialization: () => {
    console.log("Matomo is ready!");

    // Set custom dimensions
    push(["setCustomDimension", 1, getUserTier()]);

    // Track user properties
    push(["setUserId", getCurrentUserId()]);
  },
});
```

**Use cases:**

- Set custom dimensions
- Configure user ID
- Initialize custom tracking
- Set custom variables

#### `onRouteChangeStart`

Triggered when route change begins.

**Pages Router:** Uses `routeChangeStart` event  
**App Router:** Called when pathname/searchParams change

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onRouteChangeStart: (path) => {
    console.log("Navigating to:", path);

    // Show loading indicator
    showLoadingBar();

    // Track navigation timing
    performance.mark("navigation-start");
  },
});
```

**Parameters:**

- `path`: The new path being navigated to

**Use cases:**

- Show loading states
- Track navigation timing
- Reset page-specific state
- Trigger animations

#### `onRouteChangeComplete`

Triggered when route change completes and tracking is done.

**Pages Router:** Uses `routeChangeComplete` event  
**App Router:** Called after page view is tracked

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onRouteChangeComplete: (path) => {
    console.log("Tracked:", path);

    // Hide loading indicator
    hideLoadingBar();

    // Track navigation timing
    performance.mark("navigation-end");
    performance.measure("navigation", "navigation-start", "navigation-end");

    // Update page-specific features
    updatePageFeatures();
  },
});
```

**Parameters:**

- `path`: The new path that was tracked

**Use cases:**

- Hide loading states
- Measure navigation performance
- Update UI state
- Trigger post-navigation actions

#### `onScriptLoadingError`

Triggered when Matomo script fails to load.

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onScriptLoadingError: () => {
    console.error("Matomo script failed to load");

    // Detect ad blocker
    setAdBlockerDetected(true);

    // Fallback to alternative analytics
    initializeFallbackAnalytics();

    // Notify error monitoring
    Sentry.captureMessage("Matomo script blocked");
  },
});
```

**Use cases:**

- Detect ad blockers
- Fallback to alternative analytics
- Error monitoring
- User notifications

### Complete Example with All Callbacks

**Pages Router:**

```js
import { trackPagesRouter, push } from "@socialgouv/matomo-next";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    trackPagesRouter({
      url: process.env.NEXT_PUBLIC_MATOMO_URL,
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,

      onInitialization: () => {
        console.log("Matomo initialized");

        // Set user properties
        if (window.userId) {
          push(["setUserId", window.userId]);
        }

        // Set custom dimensions
        push(["setCustomDimension", 1, window.userTier || "free"]);
        push(["setCustomDimension", 2, window.userLanguage || "en"]);
      },

      onRouteChangeStart: (path) => {
        console.log("Navigating to:", path);
        NProgress.start(); // Show loading bar
        performance.mark("nav-start");
      },

      onRouteChangeComplete: (path) => {
        console.log("Tracked:", path);
        NProgress.done(); // Hide loading bar
        performance.mark("nav-end");

        // Measure navigation time
        const measure = performance.measure("navigation", "nav-start", "nav-end");

        // Track as event if slow
        if (measure.duration > 3000) {
          push(["trackEvent", "performance", "slow-navigation", path, measure.duration]);
        }
      },

      onScriptLoadingError: () => {
        console.error("Matomo blocked");

        // Track ad blocker usage
        if (window.plausible) {
          window.plausible("Ad Blocker Detected");
        }
      },
    });
  }, []);

  return <Component {...pageProps} />;
}
```

**App Router:**

```js
"use client";

import { trackAppRouter, push } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function MatomoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackAppRouter({
      url: process.env.NEXT_PUBLIC_MATOMO_URL,
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
      pathname,
      searchParams,

      onInitialization: () => {
        console.log("Matomo initialized");

        // Set user properties
        const userId = localStorage.getItem("userId");
        if (userId) {
          push(["setUserId", userId]);
        }

        // Set custom dimensions
        push(["setCustomDimension", 1, getUserTier()]);
      },

      onRouteChangeStart: (path) => {
        console.log("Navigating to:", path);
        document.body.classList.add("loading");
      },

      onRouteChangeComplete: (path) => {
        console.log("Tracked:", path);
        document.body.classList.remove("loading");

        // Update analytics dashboard
        updateAnalyticsDashboard();
      },

      onScriptLoadingError: () => {
        console.error("Matomo script failed");
        setAnalyticsBlocked(true);
      },
    });
  }, [pathname, searchParams]);

  return null;
}
```

## Advanced Tracking Patterns

### Conditional Tracking

Track only for specific user segments:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onInitialization: () => {
    // Only track logged-in users
    if (!window.userId) {
      push(["optUserOut"]); // Opt out anonymous users
    }
  },
});
```

### Performance Monitoring

Track page load performance:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onRouteChangeComplete: (path) => {
    // Track page load time
    const perfData = performance.getEntriesByType("navigation")[0];
    if (perfData) {
      push(["trackEvent", "performance", "page-load", path, Math.round(perfData.loadEventEnd - perfData.fetchStart)]);
    }
  },
});
```

### Error Tracking

Track JavaScript errors:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onInitialization: () => {
    window.addEventListener("error", (event) => {
      push(["trackEvent", "error", "javascript-error", `${event.message} at ${event.filename}:${event.lineno}`]);
    });
  },
});
```

### Custom User Properties

Track user properties throughout session:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onInitialization: () => {
    // Set user tier
    push(["setCustomDimension", 1, getUserTier()]);

    // Set user language
    push(["setCustomDimension", 2, navigator.language]);

    // Set device type
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    push(["setCustomDimension", 3, isMobile ? "mobile" : "desktop"]);
  },
});
```

## Integration Patterns

### With Authentication

```js
function MyApp({ Component, pageProps }) {
  const { user } = useAuth();

  useEffect(() => {
    trackPagesRouter({
      url: MATOMO_URL,
      siteId: MATOMO_SITE_ID,
      onInitialization: () => {
        if (user) {
          push(["setUserId", user.id]);
          push(["setCustomDimension", 1, user.plan]);
        }
      },
    });
  }, [user]);

  return <Component {...pageProps} />;
}
```

### With Feature Flags

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onInitialization: () => {
    // Track active feature flags
    const flags = getActiveFeatureFlags();
    flags.forEach((flag, index) => {
      push(["setCustomDimension", index + 1, flag]);
    });
  },
});
```

### With A/B Testing

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  onInitialization: () => {
    // Track A/B test variant
    const variant = getABTestVariant();
    push(["setCustomDimension", 1, variant]);
    push(["trackEvent", "ab-test", "view", variant]);
  },
});
```

## Next Steps

- [Configuration](./configuration.md) - Complete configuration reference
- [Event Tracking](./events.md) - Track custom events
- [Heatmap & Session Recording](./heatmap-session-recording.md) - User behavior tracking
- [Security](./security.md) - CSP and privacy considerations
