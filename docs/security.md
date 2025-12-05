# Security & Privacy

This guide covers security considerations, Content Security Policy configuration, and privacy best practices for matomo-next.

## Content Security Policy (CSP)

### Nonce Support

If you use a Content Security Policy with a `nonce` attribute, pass it to the initialization function:

**Pages Router:**

```js
import { trackPagesRouter } from "@socialgouv/matomo-next";

trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  nonce: "your-nonce-value",
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
  nonce: "your-nonce-value",
});
```

#### Generating Nonces in Next.js

**With Middleware (recommended):**

```js
// middleware.js
import { NextResponse } from "next/server";
import crypto from "crypto";

export function middleware(request) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const response = NextResponse.next();

  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}' https://your-matomo.com;`);

  return response;
}
```

**Retrieving nonce in component:**

```js
import { headers } from "next/headers";

export function MatomoAnalytics() {
  const nonce = headers().get("x-nonce");

  useEffect(() => {
    trackAppRouter({
      url: MATOMO_URL,
      siteId: MATOMO_SITE_ID,
      pathname,
      searchParams,
      nonce,
    });
  }, [pathname, searchParams, nonce]);

  return null;
}
```

### Trusted Types

matomo-next injects scripts into the DOM. If you use strict Trusted Types, allow the policy:

```txt
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types matomo-next;
```

#### Custom Policy Name

You can set a custom policy name:

**Pages Router:**

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  trustedPolicyName: "my-custom-policy",
});
```

**App Router:**

```js
trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  trustedPolicyName: "my-custom-policy",
});
```

Then update your CSP header:

```txt
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types my-custom-policy;
```

### Complete CSP Configuration

Example secure CSP configuration for Next.js:

```js
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'nonce-{{NONCE}}' https://your-matomo.com;
  connect-src 'self' https://your-matomo.com;
  img-src 'self' https://your-matomo.com data: blob:;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  require-trusted-types-for 'script';
  trusted-types matomo-next;
`;

module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
};
```

## Privacy Considerations

### Cookie-less Tracking

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
- No cookie consent banner needed (for tracking only)
- Better GDPR compliance

**Trade-offs:**

- Cannot track returning visitors across sessions
- Reduced visitor uniqueness
- No cart abandonment tracking

### Clean URLs

Remove sensitive data from tracked URLs:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  cleanUrl: true,
});
```

**Examples:**

- `/profile?user_id=123&token=abc` → tracked as `/profile`
- `/checkout?payment_intent=pi_123` → tracked as `/checkout`

### Exclude Sensitive Routes

Prevent tracking of sensitive pages:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  excludeUrlsPatterns: [
    /^\/admin/, // Admin pages
    /^\/api/, // API routes
    /\?token=/, // URLs with tokens
    /\?reset_password=/, // Password reset pages
    /^\/checkout\/payment/, // Payment pages
  ],
});
```

### Data Minimization

Track only what you need:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true,
  cleanUrl: true,
  excludeUrlsPatterns: [/\/admin/, /\?token=/],
  enableHeatmapSessionRecording: false, // Disable if not needed
});
```

## GDPR Compliance

### Consent Management

Respect user consent before tracking:

```js
function MyApp({ Component, pageProps }) {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check consent status
    const consent = localStorage.getItem("analytics-consent");
    setHasConsent(consent === "true");
  }, []);

  useEffect(() => {
    if (hasConsent) {
      trackPagesRouter({
        url: MATOMO_URL,
        siteId: MATOMO_SITE_ID,
      });
    }
  }, [hasConsent]);

  return <Component {...pageProps} />;
}
```

### Opt-Out Functionality

Provide opt-out mechanism:

```js
import { push } from "@socialgouv/matomo-next";

function OptOutButton() {
  const handleOptOut = () => {
    push(["optUserOut"]);
    localStorage.setItem("analytics-consent", "false");
  };

  return <button onClick={handleOptOut}>Opt out of tracking</button>;
}
```

### Data Retention

Configure data retention in Matomo settings:

