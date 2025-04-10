import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { readFile } from "fs/promises";
import { Knex } from "knex";
import { join } from "path";
import { Readable } from "stream";
import { importFromExcel } from "../src/util/importFromExcel";
import { loadEnv } from "../src/util/loadEnv";
import { parseStandardListDefinitionsData } from "../src/util/parseStandardListDefinitionsData";

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
