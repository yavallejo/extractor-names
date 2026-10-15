// Returns a normalized http(s) URL, or null if the input is not a usable URL.
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Has a scheme (but `host:port` is not a scheme) -> keep; otherwise assume https.
  const hasScheme =
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^[^/]+:\d+(\/|$)/.test(trimmed);
  const withProtocol = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}
