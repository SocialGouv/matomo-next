# Server-Side Proxy

Bypass ad-blockers by routing Matomo tracking requests through your own Next.js server with a randomly-generated endpoint that changes on every build.

## Why?

Ad-blockers commonly block requests to known analytics domains (e.g. `*.matomo.cloud`, `analytics.example.com`). They also maintain lists of known proxy paths. This proxy solves both problems:

1. **Your domain** — the browser only talks to `yoursite.com`, never to the Matomo domain
2. **Random endpoint** — the proxy path changes on every build (e.g. `/api/a3f7b2c1e9`), so ad-blockers can't hardcode it
3. **True server-side proxy** — requests are forwarded by your API route, not just rewritten
4. **Opaque filenames** — even `matomo.js` / `matomo.php` are hidden behind build-time random names

## How It Works

```
Browser → yoursite.com/api/a3f7b2c1e9/t3fa1c0d2e4 → [Next.js rewrite] → /api/__mp/t3fa1c0d2e4 → [API handler] → analytics.example.com/matomo.php
```

Notes:
- There is **no PHP running on your site**. `matomo.php` is only the upstream Matomo endpoint.
  On your domain we use an opaque path (e.g. `t3fa1c0d2e4`) and forward it server-side.
- Route conflicts are practically avoided because the public proxy prefix is **random** and
  generated per build (10 hex chars). If you want additional guarantees, provide a custom
  `proxyPath` that you know won’t overlap with your existing API routes.

1. `withMatomoProxy()` generates a **random** proxy path at build time (e.g. `/api/a3f7b2c1e9`)
2. It adds a Next.js rewrite: `/api/{random}/:path*` → `/api/__mp/:path*`
3. You create a catch-all API route with `createMatomoProxyHandler()` that forwards requests to Matomo
4. The browser only ever talks to **your** domain — ad-blockers see nothing suspicious
5. On next deploy, a **new random path** is generated — impossible to maintain a blocklist

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

### 2. Create the API route handler

Create a catch-all route that forwards requests to Matomo:

```ts
// app/api/__mp/[...path]/route.ts
import { createMatomoProxyHandler } from "@socialgouv/matomo-next";

export const { GET, POST } = createMatomoProxyHandler();
```

That's it! The handler reads the `MATOMO_PROXY_TARGET` env var (set automatically by `withMatomoProxy`) and forwards requests to your Matomo instance.

### 3. Use the proxy in your tracker

When the proxy is configured via `withMatomoProxy()`, the library will **automatically**
route calls through your own domain.

This includes **both** the hostname *and* the usual Matomo filenames:
- the browser will request an opaque `*.js` filename (proxied to upstream `matomo.js`)
- the tracking hits will go to an opaque non-`.php` endpoint (proxied to upstream `matomo.php`)

That means you can omit the Matomo URL entirely (so it doesn't end up in the client bundle),
as long as `NEXT_PUBLIC_MATOMO_PROXY_PATH` is present.

Under the hood, the client uses the proxy **path** (relative URL), so there is
no need to pass your own domain anywhere: the browser automatically resolves it
against the current origin.

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackAppRouter } from "@socialgouv/matomo-next";

export function MatomoProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackAppRouter({
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID!,
      pathname,
      searchParams,
    });
  }, [pathname, searchParams]);

  return null;
}
```

If you still want an explicit fallback to the direct Matomo URL, you can keep
passing `url` yourself:

```tsx
import { trackAppRouter } from "@socialgouv/matomo-next";

trackAppRouter({
  url: process.env.NEXT_PUBLIC_MATOMO_URL!,
  siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID!,
  pathname,
  searchParams,
});
```

Or disable the proxy selection explicitly:

```tsx
trackAppRouter({
  url: process.env.NEXT_PUBLIC_MATOMO_URL!,
  siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID!,
  useProxy: false,
  pathname,
  searchParams,
});
```

### Alternative: Use `getProxyPath()` / `getProxyUrl()`

If you prefer to wire the proxy base URL yourself:

```tsx
import { getProxyPath } from "@socialgouv/matomo-next";

const url = getProxyPath() ?? process.env.NEXT_PUBLIC_MATOMO_URL!;

