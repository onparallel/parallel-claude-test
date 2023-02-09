import { ArgsValue } from "nexus/dist/core";
import { isDefined } from "remeda";
import { fromGlobalId } from "../../util/globalId";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { NexusGenInputs } from "../__types";

export function validPetitionListViewDataInput<TypeName extends string, FieldName extends string>(
  prop: (
    args: ArgsValue<TypeName, FieldName>
  ) => NexusGenInputs["PetitionListViewDataInput"] | null | undefined,
  name: string
) {
  return (async (_, args, ctx, info) => {
    const data = prop(args);
    if (!data) {
      return;
    }

    try {
      if (isDefined(data.sharedWith)) {
        data.sharedWith.filters.map((f) => {
          const { type } = fromGlobalId(f.value);
          if (type !== "User" && type !== "UserGroup") {
            throw new Error(`Invalid id ${f.value}`);
          }
        });
      }
    } catch (e: any) {
      throw new ArgValidationError(info, e.message, name);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
