import { OpenAI } from "langchain";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import weaviate, { ApiKey, WeaviateClient } from "weaviate-ts-client";

function buildGqlQuery(concepts: string[]) {
  return `{
    Get {
      Article(nearText: {
        concepts: ${JSON.stringify(concepts)}
      }, limit: ${concepts.length}) {
        content
      }
    }
  }`;
}

export function initializeWeaviate(): WeaviateClient {
  return weaviate.client({
    scheme: "https",
    host: process.env.WEAVIATE_CLUSTER!,
    apiKey: new ApiKey(process.env.WEAVIATE_API_KEY!),
    headers: { "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY! },
  });
}

export function initializeOpenAI() {
  return new OpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
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

export function formatContext(context: string[]) {
  context.reduce((prev, curr) => {
    return (
      prev + curr + "\n-------------------------------------------------\n"
    );
  }, "");
}

export async function queryData(concepts: string[]) {
  try {
    const query = buildGqlQuery(concepts);

    const response = await fetch(
      `https://${process.env.WEAVIATE_CLUSTER}/v1/graphql`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WEAVIATE_API_KEY ?? ""}`,
          "X-Openai-Api-Key": process.env.OPENAI_API_KEY ?? "",
        },
        body: JSON.stringify({ query }),
      }
    );
    const result = await response.json();
    return result.data.Get.Article.map(
      ({ content }: { content: string }) => content
    );
  } catch (error) {
    console.log({ error });
  }
}

export async function getVectorQueryResults(
  vectordbQueries: string[]
): Promise<string[]> {
  const context = [];
  for (const query of vectordbQueries) {
    const result = await queryData([query]);
    context.push(result);
  }
  return context;
}
