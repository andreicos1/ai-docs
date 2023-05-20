import { kv } from "@vercel/kv";
import {
  ChatGPTMessage,
  OpenAIStream,
  OpenAIStreamPayload,
} from "../../utils/openai-stream";

async function getMessages(conversationId: string, query: string) {
  let previousMessages = await kv.lrange<ChatGPTMessage>(conversationId, 0, -1);
  const newMessage: ChatGPTMessage = {
    role: "user",
    content: query,
  };
  await kv.lpush(conversationId, newMessage);
  return [...previousMessages, newMessage];
}

export async function POST(req: Request) {
  console.log("received call");
  try {
    const { query, conversationId } = await req.json();

    const messages = await getMessages(conversationId, query);

    console.log("got messages");
    const payload: OpenAIStreamPayload = {
      model: "gpt-3.5-turbo",
      messages,
      stream: true,
    };
    const stream = await OpenAIStream(conversationId, payload);
    return new Response(stream);
  } catch (error) {
    console.log(error);
    return new Response("Something went wrong.");
  }
}
