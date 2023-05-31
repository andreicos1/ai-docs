import { kv } from "@vercel/kv"
import { NextRequest } from "next/server"
import { formatContext, getComponentsToVectorQuery, initializeOpenAI, queryData } from "../../utils/langchain"
import { ChatGPTMessage, OpenAIStream, OpenAIStreamPayload } from "../../utils/openai-stream"

const LLM_SYSTEM_PROMPT = `You are an expert Vue UI Storefront developer.
You will provide a clear and concise answer to the given question, that includes the properties of the components and a code snippet.
You are provided documentation for relevant components from the UI Storefront library.
You must provide the answer in markdown format.
Use the components that make the most sense in a production environment. Use the components from the UI Storefront documentation.
Note that all components are named like this: 'Sidebar --> SfSidebar', 'AddToCart --> SfAddToCart'
`

const HEADERS_STREAM = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "text/event-stream;charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
}

async function getMessages(conversationId: string, query: string, context: string[]): Promise<ChatGPTMessage[]> {
  const stringDocuments = formatContext(context)
  const messageContent = `Question: ${query}\n. Documentation: ${stringDocuments}`

  const firstMessages: ChatGPTMessage[] = [
    {
      role: "system",
      content: LLM_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: messageContent,
    },
  ]
  // The LLM_SYSTEM_PROMPT message is breaking the app on subsequent messages for some reason, so we don't add it to history
  kv.lpush(conversationId, {
    role: "system",
    content: "You are an expert UI Storefront developer.",
  })

  kv.lpush(conversationId, {
    role: "user",
    content: messageContent,
  })

  return firstMessages
}

export default async function handler(req: NextRequest) {
  try {
    const { query, conversationId } = await req.json()
    const model = initializeOpenAI()

    const componentsToQuery = await getComponentsToVectorQuery(model, query)

    if (!componentsToQuery.length) {
      return new Response("I'm sorry, but I couldn't find anything relevant in my data. Please try again.")
    }

    const context = await queryData(componentsToQuery)
    const outboundMessages = await getMessages(conversationId, query, context)

    const payload: OpenAIStreamPayload = {
      model: "gpt-3.5-turbo",
      messages: outboundMessages,
      stream: true,
    }

    const stream = await OpenAIStream(conversationId, payload)
    return new Response(stream, { headers: HEADERS_STREAM })
  } catch (error) {
    console.log(error)
    return new Response("Error")
  }
}

export const config = {
  runtime: "edge",
}
