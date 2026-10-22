import "server-only";

import { inflateRawSync } from "node:zlib";

export type ImportedParticipant = {
  rowNumber: number;
  fullName: string;
  telegram: string;
  phone: string;
};

export type ParticipantSheetParse = {
  people: ImportedParticipant[];
  errors: string[];
};

const MAX_IMPORT_ROWS = 500;

const HEADER_FIELDS = [
  ["lastName", ["фамилия", "surname", "lastname"]],
  ["firstName", ["имя", "firstname"]],
  ["patronymic", ["отчество", "patronymic", "middlename"]],
  ["telegram", ["телеграмм", "телеграм", "telegram", "tg"]],
  ["phone", ["номертелефона", "телефон", "phone", "mobile"]],
] as const;

type NameField = (typeof HEADER_FIELDS)[number][0];

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number(num)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function columnIndex(letters: string) {
  let index = 0;
  for (const char of letters.toUpperCase()) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

function findEndOfCentralDirectory(buffer: Buffer) {
  const min = Math.max(0, buffer.length - 22 - 65535);
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error("Не удалось прочитать файл Excel");
}

function unzipXlsx(buffer: Buffer) {
  const eocd = findEndOfCentralDirectory(buffer);
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  if (offset === 0xffffffff) {
    throw new Error("Этот файл Excel слишком большой");
  }

  const files = new Map<string, Buffer>();
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      break;
    }

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength).replace(/\\/g, "/");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = compressedSize === 0 || method === 0
      ? Buffer.from(compressed)
      : method === 8
        ? inflateRawSync(compressed)
        : null;
    if (!data) {
      throw new Error("Не удалось прочитать файл Excel");
    }

    files.set(name, data);
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

function xmlText(fragment: string) {
  const withoutPhonetic = fragment
    .replace(/<rPh\b[\s\S]*?<\/rPh>/g, "")
    .replace(/<phoneticPr\b[^>]*\/>/g, "");
  const parts: string[] = [];
  const pattern = /<(?:[\w-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?t>/g;
  let match = pattern.exec(withoutPhonetic);
  while (match) {
    parts.push(decodeXml(match[1]));
    match = pattern.exec(withoutPhonetic);
  }
  return parts.join("");
}

function readSharedStrings(xml: string) {
  const strings: string[] = [];
  const pattern = /<(?:[\w-]+:)?si\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?si>/g;
  let match = pattern.exec(xml);
  while (match) {
    strings.push(xmlText(match[1]));
    match = pattern.exec(xml);
  }
  return strings;
}

function resolveFirstSheetPath(files: Map<string, Buffer>) {
  const workbook = files.get("xl/workbook.xml")?.toString("utf8") ?? "";
  const rels = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";
  const sheetId = workbook.match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1];
  if (sheetId) {
    const relPattern = new RegExp(`<Relationship\\b(?=[^>]*\\bId="${sheetId}")(?=[^>]*\\bTarget="([^"]+)")[^>]*>`);
    const target = relPattern.exec(rels)?.[1];
    if (target) {
      const cleaned = decodeURIComponent(target).replace(/\\/g, "/").replace(/^\//, "");
      return cleaned.startsWith("xl/") ? cleaned : `xl/${cleaned.replace(/^\.\//, "")}`;
    }
  }

  return [...files.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)) ?? "";
}

function readSheetRows(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  const rowPattern = /<(?:[\w-]+:)?row\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?row>/g;
  let rowMatch = rowPattern.exec(xml);
  while (rowMatch) {
    const cells: string[] = [];
    const cellPattern = /<(?:[\w-]+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w-]+:)?c>)/g;
    let cellMatch = cellPattern.exec(rowMatch[1]);
    let fallbackIndex = 0;
    while (cellMatch) {
      const attrs = cellMatch[1] ?? "";
      const body = cellMatch[2] ?? "";
      const ref = attrs.match(/\br="([A-Z]+)\d+"/i)?.[1];
      const index = ref ? columnIndex(ref) : fallbackIndex;
      fallbackIndex = index + 1;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? "";
      let value = "";
      if (type === "inlineStr") {
        value = xmlText(body);
      } else {
        const raw = decodeXml(body.match(/<(?:[\w-]+:)?v\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?v>/)?.[1] ?? "").trim();
        if (type === "s") {
          value = sharedStrings[Number(raw)] ?? "";
        } else if (/e\+/i.test(raw) && Number.isFinite(Number(raw))) {
          value = String(Math.round(Number(raw)));
        } else {
          value = raw.replace(/\.0+$/, "");
        }
      }
      cells[index] = value;
      cellMatch = cellPattern.exec(rowMatch[1]);
    }
    rows.push(Array.from({ length: cells.length }, (_, index) => cells[index] ?? ""));
    rowMatch = rowPattern.exec(xml);
  }
  return rows;
}

