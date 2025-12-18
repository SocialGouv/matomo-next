import { safePush } from "../utils";

describe("safePush", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should successfully push command when pushFn works", () => {
    const mockPushFn = jest.fn();
    const command = ["trackPageView"] as const;

    safePush(mockPushFn, command);

    expect(mockPushFn).toHaveBeenCalledWith(command);
    expect(mockPushFn).toHaveBeenCalledTimes(1);
  });

  it("should handle errors silently when debug is false", () => {
    const mockPushFn = jest.fn(() => {
      throw new Error("Method not found");
    });
    const command = ["HeatmapSessionRecording.setKeystrokes", "false"] as const;

    safePush(mockPushFn, command, false);

    expect(mockPushFn).toHaveBeenCalledWith(command);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("should log warning when debug is true and error occurs", () => {
    const mockPushFn = jest.fn(() => {
      throw new Error("Method not found");
    });
    const command = ["HeatmapSessionRecording.setKeystrokes", "false"] as const;

    safePush(mockPushFn, command, true);

    expect(mockPushFn).toHaveBeenCalledWith(command);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Matomo: Method "HeatmapSessionRecording.setKeystrokes" may not be available yet. Command queued.',
      expect.any(Error),
    );
  });

  it("should handle complex commands", () => {
    const mockPushFn = jest.fn();
    const command = [
      "HeatmapSessionRecording.setCaptureVisibleContentOnly",
      "true",
    ] as const;

    safePush(mockPushFn, command);

    expect(mockPushFn).toHaveBeenCalledWith(command);
  });

  it("should not throw error even when pushFn throws", () => {
    const mockPushFn = jest.fn(() => {
      throw new Error("Critical error");
    });
    const command = ["trackPageView"] as const;

    expect(() => safePush(mockPushFn, command)).not.toThrow();
  });
});
