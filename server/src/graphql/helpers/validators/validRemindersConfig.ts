import { core } from "@nexus/schema";
import { ArgValidationError } from "../errors";
import { findTimeZone } from "timezone-support";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validRemindersConfig<
  TypeName extends string,
  FieldName extends string
>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => core.GetGen2<"inputTypes", "RemindersConfigInput"> | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const remindersConfig = prop(args);
    if (remindersConfig) {
      const { time, timezone, offset } = remindersConfig;
      if (!/(2[0-3]|[01][0-9]):([0-5][0-9])/.test(time)) {
        throw new ArgValidationError(
          info,
          `${argName}.time`,
          `Value must be a valid 00:00-23:59 time.`
        );
      }
      try {
        findTimeZone(timezone);
      } catch {
        throw new ArgValidationError(
          info,
          `${argName}.timezone`,
          `Value must be a valid timezone.`
        );
      }
      if (offset < 1) {
        throw new ArgValidationError(
          info,
          `${argName}.offset`,
          `Value must be larger than 0.`
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
