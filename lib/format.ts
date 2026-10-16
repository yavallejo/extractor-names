export type CopyFormat = "lines" | "json" | "csv";

export const COPY_FORMATS: { value: CopyFormat; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "json", label: "JSON" },
  { value: "csv", label: "CSV" },
];

// Serializes the extracted texts for "Copy all". CSV is a single `text` column
// with every cell quoted, so commas, quotes and line breaks survive a paste.
export function formatItems(items: string[], format: CopyFormat): string {
  if (format === "json") return JSON.stringify(items, null, 2);
  if (format === "csv") {
    return ["text", ...items.map((item) => `"${item.replace(/"/g, '""')}"`)].join("\n");
  }
  return items.join("\n");
}
