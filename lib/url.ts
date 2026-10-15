// Returns a normalized http(s) URL, or null if the input is not a usable URL.
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Has a scheme (but `host:port` is not a scheme) -> keep; otherwise assume https.
  const hasScheme =
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^[^/]+:\d+(\/|$)/.test(trimmed);
  // Local dev servers (localhost, IPv4/IPv6 literals) speak plain http.
  const isLocal = /^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\])(:\d+)?([/?#]|$)/i.test(trimmed);
  const withProtocol = hasScheme ? trimmed : `${isLocal ? "http" : "https"}://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const isBareHost =
      !url.hostname.includes(".") && url.hostname !== "localhost" && !url.hostname.startsWith("[");
    if (isBareHost) return null;
    return url.toString();
  } catch {
    return null;
  }
}
