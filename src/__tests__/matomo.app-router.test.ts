import "./test-setup";

describe("App Router functionality", () => {
  beforeEach(() => {
    global._paq = [];
    jest.resetModules();
  });

  test("should track initial pageview when pathname is provided (first call)", () => {
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    trackAppRouter({ pathname: "/home", siteId: "42", url: "https://YO" });

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
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    trackAppRouter({ pathname: "/home", siteId: "42", url: "https://YO" });
    trackAppRouter({ pathname: "/about", siteId: "42", url: "https://YO" });

    expect(window._paq).toEqual(
      expect.arrayContaining([["setCustomUrl", "/about"], ["trackPageView"]]),
    );
  });

  test("should not track again if pathname hasn't changed", () => {
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    trackAppRouter({ pathname: "/home", siteId: "42", url: "https://YO" });
    const initialLength = window._paq?.length || 0;

    trackAppRouter({ pathname: "/home", siteId: "42", url: "https://YO" });

    expect(window._paq?.length).toBe(initialLength);
  });

  test("should track URL with search params on initial pageview", () => {
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    const searchParams = new URLSearchParams("q=test&page=1");
    trackAppRouter({
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
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    trackAppRouter({
      pathname: "/search",
      searchParams: new URLSearchParams("q=test"),
      siteId: "42",
      url: "https://YO",
    });

    const initialLength = window._paq?.length || 0;

    trackAppRouter({
      pathname: "/search",
      searchParams: new URLSearchParams("q=other"),
      siteId: "42",
      url: "https://YO",
    });

    setTimeout(() => {
      expect(window._paq?.length).toBeGreaterThan(initialLength);
      expect(window._paq).toEqual(
        expect.arrayContaining([["setCustomUrl", "/search?q=other"]]),
      );
      expect(window._paq).toEqual(
        expect.arrayContaining([["trackSiteSearch", "other"]]),
      );
      done();
    }, 10);
  });

  test("should not track when URL with search params hasn't changed", () => {
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    trackAppRouter({
      pathname: "/search",
      searchParams: new URLSearchParams("q=test"),
      siteId: "42",
      url: "https://YO",
    });

    const initialLength = window._paq?.length || 0;

    trackAppRouter({
      pathname: "/search",
      searchParams: new URLSearchParams("q=test"),
      siteId: "42",
      url: "https://YO",
    });

    expect(window._paq?.length).toBe(initialLength);
  });

  test("should exclude URLs based on patterns even with search params", () => {
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    trackAppRouter({
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
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    const onRouteChangeStart = jest.fn();
    const onRouteChangeComplete = jest.fn();

    trackAppRouter({
      pathname: "/home",
      siteId: "42",
      url: "https://YO",
      onRouteChangeStart,
      onRouteChangeComplete,
    });

    trackAppRouter({
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
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      trackAppRouter({
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
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      trackAppRouter({
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
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      trackAppRouter({
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
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      trackAppRouter({
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

        trackAppRouter({
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
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      trackAppRouter({
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
          expect.arrayContaining([
            ["setCustomUrl", "/search?q=test&page=2%23more"],
          ]),
        );
        done();
      }, 10);
    });

    test("should support custom search keyword parameter", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      trackAppRouter({
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
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      trackAppRouter({
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
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      trackAppRouter({
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
     
    const { trackAppRouter } = require("../index");
    document.head.appendChild(document.createElement("script"));

    trackAppRouter({
      pathname: "/home",
      siteId: "42",
      url: "https://YO",
    });

    trackAppRouter({
      pathname: "/about#section",
      searchParams: new URLSearchParams("tab=info"),
      siteId: "42",
      url: "https://YO",
    });

    expect(window._paq).toEqual(
      expect.arrayContaining([["setCustomUrl", "/about#section?tab=info"]]),
    );
  });

  describe("cleanUrl parameter", () => {
    test("should clean URL by default (cleanUrl=true) - remove query params and hash", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      window._paq = [];

      trackAppRouter({
        pathname: "/products",
        searchParams: new URLSearchParams(
          "id=123&category=electronics#reviews",
        ),
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["setCustomUrl", "/products"]]),
        );
        expect(window._paq).not.toEqual(
          expect.arrayContaining([
            ["setCustomUrl", "/products?id=123&category=electronics"],
          ]),
        );
        done();
      }, 10);
    });

    test("should keep query params and hash when cleanUrl=false", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
        cleanUrl: false,
      });

      window._paq = [];

      trackAppRouter({
        pathname: "/products",
        searchParams: new URLSearchParams("id=456&ref=homepage"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: false,
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([
            ["setCustomUrl", "/products?id=456&ref=homepage"],
          ]),
        );
        done();
      }, 10);
    });

    test("should clean referrer URL when cleanUrl=true", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/products",
        searchParams: new URLSearchParams("category=books&sort=price"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      window._paq = [];

      trackAppRouter({
        pathname: "/details",
        searchParams: new URLSearchParams("id=789"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([
            ["setReferrerUrl", "/products"],
            ["setCustomUrl", "/details"],
          ]),
        );
        done();
      }, 10);
    });

    test("should keep query params in referrer when cleanUrl=false", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/products",
        searchParams: new URLSearchParams("filter=new"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: false,
      });

      window._paq = [];

      trackAppRouter({
        pathname: "/cart",
        siteId: "42",
        url: "https://YO",
        cleanUrl: false,
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([
            ["setReferrerUrl", "/products?filter=new"],
            ["setCustomUrl", "/cart"],
          ]),
        );
        done();
      }, 10);
    });

    test("should handle hash fragments correctly when cleanUrl=true", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
      });

      window._paq = [];

      trackAppRouter({
        pathname: "/docs#installation",
        searchParams: new URLSearchParams("version=2.0"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([["setCustomUrl", "/docs"]]),
        );
        done();
      }, 10);
    });

    test("should keep query params for search routes even with cleanUrl=true", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      window._paq = [];

      trackAppRouter({
        pathname: "/search",
        searchParams: new URLSearchParams("q=test&category=docs&page=2"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([
            ["setCustomUrl", "/search?q=test&category=docs&page=2"],
            ["trackSiteSearch", "test"],
          ]),
        );
        expect(window._paq).not.toEqual(
          expect.arrayContaining([["setCustomUrl", "/search"]]),
        );
        done();
      }, 10);
    });

    test("should keep query params for /recherche route with cleanUrl=true", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/home",
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      window._paq = [];

      trackAppRouter({
        pathname: "/recherche",
        searchParams: new URLSearchParams("q=matomo&filter=all"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([
            ["setCustomUrl", "/recherche?q=matomo&filter=all"],
            ["trackSiteSearch", "matomo"],
          ]),
        );
        done();
      }, 10);
    });

    test("should clean non-search routes but keep search routes with cleanUrl=true", (done) => {
       
      const { trackAppRouter } = require("../index");
      document.head.appendChild(document.createElement("script"));

      trackAppRouter({
        pathname: "/products",
        searchParams: new URLSearchParams("id=123&ref=home"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      window._paq = [];

      trackAppRouter({
        pathname: "/search",
        searchParams: new URLSearchParams("q=nextjs"),
        siteId: "42",
        url: "https://YO",
        cleanUrl: true,
      });

      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([
            ["setReferrerUrl", "/products"],
            ["setCustomUrl", "/search?q=nextjs"],
            ["trackSiteSearch", "nextjs"],
          ]),
        );
        done();
      }, 10);
    });
  });
});
