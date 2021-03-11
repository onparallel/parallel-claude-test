import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex) {
  return knex.schema
    .createSchemaIfNotExists("public")

    .createTable("organization", (t) => {
      t.increments("id");
      t.string("name").notNullable();
      t.string("identifier").notNullable();
      t.enum("status", ["DEV", "DEMO", "ACTIVE", "CHURNED"], {
        useNative: true,
        enumName: "organization_status",
      }).notNullable();
      timestamps(t);

      t.unique(["identifier"]);
    })

    .createTable("user", (t) => {
      t.increments("id");
      t.string("cognito_id").notNullable();
      t.integer("org_id").notNullable();
      t.enum("organization_role", ["NORMAL", "ADMIN"], {
        useNative: true,
        enumName: "user_organization_role",
      })
        .notNullable()
        .defaultTo("NORMAL");
      t.string("email").notNullable();
      t.string("first_name");
      t.string("last_name");
      timestamps(t);

      t.unique(["email"]);
      t.foreign("org_id").references("organization.id");
    });
}

export async function down(knex: Knex) {
  return knex.schema
    .dropTable("user")
    .raw("DROP TYPE user_organization_role")
    .dropTable("organization")
    .raw("DROP TYPE organization_status");
}
