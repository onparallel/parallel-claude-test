import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { authenticate, chain, userIsSuperAdmin } from "../helpers/authorize";

export function supportMethodAccess<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return chain(authenticate(), userIsSuperAdmin());
}
