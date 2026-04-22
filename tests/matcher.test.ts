import { describe, it, expect } from "vitest";
import { matchPerson } from "../src/core/matcher.js";
import type { AnalyzeRequest } from "../src/core/types.js";

const baseInput: AnalyzeRequest = {
  person_name: "Jake Stein",
  disambiguation: {
    company: "TRYPS",
    role: "founder",
    location: "Dubai",
    industry_keywords: ["travel", "tech"],
  },
  known_domains: ["jointryps.com"],
  known_profiles: ["linkedin.com/in/jakestein"],
  queries: { primary: "Jake Stein" },
  search_config: { country: "ae", language: "en" },
  peers: [],
};

describe("matchPerson", () => {
  it("hard matches on known domain", () => {
    const result = matchPerson(
      "https://www.jointryps.com/about",
      "About Us",
      "Learn more about our team",
      baseInput
    );
    expect(result.is_person).toBe(true);
    expect(result.match_confidence).toBe(1.0);
    expect(result.match_type).toBe("known_domain");
  });

  it("hard matches on known profile", () => {
    const result = matchPerson(
      "https://linkedin.com/in/jakestein",
      "Jake Stein - Founder",
      "Building the future of travel",
      baseInput
    );
    expect(result.is_person).toBe(true);
    expect(result.match_confidence).toBe(1.0);
    expect(result.match_type).toBe("known_profile");
  });

  it("signal-based match with name + company", () => {
    const result = matchPerson(
      "https://techcrunch.com/article",
      "Jake Stein launches TRYPS in Dubai",
      "The travel startup...",
      baseInput
    );
    expect(result.is_person).toBe(true);
    expect(result.match_confidence).toBeGreaterThanOrEqual(0.6);
    expect(result.match_signals).toContain("name_in_title");
    expect(result.match_signals).toContain("company_match");
  });

  it("does not match different Jake Stein", () => {
    const result = matchPerson(
      "https://dentist.com/jake-stein",
      "Jake Stein DDS - Ohio Dentist",
      "Family dental care in Columbus Ohio",
      baseInput
    );
    // Name in title = 0.3, no company/role/location match
    expect(result.match_confidence).toBeLessThan(0.5);
    expect(result.is_person).toBe(false);
  });

  it("matches with name in snippet + company", () => {
    const result = matchPerson(
      "https://gulfnews.com/tech/article",
      "Dubai startup raises $5M",
      "Jake Stein's TRYPS has raised...",
      baseInput
    );
    expect(result.is_person).toBe(true);
    expect(result.match_signals).toContain("name_in_snippet");
    expect(result.match_signals).toContain("company_match");
  });

  it("does not match unrelated result", () => {
    const result = matchPerson(
      "https://randomsite.com/article",
      "Best Travel Apps 2026",
      "Here are the top travel apps...",
      baseInput
    );
    expect(result.is_person).toBe(false);
    expect(result.match_confidence).toBe(0);
    expect(result.match_type).toBe("none");
  });

  it("does NOT match similar LinkedIn URL with different slug", () => {
    // linkedin.com/in/jakestein should NOT match linkedin.com/in/jakestein123
    const result = matchPerson(
      "https://linkedin.com/in/jakestein123",
      "Jake Stein - Some Other Person",
      "Different person entirely",
      baseInput
    );
    expect(result.match_type).not.toBe("known_profile");
    // Should fall through to signal-based matching, not hard match
    expect(result.match_confidence).toBeLessThan(1.0);
  });

  it("matches exact LinkedIn URL with trailing slash or subpath", () => {
    const result = matchPerson(
      "https://linkedin.com/in/jakestein/",
      "Jake Stein - Founder",
      "Building travel tech",
      baseInput
    );
    expect(result.match_type).toBe("known_profile");
    expect(result.match_confidence).toBe(1.0);
  });

  it("does NOT match hyphenated extension of profile slug", () => {
    // Known bug: linkedin.com/in/jake-stein should NOT match linkedin.com/in/jake-stein-8625062
    const inputWithHyphen: AnalyzeRequest = {
      ...baseInput,
      known_profiles: ["linkedin.com/in/jake-stein"],
    };
    const result = matchPerson(
      "https://linkedin.com/in/jake-stein-8625062",
      "Jake Stein - Palatine, Illinois",
      "Some other Jake Stein",
      inputWithHyphen
    );
    expect(result.match_type).not.toBe("known_profile");
    expect(result.match_confidence).toBeLessThan(1.0);
  });
});
