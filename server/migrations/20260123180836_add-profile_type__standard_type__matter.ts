import type { Knex } from "knex";
import {
  addProfileTypeStandardType,
  removeProfileTypeStandardType,
} from "./helpers/profileTypeStandardTypes";

export async function up(knex: Knex): Promise<void> {
  await addProfileTypeStandardType(knex, "MATTER");
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileTypeStandardType(knex, "MATTER");
}
