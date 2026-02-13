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
  it("should generate a deterministic path from a URL", () => {
    const path1 = generateProxyPath("https://analytics.example.com");
    const path2 = generateProxyPath("https://analytics.example.com");
    expect(path1).toBe(path2);
  });

  it("should generate different paths for different URLs", () => {
    const path1 = generateProxyPath("https://a.example.com");
    const path2 = generateProxyPath("https://b.example.com");
    expect(path1).not.toBe(path2);
  });

  it("should start with /mtm-", () => {
    const path = generateProxyPath("https://analytics.example.com");
    expect(path).toMatch(/^\/mtm-[a-f0-9]{8}$/);
  });

  it("should produce an 8-char hex hash", () => {
    const path = generateProxyPath("https://test.matomo.cloud");
    const hash = path.replace("/mtm-", "");
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[a-f0-9]+$/);
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

  it("should inject NEXT_PUBLIC_MATOMO_PROXY_PATH env var", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({});
    expect(config.env).toBeDefined();
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_PATH).toMatch(
      /^\/mtm-[a-f0-9]{8}$/,
    );
  });

  it("should inject NEXT_PUBLIC_MATOMO_PROXY_SITE_ID when siteId is provided", () => {
    const config = withMatomoProxy({
      matomoUrl: MATOMO_URL,
      siteId: "42",
    })({});
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_SITE_ID).toBe("42");
  });

  it("should not inject siteId env when siteId is not provided", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({});
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_SITE_ID).toBeUndefined();
  });

  it("should use custom proxyPath when provided", () => {
    const config = withMatomoProxy({
      matomoUrl: MATOMO_URL,
      proxyPath: "/my-custom-path",
    })({});
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_PATH).toBe("/my-custom-path");
  });

  it("should create rewrites for matomo.js, matomo.php, and plugins", async () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({});
    const rewrites = await config.rewrites!();

    expect(rewrites).toHaveLength(3);

    // matomo.js
    expect(rewrites[0].source).toContain("matomo\\.js");
    expect(rewrites[0].destination).toContain(MATOMO_URL);

    // matomo.php
    expect(rewrites[1].source).toContain("matomo\\.php");
    expect(rewrites[1].destination).toContain(MATOMO_URL);

    // plugins
    expect(rewrites[2].source).toContain("/plugins/");
    expect(rewrites[2].destination).toContain(`${MATOMO_URL}/plugins/`);
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
    expect(rewrites).toHaveLength(4); // 1 existing + 3 matomo
    expect(rewrites[0]).toEqual(existingRewrite);
  });

  it("should preserve other Next.js config properties", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({
      reactStrictMode: true,
      images: { domains: ["example.com"] },
    });

    expect(config.reactStrictMode).toBe(true);
    expect(config.images).toEqual({ domains: ["example.com"] });
  });

  it("should merge with existing env vars", () => {
    const config = withMatomoProxy({ matomoUrl: MATOMO_URL })({
      env: { EXISTING_VAR: "hello" },
    });

    expect(config.env!.EXISTING_VAR).toBe("hello");
    expect(config.env!.NEXT_PUBLIC_MATOMO_PROXY_PATH).toBeDefined();
  });

  it("should strip trailing slash from matomoUrl", async () => {
    const config = withMatomoProxy({
      matomoUrl: "https://analytics.example.com/",
    })({});

    const rewrites = await config.rewrites!();
    // All destinations should not have double slashes
    for (const rule of rewrites) {
      expect(rule.destination).not.toContain("//:");
    }
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
    process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH = "/mtm-abcd1234";
    // In jsdom, window.location.origin is "http://localhost"
    const result = getProxyUrl();
    expect(result).toBe("http://localhost/mtm-abcd1234");
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
    process.env.NEXT_PUBLIC_MATOMO_PROXY_PATH = "/mtm-abcd1234";
    expect(getProxyPath()).toBe("/mtm-abcd1234");
  });
});
