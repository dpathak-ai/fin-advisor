import Head from "next/head";
import Link from "next/link";
import { SignInButton, SignedOut, SignedIn, UserButton } from "@clerk/nextjs";

const FREE_FEATURES = [
  "5 searches / month",
  "Plain-English explanations",
  "Real-world examples",
];

const PRO_FEATURES = [
  "100 searches / month",
  "Plain-English explanations",
  "Real-world examples",
  "Priority support",
];

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Finance Advisor — Financial terms, explained simply</title>
        <meta
          name="description"
          content="Type any financial term and instantly get a plain-English explanation with a real-world example."
        />
      </Head>

      {/* ── Navbar ── */}
      <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <span className="text-sm font-semibold text-gray-900">Finance Advisor</span>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/app">
              <button className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/app" className="text-sm font-medium text-blue-600 transition hover:text-blue-700">
              Go to app →
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* ── Page body — single scroll, no full-screen section ── */}
      <main className="min-h-screen bg-gray-50 px-4 pt-24 pb-16">
        <div className="mx-auto max-w-2xl">

          {/* ── Hero ── */}
          <div className="py-12 text-center">
            <span className="inline-block rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              Your personal finance dictionary
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              Finance, explained <br />
              <span className="text-blue-600">in plain English.</span>
            </h1>
            <p className="mt-4 text-base text-gray-500 leading-relaxed">
              Type any financial term — compound interest, P/E ratio, hedge fund —
              and instantly get a clear explanation with a real-world example.
            </p>
            <div className="mt-6">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/app">
                  <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
                    Get started — it's free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/app"
                  className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  Go to app →
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* ── Pricing ── */}
          <div id="pricing" className="mt-4">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900">Simple pricing</h2>
              <p className="mt-1 text-sm text-gray-500">Start free. Upgrade when you need more.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Free card */}
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Free</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">$0</span>
                  <span className="text-sm text-gray-400">/ month</span>
                </div>

                <ul className="mt-5 space-y-2">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl="/app">
                      <button className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                        Get started
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link
                      href="/app"
                      className="block w-full rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Go to app
                    </Link>
                  </SignedIn>
                </div>
              </div>

              {/* Pro card */}
              <div className="relative rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
                {/* Popular badge */}
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>

                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Pro</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">$9</span>
                  <span className="text-sm text-gray-400">/ month</span>
                </div>

                <ul className="mt-5 space-y-2">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl="/app">
                      <button className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                        Get Pro
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    {/* Links to the Clerk UserProfile billing tab */}
                    <Link
                      href="/user-profile"
                      className="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Upgrade to Pro
                    </Link>
                  </SignedIn>
                </div>

                {/* Highlight strip at the bottom — echoes the ExplanationCard example style */}
                <div className="mt-5 rounded-lg bg-blue-50 px-3 py-2">
                  <p className="text-xs text-blue-600 text-center">20× more searches than free</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}
