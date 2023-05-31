import { ClerkProvider } from "@clerk/nextjs"
import type { AppProps } from "next/app"
import "../styles/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  const AnyComponent = Component as any
  return (
    <ClerkProvider {...pageProps}>
      <AnyComponent {...pageProps} />
    </ClerkProvider>
  )
}
