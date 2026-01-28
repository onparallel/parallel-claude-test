import "./../init";
// keep this space to prevent import sorting removing init from top
import { Knex } from "knex";
import pMap from "p-map";
import { filter, firstBy, flatMap, indexBy, isNonNullish, map, pipe, unique } from "remeda";
import yargs from "yargs";
import { createContainer } from "../container";
import { ProfileType, ProfileTypeFieldType } from "../db/__types";
import { KNEX } from "../db/knex";
import {
  PROFILES_SETUP_SERVICE,
  ProfileRelationshipTypeAlias,
  ProfilesSetupService,
} from "../services/ProfilesSetupService";
import { ProfileTypeFieldOptions } from "../services/ProfileTypeFieldService";
import { loadEnv } from "../util/loadEnv";
import { waitFor } from "../util/promises/waitFor";

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

  let i = 0;
  for (const { id: ownerId, org_id: orgId } of orgOwners) {
    console.log(`Processing Org:${orgId} (${++i}/${orgOwners.length})`);

    const { rows: standardProfileTypes } = await knex.raw<{
      rows: ProfileType[];
    }>(
      /* sql */ `
        select * 
        from profile_type 
        where org_id = ?
        and standard_type is not null
        and deleted_at is null
        and archived_at is null;
      `,
      [orgId],
    );

    // on each of the standard profile types, make sure every property is there.
    // This way we can add missing properties to incomplete standard types
    for (const profileType of standardProfileTypes) {
      const currentProperties = await knex
        .from("profile_type_field")
        .where("profile_type_id", profileType.id)
        .whereNull("deleted_at")
        .select("*");

      // get latest position to add new properties at the end
      let position = firstBy(currentProperties, [(p) => p.position, "desc"])?.position ?? 0;
      for (const propertyDefinition of await profiles.getProfileTypeFieldsDefinition(
        profileType.standard_type!,
      )) {
        const existingProperty = currentProperties.find(
          (p) => p.alias === propertyDefinition.alias,
        );
        if (!existingProperty) {
          console.log(
            `Adding missing property ${propertyDefinition.alias} to ProfileType:${profileType.id}`,
          );
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
            console.log(
              `Updating options for ${propertyDefinition.alias} in ProfileType:${profileType.id}`,
            );
            await knex.from("profile_type_field").where("id", existingProperty.id).update({
              options,
            });
          }
        }
      }
    }

    const knownStandardTypes = unique(
      standardProfileTypes.map((s) => s.standard_type!).filter(isNonNullish),
    );
    // make sure every profile_relationship_type is inserted for known standard types
    const relationshipAliasesToCreate = pipe(
      Object.entries(allowedProfileTypesDefinition),
      filter(([_, [left, right]]) => {
        return (
          left.some((st) => knownStandardTypes.includes(st)) &&
          right.some((st) => knownStandardTypes.includes(st))
        );
      }),
      map(([alias]) => alias as ProfileRelationshipTypeAlias),
    );

    if (relationshipAliasesToCreate.length > 0) {
      console.log(`Creating relationship types`);
      await knex
        .from("profile_relationship_type")
        .insert(
          await pMap(
            relationshipAliasesToCreate,
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
        )
        .onConflict()
        .ignore();
    }

    const relationshipTypes = await knex
      .from("profile_relationship_type")
      .where("org_id", orgId)
      .whereNull("deleted_at")
      .whereNotNull("alias")
      .select("*");

    const relationshipTypesByAlias = indexBy(relationshipTypes, (r) => r.alias);

    const allowedRelationshipsToCreate = pipe(
      Object.entries(allowedProfileTypesDefinition),
      filter(([alias]) => isNonNullish(relationshipTypesByAlias[alias])),
      flatMap(([alias, [left, right]]) => {
        const knownLeft = left.filter((st) => knownStandardTypes.includes(st));
        const knownRight = right.filter((st) => knownStandardTypes.includes(st));
        return [
          ...knownLeft.flatMap((st) =>
            standardProfileTypes
              .filter((pt) => pt.standard_type === st)
              .map((pt) => ({
                org_id: pt.org_id,
                allowed_profile_type_id: pt.id,
                profile_relationship_type_id: relationshipTypesByAlias[alias].id,
                direction: "LEFT_RIGHT" as const,
              })),
          ),
          ...knownRight.flatMap((st) =>
            standardProfileTypes
              .filter((pt) => pt.standard_type === st)
              .map((pt) => ({
                org_id: pt.org_id,
                allowed_profile_type_id: pt.id,
                profile_relationship_type_id: relationshipTypesByAlias[alias].id,
                direction: "RIGHT_LEFT" as const,
              })),
          ),
        ];
      }),
    );

    if (allowedRelationshipsToCreate.length > 0) {
      console.log(
        `Creating ${allowedRelationshipsToCreate.length} allowed profile types for relationships`,
      );
      await knex
        .from("profile_relationship_type_allowed_profile_type")
        .insert(
          allowedRelationshipsToCreate.map((r) => ({
            org_id: orgId,
            profile_relationship_type_id: r.profile_relationship_type_id,
            allowed_profile_type_id: r.allowed_profile_type_id,
            direction: r.direction,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          })),
        )
        .onConflict()
        .ignore();
    }
  }
}

main().then(() => {
  process.exit(0);
});
