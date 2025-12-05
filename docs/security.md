# Security & Privacy

Security considerations and Content Security Policy configuration.

## Content Security Policy (CSP)

### Nonce

If you use a CSP header with a `nonce` attribute, pass it to the initialization function:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  nonce: "your-nonce-value",
});
```

### Trusted Types

If you use strict Trusted Types, allow the script tag creation by adding the policy name:

```txt
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types matomo-next;
```

You can set a custom policy name:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  trustedPolicyName: "your-custom-policy-name",
});
```

## Privacy & GDPR

### GDPR-Compliant Tracking

Enable cookie-less tracking for better GDPR compliance:

**Pages Router:**

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true,
});
```

**App Router:**

```js
trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  disableCookies: true,
});
```

### Exclude Sensitive Routes

Prevent tracking of specific URLs:

**Pages Router:**

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  excludeUrlsPatterns: [/^\/admin/, /\?token=/],
});
```

**App Router:**

```js
trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  excludeUrlsPatterns: [/^\/admin/, /\?token=/],
});
```

### Clean URLs

Remove sensitive data from tracked URLs:

**Pages Router:**

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  cleanUrl: true,
});
```

**App Router:**

```js
trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  cleanUrl: true,
});
```

### Debug Mode

Enable debug logging during development:

**Pages Router:**

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  debug: process.env.NODE_ENV === "development",
});
```

**App Router:**

```js
trackAppRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  pathname,
  searchParams,
  debug: process.env.NODE_ENV === "development",
});
```

## Next Steps

- [Advanced Configuration](./advanced.md) - All available options, HeartBeat timer, debug mode, callbacks
- [Events](./events.md) - Track custom events
- [Heatmap & Session Recording](./heatmap-session-recording.md) - User behavior tracking
