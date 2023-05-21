import { PineconeClient } from "@pinecone-database/pinecone";
import { kv } from "@vercel/kv";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/dist/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { NextRequest } from "next/server";
import {
  ChatGPTMessage,
  OpenAIStream,
  OpenAIStreamPayload,
} from "../../utils/openai-stream";

const PRE_VECTOR_QUERY = `You will identify the relevant components being queried by the user.
You will only output the components and make no other comments, as doing so would break the application.
{query}.
You must provide output as an array of strings. It is imperative to only return the array.`;

const LLM_SYSTEM_PROMPT = `You are an expert Vue UI Storefront developer.
You will provide a clear and concise answer to the given question, that includes the properties of the components and a code snippet.
The code provided is relevant source code. This is NOT my code. It is SOURCE CODE that you must use to answer the question.
You must provide the answer in markdown format.
Use the components that make the most sense in a production environment. Try to use the given components, not the ones making them up.
`;

const HEADERS_STREAM = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "text/event-stream;charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
};

function initializeOpenAI() {
  return new OpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

async function initializePineCone() {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: `${process.env.PINECONE_ENVIRONMENT}`, //this is in the dashboard
    apiKey: `${process.env.PINECONE_API_KEY}`,
  });
  return pinecone;
}

async function initializePineconeIndex(pinecone: PineconeClient) {
  const pineconeIndex = pinecone.Index("vue-storefront");
  await pineconeIndex.describeIndexStats({
    describeIndexStatsRequest: {},
  });
  return pineconeIndex;
}

async function getComponentsToVectorQuery(
  model: OpenAI,
  query: string
): Promise<string[]> {
  try {
    const preVectorQuery = new PromptTemplate({
      template: PRE_VECTOR_QUERY,
      inputVariables: ["query"],
    });
    const llmchain = new LLMChain({ llm: model, prompt: preVectorQuery });
    const preVectorQueryResponse = await llmchain.call({
      query: query,
    });
    return JSON.parse(preVectorQueryResponse.text);
  } catch (error) {
    console.log({ error });
    return [];
  }
}

async function getVectorQueryResults(
  vectordbQueries: any,
  vectorStore: PineconeStore
) {
  const context = [];
  for (const query of vectordbQueries) {
    const result = await vectorStore.similaritySearch(query, 1);
    context.push(result[0]);
  }
  return context;
}

async function getMessages(
  conversationId: string,
  query: string,
  context: Document<Record<string, any>>[]
): Promise<ChatGPTMessage[]> {
  const stringDocuments = context.reduce((prev, curr) => {
    return prev + curr.pageContent + "\n";
  }, "");
  const messageContent = `Question: ${query}\n. Code: ${stringDocuments}`;

  const firstMessages: ChatGPTMessage[] = [
    {
      role: "system",
      content: LLM_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: messageContent,
    },
  ];
  // The LLM_SYSTEM_PROMPT message is breaking the app on subsequent messages for some reason, so we don't add it to history
  kv.lpush(conversationId, {
    role: "system",
    content: "You are an expert UI Storefront developer.",
  });

  kv.lpush(conversationId, {
    role: "user",
    content: messageContent,
  });

  return firstMessages;
}

export default async function handler(req: NextRequest) {
  try {
    const { query, conversationId } = await req.json();
    const model = initializeOpenAI();
    const pinecone = await initializePineCone();
    const pineconeIndex = await initializePineconeIndex(pinecone);
    const componentsToQuery = await getComponentsToVectorQuery(model, query);

    console.log({ query, conversationId, pineconeIndex, componentsToQuery });

    if (!componentsToQuery.length) {
      return new Response(
        "I'm sorry, but I couldn't find any relevant components to your query. Please try again."
      );
    }

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      { pineconeIndex }
    );
    const context = await getVectorQueryResults(componentsToQuery, vectorStore);
    const outboundMessages = await getMessages(conversationId, query, context);

    const payload: OpenAIStreamPayload = {
      model: "gpt-3.5-turbo",
      messages: outboundMessages,
      stream: true,
    };

    const stream = await OpenAIStream(conversationId, payload);
    return new Response(stream, { headers: HEADERS_STREAM });
  } catch (error) {
    console.log(error);
    return new Response("Error");
  }
}

export const config = {
  runtime: "edge",
};
