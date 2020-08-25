import { idArg, queryField } from "@nexus/schema";
import { fromGlobalId } from "../../util/globalId";
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
      const { id } = fromGlobalId(args.id, "Organization");
      return await ctx.organizations.loadOrg(id);
    },
  });
});
