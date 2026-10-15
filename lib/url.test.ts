import { describe, it, expect } from "vitest";
import { normalizeUrl } from "./url";

describe("normalizeUrl", () => {
  it("keeps an https URL unchanged", () => {
    expect(normalizeUrl("https://a.com/x")).toBe("https://a.com/x");
  });
  it("prepends https:// when the protocol is missing", () => {
    expect(normalizeUrl("a.com/x")).toBe("https://a.com/x");
  });
  it("trims whitespace", () => {
    expect(normalizeUrl("  http://a.com  ")).toBe("http://a.com/");
  });
  it("rejects non-http(s) protocols", () => {
    expect(normalizeUrl("ftp://a.com")).toBeNull();
    expect(normalizeUrl("file:///etc/passwd")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });
  it("rejects empty and garbage input", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});
