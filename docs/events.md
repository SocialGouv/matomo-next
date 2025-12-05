# Event Tracking

Track custom user interactions and events in your Next.js application.

## Type-Safe Event Tracking (Recommended)

Use the [`sendEvent()`](../src/events.ts) helper for type-safe event tracking with auto-completion:

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

### Parameters

- `category` (required): The event category (e.g., "video", "contact", "download")
- `action` (required): The action being tracked (e.g., "play", "click", "submit")
- `name` (optional): A label for the event (e.g., "intro-video", "phone-number")
- `value` (optional): A numeric value associated with the event (e.g., price, duration)

## Common Use Cases

### Button Clicks

```js
import { sendEvent } from "@socialgouv/matomo-next";

function ContactButton() {
  const handleClick = () => {
    sendEvent({ category: "contact", action: "click" });
    // Your click handler logic
  };

  return <button onClick={handleClick}>Contact Us</button>;
}
```

### Form Submissions

```js
import { sendEvent } from "@socialgouv/matomo-next";

function ContactForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    sendEvent({
      category: "form",
      action: "submit",
      name: "contact-form",
    });
    // Your form submission logic
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Video Interactions

```js
import { sendEvent } from "@socialgouv/matomo-next";

function VideoPlayer() {
  return (
    <video
      onPlay={() =>
        sendEvent({
          category: "video",
          action: "play",
          name: "product-demo",
        })
      }
      onPause={() =>
        sendEvent({
          category: "video",
          action: "pause",
          name: "product-demo",
        })
      }
      onEnded={() =>
        sendEvent({
          category: "video",
          action: "complete",
          name: "product-demo",
        })
      }
    >
      <source src="/video.mp4" />
    </video>
  );
}
```

### Downloads

```js
import { sendEvent } from "@socialgouv/matomo-next";

function DownloadButton({ fileName, fileSize }) {
  const handleDownload = () => {
    sendEvent({
      category: "download",
      action: "click",
      name: fileName,
      value: fileSize,
    });
  };

  return (
    <a href={`/files/${fileName}`} onClick={handleDownload}>
      Download {fileName}
    </a>
  );
}
```

### Outbound Links

```js
import { sendEvent } from "@socialgouv/matomo-next";

function ExternalLink({ href, children }) {
  const handleClick = () => {
    sendEvent({
      category: "outbound",
      action: "click",
      name: href,
    });
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {children}
    </a>
  );
}
```

### E-commerce Tracking

```js
import { sendEvent } from "@socialgouv/matomo-next";

function AddToCartButton({ product }) {
  const handleAddToCart = () => {
    sendEvent({
      category: "ecommerce",
      action: "add-to-cart",
      name: product.name,
      value: product.price,
    });
    // Your add to cart logic
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

## Advanced Tracking with Push

For advanced use cases or custom tracking needs, use the [`push()`](../src/tracker.ts) function directly:

```js
import { push } from "@socialgouv/matomo-next";

// Track custom events
push(["trackEvent", "contact", "click phone"]);

// Track custom dimensions
push(["setCustomDimension", 1, "premium-user"]);

// Track goals
push(["trackGoal", 1]);

// Track e-commerce events
push(["addEcommerceItem", "SKU123", "Product Name", "Category", 29.99, 1]);
push(["trackEcommerceCartUpdate", 29.99]);
```

### Common Advanced Tracking Methods

#### Custom Dimensions

Track custom user properties:

```js
import { push } from "@socialgouv/matomo-next";

// Set user type
push(["setCustomDimension", 1, "premium"]);

// Set user language preference
push(["setCustomDimension", 2, "en-US"]);
```

#### Goals

Track conversion goals:

```js
import { push } from "@socialgouv/matomo-next";

// Track goal completion
push(["trackGoal", 1]); // Goal ID 1

// Track goal with revenue
push(["trackGoal", 2, 99.99]); // Goal ID 2 with value
```

#### User ID

Track authenticated users:

```js
import { push } from "@socialgouv/matomo-next";

// After user login
push(["setUserId", "user@example.com"]);
```

#### Custom Variables

Set custom variables (page or visit scope):

```js
import { push } from "@socialgouv/matomo-next";

// Page scope
push(["setCustomVariable", 1, "page-type", "product", "page"]);

// Visit scope
push(["setCustomVariable", 2, "user-type", "customer", "visit"]);
```

## Best Practices

### 1. Consistent Naming

Use consistent naming conventions across your events:

```js
// Good
sendEvent({ category: "video", action: "play", name: "intro-video" });
sendEvent({ category: "video", action: "pause", name: "intro-video" });
sendEvent({ category: "video", action: "complete", name: "intro-video" });

// Avoid inconsistency
sendEvent({ category: "videos", action: "played", name: "intro" });
sendEvent({ category: "Video", action: "Paused", name: "intro-video" });
```

### 2. Use Semantic Categories

Choose meaningful, logical categories:

```js
// Good categories
"form", "video", "download", "navigation", "social", "ecommerce";

// Less useful
"click", "button", "link";
```

### 3. Don't Track Sensitive Data

Never track personally identifiable information (PII):

```js
// ❌ Bad - contains email
sendEvent({ category: "form", action: "submit", name: "user@example.com" });

// ✅ Good - no PII
sendEvent({ category: "form", action: "submit", name: "newsletter-signup" });
```

### 4. Avoid Over-Tracking

Track meaningful interactions, not every user action:

```js
// ✅ Good - meaningful interactions
sendEvent({ category: "search", action: "submit" });
sendEvent({ category: "checkout", action: "complete" });

// ❌ Over-tracking - too granular
sendEvent({ category: "mouse", action: "move" });
sendEvent({ category: "scroll", action: "scroll-1px" });
```

## TypeScript Support

Both [`sendEvent()`](../src/events.ts) and [`push()`](../src/tracker.ts) are fully typed for TypeScript projects:

```typescript
import { sendEvent, push } from "@socialgouv/matomo-next";

// Type-safe event
sendEvent({
  category: "video",
  action: "play",
  name: "intro",
  value: 120, // TypeScript enforces string type for value
});

// Type-safe push
push(["trackEvent", "category", "action"]);
```

## Next Steps

- [Heatmap & Session Recording](./heatmap-session-recording.md) - Advanced user behavior tracking
- [Advanced Features](./advanced.md) - Callbacks and extensibility
- [Configuration](./configuration.md) - Complete configuration reference
