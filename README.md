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

<br>
<br>
<br>
<br>

- Basic SPA Matomo setup
- Will track `next/router` route changes `routeChangeComplete` event
- ⚠️ Notes for [Next.js app router](https://github.com/SocialGouv/matomo-next/issues/99)

## Usage

Add the `init` call in your `_app.js` :

```jsx
import React, { useEffect } from "react";
import App from "next/app";

import { init } from "@socialgouv/matomo-next";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

Will track routes changes by default.

### Exclude tracking some routes :

This wont track `/login.php` or any url containing `?token=`.

```js
init({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  excludeUrlsPatterns: [/^\/login.php/, /\?token=.+/],
});
```

### Disable cookies :

To disable cookies (for better GDPR compliance) set the `disableCookies` flag to `true`.

```js
init({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  disableCookies: true,
});
```

### Track additional events :

```js
import { push } from "@socialgouv/matomo-next";

// track some events
push(["trackEvent", "contact", "click phone"]);
```

### Content-Security-Policy
#### [Nonce](https://developer.mozilla.org/fr/docs/Web/HTML/Global_attributes/nonce)
If you use a `Content-Security-Policy` header with a `nonce` attribute, you can pass it to the `init` function to allow the script to be executed.

```js
init({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  nonce: "123456789",
})
```

#### [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/trusted-types)
As the `matomo-next` injects a matomo script, if you use strict Trusted Types, you need to allow the `script` tag to be created by adding our policy name to your `trusted types` directive.

```
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types matomo-next;
```

You can set a custom policy name by passing it to the `init` function.

```js
init({
  url: MATOMO_URL,
  siteId: MATOMO_SITE_ID,
  trustedPolicyName: "your-custom-policy-name",
})
```

### Extensibility

The function has three optional callback properties that allow for custom behavior to be added:

- `onRouteChangeStart(path: string) => void`: This callback is triggered when the route is about to change with Next Router event `routeChangeStart`. It receives the new path as a parameter.

- `onRouteChangeComplete`: This callback is triggered when the route change is complete with Next Router event `routeChangeComplete`. It receives the new path as a parameter.

- `onInitialization`: This callback is triggered when the function is first initialized. It does not receive any parameters. **It could be useful to use it if you want to add parameter to Matomo when the page is render the first time.**

- `onScriptLoadingError`: This callback is triggered when the script does not load. It does not receive any parameters. useful to detect ad-blockers.

## Tests

```
init
  ✓ should create a js tag and initialize (7 ms)
  ✓ should NOT create events when url is not provided (9 ms)
push
  ✓ should append data to window._paq (1 ms)
  ✓ should append dimensions data to window._paq (1 ms)
onInitialization
  ✓ should work if the surcharge of the operator (1 ms)
router.routeChangeStart event
  ✓ should setReferrerUrl and setCustomUrl on route change start (1 ms)
  ✓ should use previousPath as referer on consecutive route change (1 ms)
  ✓ should work if the surcharge of the operator (3 ms)
router.routeChangeComplete event
  ✓ should trackPageView with correct title on route change (3 ms)
  ✓ should use previousPath as referer on consecutive route change (2 ms)
  ✓ should track route as search in /recherche (1 ms)
  ✓ should track route as search in /search (2 ms)
  ✓ should work if the surcharge of the operator (2 ms)
excludeUrlsPatterns
  ✓ should excluded login.php and token variables (2 ms)
  ✓ should exclude initial page tracking (3 ms)
  ✓ should track initial page if not excluded (2 ms)
disableCookies
  ✓ should NOT append disableCookies to window._paq by default (1 ms)
  ✓ should append disableCookies to window._paq (1 ms)
```
