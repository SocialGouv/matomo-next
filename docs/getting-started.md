# Getting Started

This guide will help you integrate Matomo analytics into your Next.js application.

## Installation

```bash
npm install @socialgouv/matomo-next
# or
yarn add @socialgouv/matomo-next
```

## Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_MATOMO_URL=https://your-matomo-instance.com
NEXT_PUBLIC_MATOMO_SITE_ID=1
```

## Pages Router Setup

For Next.js applications using the Pages Router, add the [`trackPagesRouter()`](../src/track-pages-router.ts) call in your `_app.js`:

```jsx
import React, { useEffect } from "react";
import App from "next/app";
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

This will automatically track route changes using Next.js router events.

## App Router Setup

For Next.js 13+ applications using the App Router, create a client component to handle tracking:

### 1. Create a Matomo Component

Create a new file `app/matomo.js`:

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

### 2. Add to Root Layout

Add the component to your root layout (`app/layout.js`) wrapped in a `Suspense` boundary:

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

**Important:** The `Suspense` boundary is required when using [`useSearchParams()`](https://nextjs.org/docs/app/api-reference/functions/use-search-params) in the App Router.

## How It Works

### Pages Router

- Automatically tracks route changes using Next.js router events
- Uses `routeChangeComplete` event to track page views
- Tracks full URL with query parameters

### App Router

- Tracks changes in both [`pathname`](https://nextjs.org/docs/app/api-reference/functions/use-pathname) and [`searchParams`](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- Automatically detects navigation and tracks page views
- Properly handles referrer tracking between pages

Both implementations automatically:

- Track page views on navigation
- Track search queries on `/recherche` and `/search` routes
- Handle SPA navigation correctly

## Next Steps

- [Configuration Options](./configuration.md) - Learn about all available configuration options
- [Event Tracking](./events.md) - Track custom events and user interactions
- [Heatmap & Session Recording](./heatmap-session-recording.md) - Enable advanced user behavior tracking
- [Advanced Features](./advanced.md) - HeartBeat timer, debug mode, and extensibility
- [Security](./security.md) - Content Security Policy and privacy considerations
