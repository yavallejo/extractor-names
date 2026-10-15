// True if the Content-Type header is HTML (or absent, in which case we try anyway).
export function isHtmlContentType(contentType: string | null): boolean {
  if (!contentType) return true;
  const type = contentType.split(";")[0].trim().toLowerCase();
  return type === "text/html" || type === "application/xhtml+xml";
}
