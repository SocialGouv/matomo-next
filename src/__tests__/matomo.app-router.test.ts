import "./test-setup";

describe("App Router functionality", () => {
  beforeEach(() => {
    global._paq = [];
    jest.resetModules();
  });

  test("should track initial pageview when pathname is provided (first call)", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    initAppRouter({ pathname: "/home", siteId: "42", url: "https://YO" });

    expect(window._paq).toEqual(
      expect.arrayContaining([
        ["trackPageView"],
        ["enableLinkTracking"],
        ["setTrackerUrl", "https://YO/matomo.php"],
        ["setSiteId", "42"],
      ]),
    );
  });

  test("should track subsequent pageviews with setCustomUrl", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    initAppRouter({ pathname: "/home", siteId: "42", url: "https://YO" });
    initAppRouter({ pathname: "/about", siteId: "42", url: "https://YO" });

    expect(window._paq).toEqual(
      expect.arrayContaining([["setCustomUrl", "/about"], ["trackPageView"]]),
    );
  });

  test("should not track again if pathname hasn't changed", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    initAppRouter({ pathname: "/home", siteId: "42", url: "https://YO" });
    const initialLength = window._paq?.length || 0;

    initAppRouter({ pathname: "/home", siteId: "42", url: "https://YO" });

    expect(window._paq?.length).toBe(initialLength);
  });

  test("should track URL with search params on initial pageview", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    const searchParams = new URLSearchParams("q=test&page=1");
    initAppRouter({
      pathname: "/search",
      searchParams,
      siteId: "42",
      url: "https://YO",
    });

    expect(window._paq).toEqual(
      expect.arrayContaining([["trackSiteSearch", "test"]]),
    );
    expect(window._paq).not.toEqual(
      expect.arrayContaining([["trackPageView"]]),
    );
  });

  test("should track different URLs when search params change", (done) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    initAppRouter({
      pathname: "/search",
      searchParams: new URLSearchParams("q=test"),
      siteId: "42",
      url: "https://YO",
    });

    const initialLength = window._paq?.length || 0;

    initAppRouter({
      pathname: "/search",
      searchParams: new URLSearchParams("q=other"),
      siteId: "42",
      url: "https://YO",
    });

    setTimeout(() => {
      expect(window._paq?.length).toBeGreaterThan(initialLength);
      expect(window._paq).toEqual(
        expect.arrayContaining([["setCustomUrl", "/search"]]),
      );
      expect(window._paq).toEqual(
        expect.arrayContaining([["trackSiteSearch", "other"]]),
      );
      done();
    }, 10);
  });

  test("should not track when URL with search params hasn't changed", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    initAppRouter({
      pathname: "/search",
      searchParams: new URLSearchParams("q=test"),
      siteId: "42",
      url: "https://YO",
    });

    const initialLength = window._paq?.length || 0;

    initAppRouter({
      pathname: "/search",
      searchParams: new URLSearchParams("q=test"),
      siteId: "42",
      url: "https://YO",
    });

    expect(window._paq?.length).toBe(initialLength);
  });

  test("should exclude URLs based on patterns even with search params", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    initAppRouter({
      pathname: "/admin",
      searchParams: new URLSearchParams("token=secret"),
      siteId: "42",
      url: "https://YO",
      excludeUrlsPatterns: [/^\/admin/],
    });

    expect(window._paq).not.toEqual(
      expect.arrayContaining([["trackPageView"]]),
    );
    expect(window._paq).not.toEqual(
      expect.arrayContaining([["trackSiteSearch", expect.anything()]]),
    );
  });

  test("should call onRouteChangeStart and onRouteChangeComplete callbacks in App Router", (done) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    const onRouteChangeStart = jest.fn();
    const onRouteChangeComplete = jest.fn();

    initAppRouter({
      pathname: "/home",
      siteId: "42",
      url: "https://YO",
      onRouteChangeStart,
      onRouteChangeComplete,
    });

    initAppRouter({
      pathname: "/about",
      siteId: "42",
      url: "https://YO",
      onRouteChangeStart,
      onRouteChangeComplete,
    });

    expect(onRouteChangeStart).toHaveBeenCalledWith("/about");

    setTimeout(() => {
      expect(onRouteChangeComplete).toHaveBeenCalledWith("/about");
      done();
    }, 10);
  });

  describe("Site search tracking", () => {
    test("should track site search in App Router for /recherche route", (done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      initAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      initAppRouter({
        pathname: "/recherche",
        searchParams: new URLSearchParams("q=test%20query"),
        siteId: "42",
        url: "https://YO",
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["trackSiteSearch", "test query"]]),
        );
        expect(window._paq).not.toEqual(
          expect.arrayContaining([["trackPageView"]]),
        );
        done();
      }, 10);
    });

    test("should track site search in App Router for /search route", (done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      initAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      initAppRouter({
        pathname: "/search",
        searchParams: new URLSearchParams("q=next.js"),
        siteId: "42",
        url: "https://YO",
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["trackSiteSearch", "next.js"]]),
        );
        expect(window._paq).not.toEqual(
          expect.arrayContaining([["trackPageView"]]),
        );
        done();
      }, 10);
    });

    test("should handle search route without q parameter in App Router", (done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      initAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      initAppRouter({
        pathname: "/search",
        searchParams: new URLSearchParams("page=1"),
        siteId: "42",
        url: "https://YO",
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["trackSiteSearch", ""]]),
        );
        expect(window._paq).not.toEqual(
          expect.arrayContaining([["trackPageView"]]),
        );
        done();
      }, 10);
    });

    test("should track both /recherche and /search routes to avoid regressions", (done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      initAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      initAppRouter({
        pathname: "/recherche",
        searchParams: new URLSearchParams("q=first%20search"),
        siteId: "42",
        url: "https://YO",
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["trackSiteSearch", "first search"]]),
        );

        window._paq = [];

        initAppRouter({
          pathname: "/search",
          searchParams: new URLSearchParams("q=second%20search"),
          siteId: "42",
          url: "https://YO",
        });

        setTimeout(() => {
          expect(window._paq).toEqual(
            expect.arrayContaining([["trackSiteSearch", "second search"]]),
          );
          done();
        }, 10);
      }, 10);
    });

    test("should handle complex search query with multiple params and hashtag", (done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      initAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      initAppRouter({
        pathname: "/search",
        searchParams: new URLSearchParams("q=test&page=2#more"),
        siteId: "42",
        url: "https://YO",
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["trackSiteSearch", "test"]]),
        );
        expect(window._paq).toEqual(
          expect.arrayContaining([["setCustomUrl", "/search"]]),
        );
        done();
      }, 10);
    });

    test("should support custom search keyword parameter", (done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      initAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      initAppRouter({
        pathname: "/search",
        searchParams: new URLSearchParams("query=next.js"),
        searchKeyword: "query",
        siteId: "42",
        url: "https://YO",
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["trackSiteSearch", "next.js"]]),
        );
        done();
      }, 10);
    });

    test("should support custom search routes", (done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      initAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      initAppRouter({
        pathname: "/find",
        searchParams: new URLSearchParams("q=custom+route"),
        searchRoutes: ["/find", "/discover"],
        siteId: "42",
        url: "https://YO",
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["trackSiteSearch", "custom route"]]),
        );
        expect(window._paq).not.toEqual(
          expect.arrayContaining([["trackPageView"]]),
        );
        done();
      }, 10);
    });

    test("should not track as search on non-search routes when custom searchRoutes is defined", (done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      initAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      initAppRouter({
        pathname: "/search",
        searchParams: new URLSearchParams("q=test"),
        searchRoutes: ["/find"],
        siteId: "42",
        url: "https://YO",
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["trackPageView"]]),
        );
        expect(window._paq).not.toEqual(
          expect.arrayContaining([["trackSiteSearch", "test"]]),
        );
        done();
      }, 10);
    });
  });

  test("should strip hashtag from URL in App Router", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    initAppRouter({
      pathname: "/home",
      siteId: "42",
      url: "https://YO",
    });

    initAppRouter({
      pathname: "/about#section",
      searchParams: new URLSearchParams("tab=info"),
      siteId: "42",
      url: "https://YO",
    });

    expect(window._paq).toEqual(
      expect.arrayContaining([["setCustomUrl", "/about"]]),
    );
  });
});
