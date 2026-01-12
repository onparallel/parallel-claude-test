import { indexBy, unique } from "remeda";
import { getAssertionErrorMessage, isAssertionError } from "../../util/assert";
import { isGlobalId, toGlobalId } from "../../util/globalId";
import { mapAndValidateProfileQueryFilter } from "../../util/ProfileQueryFilter";
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

    if (input.values) {
      try {
        const fieldsById = indexBy(fields, (f) => f.id);
        mapAndValidateProfileQueryFilter(input.values, fieldsById);
      } catch (e) {
        if (isAssertionError(e)) {
          throw new ArgValidationError(info, `${argName}.values`, getAssertionErrorMessage(e));
        } else {
          throw e;
        }
      }
    }

    if (input.sort) {
      const validSortFields = ["name", "createdAt", "updatedAt", "closedAt"].concat(
        validIds.map((id) => `field_${id}`),
      );
      if (!validSortFields.includes(input.sort.field)) {
        throw new ArgValidationError(
          info,
          `${argName}.sort.field`,
          `Invalid sort field: ${input.sort.field}`,
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
