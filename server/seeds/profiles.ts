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
      const [individual, legalEntity, contract] = await t.from("profile_type").insert(
        [
          { name: { en: "Individual", es: "Persona física" } },
          { name: { en: "Legal entity", es: "Persona jurídica" } },
          { name: { en: "Contract", es: "Contrato" } },
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
            name: { en: "First name", es: "Nombre" },
            alias: "FIRST_NAME",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Last name", es: "Apellido" },
            alias: "LAST_NAME",
          },
          {
            type: "FILE" as const,
            name: { en: "ID", es: "Documento de identificación" },
            is_expirable: true,
            expiry_alert_ahead_time: knex.raw(`make_interval(months => ?)`, [1]),
            alias: "ID",
          },
          {
            type: "DATE" as const,
            name: { en: "Date of birth", es: "Fecha de nacimiento" },
            alias: "DATE_OF_BIRTH",
            options: knex.raw("?::jsonb", JSON.stringify({ useReplyAsExpiryDate: false })),
          },
          {
            type: "PHONE" as const,
            name: { en: "Phone number", es: "Número de teléfono" },
            alias: "PHONE_NUMBER",
          },
          {
            type: "TEXT" as const,
            name: { en: "Address", es: "Dirección" },
            alias: "ADDRESS",
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
            name: { en: "Corporate name", es: "Denominación social" },
            alias: "NAME",
          },
          {
            type: "DATE" as const,
            name: { en: "Date of incorporation", es: "Fecha de constitución" },
            alias: "DATE_OF_INCORPORATION",
            options: knex.raw("?::jsonb", JSON.stringify({ useReplyAsExpiryDate: false })),
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Tax ID", es: "Número de identificación fiscal" },
            alias: "TAX_ID",
          },
          {
            type: "TEXT" as const,
            name: { en: "Address", es: "Domicilio" },
            alias: "ADDRESS",
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

      const [type, counterparty] = await t.from("profile_type_field").insert(
        [
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Type of contract", es: "Tipo de contrato" },
            alias: "TYPE",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Counterparty", es: "Contraparte" },
            alias: "COUNTERPARTY",
          },
          {
            type: "TEXT" as const,
            name: { en: "Short description", es: "Descripción breve" },
            alias: "DESCRIPTION",
          },
          {
            type: "DATE" as const,
            name: { en: "Start date", es: "Fecha de inicio" },
            alias: "START_DATE",
            options: knex.raw("?::jsonb", JSON.stringify({ useReplyAsExpiryDate: false })),
          },
          {
            type: "DATE" as const,
            name: { en: "Expiry date", es: "Fecha de vencimiento" },
            is_expirable: true,
            expiry_alert_ahead_time: knex.raw(`make_interval(months => ?)`, [1]),
            options: knex.raw("?::jsonb", JSON.stringify({ useReplyAsExpiryDate: true })),
            alias: "EXPIRY_DATE",
          },
          {
            type: "NUMBER" as const,
            name: { en: "Amount", es: "Importe" },
            alias: "AMOUNT",
          },
          {
            type: "FILE" as const,
            name: { en: "Document", es: "Documento" },
            alias: "DOCUMENT",
          },
        ].map((data, index) => ({
          ...data,
          profile_type_id: contract.id,
          position: index,
          created_by: `User:${owner.id}`,
          updated_by: `User:${owner.id}`,
        })),
        "*"
      );
      await t
        .from("profile_type")
        .where("id", contract.id)
        .update({
          profile_name_pattern: knex.raw("?::jsonb", [
            JSON.stringify([type.id, " - ", counterparty.id]),
          ]),
        });
    });
  }
}
