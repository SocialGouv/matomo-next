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
  logExcludedTracks?: boolean;
  isAppRouter?: boolean;
  pathname?: string;
  searchParams?: URLSearchParams;
  searchKeyword?: string;
  enableHeatmapSessionRecording?: boolean;
  enableHeartBeatTimer?: boolean;
  heartBeatTimerInterval?: number;
  heatmapConfig?: HeatmapConfig;
}

export interface HeatmapConfig {
  captureKeystrokes?: boolean;
  captureVisibleContentOnly?: boolean;
  debug?: boolean;
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
