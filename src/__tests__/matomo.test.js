import Router from "next/router";

import { init, push } from "../index";

let mockRouteChangeComplete;
jest.mock("next/router", () => ({
  events: {
    emit: (event, route) => {
      mockRouteChangeComplete(route);
      jest.fn();
    },
    on: (event, cb) => {
      mockRouteChangeComplete = cb;
    },
  },
  query: {},
}));

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
  test("should trackPageView with correct title on route change", () => {
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
  test("should use previousPath as referer on consecutive route change", () => {
    document.title = "test page 2";

    Router.events.emit("routeChangeComplete", "/path/to/hello2?world");

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
  });
  it("should excluded login.php and token variables", () => {
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
  it("should exclude initial page tracking", () => {
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

  it("should track initial page if not excluded", () => {
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
