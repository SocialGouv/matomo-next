import { setLocationPathname } from "./test-setup";
import { initPagesRouter } from "..";

describe("Matomo Configuration", () => {
  beforeEach(() => {
    global._paq = [];
    document.head.querySelectorAll("script").forEach((s) => {
      s.remove();
    });
  });

  describe("disableCookies", () => {
    test("should NOT append disableCookies to window._paq by default", () => {
      document.head.appendChild(document.createElement("script"));
      initPagesRouter({ disableCookies: false, siteId: "42", url: "YO" });
      expect(window._paq).not.toEqual(
        expect.arrayContaining([["disableCookies"]]),
      );
    });

    test("should append disableCookies to window._paq", () => {
      document.head.appendChild(document.createElement("script"));
      initPagesRouter({ disableCookies: true, siteId: "42", url: "YO" });
      expect(window._paq).toEqual(expect.arrayContaining([["disableCookies"]]));
    });
  });

  describe("enableHeartBeatTimer", () => {
    test("should enable HeartBeat Timer with default interval", () => {
      document.head.appendChild(document.createElement("script"));
      initPagesRouter({
        enableHeartBeatTimer: true,
        siteId: "42",
        url: "https://YO",
      });
      expect(window._paq).toEqual(
        expect.arrayContaining([["enableHeartBeatTimer"]]),
      );
    });

    test("should enable HeartBeat Timer with custom interval", () => {
      document.head.appendChild(document.createElement("script"));
      initPagesRouter({
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

  describe("Pages Router without pathname", () => {
    test("should track initial pageview by default", () => {
      setLocationPathname("/some-page");
      document.head.appendChild(document.createElement("script"));
      initPagesRouter({ siteId: "42", url: "https://YO" });
      expect(window._paq).toEqual(expect.arrayContaining([["trackPageView"]]));
    });
  });
});
