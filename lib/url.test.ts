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
  it("uses http:// for localhost, with or without a port", () => {
    expect(normalizeUrl("localhost:3000")).toBe("http://localhost:3000/");
    expect(normalizeUrl("localhost/x")).toBe("http://localhost/x");
  });
  it("uses http:// for IPv4 and IPv6 literals", () => {
    expect(normalizeUrl("127.0.0.1:8080/a")).toBe("http://127.0.0.1:8080/a");
    expect(normalizeUrl("[::1]:3000")).toBe("http://[::1]:3000/");
  });
  it("keeps an explicit protocol on localhost", () => {
    expect(normalizeUrl("https://localhost:3000")).toBe("https://localhost:3000/");
  });
});
