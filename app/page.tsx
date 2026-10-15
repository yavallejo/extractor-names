"use client";

import { useState } from "react";

const EXAMPLE = {
  url: "https://hardfacetechnologies.com/industry/sugar-cane-processing-1",
  classes: "flex-1 px-4 py-4 text-xl leading-tight",
};

function Icon({ children, className = "h-4 w-4" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const CopyIcon = () => (
  <Icon>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </Icon>
);

const CheckIcon = () => (
  <Icon>
    <path d="M5 13l4 4L19 7" />
  </Icon>
);

const AlertIcon = () => (
  <Icon className="mt-0.5 h-4 w-4 shrink-0">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </Icon>
);

const SparkIcon = () => (
  <Icon className="h-5 w-5">
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
  </Icon>
);

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const inputClass =
  "block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 " +
  "placeholder:text-slate-400 shadow-sm outline-none transition " +
  "focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 " +
  "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 " +
  "dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";

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
    setCopied(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, classes }),
      });
      // A crashed route can answer with a non-JSON body; keep the real status.
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) setError(data?.error ?? `The server responded with an error (${res.status}).`);
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
      setError(null);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  }

  return (
    <div className="min-h-dvh bg-linear-to-b from-indigo-50/80 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <main className="mx-auto w-full min-w-0 max-w-2xl px-4 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-12 lg:max-w-3xl lg:pt-16">
        <header className="mb-6 flex items-center gap-3 sm:mb-8">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <SparkIcon />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">Extractor</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pull the text of every div with the classes you choose.
            </p>
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:space-y-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/70"
        >
          <div className="space-y-1.5">
            <label htmlFor="url" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Page URL
            </label>
            <input
              id="url"
              className={inputClass}
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="classes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Div classes
            </label>
            <input
              id="classes"
              className={`${inputClass} font-mono`}
              placeholder="flex-1 px-4 py-4 text-xl leading-tight"
              value={classes}
              onChange={(e) => setClasses(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste them as they appear in the class attribute.{" "}
              <button
                type="button"
                onClick={() => {
                  setUrl(EXAMPLE.url);
                  setClasses(EXAMPLE.classes);
                }}
                className="-my-1 inline-block py-1 font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
              >
                Try an example
              </button>
            </p>
          </div>

          <div className="flex sm:justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold sm:w-auto sm:min-w-40 text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner />}
            {loading ? "Extracting..." : "Extract"}
          </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-5 flex min-w-0 gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertIcon />
            <p className="min-w-0 break-words">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-6 space-y-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {items && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3 dark:border-slate-800 dark:bg-slate-900/95">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="mr-1.5 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {items.length}
                </span>
                {items.length === 1 ? "result" : "results"}
              </p>
              <button
                type="button"
                onClick={() => copy(items.join("\n"), "all")}
                className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {copied === "all" ? <CheckIcon /> : <CopyIcon />}
                {copied === "all" ? "Copied" : "Copy all"}
              </button>
            </div>

            <ul className="divide-y divide-slate-100 overflow-hidden rounded-b-2xl dark:divide-slate-800">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="group flex items-center gap-2 px-3 py-1.5 transition sm:gap-3 sm:px-4 sm:py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-400 sm:w-6">{i + 1}</span>
                  <span className="min-w-0 flex-1 break-words text-sm text-slate-800 dark:text-slate-100">{item}</span>
                  <button
                    type="button"
                    aria-label={`Copy ${item}`}
                    onClick={() => copy(item, i)}
                    className={`flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium transition ${
                      copied === i
                        ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                        : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                    }`}
                  >
                    {copied === i ? <CheckIcon /> : <CopyIcon />}
                    {copied === i && "Copied"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
