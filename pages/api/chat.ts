import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";
import { PRE_VECTOR_QUERY } from "../../constants";
import {
  formatContext,
  getComponentsToVectorQuery,
  getVectorQueryResults,
  initializeOpenAI,
} from "../../utils/langchain";
import {
  ChatGPTMessage,
  OpenAIStream,
  OpenAIStreamPayload,
} from "../../utils/openai-stream";

async function getMessages(
  conversationId: string,
  query: string,
  context: null | string[]
) {
  let messageContent = query;
  if (context) {
    messageContent = `Question: ${query}\n. Documentation: ${formatContext(
      context
    )}`;
  }
  let previousMessages = await kv.lrange<ChatGPTMessage>(conversationId, 0, -1);
  const newMessage: ChatGPTMessage = {
    role: "user",
    content: messageContent,
  };
  await kv.lpush(conversationId, newMessage);
  return [...previousMessages, newMessage];
}

async function getContext(query: string): Promise<null | string[]> {
  const model = initializeOpenAI();

  const componentsToQuery = await getComponentsToVectorQuery(
    model,
    query,
    PRE_VECTOR_QUERY
  );

  if (!componentsToQuery.length) {
    return null;
  }

  return await getVectorQueryResults(componentsToQuery);
}

export default async function handler(req: NextRequest) {
  console.log("received call");
  try {
    const { query, conversationId } = await req.json();

    const context = await getContext(query);
    const messages = await getMessages(conversationId, query, context);

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

export const config = {
  runtime: "edge",
};
