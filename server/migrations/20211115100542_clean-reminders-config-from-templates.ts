import { Knex } from "knex";
import { Petition } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex<Petition>("petition").where("is_template", true).andWhere("deleted_at", null).update({
    reminders_config: null,
    reminders_active: false,
  });
}

export async function down(knex: Knex): Promise<void> {}
