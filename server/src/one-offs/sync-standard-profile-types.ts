import "./../init";
// keep this space to prevent import sorting removing init from top
import { Knex } from "knex";
import { isDefined, maxBy } from "remeda";
import yargs from "yargs";
import { createContainer } from "../container";
import {
  ProfileTypeFieldType,
  ProfileTypeStandardType,
  ProfileTypeStandardTypeValues,
} from "../db/__types";
import { KNEX } from "../db/knex";
import { PROFILES_SETUP_SERVICE, ProfilesSetupService } from "../services/ProfilesSetupService";
import { loadEnv } from "../util/loadEnv";
import { waitFor } from "../util/promises/waitFor";
import { ProfileTypeFieldOptions } from "../db/helpers/profileTypeFieldOptions";

async function fetchMissingStandardTypes(knex: Knex, orgId: number) {
  const data = await knex.raw<{
    rows: { standard_type: ProfileTypeStandardType }[];
  }>(
    /* sql */ `
    with all_types as (
      select * from (values ${ProfileTypeStandardTypeValues.map(() => "(?)").join(", ")}) as t("standard_type")
    ),
    current_types as (
      select standard_type from profile_type where org_id = ? and standard_type is not null and deleted_at is null and archived_at is null
    )
    select a_t.* from all_types a_t 
    left join current_types c_t on a_t.standard_type::profile_type_standard_type = c_t.standard_type::profile_type_standard_type
    where c_t.standard_type is null;
  `,
    [...ProfileTypeStandardTypeValues, orgId],
  );

  return data.rows.map((r) => r.standard_type);
}

async function main() {
  const { orgId } = await yargs.usage("Usage: $0 --orgId [orgId]").option("orgId", {
    required: false,
    type: "number",
    description: "Run script only for this organization.",
  }).argv;

  await loadEnv();
  const container = createContainer();
  const knex = container.get<Knex>(KNEX);

  const profiles = container.get<ProfilesSetupService>(PROFILES_SETUP_SERVICE);

  const orgOwners = await knex
    .from("user")
    .whereNull("deleted_at")
    .where("is_org_owner", true)
    .mmodify((q) => {
      if (isDefined(orgId)) {
        q.where("org_id", orgId);
      }
    })
    .select("*")
    .orderBy("org_id");

  console.log(`About to run on ${orgOwners.length} organizations`);
  await waitFor(3_000);

  let i = 0;
  for (const { id: ownerId, org_id: orgId } of orgOwners) {
    console.log(`Processing Org:${orgId} (${++i}/${orgOwners.length})`);

    // search for missing standard types on organization and create them
    const missingStandardTypes = await fetchMissingStandardTypes(knex, orgId);
    for (const standardType of missingStandardTypes) {
      console.log(`Creating ${standardType}`);
      switch (standardType) {
        case "CONTRACT":
          await profiles.createDefaultContractProfileType(orgId, `User:${ownerId}`);
          break;
        case "INDIVIDUAL":
          await profiles.createDefaultIndividualProfileType(orgId, `User:${ownerId}`);
          break;
        case "LEGAL_ENTITY":
          await profiles.createDefaultLegalEntityProfileType(orgId, `User:${ownerId}`);
          break;
        default:
          throw new Error(`Unknown standard type: ${standardType}`);
      }
    }

    // on each of the standard profile types, make sure every property is there.
    // This way we can add missing properties to incomplete standard types
    for (const standardType of ProfileTypeStandardTypeValues.filter(
      (st) => !missingStandardTypes.includes(st), // skip the ones we just created
    )) {
      const [profileType] = await knex
        .from("profile_type")
        .where({
          org_id: orgId,
          standard_type: standardType,
          deleted_at: null,
        })
        .select("*");

      const currentProperties = await knex
        .from("profile_type_field")
        .where("profile_type_id", profileType.id)
        .whereNull("deleted_at")
        .select("*");

      // get latest position to add new properties at the end
      let position = maxBy(currentProperties, (p) => p.position)?.position ?? 0;
      for (const propertyDefinition of await profiles.getProfileTypeFieldsDefinition(
        standardType,
      )) {
        const existingProperty = currentProperties.find(
          (p) => p.alias === propertyDefinition.alias,
        );
        if (!existingProperty) {
          console.log(`Adding missing property ${propertyDefinition.alias} to ${standardType}`);
          await knex.from("profile_type_field").insert({
            alias: propertyDefinition.alias,
            name: propertyDefinition.name,
            options: propertyDefinition.options,
            type: propertyDefinition.type as ProfileTypeFieldType,
            position: ++position,
            permission: "WRITE",
            profile_type_id: profileType.id,
            created_by: `User:${ownerId}`,
            is_expirable: propertyDefinition.is_expirable ?? false,
            expiry_alert_ahead_time: propertyDefinition.expiry_alert_ahead_time ?? null,
          });
        } else {
          // property with same alias already exists
          // for SELECT type, make sure options are up to date
          let update = false;
          let options = existingProperty.options;

          if (propertyDefinition.type === "SELECT") {
            const optionsDefinition =
              propertyDefinition.options as ProfileTypeFieldOptions["SELECT"];
            const selectOptions = existingProperty.options as ProfileTypeFieldOptions["SELECT"];

            if (
              isDefined(optionsDefinition.standardList) &&
              selectOptions.standardList !== optionsDefinition.standardList
            ) {
              update = true;
              selectOptions.values = [];
              selectOptions.standardList = optionsDefinition.standardList;
            }

            for (const option of optionsDefinition.values) {
              if (!selectOptions.values.some((v) => v.value === option.value)) {
                // add missing option
                update = true;
                selectOptions.values.push(option);
              }

              const existingOption = selectOptions.values.find((v) => v.value === option.value)!;
              if (!existingOption.isStandard) {
                update = true;
                // we found an option with same value, but it was created by user. Replace it with standard definition
                selectOptions.values.splice(
                  selectOptions.values.indexOf(existingOption),
                  1,
                  option,
                );
              }
            }

            for (const option of selectOptions.values) {
              if (
                option.isStandard &&
                !optionsDefinition.values.some((v) => v.value === option.value)
              ) {
                // remove standard options that are no longer in the standard list
                update = true;
                selectOptions.values.splice(selectOptions.values.indexOf(option), 1);
              }
            }

            options = selectOptions;
          } else if (propertyDefinition.type === "SHORT_TEXT") {
            // for SHORT_TEXT, make sure formats are up to date
            const optionsDefinition = propertyDefinition.options as
              | ProfileTypeFieldOptions["SHORT_TEXT"]
              | undefined;
            const shortTextOptions =
              existingProperty.options as ProfileTypeFieldOptions["SHORT_TEXT"];

            if (shortTextOptions.format !== optionsDefinition?.format) {
              update = true;
              shortTextOptions.format = optionsDefinition?.format;
            }
            options = shortTextOptions;
          }

          if (update) {
            console.log(`Updating options for ${propertyDefinition.alias} in ${standardType}`);
            await knex.from("profile_type_field").where("id", existingProperty.id).update({
              options,
            });
          }
        }
      }
    }
  }
}

main().then(() => {
  process.exit(0);
});
