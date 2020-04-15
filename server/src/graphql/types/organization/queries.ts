import { idArg, queryField } from "nexus";
import { fromGlobalId } from "../../../util/globalId";
import { authenticate } from "../../helpers/authorize";

export const organizationQueries = queryField((t) => {
  t.field("organization", {
    type: "Organization",
    args: {
      id: idArg({ required: true }),
    },
    authorize: authenticate(),
    nullable: true,
    resolve: async (_, args, ctx) => {
      const { id } = fromGlobalId(args.id, "Organization");
      return await ctx.organizations.loadOrg(id);
    },
  });
});
