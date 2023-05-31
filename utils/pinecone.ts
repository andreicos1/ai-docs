import { PineconeClient } from "@pinecone-database/pinecone";
import { Document } from "langchain/dist/document";
import { PineconeStore } from "langchain/vectorstores/pinecone";

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

export function getStringFromDocuments(
  documents: Document<Record<string, any>>[]
) {
  return documents.reduce((prev, curr) => {
    return prev + curr.pageContent + "\n";
  }, "");
}

export async function getPinconeVectorQueryResults(
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
