# Event Tracking

Track custom user interactions in your application.

## Type-Safe Event Tracking (Recommended)

Use the `sendEvent` helper:

```js
import { sendEvent } from "@socialgouv/matomo-next";

// Basic event
sendEvent({ category: "contact", action: "click phone" });

// Event with name
sendEvent({
  category: "video",
  action: "play",
  name: "intro-video",
});

// Event with name and value
sendEvent({
  category: "purchase",
  action: "buy",
  name: "product-123",
  value: 99,
});
```

### Parameters

- `category` (required): The event category
- `action` (required): The action being tracked
- `name` (optional): A label for the event
- `value` (optional): A numeric value

## Advanced Tracking with Push

For advanced use cases, use the `push` function directly:

```js
import { push } from "@socialgouv/matomo-next";

// Track custom events
push(["trackEvent", "contact", "click phone"]);

// Track custom dimensions
push(["setCustomDimension", 1, "premium-user"]);

// Track goals
push(["trackGoal", 1]);
```

## Next Steps

- [Advanced Configuration](./advanced.md) - All available options, HeartBeat timer, debug mode, callbacks
- [Heatmap & Session Recording](./heatmap-session-recording.md) - User behavior tracking
- [Security](./security.md) - CSP and privacy
