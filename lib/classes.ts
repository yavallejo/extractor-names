// `.a.b` or `.md\:flex` -> class names. Only tokens that start with a dot are
// treated as CSS selectors, so `w-1.5` is kept as a single class.
function selectorToClasses(token: string): string[] {
  if (!token.startsWith(".")) return [token];
  return token
    .split(/(?<!\\)\./)
    .filter(Boolean)
    .map((c) => c.replace(/\\(.)/g, "$1"));
}

// Normalizes pasted class input: tolerates `class="..."`, JSX `className="..."`,
// a whole pasted opening tag, wrapping quotes/backticks and CSS selectors.
// Quotes are only stripped at token edges, so Tailwind values like
// `content-['x']` survive.
export function parseClasses(input: string): string[] {
  return input
    .replace(/^\s*<[a-z][a-z0-9]*/i, " ")
    .replace(/\/?>\s*$/, " ")
    .replace(/class(name)?\s*=/i, " ")
    .replace(/(^|\s)["'`]+/g, "$1 ")
    .replace(/["'`]+(?=\s|$)/g, " ")
    .split(/\s+/)
    .flatMap(selectorToClasses)
    .filter(Boolean);
}
