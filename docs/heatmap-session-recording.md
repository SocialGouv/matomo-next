# Heatmap & Session Recording

Enable Matomo's powerful Heatmap & Session Recording features to visualize user behavior and watch session replays.

## Quick Start

Enable the feature with minimal configuration:

**Pages Router:**

```js
import { trackPagesRouter } from "@socialgouv/matomo-next";

trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeatmapSessionRecording: true,
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
  enableHeatmapSessionRecording: true,
});
```

This automatically:

- Loads the Heatmap & Session Recording plugin
- Starts recording user sessions
- Captures clicks and mouse movements
- Respects privacy by masking sensitive fields

## Configuration Options

Customize the behavior with the `heatmapConfig` object:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeatmapSessionRecording: true,
  heatmapConfig: {
    // Keystroke capture (default: false)
    captureKeystrokes: false,

    // Mouse/touch movement recording (default: true)
    recordMovements: true,

    // Max capture time in seconds (default: 600 = 10 minutes)
    maxCaptureTime: 600,

    // Disable automatic page view detection (default: false)
    disableAutoDetectNewPageView: false,

    // Custom trigger function
    trigger: (config) => {
      return window.userLoggedIn === true;
    },

    // Manual configuration
    addConfig: {
      heatmap: { id: 5 },
      sessionRecording: { id: 10 },
    },
  },
});
```

### Configuration Parameters

#### `captureKeystrokes`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Controls whether keyboard input is captured

**Important:** Disabled by default for privacy. Enable only if needed and ensure GDPR compliance.

#### `recordMovements`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Records mouse/touch movements for heatmap visualization

Disable this to reduce data collection:

```js
heatmapConfig: {
  recordMovements: false, // Disables "Move Heatmap" feature
}
```

#### `maxCaptureTime`

- **Type:** `number`
- **Default:** `600` (10 minutes)
- **Description:** Maximum recording duration per page view in seconds

**Recommended:** Keep under 29 minutes to avoid creating new visits due to Matomo's 30-minute inactivity timeout.

```js
heatmapConfig: {
  maxCaptureTime: 1800, // 30 minutes
}
```

#### `disableAutoDetectNewPageView`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Disables automatic page view detection for SPAs

Enable if you track "virtual" page views for events or downloads:

```js
heatmapConfig: {
  disableAutoDetectNewPageView: true,
}
```

#### `trigger`

- **Type:** `(config: any) => boolean`
- **Default:** `undefined`
- **Description:** Custom function to control when recording happens

Use this for conditional recording:

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

#### `addConfig`

- **Type:** `{ heatmap?: { id: number }, sessionRecording?: { id: number } }`
- **Default:** `undefined`
- **Description:** Manually specify heatmap or session recording IDs

```js
heatmapConfig: {
  addConfig: {
    heatmap: { id: 5 },
    sessionRecording: { id: 10 },
  },
}
```

## Privacy & Security

### Default Privacy Protection

By default, Heatmap & Session Recording:

- ✅ **Does NOT capture keystrokes** (disabled since v3.2.0)
- ✅ **Masks sensitive fields**: `password`, `tel`, `email` input types
- ✅ **Ignores credit card patterns**: 7-21 consecutive digits
- ✅ **Ignores email patterns**: text containing `@` symbol
- ✅ **Does not record iframes**: content within iframes is not captured

### Additional Privacy Measures

Add `data-matomo-mask` attribute to elements you want to mask:

```html
<!-- Mask specific elements -->
<div data-matomo-mask>Sensitive user data</div>

