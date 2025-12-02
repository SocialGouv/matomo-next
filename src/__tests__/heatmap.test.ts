import "./test-setup";
import { trackPagesRouter } from "../track-pages-router";
import { trackAppRouter } from "../track-app-router";

describe("Heatmap & Session Recording Configuration", () => {
  beforeEach(() => {
    global._paq = [];
    document.head.querySelectorAll("script").forEach((s) => {
      s.remove();
    });
  });

  describe("Basic loading", () => {
    test("should load HeatmapSessionRecording script when enabled", () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
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
      trackPagesRouter({ siteId: "42", url: "https://example.com" });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      expect(heatmapScript).toBeUndefined();
    });
  });

  describe("captureKeystrokes configuration", () => {
    test("should disable keystrokes by default", async () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {},
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      expect(heatmapScript).toBeDefined();

      // Simulate script loading
      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      // Check that disableCaptureKeystrokes was called
      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["HeatmapSessionRecording::disableCaptureKeystrokes"],
        ]),
      );
    });

    test("should not disable keystrokes when explicitly enabled", async () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {
          captureKeystrokes: true,
        },
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      expect(heatmapScript).toBeDefined();

      // Simulate script loading
      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      // Check that disableCaptureKeystrokes was NOT called
      expect(window._paq).not.toEqual(
        expect.arrayContaining([
          ["HeatmapSessionRecording::disableCaptureKeystrokes"],
        ]),
      );
    });
  });

  describe("recordMovements configuration", () => {
    test("should not disable movements by default", async () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {},
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      expect(window._paq).not.toEqual(
        expect.arrayContaining([
          ["HeatmapSessionRecording::disableRecordMovements"],
        ]),
      );
    });

    test("should disable movements when configured", async () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {
          recordMovements: false,
        },
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["HeatmapSessionRecording::disableRecordMovements"],
        ]),
      );
    });
  });

  describe("maxCaptureTime configuration", () => {
    test("should set max capture time when configured", async () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {
          maxCaptureTime: 1800, // 30 minutes
        },
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["HeatmapSessionRecording::setMaxCaptureTime", 1800],
        ]),
      );
    });

    test("should not set max capture time when not configured", async () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {},
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      const hasMaxCaptureTime = window._paq?.some(
        (cmd) =>
          Array.isArray(cmd) &&
          cmd[0] === "HeatmapSessionRecording::setMaxCaptureTime",
      );
      expect(hasMaxCaptureTime).toBe(false);
    });
  });

  describe("disableAutoDetectNewPageView configuration", () => {
    test("should disable auto detect when configured", async () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {
          disableAutoDetectNewPageView: true,
        },
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["HeatmapSessionRecording::disableAutoDetectNewPageView"],
        ]),
      );
    });
  });

  describe("trigger configuration", () => {
    test("should set trigger function when configured", async () => {
      const triggerFn = (config: { id?: number }) => config.id !== undefined;

      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {
          trigger: triggerFn,
        },
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["HeatmapSessionRecording::setTrigger", triggerFn],
        ]),
      );
    });
  });

  describe("addConfig configuration", () => {
    test("should add manual config when provided", async () => {
      const config = {
        heatmap: { id: 5 },
        sessionRecording: { id: 10 },
      };

      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        heatmapConfig: {
          addConfig: config,
        },
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      expect(window._paq).toEqual(
        expect.arrayContaining([
          ["HeatmapSessionRecording::addConfig", config],
        ]),
      );
    });
  });

  describe("App Router integration", () => {
    test("should work with App Router", () => {
      document.head.appendChild(document.createElement("script"));
      trackAppRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        pathname: "/test",
        heatmapConfig: {
          captureKeystrokes: false,
          recordMovements: true,
          maxCaptureTime: 900,
        },
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      expect(heatmapScript).toBeDefined();
    });
  });

  describe("Debug mode", () => {
    test("should enable debug mode when debug is true", async () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        debug: true,
        heatmapConfig: {},
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      if (heatmapScript?.onload) {
        (heatmapScript.onload as any)();
      }

      expect(window._paq).toEqual(
        expect.arrayContaining([["HeatmapSessionRecording::enableDebugMode"]]),
      );
    });
  });

  describe("CSP nonce support", () => {
    test("should add nonce attribute to heatmap script", () => {
      document.head.appendChild(document.createElement("script"));
      trackPagesRouter({
        enableHeatmapSessionRecording: true,
        siteId: "42",
        url: "https://example.com",
        nonce: "test-nonce-123",
      });

      const heatmapScript = Array.from(
        document.head.querySelectorAll("script"),
      ).find((s) => s.src.includes("HeatmapSessionRecording/tracker.min.js"));

      expect(heatmapScript).toBeDefined();
      expect(heatmapScript?.getAttribute("nonce")).toBe("test-nonce-123");
    });
  });
});
