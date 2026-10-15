// True if the Content-Type header is HTML (or absent, in which case we try anyway).
export function isHtmlContentType(contentType: string | null): boolean {
  if (!contentType) return true;
  const type = contentType.split(";")[0].trim().toLowerCase();
  return type === "text/html" || type === "application/xhtml+xml";
}

export class BodyTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Response body exceeds ${maxBytes} bytes.`);
  }
}

// Reads a response body, aborting as soon as it grows past `maxBytes`.
export async function readBodyCapped(res: Response, maxBytes: number): Promise<ArrayBuffer> {
  const declared = Number(res.headers.get("content-length"));
  if (declared > maxBytes) {
    await res.body?.cancel();
    throw new BodyTooLargeError(maxBytes);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body?.getReader();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new BodyTooLargeError(maxBytes);
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

function charsetFromHeader(contentType: string | null): string | undefined {
  return /charset\s*=\s*["']?([\w.:-]+)/i.exec(contentType ?? "")?.[1];
}

// Looks for <meta charset=...> or the http-equiv form in the first 2 KB.
function sniffMetaCharset(buf: ArrayBufferLike): string | undefined {
  const head = new TextDecoder("latin1").decode(buf.slice(0, 2048));
  return /<meta[^>]+charset\s*=\s*["']?([\w.:-]+)/i.exec(head)?.[1];
}

// Decodes HTML bytes using the header charset, then <meta>, then UTF-8.
export function decodeHtml(buf: ArrayBufferLike, contentType: string | null): string {
  const label = charsetFromHeader(contentType) ?? sniffMetaCharset(buf) ?? "utf-8";
  try {
    return new TextDecoder(label).decode(buf);
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
}
