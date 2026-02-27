/**
 * @jest-environment node
 */

import { createMatomoProxyHandler } from "../server-proxy";

// ---------------------------------------------------------------------------
// createMatomoProxyHandler
// ---------------------------------------------------------------------------

describe("createMatomoProxyHandler", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MATOMO_PROXY_TARGET: "https://matomo.example.com",
      NEXT_PUBLIC_MATOMO_PROXY_JS_TRACKER_FILE: "s3fa1c0d2e4.js",
      NEXT_PUBLIC_MATOMO_PROXY_PHP_TRACKER_FILE: "t3fa1c0d2e4",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return GET and POST handlers", () => {
    const { GET, POST } = createMatomoProxyHandler();
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
  });

  it("should return 500 when MATOMO_PROXY_TARGET is not set", async () => {
    delete process.env.MATOMO_PROXY_TARGET;
    const { GET } = createMatomoProxyHandler();

    const request = new Request("http://localhost/api/__mp/matomo.js");
    const response = await GET(request, {
      params: Promise.resolve({ path: ["matomo.js"] }),
    });

    expect(response.status).toBe(500);
  });

  it("should forward GET requests to Matomo", async () => {
    const mockResponse = new Response("/* matomo tracker */", {
      status: 200,
      headers: { "content-type": "application/javascript" },
    });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { GET } = createMatomoProxyHandler();
    const request = new Request("http://localhost/api/__mp/matomo.js");
    const response = await GET(request, {
      params: Promise.resolve({ path: ["matomo.js"] }),
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://matomo.example.com/matomo.js",
      expect.objectContaining({ method: "GET" }),
    );

    fetchSpy.mockRestore();
  });

  it("should map the build-time opaque JS filename to upstream matomo.js", async () => {
    const mockResponse = new Response("/* matomo tracker */", {
      status: 200,
      headers: { "content-type": "application/javascript" },
    });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { GET } = createMatomoProxyHandler();
    const request = new Request("http://localhost/api/__mp/s3fa1c0d2e4.js");
    const response = await GET(request, {
      params: Promise.resolve({ path: ["s3fa1c0d2e4.js"] }),
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://matomo.example.com/matomo.js",
      expect.objectContaining({ method: "GET" }),
    );

    fetchSpy.mockRestore();
  });

  it("should map the build-time opaque tracking endpoint to upstream matomo.php", async () => {
    const mockResponse = new Response(null, { status: 204 });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { POST } = createMatomoProxyHandler();
    const request = new Request("http://localhost/api/__mp/t3fa1c0d2e4", {
      method: "POST",
      body: "idsite=1&rec=1",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["t3fa1c0d2e4"] }),
    });

    expect(response.status).toBe(204);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://matomo.example.com/matomo.php",
      expect.objectContaining({ method: "POST" }),
    );

    fetchSpy.mockRestore();
  });

  it("should forward POST requests with body", async () => {
    const mockResponse = new Response(null, { status: 204 });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { POST } = createMatomoProxyHandler();
    const request = new Request("http://localhost/api/__mp/matomo.php", {
      method: "POST",
      body: "idsite=1&rec=1",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    const response = await POST(request, {
      params: Promise.resolve({ path: ["matomo.php"] }),
    });

    expect(response.status).toBe(204);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://matomo.example.com/matomo.php",
      expect.objectContaining({ method: "POST" }),
    );

    fetchSpy.mockRestore();
  });

  it("should forward query parameters", async () => {
    const mockResponse = new Response("", { status: 200 });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { GET } = createMatomoProxyHandler();
    const request = new Request(
      "http://localhost/api/__mp/matomo.php?idsite=1&rec=1",
    );
    await GET(request, {
      params: Promise.resolve({ path: ["matomo.php"] }),
    });

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("idsite=1");
    expect(calledUrl).toContain("rec=1");

    fetchSpy.mockRestore();
  });

  it("should forward user-agent and accept-language headers", async () => {
    const mockResponse = new Response("", { status: 200 });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { GET } = createMatomoProxyHandler();
    const request = new Request("http://localhost/api/__mp/matomo.php", {
      headers: {
        "user-agent": "Mozilla/5.0",
        "accept-language": "en-US",
      },
    });
    await GET(request, {
      params: Promise.resolve({ path: ["matomo.php"] }),
    });

    const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = calledOptions.headers as Record<string, string>;
    expect(headers["user-agent"]).toBe("Mozilla/5.0");
    expect(headers["accept-language"]).toBe("en-US");

    fetchSpy.mockRestore();
  });

  it("should forward x-forwarded-for header for geolocation", async () => {
    const mockResponse = new Response("", { status: 200 });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { GET } = createMatomoProxyHandler();
    const request = new Request("http://localhost/api/__mp/matomo.php", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    await GET(request, {
      params: Promise.resolve({ path: ["matomo.php"] }),
    });

    const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = calledOptions.headers as Record<string, string>;
    expect(headers["x-forwarded-for"]).toBe("1.2.3.4");

    fetchSpy.mockRestore();
  });

  it("should handle proxy errors gracefully", async () => {
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Network error"));

    const { GET } = createMatomoProxyHandler();
    const request = new Request("http://localhost/api/__mp/matomo.php");
    const response = await GET(request, {
      params: Promise.resolve({ path: ["matomo.php"] }),
    });

    expect(response.status).toBe(502);

    fetchSpy.mockRestore();
  });

  it("should handle nested paths (e.g. plugins/HeatmapSessionRecording)", async () => {
    const mockResponse = new Response("/* plugin */", { status: 200 });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { GET } = createMatomoProxyHandler();
    const request = new Request(
      "http://localhost/api/__mp/plugins/HeatmapSessionRecording/tracker.min.js",
    );
    await GET(request, {
      params: Promise.resolve({
        path: ["plugins", "HeatmapSessionRecording", "tracker.min.js"],
      }),
    });

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toBe(
      "https://matomo.example.com/plugins/HeatmapSessionRecording/tracker.min.js",
    );

    fetchSpy.mockRestore();
  });

  it("should work with sync params (Next.js 13/14 style)", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const { GET } = createMatomoProxyHandler();
    const request = new Request("http://localhost/api/__mp/matomo.js");
    // Next.js 13/14 passes params as a plain object (not a Promise)
    const response = await GET(request, {
      params: { path: ["matomo.js"] } as any,
    });

    expect(response.status).toBe(200);

    fetchSpy.mockRestore();
  });
});
