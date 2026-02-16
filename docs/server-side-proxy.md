# Server-Side Proxy

Bypass ad-blockers by routing Matomo tracking requests through your own Next.js server.

## Why?

Ad-blockers commonly block requests to known analytics domains (e.g. `*.matomo.cloud`, `analytics.example.com`). By proxying requests through your own domain, the browser sends tracking data to **your** server, which then forwards it to Matomo.

## How It Works

```
Browser → yoursite.com/mtm-a1b2c3d4/matomo.php → analytics.example.com/matomo.php
```

1. `withMatomoProxy()` adds Next.js **rewrite rules** at build time
2. A deterministic, opaque path is generated from your Matomo URL (e.g. `/mtm-a1b2c3d4`)
3. The path is exposed as `NEXT_PUBLIC_MATOMO_PROXY_PATH` for client code
4. All tracker requests (`matomo.js`, `matomo.php`, plugins) are proxied through your domain
5. Ad-blockers see requests to `yoursite.com` — not `analytics.example.com`

## Quick Start

### 1. Wrap your Next.js config

```js
// next.config.mjs
import { withMatomoProxy } from "@socialgouv/matomo-next";

const nextConfig = {
  // your existing config
};

export default withMatomoProxy({
  matomoUrl: "https://analytics.example.com",
  siteId: "1", // optional: injects NEXT_PUBLIC_MATOMO_PROXY_SITE_ID
})(nextConfig);
```

### 2. Use the proxy URL in your tracker

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackAppRouter, getProxyUrl } from "@socialgouv/matomo-next";

export function MatomoProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // getProxyUrl() returns the full proxy URL or null if not configured
    const url = getProxyUrl() ?? process.env.NEXT_PUBLIC_MATOMO_URL!;

    trackAppRouter({
      url,
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID!,
      pathname,
      searchParams,
    });
  }, [pathname, searchParams]);

  return null;
}
```

### Alternative: Use `getProxyPath()`

If you prefer a relative URL (Next.js resolves it against the current origin):

```tsx
import { getProxyPath } from "@socialgouv/matomo-next";

const url = getProxyPath() ?? process.env.NEXT_PUBLIC_MATOMO_URL!;
```

## API Reference

### `withMatomoProxy(options)`

Wraps your Next.js config to add proxy rewrite rules.

| Option       | Type     | Required | Description                                              |
| ------------ | -------- | -------- | -------------------------------------------------------- |
| `matomoUrl`  | `string` | ✅        | Full URL of your Matomo instance                         |
| `proxyPath`  | `string` | ❌        | Custom proxy path (default: auto-generated from URL hash) |
| `siteId`     | `string` | ❌        | Injected as `NEXT_PUBLIC_MATOMO_PROXY_SITE_ID` env var   |

**Returns:** A function that takes a Next.js config and returns the enhanced config.

### `getProxyUrl()`

Returns the full proxy URL (`origin + path`) or `null` if not configured.

```ts
getProxyUrl(); // "https://yoursite.com/mtm-a1b2c3d4" or null
```

### `getProxyPath()`

Returns just the proxy path or `null`.

```ts
getProxyPath(); // "/mtm-a1b2c3d4" or null
```

### `generateProxyPath(url)`

Generates a deterministic opaque path from a URL. Used internally, but exported for advanced use cases.

```ts
generateProxyPath("https://analytics.example.com");
// "/mtm-a1b2c3d4"
```

## What Gets Proxied

| Request                        | Proxy Source                                    | Destination                                   |
| ------------------------------ | ----------------------------------------------- | --------------------------------------------- |
| JS tracker                     | `/mtm-xxx/matomo.js`                            | `analytics.example.com/matomo.js`             |
| PHP tracker (data collection)  | `/mtm-xxx/matomo.php`                           | `analytics.example.com/matomo.php`            |
| Plugin assets                  | `/mtm-xxx/plugins/*`                            | `analytics.example.com/plugins/*`             |

## Advanced Usage

### Custom proxy path

If you want a specific path instead of the auto-generated one:

```js
export default withMatomoProxy({
  matomoUrl: "https://analytics.example.com",
  proxyPath: "/t",  // very short to minimize bytes
})(nextConfig);
```

### Preserving existing rewrites

`withMatomoProxy` preserves any existing rewrite rules in your config:

```js
const nextConfig = {
  rewrites: async () => [
    { source: "/old-page", destination: "/new-page" },
  ],
};

// Both the existing rewrite and Matomo rewrites will be active
export default withMatomoProxy({
  matomoUrl: "https://analytics.example.com",
})(nextConfig);
```

### Chaining with other Next.js plugins

```js
import { withMatomoProxy } from "@socialgouv/matomo-next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig = { /* ... */ };

export default withMatomoProxy({
  matomoUrl: "https://analytics.example.com",
})(
  withBundleAnalyzer({ enabled: false })(nextConfig)
);
```

## Security Considerations

- The proxy path is **opaque** but **deterministic** — the same Matomo URL always produces the same path
- No sensitive data (API keys, tokens) is embedded in the proxy
- Matomo's own security (CORS, auth tokens) still applies
- The proxy only forwards specific paths (`matomo.js`, `matomo.php`, `plugins/*`)
- Consider adding rate-limiting in production via middleware or your hosting platform
