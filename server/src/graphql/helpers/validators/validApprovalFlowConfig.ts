import { isNonNullish, unique } from "remeda";
import { assert } from "ts-essentials";
import { mapFieldLogic } from "../../../util/fieldLogic";
import { fromGlobalId, isGlobalId } from "../../../util/globalId";
import { never } from "../../../util/never";
import { NexusGenInputs } from "../../__types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { validateFieldLogic, validateFieldLogicSchema } from "./validFieldLogic";

export function validApprovalFlowConfigInput<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["ApprovalFlowConfigInput"][] | null | undefined
  >,
  petitionIdArg: ArgWithPath<TypeName, FieldName, number>,
) {
  return (async (_, args, ctx, info) => {
    const [approvalConfig, argName] = getArgWithPath(args, prop);
    const [petitionId] = getArgWithPath(args, petitionIdArg);

    if (!approvalConfig) {
      return;
    }

    if (approvalConfig.length === 0) {
      throw new ArgValidationError(info, argName, "approvalConfig must not be empty");
    }

    const validTargetTypes = ["User", "UserGroup", "PetitionField"] as const;

    for (const config of approvalConfig) {
      const index = approvalConfig.indexOf(config);

      const { values, visibility } = config;

      if (values.length === 0) {
        throw new ArgValidationError(
          info,
          `${argName}[${index}].values`,
          "values must not be empty",
        );
      }

      const invalidTarget = values.find(
        (value) => !validTargetTypes.some((type) => isGlobalId(value, type)),
      );

      if (invalidTarget) {
        throw new ArgValidationError(
          info,
          `${argName}[${index}].values[${values.indexOf(invalidTarget)}]`,
          "value must be a valid globalId",
        );
      }

      const targets = values.map((v) => fromGlobalId(v)) as {
        id: number;
        type: (typeof validTargetTypes)[number];
      }[];

      const userIds = unique(targets.filter((t) => t.type === "User").map((t) => t.id));
      const userGroupIds = unique(targets.filter((t) => t.type === "UserGroup").map((t) => t.id));
      const petitionFieldIds = unique(
        targets.filter((t) => t.type === "PetitionField").map((t) => t.id),
      );

      const [users, userGroups, petitionFields] = await Promise.all([
        userIds.length > 0 ? ctx.users.loadUser(userIds) : [],
        userGroupIds.length > 0 ? ctx.userGroups.loadUserGroup(userGroupIds) : [],
        petitionFieldIds.length > 0 ? ctx.petitions.loadField(petitionFieldIds) : [],
      ]);

      for (const target of targets) {
        if (target.type === "User") {
          const user = users.find((u) => u?.id === target.id);
          if (!user || user.org_id !== ctx.user!.org_id) {
            throw new ArgValidationError(
              info,
              `${argName}[${index}].values[${targets.indexOf(target)}]`,
              "User not found",
            );
          }
        } else if (target.type === "UserGroup") {
          const userGroup = userGroups.find((ug) => ug?.id === target.id);
          if (!userGroup || userGroup.org_id !== ctx.user!.org_id) {
            throw new ArgValidationError(
              info,
              `${argName}[${index}].values[${targets.indexOf(target)}]`,
              "UserGroup not found",
            );
          }
        } else if (target.type === "PetitionField") {
          const petitionField = petitionFields.find((pf) => pf?.id === target.id);
          if (
            !petitionField ||
            petitionField.petition_id !== petitionId ||
            petitionField.type !== "USER_ASSIGNMENT"
          ) {
            throw new ArgValidationError(
              info,
              `${argName}[${index}].values[${targets.indexOf(target)}]`,
              "PetitionField not found",
            );
          }
        } else {
          never(`Invalid target type ${target.type}`);
        }
      }

      if (visibility) {
        try {
          const logic = { visibility, math: null };
          // validate input JSON schema before anything
          validateFieldLogicSchema(logic, "string");

          const [allFields, petition] = await Promise.all([
            ctx.petitions.loadAllFieldsByPetitionId(petitionId),
            ctx.petitions.loadPetition(petitionId),
          ]);
          assert(isNonNullish(petition), "Petition not found");
          await validateFieldLogic(
            {
              petition_id: petitionId,
              visibility: mapFieldLogic<string>({ visibility: logic.visibility }, (id) => {
                assert(typeof id === "string");
                return fromGlobalId(id, "PetitionField").id;
              }).field.visibility,
            },
            allFields,
            {
              variables: petition.variables ?? [],
              standardListDefinitions:
                await ctx.petitions.loadResolvedStandardListDefinitionsByPetitionId(petitionId),
              customLists: petition.custom_lists ?? [],
              loadSelectOptionsValuesAndLabels: (options) =>
                ctx.petitionFields.loadSelectOptionsValuesAndLabels(options),
            },
            true,
          );
        } catch (e) {
          if (e instanceof Error) {
            throw new ArgValidationError(info, `${argName}[${index}].visibility`, e.message);
          }
          throw e;
        }
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
