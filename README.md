<h1 align="center">
  <img src="https://github.com/SocialGouv/matomo-next/raw/master/.github/matomo.png" width="250"/>
  <p align="center">Matomo Next</p>
  <p align="center" style="font-size: 0.5em">Matomo analytics for Next.js applications</p>
</h1>

<p align="center">
  <a href="https://github.com/SocialGouv/matomo-next/actions/"><img src="https://github.com/SocialGouv/matomo-next/workflows/ci/badge.svg" alt="Github Master CI Build Status"></a>
  <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache--2.0-yellow.svg" alt="License: Apache-2.0"></a>
  <a href="https://github.com/SocialGouv/matomo-next/releases "><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/SocialGouv/matomo-next?sort=semver"></a>
  <a href="https://www.npmjs.com/package/@socialgouv/matomo-next"><img src="https://img.shields.io/npm/v/@socialgouv/matomo-next.svg" alt="Npm version"></a>
  <a href="https://codecov.io/gh/SocialGouv/matomo-next"><img src="https://codecov.io/gh/SocialGouv/matomo-next/branch/master/graph/badge.svg" alt="codecov"></a>
</p>

<br/>

A lightweight, TypeScript-ready Matomo analytics integration for Next.js applications with support for both Pages Router and App Router.

## ✨ Features

- ✅ **Pages Router & App Router Support** - Works with both Next.js routing systems
- ✅ **Automatic Page Tracking** - Tracks route changes and page views automatically
- ✅ **Search Tracking** - Built-in search query tracking
- ✅ **GDPR Compliant** - Cookie-less tracking option
- ✅ **Custom Events** - Type-safe event tracking API
- ✅ **Heatmap & Session Recording** - Optional user behavior visualization
- ✅ **TypeScript Support** - Full type safety and auto-completion

## 📦 Installation

```bash
npm install @socialgouv/matomo-next
# or
yarn add @socialgouv/matomo-next
```

## 🚀 Quick Start

### Pages Router

Add the [`trackPagesRouter()`](./src/track-pages-router.ts) call in your `_app.js`:

```jsx
import { useEffect } from "react";
import { trackPagesRouter } from "@socialgouv/matomo-next";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    trackPagesRouter({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

### App Router

Create a client component for tracking with [`trackAppRouter()`](./src/track-app-router.ts):

```jsx
"use client";

import { trackAppRouter } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

export function MatomoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackAppRouter({
      url: MATOMO_URL,
      siteId: MATOMO_SITE_ID,
      pathname,
      searchParams,
    });
  }, [pathname, searchParams]);

  return null;
}
```

Add it to your root layout wrapped in a `Suspense` boundary:

```jsx
import { Suspense } from "react";
import { MatomoAnalytics } from "./matomo";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Suspense fallback={null}>
          <MatomoAnalytics />
        </Suspense>
      </body>
    </html>
  );
}
```

## 📖 Documentation

### Core Documentation

- **[Getting Started](./docs/getting-started.md)** - Installation and basic setup
- **[Configuration](./docs/configuration.md)** - All configuration options and examples
- **[Event Tracking](./docs/events.md)** - Track custom user interactions
- **[Advanced Features](./docs/advanced.md)** - HeartBeat timer, callbacks, and extensibility
- **[Security & Privacy](./docs/security.md)** - CSP configuration and GDPR compliance

### Advanced Features

- **[Heatmap & Session Recording](./docs/heatmap-session-recording.md)** - User behavior tracking and visualization

## 🎯 Common Use Cases

### Track Custom Events

Use the [`sendEvent()`](./src/events.ts) helper for type-safe event tracking:

```js
import { sendEvent } from "@socialgouv/matomo-next";

// Track a button click
sendEvent({ category: "contact", action: "click phone" });

// Track with additional context
sendEvent({
  category: "video",
  action: "play",
  name: "intro-video",
  value: "120",
});
```

### GDPR-Compliant Tracking

Enable cookie-less tracking:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true,
});
```

### Exclude Sensitive Routes

Prevent tracking of specific URLs:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  excludeUrlsPatterns: [/^\/admin/, /\?token=/],
});
```

### Debug Mode

Enable debug logging during development:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  debug: process.env.NODE_ENV === "development",
});
```

## 🔧 Configuration Options

| Option                          | Type       | Description           | Docs                                                              |
| ------------------------------- | ---------- | --------------------- | ----------------------------------------------------------------- |
| `url`                           | `string`   | Matomo instance URL   | Required                                                          |
| `siteId`                        | `string`   | Matomo site ID        | Required                                                          |
| `disableCookies`                | `boolean`  | Cookie-less tracking  | [Config](./docs/configuration.md#privacy--gdpr)                   |
| `excludeUrlsPatterns`           | `RegExp[]` | URLs to exclude       | [Config](./docs/configuration.md#exclude-url-patterns)            |
| `cleanUrl`                      | `boolean`  | Remove query params   | [Config](./docs/configuration.md#clean-urls)                      |
| `searchKeyword`                 | `string`   | Search parameter name | [Config](./docs/configuration.md#custom-search-keyword-parameter) |
| `enableHeartBeatTimer`          | `boolean`  | Track time on page    | [Advanced](./docs/advanced.md#heartbeat-timer)                    |
| `enableHeatmapSessionRecording` | `boolean`  | Enable recordings     | [Heatmap](./docs/heatmap-session-recording.md)                    |
| `debug`                         | `boolean`  | Enable debug logs     | [Advanced](./docs/advanced.md#debug-mode)                         |

See [complete configuration options](./docs/configuration.md) for full details.

## 🛡️ Security

### Content Security Policy

Configure CSP with nonce support:

```js
trackPagesRouter({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  nonce: "your-nonce-value",
});
```

### Trusted Types

Allow the script injection policy:

```txt
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types matomo-next;
```

See [Security documentation](./docs/security.md) for complete CSP setup.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

Apache-2.0 © [Social Gouv](https://github.com/SocialGouv)

## 🔗 Links

- [Matomo Official Documentation](https://matomo.org/docs/)
- [Matomo JavaScript Tracker API](https://developer.matomo.org/api-reference/tracking-javascript)
- [Next.js Documentation](https://nextjs.org/docs)

---

<p align="center">Made with ❤️ by <a href="https://github.com/SocialGouv">Social Gouv</a></p>
