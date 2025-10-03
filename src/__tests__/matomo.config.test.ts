import "./test-setup";
import { init } from "..";

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
      init({ disableCookies: false, siteId: "42", url: "YO" });
      expect(window._paq).not.toEqual(
        expect.arrayContaining([["disableCookies"]]),
      );
    });

    test("should append disableCookies to window._paq", () => {
      document.head.appendChild(document.createElement("script"));
      init({ disableCookies: true, siteId: "42", url: "YO" });
      expect(window._paq).toEqual(expect.arrayContaining([["disableCookies"]]));
    });
  });

  describe("enableHeartBeatTimer", () => {
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

  describe("Pages Router without pathname", () => {
    test("should track initial pageview by default", () => {
      window.location.pathname = "/some-page";
      document.head.appendChild(document.createElement("script"));
      init({ siteId: "42", url: "https://YO" });
      expect(window._paq).toEqual(expect.arrayContaining([["trackPageView"]]));
    });
  });
});
