Need:

1. Node.js LTS (only tested with 18.x)
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

Observe: When selecting an item with a high count (300+) like `Sík Sándor` and
an item with a low count (somewhere between 1-10) like `Sajó Géza` (or
`Lovászy Nándor` for Algolia with record limit), the item with the low count
will display 0. The item with the low count should be searched for.
