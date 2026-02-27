/**
 * Server-side tracking proxy for Matomo.
 *
 * Proxies tracking requests through your own domain using a randomly
 * generated endpoint path that changes on every build — effectively
 * bypassing ad-blockers that block known analytics domains or patterns.
 *
 * How it works:
 * 1. `withMatomoProxy()` generates a random path at build time (e.g. `/api/a3f7b2c1e9`)
 * 2. It adds a Next.js rewrite: `/api/{random}/:path*` → `/api/__mp/:path*`
 * 3. You create a catch-all API route at `app/api/__mp/[...path]/route.ts`
 *    that uses `createMatomoProxyHandler()` to forward requests to Matomo
 * 4. The browser only ever talks to YOUR domain — ad-blockers see nothing suspicious
 * 5. Each build produces a different path, so blockers can't hardcode it
 *
 * @module server-proxy
 */

// NOTE: this file is imported from both server and client code paths.
// Avoid Node-only imports (like `crypto`) at module top-level so bundlers
// don't try to polyfill them for the browser.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for the Matomo server-side proxy */
export interface MatomoProxyOptions {
  /** Full URL of your Matomo instance (e.g. "https://analytics.example.com") */
  matomoUrl: string;
  /**
   * Custom proxy path prefix. If not provided, a random path is generated
   * at build time to avoid detection by ad-blockers.
   *
   * ⚠️ Using a fixed path reduces ad-block resistance since the path
   * won't change between builds.
   *
   * @default auto-generated random path per build
   */
  proxyPath?: string;
  /**
   * Matomo Site ID – exposed as a build-time env var
   * `NEXT_PUBLIC_MATOMO_PROXY_SITE_ID` for the client to consume.
   */
  siteId?: string;
}

/** Shape of the rewrite rules we inject into the Next.js config */
interface NextRewrite {
  source: string;
  destination: string;
}

type NextRewritesObject = {
  beforeFiles?: NextRewrite[];
  afterFiles?: NextRewrite[];
  fallback?: NextRewrite[];
};

type NextRewritesResult = NextRewrite[] | NextRewritesObject;