<!-- Mask form fields -->
<input type="text" data-matomo-mask placeholder="SSN" />
```

Add `data-matomo-unmask` to override default masking:

```html
<!-- Override default email masking -->
<input type="email" data-matomo-unmask />
```

### GDPR Compliance

Consider these practices for GDPR compliance:

1. **Obtain consent** before enabling recording
2. **Use trigger function** to respect user preferences
3. **Keep recordings time-limited** with `maxCaptureTime`
4. **Disable keystroke capture** (already default)
5. **Mask PII fields** with `data-matomo-mask`

Example consent-based implementation:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  enableHeatmapSessionRecording: true,
  heatmapConfig: {
    trigger: () => {
      // Check if user consented to recording
      return localStorage.getItem("matomo-recording-consent") === "true";
    },
  },
});
```

## Use Cases

### User Experience Analysis

Record sessions to understand:

- Where users click
- How they navigate your site
- Where they encounter issues
- What captures their attention

### A/B Testing Validation

Compare user behavior between variants:

```js
heatmapConfig: {
  trigger: () => {
    // Only record control group
    return window.abTestVariant === "control";
  },
}
```

### Bug Investigation

Record sessions during testing or for specific users:

```js
heatmapConfig: {
  trigger: () => {
    // Record QA team sessions
    return window.location.search.includes("qa=true");
  },
}
```

### Premium Features

Limit recording to paying customers:

```js
heatmapConfig: {
  trigger: () => {
    return window.userPlan === "premium" || window.userPlan === "enterprise";
  },
}
```

## Testing & Development

### Force Recording

During development, force recording by adding URL parameter:

```
?pk_hsr_forcesample=1
```

Example: `http://localhost:3000?pk_hsr_forcesample=1`

### Prevent Recording

Prevent recording during development:

```
?pk_hsr_forcesample=0
```

This is useful when your sample rate is less than 100% and you want to control recording during testing.

## Single-Page Applications

SPAs are fully supported out of the box. Each time you call [`trackPageView`](https://developer.matomo.org/api-reference/tracking-javascript#page-views), a new page view is automatically detected.

If you track "virtual" page views (for events, downloads, etc.) without wanting to stop the recording:

```js
heatmapConfig: {
  disableAutoDetectNewPageView: true,
}
```

## Performance Considerations

### Impact on Performance

Heatmap & Session Recording has minimal performance impact:

- Asynchronous loading
- Efficient DOM capturing
- Compressed data transmission

### Optimize Recording Duration

Limit recording time to reduce data:

```js
heatmapConfig: {
  maxCaptureTime: 300, // 5 minutes only
}
```

### Selective Recording

Use triggers to record only what matters:

```js
heatmapConfig: {
  trigger: () => {
    // Only record checkout process
    return window.location.pathname.startsWith("/checkout");
  },
}
```

## Troubleshooting

### Recordings Not Appearing

1. **Check if plugin is loaded**: Enable debug mode to see console logs
2. **Verify sample rate**: In Matomo dashboard, check heatmap sample rate
3. **Check trigger function**: Ensure your trigger returns `true`
4. **Use force parameter**: Test with `?pk_hsr_forcesample=1`

### Too Much Data Captured

1. **Reduce capture time**: Lower `maxCaptureTime`
2. **Disable movements**: Set `recordMovements: false`
3. **Use selective triggers**: Record only specific user segments
4. **Lower sample rate**: Adjust in Matomo dashboard

### Privacy Concerns

1. **Disable keystrokes**: Ensure `captureKeystrokes: false`
2. **Mask fields**: Add `data-matomo-mask` attributes
3. **Implement consent**: Use trigger function to check consent
4. **Review captured data**: Regularly audit recordings for PII

## Additional Resources

- [Matomo Heatmap & Session Recording FAQ](https://matomo.org/faq/heatmap-session-recording/)
- [Developer FAQ](https://matomo.org/faq/heatmap-session-recording/developers/)
- [JavaScript Tracker API Reference](https://developer.matomo.org/api-reference/tracking-javascript)

## Next Steps

- [Advanced Features](./advanced.md) - HeartBeat timer and extensibility
- [Event Tracking](./events.md) - Track custom events
- [Security](./security.md) - Content Security Policy configuration
