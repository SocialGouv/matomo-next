import type { HeatmapConfig } from "./types";
import { push } from "./tracker";

/**
 * Load and configure Heatmap & Session Recording plugin
 * @param url - Matomo instance URL
 * @param config - Heatmap configuration options
 * @param nonce - Optional nonce for CSP
 * @param onScriptLoadingError - Optional callback for script loading errors
 */
export const loadHeatmapSessionRecording = (
  url: string,
  config: HeatmapConfig = {},
  nonce?: string,
  onScriptLoadingError?: () => void,
): void => {
  const script = document.createElement("script");
  script.src = `${url}/plugins/HeatmapSessionRecording/tracker.min.js`;
  script.async = true;

  if (nonce) {
    script.setAttribute("nonce", nonce);
  }

  script.onload = () => {
    if (config.debug) {
      console.log("HeatmapSessionRecording tracker.min.js loaded");
      push(["HeatmapSessionRecording::debug", "true"]);
    }

    // Configure keystrokes capture (disabled by default)
    const captureKeystrokes = config.captureKeystrokes ?? false;
    push([
      "HeatmapSessionRecording.setKeystrokes",
      captureKeystrokes.toString(),
    ]);

    if (config.debug) {
      console.log(`Keystrokes ${captureKeystrokes ? "enabled" : "disabled"}`);
    }

    // Configure visible content capture (full page by default)
    const captureVisibleOnly = config.captureVisibleContentOnly ?? false;
    push([
      "HeatmapSessionRecording.setCaptureVisibleContentOnly",
      captureVisibleOnly.toString(),
    ]);

    if (config.debug) {
      console.log(
        `Capture ${
          captureVisibleOnly ? "visible content only" : "full page"
        } enabled`,
      );
    }

    // Wait for page load before enabling
    const handleLoad = () => {
      if (config.debug) {
        console.log("Activating Matomo Heatmap & Session Recording");
      }
      push(["HeatmapSessionRecording::enable"]);
      if (config.debug) {
        console.log(
          "HeatmapSessionRecording enabled at",
          new Date().toISOString(),
        );
      }
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }
  };

  script.onerror = () => {
    console.error("Failed to load HeatmapSessionRecording tracker.min.js");
    if (onScriptLoadingError) {
      onScriptLoadingError();
    }
  };

  document.head.appendChild(script);
};
