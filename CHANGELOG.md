# [1.7.0](https://github.com/SocialGouv/matomo-next/compare/v1.6.1...v1.7.0) (2023-09-06)


### Features

* allow disabling of cookie usage ([#111](https://github.com/SocialGouv/matomo-next/issues/111)) ([3d50f80](https://github.com/SocialGouv/matomo-next/commit/3d50f80dc2384de9681f3e8611a2040e934b026d)), closes [#82](https://github.com/SocialGouv/matomo-next/issues/82) [#82](https://github.com/SocialGouv/matomo-next/issues/82) [#82](https://github.com/SocialGouv/matomo-next/issues/82)

## [1.6.1](https://github.com/SocialGouv/matomo-next/compare/v1.6.0...v1.6.1) (2023-01-16)


### Bug Fixes

* **initialization:** change argument to allow to be enable before `trackPageView` ([#91](https://github.com/SocialGouv/matomo-next/issues/91)) ([9c9a3db](https://github.com/SocialGouv/matomo-next/commit/9c9a3db494c44fdca89514d3f367c1a6f8218cf7))

# [1.6.0](https://github.com/SocialGouv/matomo-next/compare/v1.5.0...v1.6.0) (2023-01-13)


### Features

* add surcharge during initialization of the parameters + add documentation ([#90](https://github.com/SocialGouv/matomo-next/issues/90)) ([51c1d34](https://github.com/SocialGouv/matomo-next/commit/51c1d345391e70b24225483430892186186ff5dd))

# [1.5.0](https://github.com/SocialGouv/matomo-next/compare/v1.4.0...v1.5.0) (2023-01-13)


### Features

* add possibility to surcharge next router listener  ([#88](https://github.com/SocialGouv/matomo-next/issues/88)) ([f1bf4a2](https://github.com/SocialGouv/matomo-next/commit/f1bf4a2e32b0ffb74a994eaeb4cff73f15591031))

# [1.4.0](https://github.com/SocialGouv/matomo-next/compare/v1.3.0...v1.4.0) (2022-07-11)


### Features

* **ts:** add dimension support ([#84](https://github.com/SocialGouv/matomo-next/issues/84)) ([417e914](https://github.com/SocialGouv/matomo-next/commit/417e914d6a72e61ff056319f8f1bb1724145bec8))

# [1.3.0](https://github.com/SocialGouv/matomo-next/compare/v1.2.2...v1.3.0) (2022-03-10)


### Features

* **routeChangeComplete events:** set referrerUrl and customUrl on routeChangeStart so it can matomo events can be used early on page load (e.g. in a react useEffect) with the correct values ([#72](https://github.com/SocialGouv/matomo-next/issues/72)) ([52f2bbc](https://github.com/SocialGouv/matomo-next/commit/52f2bbc5bad294d07a8e14315081c289622b6c11))

## [1.2.2](https://github.com/SocialGouv/matomo-next/compare/v1.2.1...v1.2.2) (2021-05-11)


### Bug Fixes

* dont use deprecated setGenerationTimeMs fix [#36](https://github.com/SocialGouv/matomo-next/issues/36) ([#52](https://github.com/SocialGouv/matomo-next/issues/52)) ([b2c6dd5](https://github.com/SocialGouv/matomo-next/commit/b2c6dd51a243757583e0ec3a37c59d21f7da8b3b))

## [1.2.1](https://github.com/SocialGouv/matomo-next/compare/v1.2.0...v1.2.1) (2021-02-19)


### Bug Fixes

* Allow `push` be called before `init` from [#33](https://github.com/SocialGouv/matomo-next/issues/33) ([#40](https://github.com/SocialGouv/matomo-next/issues/40)) ([4a5a15e](https://github.com/SocialGouv/matomo-next/commit/4a5a15e1cb324a637c09177af8f454d17c58b2e0))

# [1.2.0](https://github.com/SocialGouv/matomo-next/compare/v1.1.2...v1.2.0) (2021-02-19)


### Features

* typescript ([#38](https://github.com/SocialGouv/matomo-next/issues/38)) ([5c4cc1f](https://github.com/SocialGouv/matomo-next/commit/5c4cc1fd692d2638267b7a3c0bc014a82048b718)), closes [#12](https://github.com/SocialGouv/matomo-next/issues/12)

## [1.1.2](https://github.com/SocialGouv/matomo-next/compare/v1.1.1...v1.1.2) (2020-06-15)


### Bug Fixes

* dont double-enableLinkTracking fix [#23](https://github.com/SocialGouv/matomo-next/issues/23) ([#26](https://github.com/SocialGouv/matomo-next/issues/26)) ([12ae2e5](https://github.com/SocialGouv/matomo-next/commit/12ae2e54900faf2f452494c721e4946bf622a674))

## [1.1.1](https://github.com/SocialGouv/matomo-next/compare/v1.1.0...v1.1.1) (2020-06-15)


### Bug Fixes

* **matomo:** dont track excludeUrls even on first load ([#24](https://github.com/SocialGouv/matomo-next/issues/24)) ([647d039](https://github.com/SocialGouv/matomo-next/commit/647d0393305ad70d3e13223d0866ad4a75a079e9))

# [1.1.0](https://github.com/SocialGouv/matomo-next/compare/v1.0.1...v1.1.0) (2020-06-04)


### Features

* add init.excludeUrlsPatterns ([#20](https://github.com/SocialGouv/matomo-next/issues/20)) ([b4db11d](https://github.com/SocialGouv/matomo-next/commit/b4db11d2f26e15ba0aae7976521be2aa89aec219))

## [1.0.1](https://github.com/SocialGouv/matomo-next/compare/v1.0.0...v1.0.1) (2020-05-18)


### Bug Fixes

* trigger patch release ([51f97c5](https://github.com/SocialGouv/matomo-next/commit/51f97c5c96cd31465677d7b160acbd0aa96355b9))

# 1.0.0 (2020-05-15)


### Bug Fixes

* dummy ([1959a1c](https://github.com/SocialGouv/matomo-next/commit/1959a1cdee001d80f544c524c2e552b32f31ce26))
* dummy ([b6654fc](https://github.com/SocialGouv/matomo-next/commit/b6654fc6ae6784f170c712bb1716eee636b6702e))
