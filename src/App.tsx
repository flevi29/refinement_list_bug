import algoliasearch from "algoliasearch/lite";
import {
  default as TypesenseInstantSearchAdapter,
} from "typesense-instantsearch-adapter";
// @ts-ignore
import { InstantSearch, RefinementList } from "react-instantsearch-hooks-web";

const {
  REACT_APP_COLL_NAME,
  REACT_APP_TYPE_API_KEY,
  REACT_APP_TYPE_PORT,
  REACT_APP_ALGOLIA_API_KEY,
  REACT_APP_ALGOLIA_APP_ID,
} = process.env;

let searchClient: any;
if (REACT_APP_ALGOLIA_API_KEY && REACT_APP_ALGOLIA_APP_ID) {
  searchClient = algoliasearch(
    REACT_APP_ALGOLIA_APP_ID,
    REACT_APP_ALGOLIA_API_KEY,
  );
} else {
  searchClient = new TypesenseInstantSearchAdapter({
    server: {
      apiKey: REACT_APP_TYPE_API_KEY!,
      nodes: [{
        host: "localhost",
        port: Number(REACT_APP_TYPE_PORT!),
        protocol: "http",
      }],
    },
    additionalSearchParameters: {
      query_by: "authors",
    },
  }).searchClient;
}

function App() {
  return (
    <InstantSearch searchClient={searchClient} indexName={REACT_APP_COLL_NAME}>
      <RefinementList attribute="authors" searchable></RefinementList>
    </InstantSearch>
  );
}

export default App;
