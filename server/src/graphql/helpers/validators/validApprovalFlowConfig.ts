import { isNonNullish, partition } from "remeda";
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

      const invalid = values.find((v) => !isGlobalId(v, "User") && !isGlobalId(v, "UserGroup"));
      if (invalid) {
        throw new ArgValidationError(
          info,
          `${argName}[${index}].values[${values.indexOf(invalid)}]`,
          "value must be a valid User or UserGroup id",
        );
      }

      const targets = values.map((v) => fromGlobalId(v));
      const [userIds, userGroupIds] = partition(targets, (t) => t.type === "User");
      const [users, userGroups] = await Promise.all([
        ctx.users.loadUser(userIds.map((u) => u.id)),
        ctx.userGroups.loadUserGroup(userGroupIds.map((g) => g.id)),
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
        } else {
          never("Invalid target type");
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
