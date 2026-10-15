import { describe, it, expect } from "vitest";
import { BodyTooLargeError, decodeHtml, isHtmlContentType, readBodyCapped } from "./http";

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

const latin1 = (text: string) => Uint8Array.from(text, (c) => c.charCodeAt(0)).buffer;

describe("decodeHtml", () => {
  it("decodes UTF-8 by default", () => {
    const buf = new TextEncoder().encode("<p>Café™</p>").buffer;
    expect(decodeHtml(buf, "text/html")).toBe("<p>Café™</p>");
  });
  it("uses the charset from the Content-Type header", () => {
    expect(decodeHtml(latin1("<p>Caf\xe9</p>"), "text/html; charset=windows-1252")).toBe("<p>Café</p>");
  });
  it("sniffs <meta charset> when the header has no charset", () => {
    const html = '<html><head><meta charset="iso-8859-1"></head><p>Caf\xe9</p>';
    expect(decodeHtml(latin1(html), "text/html")).toContain("Café");
  });
  it("sniffs the http-equiv meta form", () => {
    const html = '<meta http-equiv="Content-Type" content="text/html; charset=windows-1252"><p>Caf\xe9</p>';
    expect(decodeHtml(latin1(html), null)).toContain("Café");
  });
  it("falls back to UTF-8 on an unknown charset", () => {
    const buf = new TextEncoder().encode("<p>ok</p>").buffer;
    expect(decodeHtml(buf, "text/html; charset=not-a-real-charset")).toBe("<p>ok</p>");
  });
});

describe("readBodyCapped", () => {
  it("returns the body when it fits", async () => {
    const buf = await readBodyCapped(new Response("hello"), 100);
    expect(new TextDecoder().decode(buf)).toBe("hello");
  });
  it("throws BodyTooLargeError when the body exceeds the cap", async () => {
    await expect(readBodyCapped(new Response("x".repeat(50)), 10)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
  it("throws early when Content-Length already exceeds the cap", async () => {
    const res = new Response("x", { headers: { "content-length": "9999" } });
    await expect(readBodyCapped(res, 10)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
});
