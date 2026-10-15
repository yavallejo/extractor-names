"use client";

import { useState } from "react";

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-green-600">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [classes, setClasses] = useState("");
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | "all" | null>(null);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setItems(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, classes }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Unknown error.");
      else setItems(data.items);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, key: number | "all") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Extractor</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="URL (https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <input
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Classes (e.g. flex-1 px-4 py-4 text-xl leading-tight)"
          value={classes}
          onChange={(e) => setClasses(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Extracting..." : "Extract"}
        </button>
      </form>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {items && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {items.length} {items.length === 1 ? "result" : "results"}
            </p>
            <button
              type="button"
              onClick={() => copy(items.join("\n"), "all")}
              className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {copied === "all" ? <CheckIcon /> : <CopyIcon />} Copy all
            </button>
          </div>
          <ul className="divide-y divide-gray-200 rounded border border-gray-200">
            {items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>{item}</span>
                <button
                  type="button"
                  aria-label={`Copy ${item}`}
                  onClick={() => copy(item, i)}
                  className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100"
                >
                  {copied === i ? <CheckIcon /> : <CopyIcon />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
