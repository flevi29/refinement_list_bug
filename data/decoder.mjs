import { createReadStream } from "node:fs";

class MarcDecoder {
  #textDecoder;
  #groupSeparator = String.fromCharCode(29);
  #recordSeparator = String.fromCharCode(30);
  #unitSeparator = String.fromCharCode(31);
  #bufferedChunk = "";

  constructor(encoding) {
    this.#textDecoder = new TextDecoder(encoding, {
      fatal: true,
      ignoreBOM: true,
    });
  }

  #extractRecord(record) {
    const lines = record.split(this.#recordSeparator);
    const tagInfo = lines[0].substring(24).match(/.{12}/g);
    if (!tagInfo || tagInfo.length !== lines.length - 2) {
      throw new Error(
        "Record is corrupt, field count and tag count do not match up\n\n" +
          record,
      );
    }
    const control = {};
    const mappedRecord = {
      leader: lines[0].substring(0, 24),
      control,
    };

    const data = {};
    let id = null;
    for (const [index, line] of lines.slice(1, lines.length - 1).entries()) {
      const tag = Number(tagInfo[index].substring(0, 3));
      if (tag < 10) {
        control[tag] = line;
        if (id === null && tag === 1) {
          id = encodeURI(line);
        }
      } else {
        const dataTag = data[tag];
        const sub = {};
        for (const subfield of line.split(this.#unitSeparator).splice(1)) {
          const [code, text] = [subfield[0], subfield.substring(1)];
          const subCode = sub[code];
          const insertValue = text === "" ? null : text;
          if (subCode === undefined) {
            sub[code] = [insertValue];
          } else {
            subCode.push(insertValue);
          }
        }
        const indexes = line.substring(0, 2);
        const element = {
          ind1: indexes[0],
          ind2: indexes[1],
          sub,
        };
        if (dataTag === undefined) data[tag] = [element];
        else dataTag.push(element);
      }
    }
    if (id === null) throw new Error(`record has no id\n${record}`);
    if (Object.keys(data).length !== 0) mappedRecord.data = data;
    return [id, mappedRecord];
  }

  getRecordsFromMarc(chunk) {
    const records = [];
    let convertedChunk = this.#textDecoder.decode(chunk, { stream: true });
    let ind = convertedChunk.indexOf(this.#groupSeparator);
    if (ind === -1) this.#bufferedChunk += convertedChunk;
    else {
      let bufferedChunk = this.#bufferedChunk;
      do {
        bufferedChunk += convertedChunk.substring(0, ind);
        records.push(this.#extractRecord(bufferedChunk));
        bufferedChunk = "";
        convertedChunk = convertedChunk.substring(ind + 1);
      } while ((ind = convertedChunk.indexOf(this.#groupSeparator)) !== -1);
      this.#bufferedChunk = convertedChunk;
    }
    return records;
  }
}

export async function* harvest(path) {
  const marcConverter = new MarcDecoder("windows-1250");
  const readStream = createReadStream(path);
  for await (const chunk of readStream) {
    yield marcConverter.getRecordsFromMarc(chunk);
  }
}
