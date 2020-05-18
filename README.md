<h1 align="center">
  <img src="https://github.com/SocialGouv/matomo-next/raw/master/.github/matomo.png" width="250"/>
  <p align="center">Matomo Next</p>
  <p align="center" style="font-size: 0.5em">Matomo analytics for Next.js applications</p>
</h1>

<p align="center">
  <a href="https://github.com/SocialGouv/matomo-next/workflows/ci/"><img src="https://github.com/SocialGouv/matomo-next/workflows/ci/badge.svg" alt="Github Master CI Status"></a>
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

## Usage

Add the `init` call in your `_app.js` :

```jsx
import React from "react";
import App from "next/app";

import { init } from "@socialgouv/matomo-next";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

class MyApp extends App {
  componentDidMount() {
    init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }
  render() {
    const { Component, pageProps } = this.props;
    return <Component {...pageProps} />;
  }
}

export default MyApp;
```

Will track routes changes by default.

You can also track additionnal events :

```js
import { push } from "@socialgouv/matomo-next";

// track some events
push(["trackEvent", "contact", "click phone"]);
```

## Tests

```
init
  ✓ should create a js tag and initialize (13 ms)
push
  ✓ should append data to window._paq (1 ms)
router.routeChangeComplete event
  ✓ should trackPageView with correct title on route change (4 ms)
  ✓ should use previousPath as referer on consecutive route change (6 ms)
```
