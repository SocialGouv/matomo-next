import { sendEvent } from "../events";
import { push } from "../tracker";

// Mock the tracker module
jest.mock("../tracker", () => ({
  push: jest.fn(),
}));

describe("sendEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send basic event with category and action", () => {
    sendEvent({ category: "contact", action: "click phone" });

    expect(push).toHaveBeenCalledWith(["trackEvent", "contact", "click phone"]);
  });

  it("should send event with name", () => {
    sendEvent({ category: "video", action: "play", name: "intro-video" });

    expect(push).toHaveBeenCalledWith([
      "trackEvent",
      "video",
      "play",
      "intro-video",
    ]);
  });

  it("should send event with name and value", () => {
    sendEvent({
      category: "purchase",
      action: "buy",
      name: "product-123",
      value: "99.99",
    });

    expect(push).toHaveBeenCalledWith([
      "trackEvent",
      "purchase",
      "buy",
      "product-123",
      "99.99",
    ]);
  });

  it("should handle multiple events", () => {
    sendEvent({ category: "ui", action: "click" });
    sendEvent({ category: "ui", action: "hover", name: "button" });
    sendEvent({
      category: "form",
      action: "submit",
      name: "contact",
      value: "1",
    });

    expect(push).toHaveBeenCalledTimes(3);
    expect(push).toHaveBeenNthCalledWith(1, ["trackEvent", "ui", "click"]);
    expect(push).toHaveBeenNthCalledWith(2, [
      "trackEvent",
      "ui",
      "hover",
      "button",
    ]);
    expect(push).toHaveBeenNthCalledWith(3, [
      "trackEvent",
      "form",
      "submit",
      "contact",
      "1",
    ]);
  });
});
