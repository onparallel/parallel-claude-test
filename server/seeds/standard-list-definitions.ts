import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import Excel, { CellRichTextValue } from "exceljs";
import { readFile } from "fs/promises";
import { Knex } from "knex";
import { join } from "path";
import { Readable, Stream } from "stream";
import { loadEnv } from "../src/util/loadEnv";
import { parseStandardListDefinitionsData } from "./utils/helpers";

export async function seed(knex: Knex): Promise<any> {
  await loadEnv();

  const file = await readFile(join(__dirname, "./data/standard-list-definitions.xlsx"));
  const data = await importFromExcel(Readable.from(file));
  const lists = parseStandardListDefinitionsData(data);

  await knex.from("standard_list_definition").truncate();
  await knex.from("standard_list_definition").insert(
    lists.map((d) => ({
      ...d,
      version_format: JSON.stringify(d.version_format),
      values: JSON.stringify(d.values),
      created_by: "User:1",
    })),
  );
}

async function importFromExcel(file: Stream) {
  const wb = new Excel.Workbook();
  const workbook = await wb.xlsx.read(file);
  const rows: string[][] = [];
  workbook.worksheets[0].eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (typeof cell.text !== "string") {
        if ("richText" in cell.text) {
          cells.push((cell.text as CellRichTextValue).richText.map((p) => p.text).join(""));
        } else {
          cells.push("");
        }
      } else {
        cells.push(cell.text);
      }
    });
    rows.push(cells);
  });
  return rows;
}
