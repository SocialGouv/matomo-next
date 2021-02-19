import { default as Router } from "next/router";

import { init, push } from "..";

type RouteChangeFunction = (route: string) => void;
// eslint-disable-next-line @typescript-eslint/init-declarations
let mockRouteChangeComplete: RouteChangeFunction;

type AnyObject = Record<string, string>;

jest.mock("next/router", () => {
  const query = {} as AnyObject;
  return {
    events: {
      emit: (_event: unknown, route: string) => {
        if (/\?/.exec(route) !== null) {
          const search = route.split("?")[1];
          // eslint-disable-next-line @typescript-eslint/prefer-includes
          if (search.indexOf("=") > -1) {
            const values = JSON.parse(
              `{"${decodeURI(search)
                .replace(/"/g, '\\"')
                .replace(/&/g, '","')
                .replace(/=/g, '":"')}"}`
            ) as AnyObject;
            Object.keys(values).forEach((key) => {
              query[key] = decodeURIComponent(values[key]);
            });
          }
        }
        mockRouteChangeComplete(route);
        jest.fn();
      },
      on: (_event: unknown, cb: RouteChangeFunction) => {
        mockRouteChangeComplete = cb;
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

describe("init", () => {
  beforeEach(() => {
    global._paq = [];
  });
  it("should create a js tag and initialize", () => {
    // we need to add a fake script node so
    // init can insert matomo tracker code before it
    document.head.appendChild(document.createElement("script"));
    init({ siteId: "42", url: "https://YO" });
    expect(global._paq).toMatchSnapshot();
  });
  it("should NOT create events when url is not provided", () => {
    // we need to add a fake script node so
    // init can insert matomo tracker code before it
    document.head.appendChild(document.createElement("script"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    init({ siteId: "42" });
    expect(global._paq).toMatchSnapshot();
  });
});

describe("push", () => {
  test("should append data to window._paq", () => {
    init({ siteId: "42", url: "YO" });
    window._paq = [];
    push(["trackEvent", "kikoo", "lol"]);
    expect(window._paq).toMatchSnapshot();
  });
});

describe("router.routeChangeComplete event", () => {
  beforeEach(() => {
    global._paq = [];
    jest.resetAllMocks();
  });
  test("should trackPageView with correct title on route change", async () => {
    init({ siteId: "42", url: "YO" });
    window._paq = [];
    document.title = "test page";

    Router.events.emit("routeChangeComplete", "/path/to/hello?world");

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });
  test("should use previousPath as referer on consecutive route change", async () => {
    document.title = "test page 2";

    Router.events.emit("routeChangeComplete", "/path/to/hello2?world");

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });

  test("should track route as search in /recherche", async () => {
    document.title = "search results";
    Router.events.emit("routeChangeComplete", "/recherche?q=some+query");
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });

  test("should track route as search in /search", async () => {
    document.title = "search results";
    Router.events.emit("routeChangeComplete", "/search?q=some+query");
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });
});

describe("excludeUrlsPatterns", () => {
  beforeEach(() => {
    global._paq = [];
    document.title = "some page";
    jest.resetAllMocks();
  });
  it("should excluded login.php and token variables", async () => {
    // we need to add a fake script node so
    // init can insert matomo tracker code before it
    document.head.appendChild(document.createElement("script"));
    init({
      excludeUrlsPatterns: [/^\/login.php/, /\?token=.+/],
      siteId: "42",
      url: "https://YO",
    });
    Router.events.emit("routeChangeComplete", "/login.php");
    Router.events.emit("routeChangeComplete", "/path/to/page.php");
    Router.events.emit("routeChangeComplete", "/path/to/page.php?token=pouet");
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });
  it("should exclude initial page tracking", async () => {
    window.location.pathname = "/change-password-pouet";
    document.head.appendChild(document.createElement("script"));
    init({
      excludeUrlsPatterns: [/^\/change-password/],
      siteId: "42",
      url: "https://YO",
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });

  it("should track initial page if not excluded", async () => {
    window.location.pathname = "/some-page";
    document.head.appendChild(document.createElement("script"));
    init({
      excludeUrlsPatterns: [/^\/change-password/],
      siteId: "42",
      url: "https://YO",
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window._paq).toMatchSnapshot();
        resolve();
      }, 0);
    });
  });
});

// todo: should track pageview on next router routeChangeComplete
