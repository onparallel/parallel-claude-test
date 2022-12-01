import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.from("feature_flag").where("name", "DEVELOPER_ACCESS").update({
    default_value: true,
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.from("feature_flag").where("name", "DEVELOPER_ACCESS").update({
    default_value: false,
  });
}
