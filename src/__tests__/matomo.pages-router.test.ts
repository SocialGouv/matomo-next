import { default as Router } from "next/router";
import { trackPagesRouter, push } from "..";

type RouteChangeFunction = (route: string) => void;

let mockRouteChangeComplete: RouteChangeFunction;

let mockRouteChangeStart: RouteChangeFunction;

type AnyObject = Record<string, string>;

/**
 * Helper to set window.location.pathname in jsdom 26+ (Jest 30+).
 * Direct assignment triggers "not implemented: navigation" in jsdom 26.
 * Using history.pushState updates the URL without triggering navigation.
 */
function setLocationPathname(pathname: string): void {
  window.history.pushState({}, "", pathname);
}

jest.mock("next/router", () => {
  const query = {} as AnyObject;
  return {
    events: {
      emit: (_event: string, route: string) => {
        if (/\?/.exec(route) !== null) {
          const search = route.split("?")[1];

          if (search.indexOf("=") > -1) {
            const values = JSON.parse(
              `{"${decodeURI(search)
                .replace(/"/g, '\\"')
                .replace(/&/g, '","')
                .replace(/=/g, '":"')}"}`,
            ) as AnyObject;
            Object.keys(values).forEach((key) => {
              query[key] = decodeURIComponent(values[key]);
            });
          }
        }
        if (_event === "routeChangeStart") {
          mockRouteChangeStart(route);
        } else {
          mockRouteChangeComplete(route);
        }
        jest.fn();
      },
      on: (_event: string, cb: RouteChangeFunction) => {
        if (_event === "routeChangeStart") {
          mockRouteChangeStart = cb;
        } else {
          mockRouteChangeComplete = cb;
        }
      },
    },
    query,
  };
});

// jsdom 26+ (Jest 30+) starts at "http://localhost/" with pathname "/"
// No need to redefine window.location.

beforeEach(() => {
  // Add a fake script node so init can insert matomo tracker code before it
  if (!document.head.querySelector("script")) {
    document.head.appendChild(document.createElement("script"));
  }
});

describe("router.routeChangeStart event", () => {
  beforeEach(() => {
    global._paq = [];
  });
  test("should setReferrerUrl and setCustomUrl on route change start", async () => {
    trackPagesRouter({ siteId: "42", url: "YO" });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/path/to/hello?world");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual([
        ["setReferrerUrl", "/"],
        ["setCustomUrl", "/path/to/hello?world"],
        ["deleteCustomVariables", "page"],
      ]);

      resolve();
    });
  });
  test("should setReferrerUrl and setCustomUrl on route change start and handle hashtag (by removing it)", async () => {
    trackPagesRouter({ siteId: "42", url: "YO" });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/path/to/hello#should-not-appear");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual([
        ["setReferrerUrl", "/"],
        ["setCustomUrl", "/path/to/hello#should-not-appear"],
        ["deleteCustomVariables", "page"],
      ]);

      resolve();
    });
  });
  test("should use previousPath as referer on consecutive route change", async () => {
    document.title = "test page 2";

    Router.events.emit("routeChangeStart", "/path/to/hello2?world");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual([
        ["setReferrerUrl", "/path/to/hello#should-not-appear"],
        ["setCustomUrl", "/path/to/hello2?world"],
        ["deleteCustomVariables", "page"],
      ]);
      resolve();
    });
  });

  test("should work if the surcharge of the operator", async () => {
    trackPagesRouter({
      onRouteChangeStart: (path) => {
        push(["newOperatorStart", "COMPLETE"]);
        push(["path", path]);
      },
      siteId: "42",
      url: "YO",
    });
    Router.events.emit("routeChangeStart", "/bonjour");
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([
            ["newOperatorStart", "COMPLETE"],
            ["path", "/bonjour"],
          ]),
        );
        resolve();
      }, 0);
    });
  });
});

describe("router.routeChangeComplete event", () => {
  beforeEach(() => {
    global._paq = [];
  });
  test("should trackPageView with correct title on route change", async () => {
    trackPagesRouter({ siteId: "42", url: "YO" });
    window._paq = [];
    document.title = "test page";

    Router.events.emit("routeChangeComplete", "/path/to/hello?world");

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });
  test("should use previousPath as referer on consecutive route change", async () => {
    document.title = "test page 2";

    Router.events.emit("routeChangeComplete", "/path/to/hello2?world");

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });

  test("should track route as search in /recherche", async () => {
    document.title = "search results";
    Router.events.emit("routeChangeComplete", "/recherche?q=some+query");
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });

  test("should track route as search in /search", async () => {
    document.title = "search results";
    Router.events.emit("routeChangeComplete", "/search?q=some+query");
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });

  test("should work if the surcharge of the operator", async () => {
    trackPagesRouter({
      onRouteChangeComplete: (path) => {
        push(["newOperatorComplete", "COMPLETE"]);
        push(["path", path]);
      },
      siteId: "42",
      url: "YO",
    });
    Router.events.emit("routeChangeComplete", "/hello-world");
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toEqual(
          expect.arrayContaining([
            ["newOperatorComplete", "COMPLETE"],
            ["path", "/hello-world"],
          ]),
        );
        resolve();
      }, 0);
    });
  });
});

