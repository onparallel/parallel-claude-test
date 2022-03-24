import { objectType } from "nexus";

export const UserAuthenticationToken = objectType({
  name: "UserAuthenticationToken",
  definition(t) {
    t.globalId("id");
    t.nonNull.string("tokenName", {
      resolve: (o) => o.token_name,
    });
    t.nullable.datetime("lastUsedAt", {
      resolve: (o) => o.last_used_at,
    });
    t.nullable.string("hint", {
      resolve: (o) => o.token_hint,
    });
    t.implements("CreatedAt");
  },
});
