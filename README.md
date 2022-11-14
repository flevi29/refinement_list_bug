Need:

1. Node.js
2. Docker or Algolia

Run:

```shell
# Typesense
docker compose up -d
npm run harvest:typesense
npm start
# Algolia
# Be sure to populate .env `REACT_APP_ALGOLIA_API_KEY` and `REACT_APP_ALGOLIA_APP_ID`
npm run harvest:algolia
npm start
```

Observe: When selecting an item with a high count (1000+) and an item with a low
count (1-10), the item with the low count will display 0. The item with the low
count should be searched for.
