import "dotenv/config";
import algoliasearch from "algoliasearch";
import { MarcDataExtractor } from "./extractor.mjs";
import { harvest } from "./decoder.mjs";

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

const extractor = new MarcDataExtractor("algolia");

const BATCH_SIZE = 200;

const mainArr = [];
for await (const arr of harvest("./data/DATA.mrc")) {
  for (const [id, rec] of arr) {
    mainArr.push(extractor.extractData(id, rec));
    if (mainArr.length > BATCH_SIZE) {
      await index.saveObjects(mainArr.splice(0, BATCH_SIZE));
    }
  }
}

if (mainArr.length > 0) {
  await index.saveObjects(mainArr);
}
