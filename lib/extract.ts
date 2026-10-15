import * as cheerio from "cheerio";

// Normalizes pasted class input: tolerates `class="..."`, JSX `className="..."`,
// a whole pasted opening tag, quotes and leading dots.
export function parseClasses(input: string): string[] {
  return input
    .replace(/^\s*<[a-z][a-z0-9]*/i, " ")
    .replace(/\/?>\s*$/, " ")
    .replace(/class(name)?\s*=/i, " ")
    .replace(/["']/g, " ")
    .split(/\s+/)
    .map((c) => c.replace(/^\./, ""))
    .filter(Boolean);
}

// Finds every <div> that has ALL the given classes and returns how many matched
// plus the direct text of those that have any.
// Matching compares class tokens instead of using a CSS selector, so classes
// like `md:flex` or `2xl:p-4` need no escaping.
export function extractDivs(
  html: string,
  classes: string[],
): { matched: number; items: string[] } {
  if (classes.length === 0) return { matched: 0, items: [] };
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const items: string[] = [];
  let matched = 0;

  $("div").each((_, el) => {
    const tokens = ($(el).attr("class") ?? "").split(/\s+/);
    if (!classes.every((c) => tokens.includes(c))) return;
    matched++;

    // Join text nodes with a space so `Line1<br>Line2` does not become `Line1Line2`.
    const text = $(el)
      .contents()
      .filter((_, node) => node.type === "text")
      .map((_, node) => (node as unknown as { data: string }).data)
      .get()
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text && !seen.has(text)) {
      seen.add(text);
      items.push(text);
    }
  });

  return { matched, items };
}

export function extractTexts(html: string, classes: string[]): string[] {
  return extractDivs(html, classes).items;
}