function readXlsxRows(bytes: Uint8Array) {
  const files = unzipXlsx(Buffer.from(bytes));
  const sheetPath = resolveFirstSheetPath(files);
  const sheet = sheetPath ? files.get(sheetPath) : undefined;
  if (!sheet) {
    throw new Error("В файле Excel нет таблицы");
  }
  const sharedStrings = readSharedStrings(files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "");
  return readSheetRows(sheet.toString("utf8"), sharedStrings);
}

function parseCsv(text: string) {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstLine = source.split("\n").find((line) => line.trim()) ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]/g, "");
}

function cleanCell(value: string | undefined) {
  return (value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function headerMap(row: string[]) {
  const fields = new Map<NameField, number>();
  row.forEach((cell, index) => {
    const header = normalizeHeader(cell);
    if (!header) return;
    for (const [field, aliases] of HEADER_FIELDS) {
      if (!fields.has(field) && aliases.some((alias) => alias === header)) {
        fields.set(field, index);
      }
    }
  });
  return fields.size >= 2 ? fields : null;
}

function tidyTelegram(value: string) {
  const link = value.match(/(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{2,32})/i);
  return link ? `@${link[1]}` : value;
}

export function parseParticipantRows(rows: string[][]): ParticipantSheetParse {
  const firstContentIndex = rows.findIndex((row) => row.some((cell) => cleanCell(cell)));
  if (firstContentIndex < 0) {
    return { people: [], errors: [] };
  }

  const mappedHeaders = headerMap(rows[firstContentIndex] ?? []);
  const dataRows = mappedHeaders ? rows.slice(firstContentIndex + 1) : rows.slice(firstContentIndex);
  const people: ImportedParticipant[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = (mappedHeaders ? firstContentIndex + 1 : firstContentIndex) + index + 1;
    const read = (field: NameField, fallbackIndex: number) => {
      const column = mappedHeaders?.get(field) ?? (mappedHeaders ? -1 : fallbackIndex);
      return column >= 0 ? cleanCell(row[column]) : "";
    };
    const lastName = read("lastName", 0);
    const firstName = read("firstName", 1);
    const patronymic = read("patronymic", 2);
    const telegram = tidyTelegram(read("telegram", 3));
    const phone = read("phone", 4);
    if (!lastName && !firstName && !patronymic && !telegram && !phone) {
      return;
    }

    const fullName = [firstName, patronymic, lastName].filter(Boolean).join(" ");
    if (!fullName) {
      errors.push(`Строка ${rowNumber}: нет имени`);
      return;
    }

    people.push({ rowNumber, fullName, telegram, phone });
  });

  if (people.length > MAX_IMPORT_ROWS) {
    throw new Error(`За один раз можно импортировать до ${MAX_IMPORT_ROWS} человек`);
  }

  return { people, errors };
}

export function parseParticipantSpreadsheet(fileName: string, bytes: Uint8Array): ParticipantSheetParse {
  if (bytes.byteLength >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    throw new Error("Сохраните таблицу в формате .xlsx");
  }

  const isZip = bytes.byteLength >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (isZip) {
    return parseParticipantRows(readXlsxRows(bytes));
  }

  const extension = fileName.toLowerCase();
  if (extension.endsWith(".csv") || extension.endsWith(".txt")) {
    return parseParticipantRows(parseCsv(Buffer.from(bytes).toString("utf8")));
  }

  throw new Error("Нужен файл Excel .xlsx");
}
