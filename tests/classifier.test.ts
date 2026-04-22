import { describe, it, expect } from "vitest";
import { classifySourceType, classifyFraming } from "../src/core/classifier.js";

describe("classifySourceType", () => {
  it("identifies owned domains", () => {
    expect(
      classifySourceType("https://jointryps.com/about", true, ["jointryps.com"])
    ).toBe("owned");
  });

  it("identifies social profiles", () => {
    expect(
      classifySourceType("https://linkedin.com/in/jake", true, [])
    ).toBe("social_profile");
    expect(
      classifySourceType("https://twitter.com/jake", true, [])
    ).toBe("social_profile");
  });

  it("identifies press mentions", () => {
    expect(
      classifySourceType("https://techcrunch.com/article", true, [])
    ).toBe("press_mention");
    expect(
      classifySourceType("https://forbes.com/person/jake", true, [])
    ).toBe("press_mention");
  });

  it("identifies media appearances", () => {
    expect(
      classifySourceType("https://youtube.com/watch?v=abc", true, [])
    ).toBe("media_appearance");
    expect(
      classifySourceType("https://podcasts.apple.com/show/abc", true, [])
    ).toBe("media_appearance");
  });

  it("returns unrelated for non-person results", () => {
    expect(
      classifySourceType("https://example.com", false, [])
    ).toBe("unrelated");
  });

  it("defaults to third_party_mention for unknown domains with person match", () => {
    expect(
      classifySourceType("https://someblog.com/article", true, [])
    ).toBe("third_party_mention");
  });
});

describe("classifyFraming", () => {
  it("detects role_led", () => {
    expect(classifyFraming("Jake Stein - Founder @ TRYPS", "Building travel tech")).toBe(
      "role_led"
    );
    expect(classifyFraming("Jake Stein, CEO of TRYPS", "")).toBe("role_led");
  });

  it("detects achievement_led", () => {
    expect(
      classifyFraming("TRYPS raises $5M Series A", "Jake Stein's startup")
    ).toBe("achievement_led");
    expect(
      classifyFraming("Jake Stein awarded Entrepreneur of the Year", "")
    ).toBe("achievement_led");
  });

  it("detects expertise_led", () => {
    expect(
      classifyFraming("Jake Stein - Travel Tech Expert", "Keynote speaker")
    ).toBe("expertise_led");
  });

  it("detects controversy_led", () => {
    expect(
      classifyFraming("Jake Stein sued for fraud", "Lawsuit alleges...")
    ).toBe("controversy_led");
  });

  it("returns neutral for generic text", () => {
    expect(classifyFraming("Jake Stein", "Profile page")).toBe("neutral");
  });

  it("prioritizes controversy over other framings", () => {
    expect(
      classifyFraming("Founder Jake Stein accused of fraud", "CEO lawsuit")
    ).toBe("controversy_led");
  });
});
