import { useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import SearchBar from "@/components/SearchBar";
import ExplanationCard from "@/components/ExplanationCard";
import { ExplanationResult, AppState } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Usage {
  remaining: number;
  limit: number;
  plan: string;
}

export default function AppPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [error, setError] = useState<string>("");
  const [usage, setUsage] = useState<Usage | null>(null);

  // Holds the controller for the current in-flight request so we can cancel it
  const controllerRef = useRef<AbortController | null>(null);

  async function handleSearch(term: string) {
    // Cancel any previous in-flight request before starting a new one
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    setState("loading");
    setError("");

    const token = await getToken();
    let accumulated = "";
    let usageInfo: Usage | null = null;

    try {
      await fetchEventSource(`/api/explain`, {
        signal: controllerRef.current.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ term }),

        // Called once when the HTTP response headers arrive
        async onopen(response) {
          if (response.status === 429) {
            setState("limit_exceeded");
            throw new Error("limit_exceeded");
          }
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail ?? "Something went wrong");
          }
          // Grab usage counters from response headers
          usageInfo = {
            remaining: parseInt(response.headers.get("X-Searches-Remaining") ?? "0"),
            limit:     parseInt(response.headers.get("X-Searches-Limit")     ?? "5"),
            plan:      response.headers.get("X-Plan") ?? "free",
          };
        },

        // Called for every `data: …` line the server sends
        onmessage(event) {
          if (event.data) accumulated += event.data;
        },

        // Throw so fetchEventSource does NOT retry on errors
        onerror(err) {
          throw err;
        },
      });

      // Execution reaches here only when the stream closes normally
      const parsed = JSON.parse(accumulated);
      setResult({ term, explanation: parsed.explanation, example: parsed.example });
      if (usageInfo) setUsage(usageInfo);
      setState("success");

    } catch (err: unknown) {
      // AbortError means the user started a new search — silently ignore
      if (err instanceof DOMException && err.name === "AbortError") return;

      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg !== "limit_exceeded") {
        setError(msg);
        setState("error");
      }
    }
  }

  const isFreePlan = !usage || usage.plan === "free";

  return (
    <>
      <Head>
        <title>Finance Advisor</title>
        <meta name="description" content="Understand any financial term in plain English" />
      </Head>

      <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-20">
        {/* User avatar — top right */}
        <div className="fixed top-4 right-4">
          <UserButton afterSignOutUrl="/" />
        </div>

        <div className="w-full max-w-xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Advisor</h1>
            <p className="text-sm text-gray-500">
              Enter any financial term and get a plain-English explanation with a real-world example.
            </p>
          </div>

          <SearchBar onSearch={handleSearch} isLoading={state === "loading"} />

          {/* Usage counter — shown after first successful search */}
          {usage && state !== "limit_exceeded" && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>
                <span className={usage.remaining <= 1 ? "text-orange-500 font-medium" : ""}>
                  {usage.remaining} of {usage.limit}
                </span>{" "}
                searches remaining this month
              </span>
              {isFreePlan && (
                <Link href="/#pricing" className="text-blue-500 hover:text-blue-600 transition">
                  Upgrade to Pro →
                </Link>
              )}
            </div>
          )}

          <div className="mt-6">
            {state === "loading" && (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            )}

            {state === "limit_exceeded" && (
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-6 text-center">
                <p className="text-sm font-semibold text-orange-700 mb-1">Monthly limit reached</p>
                <p className="text-sm text-orange-600 mb-4">
                  You've used all your free searches for this month.
                  Upgrade to Pro for 100 searches / month.
                </p>
                <Link
                  href="/#pricing"
                  className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Upgrade to Pro →
                </Link>
              </div>
            )}

            {state === "error" && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            {state === "success" && result && <ExplanationCard result={result} />}
          </div>
        </div>
      </main>
    </>
  );
}
