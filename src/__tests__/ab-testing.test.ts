import {
  initABTesting,
  getABTestState,
} from "../ab-testing";
import type {
  ABTestDefinition,
} from "../ab-testing";
import type { PushArgs } from "../types";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Collect everything pushed via _paq so we can inspect it */
function collectPaqCalls(): unknown[][] {
  return (window._paq as unknown[][]) ?? [];
}

// ---------------------------------------------------------------------------
// setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  window._paq = [] as PushArgs[];
  delete window.__MATOMO_AB_TEST__;
});

// ---------------------------------------------------------------------------
// initABTesting
// ---------------------------------------------------------------------------

describe("initABTesting", () => {
  it("should be a no-op when `enabled` is false", () => {
    initABTesting({
      enabled: false,
      pathname: "/",
      tests: [
        {
          name: "test-1",
          percentage: 100,
          variations: [{ name: "original" }, { name: "variant-a" }],
        },
      ],
    });

    expect(collectPaqCalls()).toHaveLength(0);
    expect(window.__MATOMO_AB_TEST__).toBeUndefined();
  });

  it("should be a no-op when pathname is empty", () => {
    initABTesting({
      enabled: true,
      pathname: "",
      tests: [
        {
          name: "test-1",
          percentage: 100,
          variations: [{ name: "original" }],
        },
      ],
    });

    expect(collectPaqCalls()).toHaveLength(0);
  });

  it("should be a no-op when pathname matches an excluded pattern", () => {
    initABTesting({
      enabled: true,
      pathname: "/admin/dashboard",
      excludeUrlsPatterns: [/^\/admin/],
      tests: [
        {
          name: "test-1",
          percentage: 100,
          variations: [{ name: "original" }],
        },
      ],
    });

    expect(collectPaqCalls()).toHaveLength(0);
  });

  it("should be a no-op when tests array is empty", () => {
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [],
    });

    expect(collectPaqCalls()).toHaveLength(0);
  });

  it("should be a no-op when _paq is not available", () => {
    window._paq = null;
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "test-1",
          percentage: 100,
          variations: [{ name: "original" }],
        },
      ],
    });

    expect(window.__MATOMO_AB_TEST__).toBeUndefined();
  });

  it("should register a single test via AbTesting::create", () => {
    const test: ABTestDefinition = {
      name: "homepage-hero",
      percentage: 100,
      variations: [{ name: "original" }, { name: "new-hero" }],
    };

    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [test],
    });

    const calls = collectPaqCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe("AbTesting::create");

    const config = calls[0][1] as Record<string, unknown>;
    expect(config.name).toBe("homepage-hero");
    expect(config.percentage).toBe(100);
    expect(config.variations).toHaveLength(2);
  });

  it("should register multiple tests", () => {
    initABTesting({
      enabled: true,
      pathname: "/pricing",
      tests: [
        {
          name: "pricing-v1",
          percentage: 50,
          variations: [{ name: "original" }, { name: "variant-a" }],
        },
        {
          name: "pricing-v2",
          percentage: 100,
          variations: [
            { name: "original" },
            { name: "variant-b" },
            { name: "variant-c" },
          ],
        },
      ],
    });

    const calls = collectPaqCalls();
    expect(calls).toHaveLength(2);
    expect((calls[0][1] as Record<string, unknown>).name).toBe("pricing-v1");
    expect((calls[1][1] as Record<string, unknown>).name).toBe("pricing-v2");
  });

  it("should create placeholder state in __MATOMO_AB_TEST__", () => {
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "my-test",
          percentage: 100,
          variations: [{ name: "original" }],
        },
      ],
    });

    expect(window.__MATOMO_AB_TEST__).toBeDefined();
    const state = window.__MATOMO_AB_TEST__!["my-test"];
    expect(state).toEqual({
      abTest: "my-test",
      variant: null,
      isReady: false,
    });
  });

  it("should update state when a variant is activated", () => {
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "cta-test",
          percentage: 100,
          variations: [{ name: "original" }, { name: "green-cta" }],
        },
      ],
    });

    // Simulate Matomo activating a variant by calling the activate function
    const calls = collectPaqCalls();
    const config = calls[0][1] as Record<string, unknown>;
    const variations = config.variations as Array<{
      name: string;
      activate: () => void;
    }>;

    // Activate the second variation ("green-cta")
    variations[1].activate();

    const state = window.__MATOMO_AB_TEST__!["cta-test"];
    expect(state).toEqual({
      abTest: "cta-test",
      variant: "green-cta",
      isReady: true,
    });
  });

  it("should include startDateTime and endDateTime when provided", () => {
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "scheduled-test",
          percentage: 100,
          variations: [{ name: "original" }],
          startDateTime: "2025-01-01T00:00:00Z",
          endDateTime: "2025-12-31T23:59:59Z",
        },
      ],
    });

    const config = collectPaqCalls()[0][1] as Record<string, unknown>;
    expect(config.startDateTime).toBe("2025-01-01T00:00:00Z");
    expect(config.endDateTime).toBe("2025-12-31T23:59:59Z");
  });

  it("should use default trigger when none provided", () => {
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "trigger-test",
          percentage: 100,
          variations: [{ name: "original" }],
        },
      ],
    });

    const config = collectPaqCalls()[0][1] as Record<string, unknown>;
    expect(typeof config.trigger).toBe("function");
    expect((config.trigger as () => boolean)()).toBe(true);
  });

  it("should use custom trigger when provided", () => {
    const customTrigger = jest.fn(() => false);

    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "custom-trigger-test",
          percentage: 100,
          variations: [{ name: "original" }],
          trigger: customTrigger,
        },
      ],
    });

    const config = collectPaqCalls()[0][1] as Record<string, unknown>;
    expect((config.trigger as () => boolean)()).toBe(false);
    expect(customTrigger).toHaveBeenCalled();
  });

  it("should not overwrite existing state when called again", () => {
    // First call
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "dup-test",
          percentage: 100,
          variations: [{ name: "original" }, { name: "variant" }],
        },
      ],
    });

    // Simulate activation
    const calls = collectPaqCalls();
    const variations = (calls[0][1] as Record<string, unknown>)
      .variations as Array<{
      name: string;
      activate: () => void;
    }>;
    variations[1].activate();

    // Second call should not overwrite the ready state
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "dup-test",
          percentage: 100,
          variations: [{ name: "original" }, { name: "variant" }],
        },
      ],
    });

    const state = window.__MATOMO_AB_TEST__!["dup-test"];
    expect(state.isReady).toBe(true);
    expect(state.variant).toBe("variant");
  });

  it("should not match excluded patterns when excludeUrlsPatterns is empty", () => {
    initABTesting({
      enabled: true,
      pathname: "/some-page",
      excludeUrlsPatterns: [],
      tests: [
        {
          name: "no-exclude-test",
          percentage: 100,
          variations: [{ name: "original" }],
        },
      ],
    });

    expect(collectPaqCalls()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getABTestState
// ---------------------------------------------------------------------------

describe("getABTestState", () => {
  it("should return null when no tests are initialized", () => {
    expect(getABTestState("nonexistent")).toBeNull();
  });

  it("should return the state for an initialized test", () => {
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "state-test",
          percentage: 100,
          variations: [{ name: "original" }],
        },
      ],
    });

    const state = getABTestState("state-test");
    expect(state).toEqual({
      abTest: "state-test",
      variant: null,
      isReady: false,
    });
  });

  it("should return updated state after variant activation", () => {
    initABTesting({
      enabled: true,
      pathname: "/",
      tests: [
        {
          name: "state-ready-test",
          percentage: 100,
          variations: [{ name: "original" }, { name: "variant-x" }],
        },
      ],
    });

    // Activate variant
    const config = collectPaqCalls()[0][1] as Record<string, unknown>;
    const variations = config.variations as Array<{
      name: string;
      activate: () => void;
    }>;
    variations[1].activate();

    const state = getABTestState("state-ready-test");
    expect(state).toEqual({
      abTest: "state-ready-test",
      variant: "variant-x",
      isReady: true,
    });
  });
});
