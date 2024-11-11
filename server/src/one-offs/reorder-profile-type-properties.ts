import "./../init";
// keep this space to prevent import sorting removing init from top
import { Knex } from "knex";
import { isNonNullish } from "remeda";
import yargs from "yargs";
import { createContainer } from "../container";
import { KNEX } from "../db/knex";
import { loadEnv } from "../util/loadEnv";
import { waitFor } from "../util/promises/waitFor";

async function main() {
  const {
    orgId,
    standardType,
    field: targetFieldAlias,
    after: afterFieldAlias,
    before: beforeFieldAlias,
    apply,
  } = await yargs
    .usage(
      "Usage: $0 --orgId [orgId] --standardType [standardType] --field [field] --after [after] --before [before]",
    )
    .option("orgId", {
      required: false,
      type: "number",
      description: "Run script only for this organization.",
    })
    .option("standardType", {
      required: true,
      type: "string",
      choices: ["INDIVIDUAL", "LEGAL_ENTITY", "CONTRACT"],
      description: "Standard type of the profile type.",
    })
    .option("field", {
      required: true,
      type: "string",
      description: "Alias of the field you want to reposition",
    })
    .option("after", {
      required: false,
      type: "string",
      description: "Alias of the field you want to place the field after",
    })
    .option("before", {
      required: false,
      type: "string",
      description: "Alias of the field you want to place the field before",
    })
    .option("apply", {
      required: false,
      type: "boolean",
      description: "Pass this flag to apply the changes into the database",
    }).argv;

  if ((!beforeFieldAlias && !afterFieldAlias) || (beforeFieldAlias && afterFieldAlias)) {
    console.error("You must provide either --before or --after");
    process.exit(1);
  }

  await loadEnv();
  const container = createContainer();
  const knex = container.get<Knex>(KNEX);

  const orgOwners = await knex
    .from("user")
    .whereNull("deleted_at")
    .where("is_org_owner", true)
    .mmodify((q) => {
      if (isNonNullish(orgId)) {
        q.where("org_id", orgId);
      }
    })
    .select("*")
    .orderBy("org_id");

  console.log(`About to run on ${orgOwners.length} organization(s)`);
  if (apply) {
    console.log("** Will apply changes to database **");
  } else {
    console.log("** Dry run, no changes will be applied **");
  }

  await waitFor(5_000);

  let i = 0;
  for (const { id: ownerId, org_id: orgId } of orgOwners) {
    console.log(`Processing Org:${orgId} (${++i}/${orgOwners.length})`);

    const profileTypes = await knex
      .from("profile_type")
      .where("org_id", orgId)
      .whereNull("deleted_at")
      .where("standard_type", standardType)
      .select("*");

    for (const profileType of profileTypes) {
      console.log(`- Processing ProfileType:${profileType.id}`);
      const fields = await knex
        .from("profile_type_field")
        .where("profile_type_id", profileType.id)
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .select("*");

      const targetField = fields.find((f) => f.alias === targetFieldAlias);
      const afterField = afterFieldAlias ? fields.find((f) => f.alias === afterFieldAlias) : null;
      const beforeField = beforeFieldAlias
        ? fields.find((f) => f.alias === beforeFieldAlias)
        : null;

      if (!targetField) {
        console.warn(
          `Field with alias ${targetFieldAlias} not found in ProfileType:${profileType.id}`,
        );
        continue;
      }
      if (afterField === undefined) {
        console.warn(
          `Field with alias ${afterFieldAlias} not found in ProfileType:${profileType.id}`,
        );
        continue;
      }
      if (beforeField === undefined) {
        console.warn(
          `Field with alias ${beforeFieldAlias} not found in ProfileType:${profileType.id}`,
        );
        continue;
      }
      if (targetField.id === afterField?.id || targetField.id === beforeField?.id) {
        console.warn("Target field cannot be the same as after or before field");
        continue;
      }

      const newPositions = fields.flatMap((f) => {
        if (f.id === targetField.id) {
          return []; // remove target from current position
        }
        if (afterField && f.id === afterField.id) {
          return [afterField, targetField]; // place target after afterField
        }
        if (beforeField && f.id === beforeField.id) {
          return [targetField, beforeField]; // place target before beforeField
        }
        return [f];
      });

      console.log(
        "  -> new order:",
        newPositions.map((f) => f.alias || `id:${f.id}`),
      );

      if (apply) {
        await knex.raw(
          /* sql */ `
            update profile_type_field as ptf set
              position = t.position,
              updated_at = NOW(),
              updated_by = ?
            from (values ${newPositions.map(() => "(?::int, ?::int)").join(", ")}) as t("id", "position")
            where t.id = ptf.id and t.position != ptf.position;
          `,
          [`User:${ownerId}`, ...newPositions.flatMap(({ id }, position) => [id, position])],
        );
      }
    }
  }
}

main().then(() => {
  process.exit(0);
});
