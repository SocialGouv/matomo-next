import { default as Router } from "next/router";

import { init, push } from "..";

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

  test("should append dimensions data to window._paq", () => {
    init({ siteId: "42", url: "YO" });
    window._paq = [];
    push([
      "trackEvent",
      "kikoo",
      "lol",
      null,
      null,
      { dimension1: "ok", dimension2: "foobar" },
    ]);
    expect(window._paq).toMatchSnapshot();
  });
});

describe("onInitialization", () => {
  test("should work if the surcharge of the operator", () => {
    init({
      onInitialization: () => {
        push(["during_initialization", "hello"]);
      },
      siteId: "42",
      url: "YO",
    });
    expect(window._paq).toEqual(
      expect.arrayContaining([["during_initialization", "hello"]]),
    );
  });
});

describe("router.routeChangeStart event", () => {
  beforeEach(() => {
    global._paq = [];
    jest.resetAllMocks();
  });
  test("should setReferrerUrl and setCustomUrl on route change start", async () => {
    init({ siteId: "42", url: "YO" });
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
    init({ siteId: "42", url: "YO" });
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
    init({
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
    jest.resetAllMocks();
  });
  test("should trackPageView with correct title on route change", async () => {
    init({ siteId: "42", url: "YO" });
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
    init({
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
    window.location.pathname = "/change-password-pouet";
    document.head.appendChild(document.createElement("script"));
    init({
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
    window.location.pathname = "/some-page";
    document.head.appendChild(document.createElement("script"));
    init({
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

// todo: should track pageview on next router routeChangeComplete

describe("disableCookies", () => {
  test("should NOT append disableCookies to window._paq by default", () => {
    init({ disableCookies: false, siteId: "42", url: "YO" });
    expect(window._paq).not.toEqual(
      expect.arrayContaining([["disableCookies"]]),
    );
  });

  test("should append disableCookies to window._paq", () => {
    init({ disableCookies: true, siteId: "42", url: "YO" });
    expect(window._paq).toEqual(expect.arrayContaining([["disableCookies"]]));
  });
});

describe("App Router with pathname", () => {
  beforeEach(() => {
    global._paq = [];
    // Reset module state
    jest.resetModules();
  });

  test("should track initial pageview when pathname is provided (first call)", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { init } = require("../index");
    document.head.appendChild(document.createElement("script"));

    init({ pathname: "/home", siteId: "42", url: "https://YO" });

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
    const { init } = require("../index");
    document.head.appendChild(document.createElement("script"));

    // First call
    init({ pathname: "/home", siteId: "42", url: "https://YO" });

    // Second call with different pathname
    init({ pathname: "/about", siteId: "42", url: "https://YO" });

    expect(window._paq).toEqual(
      expect.arrayContaining([["setCustomUrl", "/about"], ["trackPageView"]]),
    );
  });

  test("should not track again if pathname hasn't changed", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { init } = require("../index");
    document.head.appendChild(document.createElement("script"));

    init({ pathname: "/home", siteId: "42", url: "https://YO" });
    const initialLength = window._paq?.length || 0;

    // Call again with same pathname
    init({ pathname: "/home", siteId: "42", url: "https://YO" });

    // Should not have added more tracking calls
    expect(window._paq?.length).toBe(initialLength);
  });

  test("should track initial pageview by default (Pages Router without pathname)", () => {
    window.location.pathname = "/some-page";
    document.head.appendChild(document.createElement("script"));
    init({ siteId: "42", url: "https://YO" });
    expect(window._paq).toEqual(expect.arrayContaining([["trackPageView"]]));
  });
});

describe("enableHeartBeatTimer", () => {
  beforeEach(() => {
    global._paq = [];
  });

  test("should enable HeartBeat Timer with default interval", () => {
    document.head.appendChild(document.createElement("script"));
    init({ enableHeartBeatTimer: true, siteId: "42", url: "https://YO" });
    expect(window._paq).toEqual(
      expect.arrayContaining([["enableHeartBeatTimer"]]),
    );
  });

  test("should enable HeartBeat Timer with custom interval", () => {
    document.head.appendChild(document.createElement("script"));
    init({
      enableHeartBeatTimer: true,
      heartBeatTimerInterval: 30,
      siteId: "42",
      url: "https://YO",
    });
    expect(window._paq).toEqual(
      expect.arrayContaining([["enableHeartBeatTimer", 30]]),
    );
  });
});

describe("enableHeatmapSessionRecording", () => {
  beforeEach(() => {
    global._paq = [];
    // Clean up any existing scripts
    document.head.querySelectorAll("script").forEach((s) => {
      s.remove();
    });
  });

  test("should load HeatmapSessionRecording script when enabled", () => {
    document.head.appendChild(document.createElement("script"));
    init({
      enableHeatmapSessionRecording: true,
      siteId: "42",
      url: "https://YO",
    });

    const heatmapScript = Array.from(
      document.head.querySelectorAll("script"),
    ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

    expect(heatmapScript).toBeDefined();
    expect(heatmapScript?.src).toContain(
      "/plugins/HeatmapSessionRecording/tracker.min.js",
    );
  });

  test("should not load HeatmapSessionRecording script when disabled", () => {
    document.head.appendChild(document.createElement("script"));
    init({ siteId: "42", url: "https://YO" });

    const heatmapScript = Array.from(
      document.head.querySelectorAll("script"),
    ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

    expect(heatmapScript).toBeUndefined();
  });
});