1. Go to Administration → Privacy → Anonymize data
2. Set appropriate retention periods
3. Enable automatic deletion of old logs

### Right to Erasure

Implement data deletion requests:

```js
// API route to handle deletion requests
export async function POST(request) {
  const { userId } = await request.json();

  // Call Matomo's user deletion API
  await fetch(`${MATOMO_URL}/index.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      module: "API",
      method: "UsersManager.deleteUser",
      userLogin: userId,
      token_auth: MATOMO_TOKEN,
    }),
  });

  return Response.json({ success: true });
}
```

## Heatmap & Session Recording Privacy

### Default Privacy Protection

Heatmap & Session Recording automatically:

- Masks `password`, `tel`, `email` fields
- Ignores credit card patterns (7-21 digits)
- Ignores email patterns (text with @)
- Does not capture iframe content

### Additional Masking

Use data attributes to control recording:

```html
<!-- Mask sensitive elements -->
<div data-matomo-mask>User's address: 123 Main St</div>

<!-- Mask form fields -->
<input type="text" data-matomo-mask placeholder="Social Security Number" />

<!-- Override default masking -->
<input type="email" data-matomo-unmask />
```

### Disable Keystroke Capture

Keystroke capture is disabled by default:

```js
heatmapConfig: {
  captureKeystrokes: false, // Default: false
}
```

**Only enable if:**

- You have explicit user consent
- You understand GDPR implications
- You have a legitimate need

### Conditional Recording

Record only with consent:

```js
heatmapConfig: {
  trigger: () => {
    return localStorage.getItem("recording-consent") === "true";
  },
}
```

## Best Practices

### 1. Minimize Data Collection

Only track what you need:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true, // No cookies
  cleanUrl: true, // No query params
  enableHeatmapSessionRecording: false, // No recordings
});
```

### 2. Be Transparent

Inform users about tracking:

- Clear privacy policy
- Cookie banner if needed
- Easy opt-out mechanism

### 3. Secure Configuration

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  nonce: getNonce(), // CSP nonce
  trustedPolicyName: "matomo", // Trusted Types
  excludeUrlsPatterns: [
    // Exclude sensitive URLs
    /\?token=/,
    /\/admin/,
  ],
});
```

### 4. Regular Audits

Periodically review:

- What data is being collected
- Retention policies
- User consent status
- Privacy compliance

### 5. Anonymous by Default

Start with minimal tracking:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true,
  onInitialization: () => {
    // Only set user ID if consented
    if (hasConsent()) {
      push(["setUserId", getUserId()]);
    }
  },
});
```

## Security Checklist

- [ ] CSP headers configured with nonce/Trusted Types
- [ ] Cookie-less tracking enabled (if appropriate)
- [ ] Sensitive URLs excluded from tracking
- [ ] Clean URLs enabled for privacy
- [ ] User consent mechanism implemented
- [ ] Opt-out functionality available
- [ ] Privacy policy updated
- [ ] Heatmap keystroke capture disabled
- [ ] Sensitive fields masked with data attributes
- [ ] Data retention policies configured
- [ ] HTTPS only for Matomo instance
- [ ] Regular security audits scheduled

## Compliance Resources

### GDPR

- [Matomo GDPR Compliance](https://matomo.org/gdpr/)
- [GDPR User Guide](https://matomo.org/gdpr-analytics/)

### Privacy Shield / Data Protection

- [Matomo Data Protection](https://matomo.org/privacy/)
- [Cookie-less Tracking](https://matomo.org/faq/general/faq_157/)

### Industry Standards

- [Privacy by Design](https://matomo.org/privacy-by-design/)
- [Data Minimization](https://matomo.org/faq/general/faq_146/)

## Next Steps

- [Getting Started](./getting-started.md) - Basic setup guide
- [Configuration](./configuration.md) - All configuration options
- [Advanced Features](./advanced.md) - Callbacks and extensibility
- [Heatmap & Session Recording](./heatmap-session-recording.md) - User behavior tracking
