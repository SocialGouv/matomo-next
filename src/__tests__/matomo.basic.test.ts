import "./test-setup";
import { initPagesRouter, push } from "..";

describe("Basic Matomo functionality", () => {
  beforeEach(() => {
    global._paq = [];
  });

  describe("initPagesRouter", () => {
    it("should create a js tag and initialize", () => {
      document.head.appendChild(document.createElement("script"));
      initPagesRouter({ siteId: "42", url: "https://YO" });
      expect(global._paq).toMatchSnapshot();
    });

    it("should NOT create events when url is not provided", () => {
      document.head.appendChild(document.createElement("script"));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      initPagesRouter({ siteId: "42" });
      expect(global._paq).toMatchSnapshot();
    });
  });

  describe("push", () => {
    test("should append data to window._paq", () => {
      initPagesRouter({ siteId: "42", url: "YO" });
      window._paq = [];
      push(["trackEvent", "kikoo", "lol"]);
      expect(window._paq).toMatchSnapshot();
    });

    test("should append custom dimensions data to window._paq", () => {
      initPagesRouter({ siteId: "42", url: "YO" });
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
      initPagesRouter({
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
});
