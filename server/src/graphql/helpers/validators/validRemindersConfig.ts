import { core } from "nexus";
import { isValidTime, isValidTimezone } from "../../../util/time";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validRemindersConfig<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    core.GetGen2<"inputTypes", "RemindersConfigInput"> | null | undefined
  >,
) {
  return ((_, args, ctx, info) => {
    const [remindersConfig, argName] = getArgWithPath(args, prop);
    if (remindersConfig) {
      const { time, timezone, offset, limit } = remindersConfig;
      if (!isValidTime(time)) {
        throw new ArgValidationError(
          info,
          `${argName}.time`,
          `Value must be a valid 00:00-23:59 time.`,
        );
      }
      if (!isValidTimezone(timezone)) {
        throw new ArgValidationError(
          info,
          `${argName}.timezone`,
          `Value must be a valid timezone.`,
        );
      }
      if (limit > 10 || limit < 1) {
        throw new ArgValidationError(info, `${argName}.limit`, `Value must be between 1 and 10.`);
      }
      if (offset < 1) {
        throw new ArgValidationError(info, `${argName}.offset`, `Value must be larger than 0.`);
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
