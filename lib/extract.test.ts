import { describe, it, expect } from "vitest";
import { extractTexts, parseClasses } from "./extract";

const SAMPLE = `
<div class="flex-1 px-4 py-4 text-xl leading-tight">
                27 Flux-coated Electrode

                    <p class="my-2 text-sm text-gray-700 break-word">
                            Hardfacing Electrodes,                            Build-Up Alloy Electrodes                      </p>
                    </div>`;

describe("parseClasses", () => {
  it("splits on spaces and newlines", () => {
    expect(parseClasses("  flex-1  px-4\npy-4 ")).toEqual(["flex-1", "px-4", "py-4"]);
  });
  it("strips a leading dot from each class", () => {
    expect(parseClasses(".flex-1 .px-4")).toEqual(["flex-1", "px-4"]);
  });
  it("strips quotes and a class= prefix", () => {
    expect(parseClasses('class="flex-1 px-4"')).toEqual(["flex-1", "px-4"]);
    expect(parseClasses("'flex-1 px-4'")).toEqual(["flex-1", "px-4"]);
  });
  it("returns [] for blank input", () => {
    expect(parseClasses("   ")).toEqual([]);
  });
});

describe("extractTexts", () => {
  const classes = ["flex-1", "px-4", "py-4", "text-xl", "leading-tight"];

  it("returns only the direct text and ignores the <p>", () => {
    expect(extractTexts(SAMPLE, classes)).toEqual(["27 Flux-coated Electrode"]);
  });

  it("keeps order and removes duplicates", () => {
    const html = `
      <div class="a b">One</div>
      <div class="a b">Two</div>
      <div class="a b">One</div>`;
    expect(extractTexts(html, ["a", "b"])).toEqual(["One", "Two"]);
  });

  it("matches divs with extra classes in any order", () => {
    const html = `<div class="z b extra a">Hit</div>`;
    expect(extractTexts(html, ["a", "b"])).toEqual(["Hit"]);
  });

  it("does not match when a class is missing", () => {
    expect(extractTexts(`<div class="a">Nope</div>`, ["a", "b"])).toEqual([]);
  });

  it("ignores elements that are not divs", () => {
    expect(extractTexts(`<span class="a b">Nope</span>`, ["a", "b"])).toEqual([]);
  });

  it("supports classes with :, /, . and a leading digit", () => {
    const html = `<div class="md:flex w-1/2 w-1.5 2xl:p-4">Hit</div>`;
    expect(extractTexts(html, ["md:flex", "w-1/2", "w-1.5", "2xl:p-4"])).toEqual(["Hit"]);
  });

  it("decodes HTML entities and collapses whitespace", () => {
    const html = `<div class="a">  Tom &amp;\n   Jerry  </div>`;
    expect(extractTexts(html, ["a"])).toEqual(["Tom & Jerry"]);
  });

  it("drops divs without direct text", () => {
    expect(extractTexts(`<div class="a"><p>child only</p></div>`, ["a"])).toEqual([]);
  });

  it("returns [] for an empty class list", () => {
    expect(extractTexts(`<div class="a">x</div>`, [])).toEqual([]);
  });
});
