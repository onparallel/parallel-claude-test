import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { Knex } from "knex";
import { User } from "../src/db/__types";

export async function seed(knex: Knex): Promise<any> {
  const owners: User[] = await knex
    .from("user")
    .whereNull("deleted_at")
    .where("organization_role", "OWNER");
  for (const owner of owners) {
    await knex.transaction(async (t) => {
      const [individual, legalEntity] = await t.from("profile_type").insert(
        [
          { name: { en: "Individual", es: "Persona física" } },
          { name: { en: "Legal entity", es: "Persona jurídica" } },
        ].map((data) => ({
          ...data,
          org_id: owner.org_id,
          created_by: `User:${owner.id}`,
          updated_by: `User:${owner.id}`,
        })),
        "*"
      );

      const [firstName, lastName] = await t.from("profile_type_field").insert(
        [
          {
            type: "SHORT_TEXT" as const,
            name: { en: "First Name", es: "Nombre" },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Last Name", es: "Apellido" },
          },
          {
            type: "DATE" as const,
            name: { en: "Date of Birth", es: "Fecha de nacimiento" },
          },
          {
            type: "TEXT" as const,
            name: { en: "Address", es: "Dirección" },
          },
        ].map((data, index) => ({
          ...data,
          profile_type_id: individual.id,
          position: index,
          created_by: `User:${owner.id}`,
          updated_by: `User:${owner.id}`,
        })),
        "*"
      );

      await t
        .from("profile_type")
        .where("id", individual.id)
        .update({
          profile_name_pattern: knex.raw("?::jsonb", [
            JSON.stringify([firstName.id, " ", lastName.id]),
          ]),
        });

      const [name] = await t.from("profile_type_field").insert(
        [
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Name", es: "Nombre" },
          },
          {
            type: "DATE" as const,
            name: { en: "Foundation Date", es: "Fecha de constitución" },
          },
          {
            type: "TEXT" as const,
            name: { en: "Address", es: "Dirección" },
          },
        ].map((data, index) => ({
          ...data,
          profile_type_id: legalEntity.id,
          position: index,
          created_by: `User:${owner.id}`,
          updated_by: `User:${owner.id}`,
        })),
        "*"
      );
      await t
        .from("profile_type")
        .where("id", legalEntity.id)
        .update({
          profile_name_pattern: knex.raw("?::jsonb", [JSON.stringify([name.id])]),
        });
    });
  }
}
