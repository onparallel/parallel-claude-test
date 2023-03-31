import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { Knex } from "knex";
import { deleteAllData } from "../src/util/knexUtils";

export async function seed(knex: Knex): Promise<any> {
  await deleteAllData(knex);
}
