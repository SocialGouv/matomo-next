# Heatmap & Session Recording

**Note:** This feature is **disabled by default**. You must explicitly enable it.

Enable Matomo's Heatmap & Session Recording feature to visualize user behavior and watch session replays.

## Basic Setup

**Pages Router:**

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeatmapSessionRecording: true,
});
```

**App Router:**

```js
trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  enableHeatmapSessionRecording: true,
});
```

The plugin will be automatically loaded from `{url}/plugins/HeatmapSessionRecording/tracker.min.js`.

## Configuration Options

### `captureKeystrokes`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Controls whether keyboard input is captured

**Important:** Disabled by default since v3.2.0 for privacy. Only enable if needed and ensure GDPR compliance.

```js
heatmapConfig: {
  captureKeystrokes: false, // Keep disabled for privacy
}
```

### `recordMovements`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Records mouse and touch movements for heatmap visualization

Disable to reduce data collection and prevent "Move Heatmap" feature:

```js
heatmapConfig: {
  recordMovements: false,
}
```

### `maxCaptureTime`

- **Type:** `number`
- **Default:** `600` (10 minutes)
- **Description:** Maximum recording duration per page view in seconds

**Recommended:** Keep under 29 minutes to avoid creating new visits due to Matomo's 30-minute inactivity timeout.

```js
heatmapConfig: {
  maxCaptureTime: 1800, // 30 minutes
}
```

### `disableAutoDetectNewPageView`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Disables automatic detection of new page views for SPAs

Set to `true` if you track "virtual" page views for events or downloads without stopping the recording:

```js
heatmapConfig: {
  disableAutoDetectNewPageView: true,
}
```

### `trigger`

- **Type:** `(config: { id?: number }) => boolean`
- **Default:** `undefined`
- **Description:** Custom function to control when recording happens

Use for conditional recording based on user properties:

```js
heatmapConfig: {
  trigger: (config) => {
    // Only record for premium users
    return window.userTier === "premium";

    // Or only during business hours
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 17;
  },
}
```

### `addConfig`

- **Type:** `{ heatmap?: { id: number }, sessionRecording?: { id: number } }`
- **Default:** `undefined`
- **Description:** Manually configure specific heatmap or session recording IDs

```js
heatmapConfig: {
  addConfig: {
    heatmap: { id: 5 },
    sessionRecording: { id: 10 },
  },
}
```

## Complete Configuration Example

**Pages Router:**

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeatmapSessionRecording: true,
  heatmapConfig: {
    captureKeystrokes: false, // Privacy: keep disabled
    recordMovements: true, // Enable move heatmap
    maxCaptureTime: 600, // 10 minutes max
    disableAutoDetectNewPageView: false,
    trigger: (config) => {
      // Only record logged-in users
      return window.isUserLoggedIn === true;
    },
  },
});
```

**App Router:**

```js
trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  enableHeatmapSessionRecording: true,
  heatmapConfig: {
    captureKeystrokes: false,
    recordMovements: true,
    maxCaptureTime: 600,
    disableAutoDetectNewPageView: false,
    trigger: (config) => {
      return window.isUserLoggedIn === true;
    },
  },
});
```

## Privacy & Security

When enabled, Heatmap & Session Recording:

- **Does NOT capture keystrokes** (disabled by default since v3.2.0)
- **Masks sensitive fields**: `password`, `tel`, `email` input types
- **Ignores credit card patterns**: 7-21 consecutive digits
- **Ignores email patterns**: text containing `@` symbol
- **Does not record iframes**: content within iframes is not captured

### Additional Privacy Measures

Use data attributes to control recording:

```html
<!-- Mask specific elements -->
<div data-matomo-mask>Sensitive user data</div>

<!-- Mask form fields -->
<input type="text" data-matomo-mask placeholder="SSN" />

<!-- Override default masking -->
<input type="email" data-matomo-unmask />
```

## Testing

### Force Recording

During development, force recording by adding URL parameter:

```
?pk_hsr_forcesample=1
```

### Prevent Recording

Prevent recording during development:

```
?pk_hsr_forcesample=0
```

This is useful when your sample rate is less than 100%.

## Next Steps

- [Advanced Configuration](./advanced.md) - All available options, HeartBeat timer, debug mode, callbacks
- [Events](./events.md) - Track custom events
- [Security](./security.md) - CSP and privacy
