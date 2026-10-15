import { describe, it, expect } from "vitest";
import { extractDivs, extractTexts, parseClasses } from "./extract";

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
  it("strips a JSX className= prefix", () => {
    expect(parseClasses('className="flex-1 px-4"')).toEqual(["flex-1", "px-4"]);
  });
  it("strips a whole pasted opening tag", () => {
    expect(parseClasses('<div class="flex-1 px-4">')).toEqual(["flex-1", "px-4"]);
  });
  it("keeps quotes inside Tailwind arbitrary values", () => {
    expect(parseClasses("content-['x'] bg-[url('/a.png')]")).toEqual([
      "content-['x']",
      "bg-[url('/a.png')]",
    ]);
    expect(parseClasses(`class="content-['x'] a"`)).toEqual(["content-['x']", "a"]);
  });
  it("strips backtick quotes", () => {
    expect(parseClasses("`flex-1 px-4`")).toEqual(["flex-1", "px-4"]);
  });
  it("splits a compound CSS selector like .a.b", () => {
    expect(parseClasses(".flex-1.px-4.py-4")).toEqual(["flex-1", "px-4", "py-4"]);
  });
  it("unescapes a CSS selector like .md\\:flex", () => {
    expect(parseClasses(".md\\:flex .w-1\\/2")).toEqual(["md:flex", "w-1/2"]);
    expect(parseClasses(".w-1\\.5")).toEqual(["w-1.5"]);
  });
  it("keeps dots inside a class that does not start with a dot", () => {
    expect(parseClasses("w-1.5 a")).toEqual(["w-1.5", "a"]);
  });
  it("keeps a > inside a class", () => {
    expect(parseClasses("[&>*]:p-4 a")).toEqual(["[&>*]:p-4", "a"]);
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

describe("extractTexts text joining", () => {
  it("separates text nodes split by <br> with a space", () => {
    expect(extractTexts(`<div class="a">Line1<br>Line2</div>`, ["a"])).toEqual(["Line1 Line2"]);
  });
});

describe("extractDivs", () => {
  it("reports matched divs separately from items with text", () => {
    const html = `
      <div class="a"><span>child only</span></div>
      <div class="a">Own text</div>`;
    expect(extractDivs(html, ["a"])).toEqual({ matched: 2, items: ["Own text"] });
  });
  it("reports zero matches", () => {
    expect(extractDivs(`<div class="b">x</div>`, ["a"])).toEqual({ matched: 0, items: [] });
  });
});
