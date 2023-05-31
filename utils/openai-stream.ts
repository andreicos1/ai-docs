// https://github.com/joschan21/bookbuddy

import { kv } from "@vercel/kv"
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser"

export type ChatGPTAgent = "user" | "system"

export interface ChatGPTMessage {
  role: ChatGPTAgent
  content: string
}

export interface OpenAIStreamPayload {
  model: string
  messages: ChatGPTMessage[]
  stream: boolean
}

function handleCompleteMessage(conversationId: string, message: string) {
  const newMessage: ChatGPTMessage = {
    role: "system",
    content: message,
  }
  kv.lpush(conversationId, newMessage)
}

export async function OpenAIStream(conversationId: string, payload: OpenAIStreamPayload) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let counter = 0
  let entireMessage = ""

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  })

  console.log("got result")

  const stream = new ReadableStream({
    async start(controller) {
      // callback
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data
          // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
          if (data === "[DONE]") {
            controller.close()
            handleCompleteMessage(conversationId, entireMessage)
            return
          }
          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta?.content || ""
            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return
            }
            entireMessage += text // add text to the entire message
            const queue = encoder.encode(text)
            controller.enqueue(queue)
            counter++
          } catch (e) {
            console.log({ e })
            // maybe parse error
            controller.error(e)
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse)
      console.log("starting stream")
      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })

  return stream
}
