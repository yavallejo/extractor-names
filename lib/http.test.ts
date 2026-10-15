import { describe, it, expect } from "vitest";
import { isHtmlContentType } from "./http";

describe("isHtmlContentType", () => {
  it("accepts text/html with a charset", () => {
    expect(isHtmlContentType("text/html; charset=utf-8")).toBe(true);
  });
  it("accepts application/xhtml+xml", () => {
    expect(isHtmlContentType("application/xhtml+xml")).toBe(true);
  });
  it("accepts a missing header", () => {
    expect(isHtmlContentType(null)).toBe(true);
  });
  it("rejects other types", () => {
    expect(isHtmlContentType("application/pdf")).toBe(false);
    expect(isHtmlContentType("application/json")).toBe(false);
    expect(isHtmlContentType("image/png")).toBe(false);
  });
});