describe("excludeUrlsPatterns", () => {
  it("should excluded login.php and token variables", async () => {
    global._paq = [];
    document.title = "some page";
    document.head.appendChild(document.createElement("script"));
    trackPagesRouter({
      excludeUrlsPatterns: [/^\/login.php/, /\?token=.+/],
      siteId: "42",
      url: "https://YO",
    });
    Router.events.emit("routeChangeStart", "/login.php");
    Router.events.emit("routeChangeStart", "/path/to/page.php");
    Router.events.emit("routeChangeStart", "/path/to/page.php?token=pouet");
    Router.events.emit("routeChangeComplete", "/login.php");
    Router.events.emit("routeChangeComplete", "/path/to/page.php");
    Router.events.emit("routeChangeComplete", "/path/to/page.php?token=pouet");
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });
  it("should exclude initial page tracking", async () => {
    global._paq = [];
    document.title = "some page";
    setLocationPathname("/change-password-pouet");
    document.head.appendChild(document.createElement("script"));
    trackPagesRouter({
      excludeUrlsPatterns: [/^\/change-password/],
      siteId: "42",
      url: "https://YO",
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });

  it("should track initial page if not excluded", async () => {
    global._paq = [];
    document.title = "some page";
    setLocationPathname("/some-page");
    document.head.appendChild(document.createElement("script"));
    trackPagesRouter({
      excludeUrlsPatterns: [/^\/change-password/],
      siteId: "42",
      url: "https://YO",
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });
});

describe("cleanUrl parameter in Pages Router", () => {
  beforeEach(() => {
    global._paq = [];
    setLocationPathname("/");
    if (!document.head.querySelector("script")) {
      document.head.appendChild(document.createElement("script"));
    }
    jest.resetModules();
  });

  test("should clean URL by default (cleanUrl=true) - remove query params and hash", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: true });
    window._paq = [];

    Router.events.emit(
      "routeChangeStart",
      "/products?id=123&category=electronics#reviews",
    );

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/"],
          ["setCustomUrl", "/products"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });

  test("should keep query params and hash when cleanUrl=false", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: false });
    window._paq = [];

    Router.events.emit(
      "routeChangeStart",
      "/products?id=456&ref=homepage#section",
    );

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/"],
          ["setCustomUrl", "/products?id=456&ref=homepage#section"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });

  test("should clean consecutive URLs when cleanUrl=true", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: true });
    window._paq = [];

    Router.events.emit(
      "routeChangeStart",
      "/products?category=books&sort=price",
    );
    window._paq = [];

    Router.events.emit("routeChangeStart", "/details?id=789#description");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/products"],
          ["setCustomUrl", "/details"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });

  test("should keep query params in consecutive URLs when cleanUrl=false", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: false });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/products?filter=new");
    window._paq = [];

    Router.events.emit("routeChangeStart", "/cart?item=123");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/products?filter=new"],
          ["setCustomUrl", "/cart?item=123"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });

  test("should handle hash-only URLs correctly when cleanUrl=true", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: true });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/docs#installation");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/"],
          ["setCustomUrl", "/docs"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });

  test("should keep hash when cleanUrl=false", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: false });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/docs#installation");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/"],
          ["setCustomUrl", "/docs#installation"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });

  test("should handle complex URLs with query and hash when cleanUrl=true", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: true });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/search?q=test&page=2#results");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/"],
          ["setCustomUrl", "/search?q=test&page=2#results"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });

  test("should keep query params for search routes with cleanUrl=true", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: true });
    window._paq = [];

    Router.events.emit(
      "routeChangeStart",
      "/search?q=test&category=docs&page=2",
    );

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/"],
          ["setCustomUrl", "/search?q=test&category=docs&page=2"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      expect(window._paq).not.toEqual(
        expect.arrayContaining([["setCustomUrl", "/search"]]),
      );
      resolve();
    });
  });

  test("should keep query params for /recherche route with cleanUrl=true", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: true });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/recherche?q=matomo&filter=all");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/"],
          ["setCustomUrl", "/recherche?q=matomo&filter=all"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });

  test("should clean non-search routes but keep search routes with cleanUrl=true", async () => {
     
    const { trackPagesRouter } = require("../index");
    trackPagesRouter({ siteId: "42", url: "YO", cleanUrl: true });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/products?id=123&ref=home");
    window._paq = [];

    Router.events.emit("routeChangeStart", "/search?q=nextjs");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["setReferrerUrl", "/products"],
          ["setCustomUrl", "/search?q=nextjs"],
          ["deleteCustomVariables", "page"],
        ]),
      );
      resolve();
    });
  });
});