trackAppRouter({ url, siteId, pathname, searchParams });
```

## API Reference

### `withMatomoProxy(options)`

Wraps your Next.js config to add proxy rewrite rules and environment variables.

| Option       | Type     | Required | Description                                                              |
| ------------ | -------- | -------- | ------------------------------------------------------------------------ |
| `matomoUrl`  | `string` | ✅        | Full URL of your Matomo instance                                         |
| `proxyPath`  | `string` | ❌        | Custom proxy path (default: random per build). ⚠️ Fixed paths reduce ad-block resistance |
| `siteId`     | `string` | ❌        | Injected as `NEXT_PUBLIC_MATOMO_PROXY_SITE_ID` env var                   |

**Environment variables set:**

| Variable                          | Scope  | Description                          |
| --------------------------------- | ------ | ------------------------------------ |
| `NEXT_PUBLIC_MATOMO_PROXY_PATH`   | Client | The random proxy path (e.g. `/api/a3f7b2c1e9`) |
| `NEXT_PUBLIC_MATOMO_PROXY_JS_TRACKER_FILE` | Client | Opaque JS filename served by your domain (e.g. `s3fa1c0d2e4.js`) |
| `NEXT_PUBLIC_MATOMO_PROXY_PHP_TRACKER_FILE`| Client | Opaque tracking endpoint served by your domain (e.g. `t3fa1c0d2e4`) |
| `MATOMO_PROXY_TARGET`             | Server | The Matomo URL (used by the API route handler) |
| `NEXT_PUBLIC_MATOMO_PROXY_SITE_ID`| Client | Site ID (only if `siteId` provided)  |

**Returns:** A function that takes a Next.js config and returns the enhanced config.

### `createMatomoProxyHandler()`

Creates Next.js App Router route handlers (GET & POST) that proxy requests to Matomo. Reads `MATOMO_PROXY_TARGET` from the environment.

The handler forwards:
- Query parameters
- User-Agent, Accept-Language, Content-Type headers
- Client IP (`X-Forwarded-For`) for geolocation accuracy

```ts
// app/api/__mp/[...path]/route.ts
import { createMatomoProxyHandler } from "@socialgouv/matomo-next";
export const { GET, POST } = createMatomoProxyHandler();
```

### `getProxyUrl()`

Returns the full proxy URL (`origin + path`) or `null` if not configured.

```ts
getProxyUrl(); // "https://yoursite.com/api/a3f7b2c1e9" or null
```

### `getProxyPath()`

Returns just the proxy path or `null`.

```ts
getProxyPath(); // "/api/a3f7b2c1e9" or null
```

### `generateProxyPath()`

Generates a random opaque path. Used internally by `withMatomoProxy`, but exported for advanced use cases.

```ts
generateProxyPath(); // "/a3f7b2c1e9" (different every call)
```

## What Gets Proxied

| Request                        | Browser sees                               | Forwarded to                                   |
| ------------------------------ | ------------------------------------------ | ---------------------------------------------- |
| JS tracker                     | `yoursite.com/api/{random}/{opaque}.js`    | `analytics.example.com/matomo.js`              |
| PHP tracker (data collection)  | `yoursite.com/api/{random}/{opaque}`       | `analytics.example.com/matomo.php`             |
| Plugin assets                  | `yoursite.com/api/{random}/plugins/*`      | `analytics.example.com/plugins/*`              |

## Advanced Usage

### Custom proxy path

If you want a specific path instead of the auto-generated one (⚠️ reduces ad-block resistance):

```js
export default withMatomoProxy({
  matomoUrl: "https://analytics.example.com",
  proxyPath: "/t",
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

### Pages Router API route

If you're using the Pages Router instead of App Router, create the handler at `pages/api/__mp/[...path].ts`:

```ts
// pages/api/__mp/[...path].ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const target = process.env.MATOMO_PROXY_TARGET;
  if (!target) return res.status(500).end("Proxy not configured");

  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join("/") : (path ?? "");
  const targetUrl = new URL(`/${pathStr}`, target);

  // Forward query params (excluding 'path' used by catch-all route)
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== "path" && typeof value === "string") {
      targetUrl.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {};
  if (req.headers["user-agent"]) headers["user-agent"] = req.headers["user-agent"];
  if (req.headers["accept-language"]) headers["accept-language"] = req.headers["accept-language"] as string;
  if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"];
  if (req.headers["x-forwarded-for"]) headers["x-forwarded-for"] = req.headers["x-forwarded-for"] as string;

  const response = await fetch(targetUrl.toString(), {
    method: req.method ?? "GET",
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
  });

  res.status(response.status);
  const contentType = response.headers.get("content-type");
  if (contentType) res.setHeader("content-type", contentType);

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}
```

## Security Considerations

- The proxy path is **random** and **changes every build** — ad-blockers cannot maintain a static blocklist
- No sensitive data (API keys, tokens) is embedded in the proxy
- `MATOMO_PROXY_TARGET` is a **server-only** env var — never exposed to the browser
- Matomo's own security (CORS, auth tokens) still applies
- The handler only proxies to the configured Matomo URL — it cannot be abused to proxy arbitrary destinations
- Consider adding rate-limiting in production via middleware or your hosting platform
