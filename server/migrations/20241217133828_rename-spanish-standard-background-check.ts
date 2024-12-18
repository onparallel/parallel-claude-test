import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("profile_type_field")
    .whereJsonSubsetOf("name", { en: "Background check", es: "Verificación de antecedentes" })
    .andWhere("type", "=", "BACKGROUND_CHECK")
    .andWhere("alias", "=", "p_background_check")
    .update({
      name: JSON.stringify({
        en: "Background check",
        es: "Búsqueda en listados",
      }),
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex("profile_type_field")
    .whereJsonSubsetOf("name", { en: "Background check", es: "Búsqueda en listados" })
    .andWhere("type", "=", "BACKGROUND_CHECK")
    .andWhere("alias", "=", "p_background_check")
    .update({
      name: JSON.stringify({
        en: "Background check",
        es: "Verificación de antecedentes",
      }),
    });
}
