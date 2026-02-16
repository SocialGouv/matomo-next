/**
 * Server-side tracking proxy for Matomo.
 *
 * Creates a Next.js rewrite rule that proxies tracking requests through
 * your own domain, effectively bypassing ad-blockers that block requests
 * to known analytics domains.
 *
 * @module server-proxy
 */

import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for the Matomo server-side proxy */
export interface MatomoProxyOptions {
  /** Full URL of your Matomo instance (e.g. "https://analytics.example.com") */
  matomoUrl: string;
  /**
   * Custom proxy path prefix. If not provided, a hashed path is generated
   * from the Matomo URL to avoid detection by ad-blockers.
   *
   * @default auto-generated from matomoUrl hash
   */
  proxyPath?: string;
  /**
   * Matomo Site ID – exposed as a build-time env var
   * `NEXT_PUBLIC_MATOMO_PROXY_PATH` for the client to consume.
   */
  siteId?: string;
}

/** Shape of the rewrite rules we inject into the Next.js config */
interface NextRewrite {
  source: string;
  destination: string;
}

/** Minimal Next.js config shape we care about */
interface NextConfig {
  rewrites?: () => Promise<NextRewrite[]> | NextRewrite[];
  env?: Record<string, string>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helper – generate an opaque proxy path from the Matomo URL
// ---------------------------------------------------------------------------

/**
 * Generates a short, deterministic, opaque path segment from a URL.
 *
 * @param url - Matomo instance URL
 * @returns A path like `/mtm-a1b2c3d4`
 *
 * @internal
 */
export function generateProxyPath(url: string): string {
  const hash = createHash("sha256").update(url).digest("hex").slice(0, 8);
  return `/mtm-${hash}`;
}

// ---------------------------------------------------------------------------
// withMatomoProxy – Next.js config wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps your Next.js config to add a server-side proxy for Matomo.
 *
 * This creates rewrite rules so that the browser sends tracking requests
 * to **your** domain (e.g. `/mtm-a1b2c3d4/matomo.php`) and Next.js
 * transparently proxies them to Matomo.
 *
 * It also exposes `NEXT_PUBLIC_MATOMO_PROXY_PATH` as an env variable
 * so the client library can use it automatically.
 *
 * @example
 * ```js
 * // next.config.mjs
 * import { withMatomoProxy } from "@socialgouv/matomo-next/server";
 *
 * const nextConfig = { /* ... *\/ };
 *
 * export default withMatomoProxy({
 *   matomoUrl: "https://analytics.example.com",
 * })(nextConfig);
 * ```
 */
export function withMatomoProxy(options: MatomoProxyOptions) {
  const { matomoUrl, proxyPath, siteId } = options;

  // Clean trailing slash
  const cleanMatomoUrl = matomoUrl.replace(/\/+$/, "");
  const resolvedProxyPath = proxyPath ?? generateProxyPath(cleanMatomoUrl);

  return function wrapNextConfig<T extends NextConfig>(nextConfig: T): T {
    const existingRewrites = nextConfig.rewrites;

    const matomoRewrites: NextRewrite[] = [
      // Proxy the JS tracker
      {
        source: `${resolvedProxyPath}/:path(matomo\\.js)`,
        destination: `${cleanMatomoUrl}/:path`,
      },
      // Proxy the PHP tracker (where data is actually sent)
      {
        source: `${resolvedProxyPath}/:path(matomo\\.php)`,
        destination: `${cleanMatomoUrl}/:path`,
      },
      // Proxy plugin assets (e.g. HeatmapSessionRecording, AbTesting)
      {
        source: `${resolvedProxyPath}/plugins/:path*`,
        destination: `${cleanMatomoUrl}/plugins/:path*`,
      },
    ];

    return {
      ...nextConfig,
      env: {
        ...nextConfig.env,
        NEXT_PUBLIC_MATOMO_PROXY_PATH: resolvedProxyPath,
        ...(siteId
          ? { NEXT_PUBLIC_MATOMO_PROXY_SITE_ID: siteId }
          : {}),
      },
      rewrites: async () => {
        let existingRules: NextRewrite[] = [];

        if (existingRewrites) {
          const result = await existingRewrites();
          if (Array.isArray(result)) {
            existingRules = result;
          }
        }

        return [...existingRules, ...matomoRewrites];
      },
    };
  };
}

// ---------------------------------------------------------------------------
// getProxyUrl – Client-side helper
// ---------------------------------------------------------------------------

/**
 * Returns the proxy URL to use instead of the direct Matomo URL.
 *
 * If a proxy path was configured via `withMatomoProxy`, this function
 * returns the origin + proxy path. Otherwise it returns `null` and you
 * should fall back to the direct Matomo URL.
 *
 * @example
 * ```ts
 * import { getProxyUrl } from "@socialgouv/matomo-next";
 *
 * const url = getProxyUrl() ?? "https://analytics.example.com";
 * trackAppRouter({ url, siteId: "1", pathname, searchParams });
 * ```
 */
export function getProxyUrl(): string | null {
  if (typeof window === "undefined") {
    // Server-side: read from env
    return process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH
      ? `${process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH}`
      : null;
  }

  // Client-side: check if the env var was injected at build time
  const proxyPath = process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH;
  if (!proxyPath) return null;

  // Build full URL using current origin
  return `${window.location.origin}${proxyPath}`;
}

/**
 * Returns just the proxy path (without origin), or null.
 *
 * Useful when you need to pass the path as the `url` parameter to
 * `trackAppRouter` / `trackPagesRouter` – in Next.js, relative URLs
 * work since the browser will resolve them against the current origin.
 */
export function getProxyPath(): string | null {
  return process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH ?? null;
}
