import { arg, idArg, objectType, stringArg } from "nexus";
import { fromGlobalId } from "../../util/globalId";
import { authenticate, authorizeAnd } from "../helpers/authorize";
import { userHasAccessToPetition } from "./petition";

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("organization", {
      type: "Organization",
      args: {
        id: stringArg({ required: true })
      },
      authorize: authenticate(),
      nullable: true,
      resolve: async (_, args, ctx) => {
        const { id } = fromGlobalId(args.id, "Organization");
        return await ctx.organizations.loadOneById(id);
      }
    });
    t.field("me", {
      type: "User",
      authorize: authenticate(),
      resolve: (_, args, ctx) => {
        return ctx.user;
      }
    });
    t.paginationField("petitions", {
      type: "Petition",
      description: "The petitions of the user",
      authorize: authenticate(),
      additionalArgs: {
        status: arg({
          type: "PetitionStatus",
          nullable: true
        })
      },
      searchable: true,
      resolve: async (_, { offset, limit, search, status }, ctx) => {
        return await ctx.petitions.loadPetitionsForUser(ctx.user.id, {
          status,
          search,
          offset,
          limit
        });
      }
    });
    t.field("petition", {
      type: "Petition",
      args: {
        id: idArg({ required: true })
      },
      authorize: authorizeAnd(authenticate(), userHasAccessToPetition("id")),
      nullable: true,
      resolve: async (root, args, ctx) => {
        const { id } = fromGlobalId(args.id, "Petition");
        return await ctx.petitions.loadOneById(id);
      }
    });
  }
});
