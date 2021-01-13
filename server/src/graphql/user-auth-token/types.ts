import { objectType } from "@nexus/schema";

export const UserAuthenticationToken = objectType({
  name: "UserAuthenticationToken",
  definition(t) {
    t.globalId("id");
    t.nonNull.string("tokenName", {
      resolve: (o) => o.token_name,
    });
    t.implements("CreatedAt");
  },
});
