import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { authenticateAnd, userIsSuperAdmin } from "../helpers/authorize";

export function superAdminAccess<
  TypeName extends string,
  FieldName extends string,
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return authenticateAnd(userIsSuperAdmin());
}
