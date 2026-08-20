import { describe, expect, it } from "vitest";

import {
  ValidationError,
  requireDepth,
  requireEntityGraphLabel,
  requireEntityId,
  requireGraphDepth,
  requireNodeGraphLabel,
  requireOptionalInt,
  requirePathTargetLabel,
  requirePublicId,
  requireSearchMode,
  requireSearchQuery,
} from "@/services/validate";

function expectRejects(fn: () => unknown): void {
  expect(() => fn()).toThrow(ValidationError);
}

describe("requirePublicId", () => {
  it("accepts a valid patient publicId", () => {
    expect(requirePublicId("P-1007")).toBe("P-1007");
  });

  it("rejects malformed ids", () => {
    expectRejects(() => requirePublicId("p-1007"));
    expectRejects(() => requirePublicId("P-100"));
    expectRejects(() => requirePublicId("P-1007x"));
    expectRejects(() => requirePublicId(""));
    expectRejects(() => requirePublicId(undefined));
    expectRejects(() => requirePublicId(null));
  });
});

describe("requireEntityId", () => {
  it("accepts a plain entity id", () => {
    expect(requireEntityId("d-1")).toBe("d-1");
  });

  it("rejects empty or overlong ids", () => {
    expectRejects(() => requireEntityId(""));
    expectRejects(() => requireEntityId(" ".repeat(3)));
    expectRejects(() => requireEntityId("x".repeat(65)));
  });
});

describe("requireSearchQuery", () => {
  it("accepts a non-empty bounded query", () => {
    expect(requireSearchQuery("ashley")).toBe("ashley");
  });

  it("rejects empty and overlong queries", () => {
    expectRejects(() => requireSearchQuery(""));
    expectRejects(() => requireSearchQuery("   "));
    expectRejects(() => requireSearchQuery("x".repeat(101)));
  });
});

describe("requireOptionalInt", () => {
  it("falls back when the value is absent", () => {
    expect(requireOptionalInt(undefined, 6, 10)).toBe(6);
    expect(requireOptionalInt("", 6, 10)).toBe(6);
  });

  it("accepts integers in range", () => {
    expect(requireOptionalInt("4", 6, 10)).toBe(4);
    expect(requireOptionalInt("10", 6, 10)).toBe(10);
  });

  it("rejects out-of-range and non-integer values", () => {
    expectRejects(() => requireOptionalInt("0", 6, 10));
    expectRejects(() => requireOptionalInt("11", 6, 10));
    expectRejects(() => requireOptionalInt("2.5", 6, 10));
    expectRejects(() => requireOptionalInt("abc", 6, 10));
    expectRejects(() => requireOptionalInt("-3", 6, 10));
  });
});

describe("requireDepth", () => {
  it("accepts a bounded depth", () => {
    expect(requireDepth("6")).toBe(6);
  });

  it("rejects depths beyond the max", () => {
    expectRejects(() => requireDepth("11"));
  });
});

describe("requirePathTargetLabel", () => {
  it("accepts the four allowed path targets", () => {
    expect(requirePathTargetLabel("Disease")).toBe("Disease");
    expect(requirePathTargetLabel("Medication")).toBe("Medication");
    expect(requirePathTargetLabel("Doctor")).toBe("Doctor");
    expect(requirePathTargetLabel("Patient")).toBe("Patient");
  });

  it("rejects everything else", () => {
    expectRejects(() => requirePathTargetLabel("Visit"));
    expectRejects(() => requirePathTargetLabel("Department"));
    expectRejects(() => requirePathTargetLabel(""));
  });
});

describe("requireSearchMode", () => {
  it("defaults an absent mode to all", () => {
    expect(requireSearchMode(undefined)).toBe("all");
    expect(requireSearchMode("")).toBe("all");
  });

  it("accepts known modes and rejects unknown ones", () => {
    expect(requireSearchMode("patient-name")).toBe("patient-name");
    expect(requireSearchMode("national-id")).toBe("national-id");
    expect(requireSearchMode("name")).toBe("name");
    expect(requireSearchMode("doctor")).toBe("doctor");
    expectRejects(() => requireSearchMode("hospital"));
  });
});

describe("requireGraphDepth", () => {
  it("defaults to 2 and accepts the allowlist 1|2|3", () => {
    expect(requireGraphDepth(undefined)).toBe(2);
    expect(requireGraphDepth("1")).toBe(1);
    expect(requireGraphDepth("3")).toBe(3);
  });

  it("rejects any other depth", () => {
    expectRejects(() => requireGraphDepth("0"));
    expectRejects(() => requireGraphDepth("4"));
  });
});

describe("allowlist label validators", () => {
  it("requireNodeGraphLabel accepts known node labels only", () => {
    expect(requireNodeGraphLabel("Medication")).toBe("Medication");
    expectRejects(() => requireNodeGraphLabel("NotAType"));
    expectRejects(() => requireNodeGraphLabel(""));
  });

  it("requireEntityGraphLabel accepts known entity labels only", () => {
    expect(requireEntityGraphLabel("Disease")).toBe("Disease");
    expectRejects(() => requireEntityGraphLabel("Alien"));
  });
});