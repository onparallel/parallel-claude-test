import { queryField } from "@nexus/schema";
import { authenticate } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";

export const organizationQueries = queryField((t) => {
  t.field("organization", {
    type: "Organization",
    args: {
      id: globalIdArg({ required: true }),
    },
    authorize: authenticate(),
    nullable: true,
    resolve: async (_, args, ctx) => {
      return await ctx.organizations.loadOrg(args.id);
    },
  });
});
