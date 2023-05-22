import { kv } from "@vercel/kv";
import { Document } from "langchain/dist/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { NextRequest } from "next/server";
import { PRE_VECTOR_QUERY } from "../../constants";
import {
  getComponentsToVectorQuery,
  getStringFromDocuments,
  getVectorQueryResults,
  initializeOpenAI,
  initializePineCone,
  initializePineconeIndex,
} from "../../utils/langchain";
import {
  ChatGPTMessage,
  OpenAIStream,
  OpenAIStreamPayload,
} from "../../utils/openai-stream";

async function getMessages(
  conversationId: string,
  query: string,
  context?: Document<Record<string, any>>[]
) {
  let messageContent = query;
  if (context) {
    const stringDocuments = getStringFromDocuments(context);
    messageContent = `Question: ${query}\n. Code: ${stringDocuments}`;
  }
  let previousMessages = await kv.lrange<ChatGPTMessage>(conversationId, 0, -1);
  const newMessage: ChatGPTMessage = {
    role: "user",
    content: messageContent,
  };
  await kv.lpush(conversationId, newMessage);
  return [...previousMessages, newMessage];
}

async function getContext(query: string) {
  const model = initializeOpenAI();
  const pinecone = await initializePineCone();
  const pineconeIndex = await initializePineconeIndex(pinecone);
  const componentsToQuery = await getComponentsToVectorQuery(
    model,
    query,
    PRE_VECTOR_QUERY
  );

  if (!componentsToQuery.length) {
    return;
  }

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    { pineconeIndex }
  );
  return await getVectorQueryResults(componentsToQuery, vectorStore);
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
