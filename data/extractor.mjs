import { defaultExtractionOptions } from "./schema.mjs";
import { customizableExtractionFunctions } from "./extractors.mjs";

export class MarcDataExtractor {
  #type;

  constructor(type) {
    this.#type = type;
  }

  extractData(
    id,
    record,
  ) {
    const upsertRec = this.#type === "typesense"
      ? {
        id,
        authors: [],
      }
      : {
        objectID: id,
        authors: [],
      };

    for (const [fnKey, params] of Object.entries(defaultExtractionOptions)) {
      customizableExtractionFunctions[fnKey](
        record,
        params,
        upsertRec,
      );
    }

    return upsertRec;
  }
}
