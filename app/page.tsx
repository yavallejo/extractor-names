"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CheckIcon, CopyIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { parseClasses } from "@/lib/classes";
import { COPY_FORMATS, formatItems, type CopyFormat } from "@/lib/format";

const EXAMPLE = {
  url: "https://hardfacetechnologies.com/industry/sugar-cane-processing-1",
  classes: "flex-1 px-4 py-4 text-xl leading-tight",
};

const SKELETON_WIDTHS = ["w-[78%]", "w-[58%]", "w-[88%]", "w-[66%]"];

const inputClass =
  "block min-h-11 w-full min-w-0 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-base text-ink " +
  "placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-200 " +
  "focus:border-ink focus:ring-4 focus:ring-accent/60";

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  );
}

const subscribeNever = () => () => {};
const detectMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

export default function Home() {
  const [url, setUrl] = useState("");
  const [classes, setClasses] = useState("");
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | "all" | null>(null);
  const [format, setFormat] = useState<CopyFormat>("lines");
  const [status, setStatus] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const isMac = useSyncExternalStore(subscribeNever, detectMac, () => false);
  const chips = useMemo(() => parseClasses(classes), [classes]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target)) {
        e.preventDefault();
        urlRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setItems(null);
    setCopied(null);
    setStatus("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, classes }),
      });
      // A crashed route can answer with a non-JSON body; keep the real status.
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) setError(data?.error ?? `The server responded with an error (${res.status}).`);
      else {
        setItems(data.items);
        setStatus(`${data.items.length} results found.`);
      }
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
      setStatus(key === "all" ? "Copied all results." : "Copied.");
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <main className="mx-auto w-full min-w-0 max-w-3xl px-4 pt-8 pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-14 lg:pt-20">
        <header className="mb-10 sm:mb-14">
          <p className="text-lg font-semibold tracking-tight">
            <span className="mark px-1.5">Pluck</span>
          </p>
          <h1 className="mt-10 text-4xl leading-[1.05] font-semibold tracking-tighter sm:text-5xl lg:text-6xl">
            Pull the <span className="mark px-1">text</span> out of any div.
          </h1>
          <p className="mt-5 max-w-[44ch] text-base text-muted sm:text-lg">
            Paste a page URL and the classes of a div. Get every match, ready to copy.
          </p>
        </header>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="space-y-5 rounded-lg border border-line bg-surface p-4 sm:p-6"
        >
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Page URL
            </label>
            <input
              id="url"
              ref={urlRef}
              className={inputClass}
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="classes" className="text-sm font-medium">
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
            <p className="text-xs text-muted">
              Paste them as they appear in the class attribute.{" "}
              <button
                type="button"
                onClick={() => {
                  setUrl(EXAMPLE.url);
                  setClasses(EXAMPLE.classes);
                }}
                className="-my-1 inline-block rounded py-1 font-medium text-ink underline decoration-accent decoration-2 underline-offset-4 transition-[text-decoration-color] hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Try an example
              </button>
            </p>
            <ul className="flex min-h-7 flex-wrap gap-1.5" aria-label="Detected classes">
              {chips.map((c, i) => (
                <li
                  key={`${c}-${i}`}
                  className="chip rounded-lg bg-accent px-2 py-0.5 font-mono text-xs text-accent-ink"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex sm:justify-end">
            <button
              type="submit"
              disabled={loading}
              className="relative flex min-h-11 w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold whitespace-nowrap text-accent-ink transition-[transform,filter] duration-150 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98] disabled:cursor-not-allowed sm:w-auto sm:min-w-44"
            >
              {loading && <span className="shimmer absolute inset-0 bg-white/40" aria-hidden="true" />}
              <span className="relative">{loading ? "Extracting..." : "Extract"}</span>
              {!loading && (
                <span className="relative hidden items-center gap-1 sm:flex" aria-hidden="true">
                  <span className="kbd border-accent-ink/30 text-accent-ink">{isMac ? "⌘" : "Ctrl"}</span>
                  <span className="kbd border-accent-ink/30 text-accent-ink">↵</span>
                </span>
              )}
            </button>
          </div>
        </form>

        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 flex min-w-0 gap-2.5 rounded-lg border border-red-300 bg-red-50 p-3.5 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
          >
            <WarningCircleIcon weight="bold" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 break-words">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-8 space-y-2" aria-hidden="true">
            {SKELETON_WIDTHS.map((w, i) => (
              <div key={i} className="flex h-11 items-center gap-3 px-3">
                <div className="h-3 w-5 animate-pulse rounded bg-line" />
                <div className={`h-3 animate-pulse rounded bg-line ${w}`} />
              </div>
            ))}
          </div>
        )}

        {!items && !loading && !error && (
          <div className="mt-8 rounded-lg border border-dashed border-line px-5 py-8 text-sm text-muted">
            <p className="font-medium text-ink">Your results will show up here.</p>
            <p className="mt-1.5 hidden sm:block">
              Press <span className="kbd">/</span> to jump to the URL, or{" "}
              <span className="kbd">{isMac ? "⌘" : "Ctrl"}</span> <span className="kbd">↵</span> to extract.
            </p>
          </div>
        )}

        {items && (
          <section className="mt-8" aria-label="Results">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line bg-paper/90 py-3 backdrop-blur">
              <p className="flex items-baseline gap-2">
                <span key={items.length} className="count font-mono text-2xl font-semibold tabular-nums">
                  {items.length}
                </span>
                <span className="text-sm text-muted">{items.length === 1 ? "result" : "results"}</span>
              </p>
              <div className="flex items-center gap-2">
                <div
                  role="radiogroup"
                  aria-label="Copy format"
                  className="flex rounded-lg border border-line p-0.5"
                >
                  {COPY_FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      role="radio"
                      aria-checked={format === f.value}
                      onClick={() => setFormat(f.value)}
                      className={`min-h-9 rounded-md px-2.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${
                        format === f.value ? "bg-ink text-paper" : "text-muted hover:text-ink"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => copy(formatItems(items, format), "all")}
                  className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-xs font-semibold whitespace-nowrap text-paper transition-[transform,opacity] duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98]"
                >
                  {copied === "all" ? <CheckIcon weight="bold" className="h-4 w-4" /> : <CopyIcon weight="bold" className="h-4 w-4" />}
                  {copied === "all" ? "Copied" : "Copy all"}
                </button>
              </div>
            </div>

            <ul className="mt-2">
              {items.map((item, i) => (
                <li
                  key={i}
                  style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
                  className={`row group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    copied === i ? "bg-accent/25" : "hover:bg-line/50"
                  }`}
                >
                  <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-faint">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-base break-words">{item}</span>
                  <button
                    type="button"
                    aria-label={`Copy ${item}`}
                    onClick={() => copy(item, i)}
                    className="flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-muted transition-colors hover:bg-line hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
                  >
                    {copied === i ? <CheckIcon weight="bold" className="h-4 w-4" /> : <CopyIcon weight="bold" className="h-4 w-4" />}
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
