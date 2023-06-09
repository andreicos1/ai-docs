import Head from "next/head"
import { ReactNode } from "react"

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Head>
        <title>QA Docs AI</title>
        <meta name="description" content="Chat with your docs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-primary text-primary">{children}</div>
    </>
  )
}

export default Layout
