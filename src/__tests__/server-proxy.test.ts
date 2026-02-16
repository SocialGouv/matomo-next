import {
  generateProxyPath,
  withMatomoProxy,
  getProxyUrl,
  getProxyPath,
} from "../server-proxy";

// ---------------------------------------------------------------------------
// generateProxyPath
// ---------------------------------------------------------------------------

describe("generateProxyPath", () => {
  it("should generate a random path on each call", () => {
    const path1 = generateProxyPath();
    const path2 = generateProxyPath();
    expect(path1).not.toBe(path2);
  });

  it("should start with /a", () => {
    const path = generateProxyPath();
    expect(path).toMatch(/^\/a[a-f0-9]{10}$/);
  });

  it("should produce a 10-char hex id after the prefix", () => {
    const path = generateProxyPath();
    const id = path.replace("/a", "");
    expect(id).toHaveLength(10);
    expect(id).toMatch(/^[a-f0-9]+$/);
  });
});

// ---------------------------------------------------------------------------
// withMatomoProxy
// ---------------------------------------------------------------------------

describe("withMatomoProxy", () => {
  const MATOMO_URL = "https://analytics.example.com";

  it("should return a function that wraps Next.js config", () => {
    const wrapper = withMatomoProxy({ matomoUrl: MATOMO_URL });
    expect(typeof wrapper).toBe("function");
  });

  it("should inject NEXT_PUBLIC_MATOMO_PROXY_PATH env var with random path", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({} as any);
    expect(config.env).toBeDefined();
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_PATH).toMatch(
      /^\/api\/a[a-f0-9]{10}$/,
    );
  });

  it("should inject MATOMO_PROXY_TARGET env var (server-only)", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({} as any);
    expect(config.env!.MATOMO_PROXY_TARGET).toBe(MATOMO_URL);
  });

  it("should inject NEXT_PUBLIC_MATOMO_PROXY_SITE_ID when siteId is provided", () => {
    const config = withMatomoProxy({
      matomoUrl: MATOMO_URL,
      siteId: "42",
    })({} as any);
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_SITE_ID).toBe("42");
  });

  it("should not inject siteId env when siteId is not provided", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({} as any);
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_SITE_ID).toBeUndefined();
  });

  it("should use custom proxyPath when provided", () => {
    const config = withMatomoProxy({
      matomoUrl: MATOMO_URL,
      proxyPath: "/my-custom-path",
    })({} as any);
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_PATH).toBe("/my-custom-path");
  });

  it("should generate different paths per build (non-deterministic)", () => {
    const config1 = withMatomoProxy({ matomoUrl: MATOMO_URL })({} as any);
    const config2 = withMatomoProxy({ matomoUrl: MATOMO_URL })({} as any);
    expect(config1.env!.NEXT_PUBLIC_MATOMO_PROXY_PATH).not.toBe(
      config2.env!.NEXT_PUBLIC_MATOMO_PROXY_PATH,
    );
  });

  it("should create a single catch-all rewrite to the internal API route", async () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({} as any);
    const rewrites = await config.rewrites!();

    expect(Array.isArray(rewrites)).toBe(false);
    expect((rewrites as any).beforeFiles).toHaveLength(1);
    expect((rewrites as any).beforeFiles[0].source).toMatch(
      /^\/api\/a[a-f0-9]{10}\/:path\*$/,
    );
    expect((rewrites as any).beforeFiles[0].destination).toBe("/api/__mp/:path*");
  });

  it("should preserve existing rewrites", async () => {
    const existingRewrite = {
      source: "/old-path",
      destination: "/new-path",
    };

    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({
      rewrites: async () => [existingRewrite],
    });

    const rewrites = await config.rewrites!();
    expect(Array.isArray(rewrites)).toBe(false);
    expect((rewrites as any).beforeFiles).toHaveLength(1);
    expect((rewrites as any).afterFiles).toHaveLength(1); // existing rule moved to afterFiles
    expect((rewrites as any).afterFiles[0]).toEqual(existingRewrite);
  });

  it("should preserve existing rewrite objects (beforeFiles/afterFiles/fallback)", async () => {
    const existingRewrite = {
      source: "/old-path",
      destination: "/new-path",
    };

    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({
      rewrites: async () => ({
        beforeFiles: [existingRewrite],
        afterFiles: [],
        fallback: [],
      }),
    } as any);

    const rewrites = await config.rewrites!();
    expect(Array.isArray(rewrites)).toBe(false);
    expect((rewrites as any).beforeFiles.length).toBeGreaterThanOrEqual(2);
    // our proxy rewrite should be first, then existing beforeFiles
    expect((rewrites as any).beforeFiles[1]).toEqual(existingRewrite);
  });

  it("should preserve other Next.js config properties", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({
      reactStrictMode: true,
      images: { domains: ["example.com"] },
    } as any);

    expect(config.reactStrictMode).toBe(true);
    expect(config.images).toEqual({ domains: ["example.com"] });
  });

  it("should merge with existing env vars", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({
      env: { EXISTING_VAR: "hello" },
    } as any);

    expect(config.env!.EXISTING_VAR).toBe("hello");
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_PATH).toBeDefined();
    expect(config.env!.MATOMO_PROXY_TARGET).toBe(MATOMO_URL);
  });

  it("should strip trailing slash from matomoUrl", () => {
    const config = withMatomoProxy({
      matomoUrl: "https://analytics.example.com/",
    })({} as any);
    expect(config.env!.MATOMO_PROXY_TARGET).toBe(
      "https://analytics.example.com",
    );
  });
});

// ---------------------------------------------------------------------------
// getProxyUrl
// ---------------------------------------------------------------------------

describe("getProxyUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return null when NEXT_PUBLIC_MATOMO_PROXY_PATH is not set", () => {
    delete process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH;
    expect(getProxyUrl()).toBeNull();
  });

  it("should return full URL with origin when proxy path is set", () => {
    process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH = "/api/a1234567890";
    // In jsdom, window.location.origin is "http://localhost"
    const result = getProxyUrl();
    expect(result).toBe("http://localhost/api/a1234567890");
  });
});

// ---------------------------------------------------------------------------
// getProxyPath
// ---------------------------------------------------------------------------

describe("getProxyPath", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return null when NEXT_PUBLIC_MATOMO_PROXY_PATH is not set", () => {
    delete process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH;
    expect(getProxyPath()).toBeNull();
  });

  it("should return the proxy path when set", () => {
    process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH = "/api/a1234567890";
    expect(getProxyPath()).toBe("/api/a1234567890");
  });
});
