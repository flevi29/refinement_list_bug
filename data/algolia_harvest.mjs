import "dotenv/config";
import data from "./data.json" assert { type: "json" };
import algoliasearch from "algoliasearch";

const {
  REACT_APP_ALGOLIA_API_KEY,
  REACT_APP_ALGOLIA_APP_ID,
  REACT_APP_COLL_NAME,
} = process.env;

const client = algoliasearch(
  REACT_APP_ALGOLIA_APP_ID,
  REACT_APP_ALGOLIA_API_KEY,
);

const index = client.initIndex(REACT_APP_COLL_NAME);

if (!await index.exists()) {
  await index.setSettings({
    searchableAttributes: ["authors"],
    attributesForFaceting: ["searchable(authors)"],
  });
}

const BATCH_SIZE = 200;

while (data.length > BATCH_SIZE) {
  await index.saveObjects(data.splice(0, BATCH_SIZE), { autoGenerateObjectIDIfNotExist: true });
}
if (data.length > 0) {
  await index.saveObjects(data, { autoGenerateObjectIDIfNotExist: true });
}
