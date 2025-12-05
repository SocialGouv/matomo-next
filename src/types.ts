export interface HTMLTrustedScriptElement
  extends Omit<HTMLScriptElement, "src"> {
  src: TrustedScriptURL | string;
}
export interface InitSettings {
  url: string;
  siteId: string;
  jsTrackerFile?: string;
  phpTrackerFile?: string;
  excludeUrlsPatterns?: RegExp[];
  disableCookies?: boolean;
  onRouteChangeStart?: (path: string) => void;
  onRouteChangeComplete?: (path: string) => void;
  onInitialization?: () => void;
  onScriptLoadingError?: () => void;
  nonce?: string;
  trustedPolicyName?: string;
  debug?: boolean;
  pathname?: string;
  searchParams?: URLSearchParams;
  searchKeyword?: string;
  searchRoutes?: string[];
  enableHeatmapSessionRecording?: boolean;
  enableHeartBeatTimer?: boolean;
  heartBeatTimerInterval?: number;
  heatmapConfig?: HeatmapConfig;
  cleanUrl?: boolean;
}

export interface HeatmapConfig {
  /**
   * Enable/disable keystroke capture (default: false)
   * Since v3.2.0, keystrokes are disabled by default
   */
  captureKeystrokes?: boolean;

  /**
   * Enable/disable recording of mouse and touch movements (default: true)
   * Set to false to disable the "Move Heatmap" feature
   */
  recordMovements?: boolean;

  /**
   * Maximum capture time in seconds (default: 600 = 10 minutes)
   * Set to less than 29 minutes to avoid creating new visits
   */
  maxCaptureTime?: number;

  /**
   * Disable automatic detection of new page views (default: false)
   * Set to true if you track "virtual" page views for events/downloads
   */
  disableAutoDetectNewPageView?: boolean;

  /**
   * Custom trigger function to control when recording happens
   * Return true to record, false to skip
   * @param config - Configuration object with heatmap/session ID
   */
  trigger?: (config: { id?: number }) => boolean;

  /**
   * Manually add heatmap/session configuration
   * Use this to manually configure specific heatmaps or sessions
   */
  addConfig?: {
    heatmap?: { id: number };
    sessionRecording?: { id: number };
  };
}

export interface Dimensions {
  dimension1?: string;
  dimension2?: string;
  dimension3?: string;
  dimension4?: string;
  dimension5?: string;
  dimension6?: string;
  dimension7?: string;
  dimension8?: string;
  dimension9?: string;
  dimension10?: string;
}

export type PushArgs = (
  | Dimensions
  | number[]
  | string[]
  | number
  | string
  | null
  | undefined
)[];

export interface MatomoState {
  isInitialPageview: boolean;
  previousUrl: string;
  matomoInitialized: boolean;
}
