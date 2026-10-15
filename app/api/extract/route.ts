import { NextResponse } from "next/server";
import { extractDivs, parseClasses } from "@/lib/extract";
import { isHtmlContentType } from "@/lib/http";
import { normalizeUrl } from "@/lib/url";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let body: { url?: unknown; classes?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const url = typeof body.url === "string" ? normalizeUrl(body.url) : null;
  if (!url) return fail("The URL is not valid (it must be http or https).", 400);

  const classes = typeof body.classes === "string" ? parseClasses(body.classes) : [];
  if (classes.length === 0) return fail("Enter at least one class.", 400);

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return fail(`The page responded with error ${res.status}.`, 502);
    const contentType = res.headers.get("content-type");
    if (!isHtmlContentType(contentType)) {
      return fail(`The URL did not return an HTML page (got ${contentType}).`, 422);
    }
    html = await res.text();
  } catch {
    return fail("Could not download the page (no response or timed out).", 502);
  }

  const { matched, items } = extractDivs(html, classes);
  if (matched === 0) {
    return fail(
      "No div with those classes was found. If the page loads its content with JavaScript, this tool will not see it.",
      422,
    );
  }
  if (items.length === 0) {
    return fail(
      `${matched} div(s) matched, but none has its own text (the text is inside a child element).`,
      422,
    );
  }

  return NextResponse.json({ items });
}
