import "./../init";
// keep this space to prevent import sorting removing init from top
import { Knex } from "knex";
import pMap from "p-map";
import { isNonNullish, maxBy } from "remeda";
import yargs from "yargs";
import { createContainer } from "../container";
import {
  ProfileRelationshipTypeAllowedProfileType,
  ProfileRelationshipTypeDirection,
  ProfileTypeFieldType,
  ProfileTypeStandardType,
  ProfileTypeStandardTypeValues,
} from "../db/__types";
import { ProfileTypeFieldOptions } from "../db/helpers/profileTypeFieldOptions";
import { KNEX } from "../db/knex";
import {
  PROFILES_SETUP_SERVICE,
  ProfileRelationshipTypeAlias,
  ProfilesSetupService,
} from "../services/ProfilesSetupService";
import { loadEnv } from "../util/loadEnv";
import { waitFor } from "../util/promises/waitFor";

async function fetchMissingProfileRelationshipAllowedProfileTypes(
  knex: Knex,
  orgId: number,
  allowedTypesDefinition: Record<
    ProfileRelationshipTypeAlias,
    [ProfileTypeStandardType[], ProfileTypeStandardType[]]
  >,
) {
  const standardProfileTypes = await knex
    .from("profile_type")
    .where({
      deleted_at: null,
      org_id: orgId,
      archived_at: null,
    })
    .whereNotNull("standard_type")
    .select("*");

  const relationshipTypes = await knex
    .from("profile_relationship_type")
    .where({
      deleted_at: null,
      org_id: orgId,
    })
    .whereNotNull("alias")
    .select("*");

  const input = Object.entries(allowedTypesDefinition).flatMap(([alias, [left, right]]) => {
    const relationshipType = relationshipTypes.find((r) => r.alias === alias)!;
    return [
      ...left.map((l) => {
        const standardType = standardProfileTypes.find((s) => s.standard_type === l)!;
        return [relationshipType.id, standardType.id, "LEFT_RIGHT"];
      }),
      ...right.map((r) => {
        const standardType = standardProfileTypes.find((s) => s.standard_type === r)!;
        return [relationshipType.id, standardType.id, "RIGHT_LEFT"];
      }),
    ];
  }) as unknown as [number, number, ProfileRelationshipTypeDirection][];

  const data = await knex.raw<{
    rows: Pick<
      ProfileRelationshipTypeAllowedProfileType,
      "profile_relationship_type_id" | "allowed_profile_type_id" | "direction"
    >[];
  }>(
    /* sql */ `
    with all_types as (
      select * from (values ${input.map(() => "(?::int, ?::int, ?::profile_relationship_type_direction)").join(", ")}) as t("profile_relationship_type_id", "allowed_profile_type_id", "direction")
    ),
    current_types as (
      select profile_relationship_type_id, allowed_profile_type_id, direction
      from profile_relationship_type_allowed_profile_type where org_id = ? and deleted_at is null
    )
    select * from all_types
    except
    select * from current_types;
  `,
    [...input.flat(), orgId],
  );

  return data.rows.map((r) => ({
    profile_relationship_type_id: r.profile_relationship_type_id,
    allowed_profile_type_id: r.allowed_profile_type_id,
    direction: r.direction,
  }));
}

async function fetchMissingProfileRelationshipTypes(
  knex: Knex,
  orgId: number,
  allRelationshipTypes: ProfileRelationshipTypeAlias[],
) {
  const data = await knex.raw<{
    rows: { alias: ProfileRelationshipTypeAlias }[];
  }>(
    /* sql */ `
    with all_types as (
      select * from (values ${allRelationshipTypes.map(() => "(?)").join(", ")}) as t("alias")
    ),
    current_types as (
      select alias from profile_relationship_type where org_id = ? and deleted_at is null
    )
    select * from all_types
    except
    select * from current_types;
  `,
    [...allRelationshipTypes, orgId],
  );

  return data.rows.map((r) => r.alias);
}

async function fetchMissingStandardTypes(knex: Knex, orgId: number) {
  const data = await knex.raw<{
    rows: { standard_type: ProfileTypeStandardType }[];
  }>(
    /* sql */ `
    with all_types as (
      select * from (values ${ProfileTypeStandardTypeValues.map(() => "(?::profile_type_standard_type)").join(", ")}) as t("standard_type")
    ),
    current_types as (
      select standard_type from profile_type where org_id = ? and standard_type is not null and deleted_at is null and archived_at is null
    )
    select * from all_types
    except
    select * from current_types;
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
      if (isNonNullish(orgId)) {
        q.where("org_id", orgId);
      }
    })
    .select("*")
    .orderBy("org_id");

  console.log(`About to run on ${orgOwners.length} organizations`);
  await waitFor(3_000);

  const profileRelationshipTypesDefinition = profiles.getProfileRelationshipTypesDefinition();
  const allowedProfileTypesDefinition =
    profiles.getProfileRelationshipAllowedProfileTypesDefinition();
  const allProfileRelationshipTypes = Object.keys(
    profileRelationshipTypesDefinition,
  ) as ProfileRelationshipTypeAlias[];

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
            updated_by: `User:${ownerId}`,
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
              isNonNullish(optionsDefinition.standardList) &&
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

    // make sure every profile_relationship_type is inserted for the org
    const missingRelationshipAliases = await fetchMissingProfileRelationshipTypes(
      knex,
      orgId,
      allProfileRelationshipTypes,
    );
    if (missingRelationshipAliases.length > 0) {
      console.log(`Creating relationship types: ${missingRelationshipAliases.join(", ")}`);
      await knex.from("profile_relationship_type").insert(
        await pMap(
          missingRelationshipAliases,
          async (alias) => {
            const [left, right] = await profileRelationshipTypesDefinition[alias]();
            return {
              org_id: orgId,
              alias,
              left_right_name: left,
              right_left_name: right,
              is_reciprocal: right === null,
              created_by: `User:${ownerId}`,
              updated_by: `User:${ownerId}`,
            };
          },
          { concurrency: 10 },
        ),
      );
    }

    const missingAllowedTypes = await fetchMissingProfileRelationshipAllowedProfileTypes(
      knex,
      orgId,
      allowedProfileTypesDefinition,
    );

    if (missingAllowedTypes.length > 0) {
      console.log(`Creating ${missingAllowedTypes.length} allowed profile types for relationships`);
      await knex.from("profile_relationship_type_allowed_profile_type").insert(
        missingAllowedTypes.map((r) => ({
          org_id: orgId,
          profile_relationship_type_id: r.profile_relationship_type_id,
          allowed_profile_type_id: r.allowed_profile_type_id,
          direction: r.direction,
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
        })),
      );
    }
  }
}

main().then(() => {
  process.exit(0);
});
