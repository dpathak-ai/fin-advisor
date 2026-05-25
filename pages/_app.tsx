import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider afterSignInUrl="/app" afterSignUpUrl="/app" {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
