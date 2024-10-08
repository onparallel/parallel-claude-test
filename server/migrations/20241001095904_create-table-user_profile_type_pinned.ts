import type { Knex } from "knex";
import { unique } from "remeda";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_profile_type_pinned", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.integer("profile_type_id").notNullable().references("profile_type.id");
  });

  await knex.raw(/* sql */ `
    create unique index user_profile_type_pinned__user_id__profile_type_id on user_profile_type_pinned(user_id, profile_type_id);
  `);

  // every user has by default the INDIVIDUAL and LEGAL_ENTITY profile types pinned
  const profileTypes = await knex
    .from("profile_type")
    .whereIn("standard_type", ["INDIVIDUAL", "LEGAL_ENTITY"])
    .whereNull("deleted_at")
    .whereNull("archived_at")
    .whereNotNull("standard_type")
    .select(["id", "org_id"]);

  const orgIds = unique(profileTypes.map((pt) => pt.org_id));

  const users = await knex
    .from("user")
    .whereIn("org_id", orgIds)
    .where("status", "ACTIVE")
    .whereNull("deleted_at")
    .select(["id", "org_id"]);

  if (users.length > 0 && profileTypes.length > 0) {
    await knex.from("user_profile_type_pinned").insert(
      users.flatMap((user) =>
        profileTypes
          .filter((pt) => pt.org_id === user.org_id)
          .map((profileType) => ({
            user_id: user.id,
            profile_type_id: profileType.id,
          })),
      ),
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_profile_type_pinned");
}
