import { default as Router } from "next/router";
import { initPagesRouter, push } from "..";

type RouteChangeFunction = (route: string) => void;
// eslint-disable-next-line @typescript-eslint/init-declarations
let mockRouteChangeComplete: RouteChangeFunction;
// eslint-disable-next-line @typescript-eslint/init-declarations
let mockRouteChangeStart: RouteChangeFunction;

type AnyObject = Record<string, string>;

jest.mock("next/router", () => {
  const query = {} as AnyObject;
  return {
    events: {
      emit: (_event: string, route: string) => {
        if (/\?/.exec(route) !== null) {
          const search = route.split("?")[1];
          // eslint-disable-next-line @typescript-eslint/prefer-includes
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

// default window.location.pathname
Object.defineProperty(window, "location", {
  value: {
    pathname: "/",
  },
});

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
    initPagesRouter({ siteId: "42", url: "YO" });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/path/to/hello?world");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual([
        ["setReferrerUrl", "/"],
        ["setCustomUrl", "/path/to/hello"],
        ["deleteCustomVariables", "page"],
      ]);

      resolve();
    });
  });
  test("should setReferrerUrl and setCustomUrl on route change start and handle hashtag (by removing it)", async () => {
    initPagesRouter({ siteId: "42", url: "YO" });
    window._paq = [];

    Router.events.emit("routeChangeStart", "/path/to/hello#should-not-appear");

    return new Promise<void>((resolve) => {
      expect(window._paq).toEqual([
        ["setReferrerUrl", "/"],
        ["setCustomUrl", "/path/to/hello"],
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
        ["setReferrerUrl", "/path/to/hello"],
        ["setCustomUrl", "/path/to/hello2"],
        ["deleteCustomVariables", "page"],
      ]);
      resolve();
    });
  });

  test("should work if the surcharge of the operator", async () => {
    initPagesRouter({
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
    initPagesRouter({ siteId: "42", url: "YO" });
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
    initPagesRouter({
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
    initPagesRouter({
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
    window.location.pathname = "/change-password-pouet";
    document.head.appendChild(document.createElement("script"));
    initPagesRouter({
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
    window.location.pathname = "/some-page";
    document.head.appendChild(document.createElement("script"));
    initPagesRouter({
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
