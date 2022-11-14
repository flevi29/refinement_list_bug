import "dotenv/config";
import { harvest } from "./decoder.mjs";
import { MarcDataExtractor } from "./extractor.mjs";
import { Client, Errors } from "typesense";

const { REACT_APP_COLL_NAME, REACT_APP_TYPE_API_KEY, REACT_APP_TYPE_PORT } =
  process.env;

const client = new Client({
  nodes: [
    {
      host: "localhost",
      port: Number(REACT_APP_TYPE_PORT),
      protocol: "http",
    },
  ],
  apiKey: REACT_APP_TYPE_API_KEY,
});

if (!await client.collections(REACT_APP_COLL_NAME).exists()) {
  await client
    .collections()
    .create({
      name: REACT_APP_COLL_NAME,
      fields: [{
        name: "authors",
        type: "string[]",
        optional: false,
        facet: true,
      }],
    });
}

async function importManyDocuments(
  documents,
  action,
) {
  if (documents.length === 0) {
    return 0;
  }
  try {
    const results = await client.collections(REACT_APP_COLL_NAME)
      .documents()
      .import(documents, { action });
    return results.length;
  } catch (e) {
    if (e instanceof Errors.ImportError) {
      const errResults = e.importResults;
      let atLeastOneSuccessFound = false;
      for (const response of errResults) {
        if (response.success) {
          if (!atLeastOneSuccessFound) atLeastOneSuccessFound = true;
        } else {
          console.error(
            `\n${response.error}\n${JSON.stringify(response.document)}`,
          );
        }
      }
      if (atLeastOneSuccessFound) throw e;
      throw new Error(
        `${
          documents.length - errResults.length
        } documents imported successfully, ${errResults.length} failed`,
      );
    }
    throw e;
  }
}

function createManyDocuments(documents) {
  return importManyDocuments(documents, "create");
}

const extractor = new MarcDataExtractor("typesense");

const BATCH_SIZE = 200;

const mainArr = [];
for await (const arr of harvest("./data/DATA.mrc")) {
  for (const [id, rec] of arr) {
    mainArr.push(extractor.extractData(id, rec));
    if (mainArr.length > BATCH_SIZE) {
      await createManyDocuments(mainArr.splice(0, BATCH_SIZE));
    }
  }
}

if (mainArr.length > 0) {
  await createManyDocuments(mainArr);
}
