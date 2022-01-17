import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function maxActiveUsers<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any[]
) {
  return (async (_, args, ctx, info) => {
    const userIds = prop(args);
    const [org, activeUserCount] = await Promise.all([
      ctx.organizations.loadOrg(ctx.user!.org_id),
      ctx.organizations.loadActiveUserCount(ctx.user!.org_id),
    ]);

    if (org!.usage_details.USER_LIMIT < activeUserCount + userIds.length) {
      throw new ArgValidationError(
        info,
        `User limit reached for this organization`,
        "USER_LIMIT_ERROR",
        {
          userLimit: org!.usage_details.USER_LIMIT,
        }
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
