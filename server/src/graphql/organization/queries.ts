import { nonNull, queryField } from "@nexus/schema";
import { authenticate } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";

export const organizationQueries = queryField((t) => {
  t.nullable.field("organization", {
    type: "Organization",
    args: {
      id: nonNull(globalIdArg()),
    },
    authorize: authenticate(),
    resolve: async (_, args, ctx) => {
      return await ctx.organizations.loadOrg(args.id);
    },
  });
});
