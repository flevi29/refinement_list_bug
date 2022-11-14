function flipKeysWithValues(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [value, key]),
  );
}

const entitiesToCoded = {
  "&": "&amp",
  "'": "&apos",
  ">": "&gt",
  "<": "&lt",
  '"': "&quot",
};
const codedToEntities = flipKeysWithValues(entitiesToCoded);

const searchDecodeValue = new RegExp(
  Object.keys(codedToEntities).join(""),
  "g",
);

function decodeXmlText(str) {
  return str.replace(
    searchDecodeValue,
    (codedEntity) => codedToEntities[codedEntity],
  );
}

function regExpOrTrim(value, regExpOptions) {
  value = decodeXmlText(value);
  if (regExpOptions === undefined) {
    return value.trim();
  }
  const {
    exp,
    options: { action, joinMatchesSeparator },
  } = regExpOptions;
  if (action === "keep") {
    const matches = value.match(exp);
    if (matches !== null) {
      if (joinMatchesSeparator === false) {
        return matches;
      }
      return matches.join(joinMatchesSeparator);
    }
  }
  const matches = value.split(exp);
  if (joinMatchesSeparator === false) {
    return matches;
  }
  return matches.join(joinMatchesSeparator);
}

function getControlfield(
  tag,
  record,
  option,
) {
  const controlElem = record.control[tag];
  if (controlElem !== undefined) {
    return regExpOrTrim(controlElem, option.regex);
  }
}

function getAllCodes(
  sub,
  codeValues,
  globalRegex,
) {
  for (const subArr of Object.values(sub)) {
    if (subArr !== undefined) {
      for (const subElem of subArr) {
        if (subElem !== null) {
          const result = regExpOrTrim(subElem, globalRegex);
          Array.isArray(result)
            ? codeValues.push(...result)
            : codeValues.push(result);
        }
      }
    }
  }
}

function getCodesByOption(
  codes,
  sub,
  codeValues,
  globalRegex,
) {
  for (const { code, regex } of codes) {
    const subArr = sub[code];
    if (subArr !== undefined) {
      for (const subElem of subArr) {
        if (subElem !== null) {
          const result = regExpOrTrim(subElem, regex ?? globalRegex);
          Array.isArray(result)
            ? codeValues.push(...result)
            : codeValues.push(result);
        }
      }
    }
  }
}

function* getDatafield(
  tag,
  record,
  option,
) {
  const { codes, joinCodesSeparator, globalRegex } = option;

  const dataTag = record.data?.[tag];
  if (dataTag !== undefined) {
    for (const { sub } of dataTag) {
      const codeValues = [];
      if (codes === "all") {
        getAllCodes(sub, codeValues, globalRegex);
      } else {
        getCodesByOption(codes, sub, codeValues, globalRegex);
      }
      if (codeValues.length !== 0) {
        if (joinCodesSeparator === false) {
          for (const value of codeValues) {
            yield value;
          }
        } else {
          yield codeValues.join(joinCodesSeparator);
        }
      }
    }
  }
}

function* extractTagData(
  tag,
  record,
  option,
) {
  if (tag < 10) {
    const result = getControlfield(
      tag,
      record,
      option,
    );
    if (result !== undefined) {
      if (Array.isArray(result)) {
        for (const elem of result) {
          yield elem;
        }
      } else {
        yield result;
      }
    }
  } else {
    yield* getDatafield(tag, record, option);
  }
}

function* extractOptionsData(
  option,
  record,
) {
  const { tags } = option;
  for (const tagOption of tags) {
    if ("tagRange" in tagOption) {
      const {
        tagRange: [tag1, tag2],
      } = tagOption;
      if (tag1 < 10 || tag2 < 10) {
        throw new Error("tag range cannot include controlfields");
      }
      for (let tag = tag1; tag <= tag2; tag += 1) {
        yield* extractTagData(tag, record, option);
      }
    } else {
      const { tag } = tagOption;
      yield* extractTagData(tag, record, option);
    }
  }
}

function* iterateRequestedValues(
  record,
  options,
) {
  if (Array.isArray(options)) {
    for (const option of options) {
      yield* extractOptionsData(option, record);
    }
  } else {
    yield* extractOptionsData(options, record);
  }
}

const customizableExtractionFunctions = {
  authors: (record, options, insertRecord) => {
    for (const value of iterateRequestedValues(record, options)) {
      insertRecord.authors.unshift(value);
    }
  },
};

export { customizableExtractionFunctions };
