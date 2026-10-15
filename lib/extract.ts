import * as cheerio from "cheerio";

// Normalizes pasted class input: tolerates `class="..."`, quotes and leading dots.
export function parseClasses(input: string): string[] {
  return input
    .replace(/class\s*=/i, " ")
    .replace(/["']/g, " ")
    .split(/\s+/)
    .map((c) => c.replace(/^\./, ""))
    .filter(Boolean);
}

// Returns the direct text of every <div> that has ALL the given classes.
// Matching compares class tokens instead of using a CSS selector, so classes
// like `md:flex` or `2xl:p-4` need no escaping.
export function extractTexts(html: string, classes: string[]): string[] {
  if (classes.length === 0) return [];
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const result: string[] = [];

  $("div").each((_, el) => {
    const tokens = ($(el).attr("class") ?? "").split(/\s+/);
    if (!classes.every((c) => tokens.includes(c))) return;

    const text = $(el)
      .contents()
      .filter((_, node) => node.type === "text")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (text && !seen.has(text)) {
      seen.add(text);
      result.push(text);
    }
  });

  return result;
}
