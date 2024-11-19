import { unique } from "remeda";
import { isGlobalId, toGlobalId } from "../../util/globalId";
import { NexusGenInputs } from "../__types";
import { ArgWithPath, getArgWithPath } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validProfileListViewDataInput<TypeName extends string, FieldName extends string>(
  profileTypeIdArg: ArgWithPath<TypeName, FieldName, number>,
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["ProfileListViewDataInput"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [input, argName] = getArgWithPath(args, prop);
    if (!input) {
      return;
    }

    if (unique(input.columns ?? []).length !== (input.columns ?? []).length) {
      throw new ArgValidationError(
        info,
        `${argName}.columns`,
        `Duplicate column values are not allowed`,
      );
    }

    const [profileTypeId] = getArgWithPath(args, profileTypeIdArg);
    const fields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    const validIds = fields.map((f) => toGlobalId("ProfileTypeField", f.id));
    /*
     possible column values are:
     - subscribers
     - createdAt
     - field_xxx (ProfileTypeField globalId)
    */
    for (const column of input.columns ?? []) {
      if (column.startsWith("field_")) {
        const globalId = column.replace("field_", "");
        if (!isGlobalId(globalId, "ProfileTypeField") || !validIds.includes(globalId)) {
          throw new ArgValidationError(
            info,
            `${argName}.columns`,
            `Invalid column value: ${column}`,
          );
        }
      } else if (!["subscribers", "createdAt"].includes(column)) {
        throw new ArgValidationError(info, `${argName}.columns`, `Invalid column value: ${column}`);
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
