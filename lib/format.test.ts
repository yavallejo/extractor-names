import { describe, expect, it } from "vitest";
import { formatItems } from "./format";

const items = ["27 Flux-coated Electrode", 'Say "hi", friend'];

describe("formatItems", () => {
  it("joins lines with newlines", () => {
    expect(formatItems(items, "lines")).toBe('27 Flux-coated Electrode\nSay "hi", friend');
  });

  it("serializes JSON as a pretty array", () => {
    expect(JSON.parse(formatItems(items, "json"))).toEqual(items);
  });

  it("quotes CSV cells and escapes inner quotes", () => {
    expect(formatItems(items, "csv")).toBe(
      'text\n"27 Flux-coated Electrode"\n"Say ""hi"", friend"',
    );
  });
});
