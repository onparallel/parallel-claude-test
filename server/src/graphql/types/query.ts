import { objectType, stringArg } from "nexus";
import { fromGlobalId } from "../../util/globalId";
import { authenticate } from "../helpers/authorize";

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("organization", {
      type: "Organization",
      args: {
        id: stringArg({ required: true })
      },
      authorize: authenticate,
      nullable: true,
      resolve: async (_, args, ctx) => {
        const { id } = fromGlobalId(args.id, "Organization");
        return await ctx.organizations.loadOneById(id);
      }
    });
    t.field("me", {
      type: "User",
      authorize: authenticate,
      resolve: (_, args, ctx, info) => {
        return ctx.user;
      }
    });
  }
});
