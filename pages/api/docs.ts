import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import pdf from "pdf-parse";
import { WeaviateClient } from "weaviate-ts-client";
import { initializeWeaviate } from "../../utils/langchain";

async function showSchemas(client: WeaviateClient) {
  client.schema
    .getter()
    .do()
    .then((res: any) => {
      console.log(res);
    })
    .catch((err: Error) => {
      console.error(err);
    });
}

async function deleteClass(client: WeaviateClient) {
  await client.schema.classDeleter().withClassName("Article").do();
}

async function createClass(client: WeaviateClient) {
  let classObj = {
    class: "Article",
    properties: [
      {
        dataType: ["text"],
        description: "Content that will be vectorized",
        name: "content",
      },
      {
        dataType: ["text"],
        description: "The name of the file",
        name: "filename",
      },
    ],
    vectorizer: "text2vec-openai", // This could be any vectorizer
  };

  // add the schema
  await client.schema
    .classCreator()
    .withClass(classObj)
    .do()
    .then((res: any) => {
      console.log(res);
    })
    .catch((err: Error) => {
      console.error(err);
    });
  await showSchemas(client);
}

async function addObjects(client: WeaviateClient, path: string) {
  const files = fs.readdirSync(path);

  let batcher = client.batch.objectsBatcher();
  for (const file of files) {
    console.log("reading file", file);
    const text = await getTextFromPdf(`${path}\\${file}`);
    const obj = {
      class: "Article",
      properties: {
        content: text,
        filename: file,
      },
    };
    // add the object to the batch queue
    batcher = batcher.withObject(obj);
    await batcher.do();
    batcher = client.batch.objectsBatcher(); // restart the batch queue
  }
}

async function setUpNewDocument(client: WeaviateClient, path: string) {
  await createClass(client);
  await addObjects(client, path);
}

async function getTextFromPdf(filepath: string) {
  const dataBuffer = fs.readFileSync(filepath);
  const data = await pdf(dataBuffer);
  return data.text;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { path } = req.body;
    const client = initializeWeaviate();
    await setUpNewDocument(client, path);
    res.status(200).send("done");
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Something went wrong");
  }
}
