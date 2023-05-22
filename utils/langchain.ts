import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAI } from "langchain";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/dist/document";
import { PromptTemplate } from "langchain/prompts";
import { PineconeStore } from "langchain/vectorstores/pinecone";

export function initializeOpenAI() {
  return new OpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

export async function initializePineCone() {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: `${process.env.PINECONE_ENVIRONMENT}`, //this is in the dashboard
    apiKey: `${process.env.PINECONE_API_KEY}`,
  });
  return pinecone;
}

export async function initializePineconeIndex(pinecone: PineconeClient) {
  const pineconeIndex = pinecone.Index("vue-storefront");
  await pineconeIndex.describeIndexStats({
    describeIndexStatsRequest: {},
  });
  return pineconeIndex;
}

export async function getComponentsToVectorQuery(
  model: OpenAI,
  query: string,
  template: string
): Promise<string[]> {
  try {
    const preVectorQuery = new PromptTemplate({
      template,
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

export async function getVectorQueryResults(
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

export function getStringFromDocuments(
  documents: Document<Record<string, any>>[]
) {
  return documents.reduce((prev, curr) => {
    return prev + curr.pageContent + "\n";
  }, "");
}