/** Minimal Next.js config shape we care about */
interface NextConfig {
  rewrites?: () => Promise<NextRewritesResult> | NextRewritesResult;
  env?: Record<string, string>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helper – generate a random proxy path (changes every build)
// ---------------------------------------------------------------------------

function generateOpaqueHex(bytesLength: number): string {
  const bytes = new Uint8Array(bytesLength);

  // Prefer Web Crypto (available in modern browsers and in Node 18+)
  const webCrypto = (globalThis as any).crypto as
    | { getRandomValues?: (array: Uint8Array) => Uint8Array }
    | undefined;
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    // Extremely unlikely in supported environments, but keep a safe-ish fallback
    // to avoid hard crashes.
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateProxyAssetName(ext: "js"): string {
  // Keep it short, opaque, and *not* containing "matomo".
  // Example: "s3fa1c0d2e4.js"
  const id = generateOpaqueHex(5);
  return `s${id}.${ext}`;
}

function generateProxyTrackingEndpoint(): string {
  // Avoid `.php` on our own domain: it's just a URL path, but it looks odd and
  // some blockers match on `*.php` patterns.
  // Example: "t3fa1c0d2e4"
  const id = generateOpaqueHex(5);
  return `t${id}`;
}

/**
 * Generates a random, opaque path segment for the proxy endpoint.
 *
 * A new path is generated on every call, ensuring each build gets
 * a unique endpoint that ad-blockers cannot predict or hardcode.
 *
 * @returns A path like `/a3f7b2c1e9`
 *
 * @internal
 */
export function generateProxyPath(): string {
  const id = generateOpaqueHex(5);
  return `/a${id}`;
}

// ---------------------------------------------------------------------------
// withMatomoProxy – Next.js config wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps your Next.js config to add a server-side proxy for Matomo.
 *
 * This:
 * 1. Generates a **random** endpoint path that changes on every build
 * 2. Adds a Next.js rewrite from the random path to an internal API route
 * 3. Exposes `NEXT_PUBLIC_MATOMO_PROXY_PATH` for the client
 * 4. Exposes `MATOMO_PROXY_TARGET` (server-only) for the API route handler
 *
 * The browser sends tracking requests to `yoursite.com/api/{random}/{opaque}`.
 * Next.js rewrites them to `/api/__mp/{opaque}`, where the handler
 * forwards them to your Matomo instance.
 *
 * @example
 * ```js
 * // next.config.mjs
 * import { withMatomoProxy } from "@socialgouv/matomo-next";
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
  // Default to an API-looking endpoint (e.g. `/api/a3f7b2c1e9`) so the client
  // naturally calls your own API, and you don't need to put your domain in
  // Matomo params.
  const resolvedProxyPath = proxyPath ?? `/api${generateProxyPath()}`;

  // Optional: hide upstream file names too (some blockers match on `/matomo.js` / `/matomo.php`).
  // These are build-time values, stable until the next build.
  const resolvedJsTrackerFile = generateProxyAssetName("js");
  const resolvedPhpTrackerFile = generateProxyTrackingEndpoint();

  return function wrapNextConfig<T extends NextConfig>(nextConfig: T): T {
    const existingRewrites = nextConfig.rewrites;

    // Rewrite: random public path → internal API route handler
    const matomoRewrites: NextRewrite[] = [
      {
        source: `${resolvedProxyPath}/:path*`,
        destination: `/api/__mp/:path*`,
      },
    ];

    return {
      ...nextConfig,
      env: {
        ...nextConfig.env,
        NEXT_PUBLIC_MATOMO_PROXY_PATH: resolvedProxyPath,
        MATOMO_PROXY_TARGET: cleanMatomoUrl,
        NEXT_PUBLIC_MATOMO_PROXY_JS_TRACKER_FILE: resolvedJsTrackerFile,
        NEXT_PUBLIC_MATOMO_PROXY_PHP_TRACKER_FILE: resolvedPhpTrackerFile,
        ...(siteId ? { NEXT_PUBLIC_MATOMO_PROXY_SITE_ID: siteId } : {}),
      },
      rewrites: async () => {
        const result = existingRewrites ? await existingRewrites() : undefined;

        // IMPORTANT: we inject our rewrite in `beforeFiles` so it takes
        // precedence over filesystem routes (avoids conflicts with existing
        // `/api/*` routes like catch-all handlers).
        if (Array.isArray(result)) {
          return {
            beforeFiles: [...matomoRewrites],
            afterFiles: [...result],
            fallback: [],
          } satisfies NextRewritesObject;
        }

        const obj = (result ?? {}) as NextRewritesObject;
        return {
          beforeFiles: [...matomoRewrites, ...(obj.beforeFiles ?? [])],
          afterFiles: [...(obj.afterFiles ?? [])],
          fallback: [...(obj.fallback ?? [])],
        } satisfies NextRewritesObject;
      },
    };
  };
}

// ---------------------------------------------------------------------------
// createMatomoProxyHandler – API route handler factory
// ---------------------------------------------------------------------------

/**
 * Creates Next.js App Router route handlers (GET & POST) that proxy
 * requests to your Matomo instance.
 *
 * The handler reads `MATOMO_PROXY_TARGET` (set by `withMatomoProxy`)
 * to know where to forward requests. It forwards relevant headers
 * (User-Agent, Accept-Language, client IP) so Matomo can accurately
 * track visitors.
 *
 * @example
 * ```ts
 * // app/api/__mp/[...path]/route.ts
 * import { createMatomoProxyHandler } from "@socialgouv/matomo-next";
 * export const { GET, POST } = createMatomoProxyHandler();
 * ```
 */
export function createMatomoProxyHandler() {
  async function handler(
    request: Request,
    context: { params: Promise<{ path?: string[] }> | { path?: string[] } },
  ): Promise<Response> {
    const target = process.env.MATOMO_PROXY_TARGET;

    if (!target) {
      return new Response("Matomo proxy not configured", { status: 500 });
    }

    // Support both Next.js 13/14 (sync params) and 15+ (async params)
    const resolvedParams =
      context.params instanceof Promise ? await context.params : context.params;

    const { path = [] } = resolvedParams;

    // Some ad-blockers match on the *filename* (e.g. `matomo.js`, `matomo.php`).
    // Since we already hide the hostname by proxying through your own domain,
    // we can also hide those filenames by allowing the browser to request any
    // root-level `*.js` / `*.php` name.
    //
    // Example:
    // - Browser requests: /{random}/stats.js  -> proxy forwards to: /matomo.js
    // - Browser requests: /{random}/stats.php -> proxy forwards to: /matomo.php
    //
    // We only do this for *root-level* paths (single segment) so plugin assets
    // like /plugins/.../*.js keep working.
    const upstreamPathSegments = (() => {
      if (path.length === 1) {
        const file = path[0] ?? "";

        // Preferred mapping: match the build-time opaque file names.
        if (file === process.env.NEXT_PUBLIC_MATOMO_PROXY_JS_TRACKER_FILE) {
          return ["matomo.js"];
        }
        if (file === process.env.NEXT_PUBLIC_MATOMO_PROXY_PHP_TRACKER_FILE) {
          return ["matomo.php"];
        }

        // Backward-compatible / permissive mapping by extension.
        if (file.endsWith(".js")) return ["matomo.js"];
        if (file.endsWith(".php")) return ["matomo.php"];
      }

      return path;
    })();

    const targetUrl = new URL(`/${upstreamPathSegments.join("/")}`, target);

    // Forward query string parameters
    const requestUrl = new URL(request.url);
    requestUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    // Build headers to forward
    const forwardHeaders: Record<string, string> = {};
    const headersToForward = [
      "user-agent",
      "accept",
      "accept-language",
      "content-type",
    ];

    for (const name of headersToForward) {
      const value = request.headers.get(name);
      if (value) forwardHeaders[name] = value;
    }

    // Forward client IP for geolocation accuracy
    const clientIp =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip");
    if (clientIp) {
      forwardHeaders["x-forwarded-for"] = clientIp;
    }

    // Read body for non-GET requests
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : undefined;

    try {
      const proxyResponse = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: forwardHeaders,
        body,
      });

      // Build response headers
      const responseHeaders = new Headers();
      const contentType = proxyResponse.headers.get("content-type");
      if (contentType) responseHeaders.set("content-type", contentType);
      const cacheControl = proxyResponse.headers.get("cache-control");
      if (cacheControl) responseHeaders.set("cache-control", cacheControl);

      return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        headers: responseHeaders,
      });
    } catch {
      return new Response("Proxy error", { status: 502 });
    }
  }

  return {
    GET: handler,
    POST: handler,
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
