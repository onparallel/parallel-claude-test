import { queryField, arg, idArg } from "@nexus/schema";
import { authenticate, authorizeAnd } from "../helpers/authorize";
import { userHasAccessToPetition } from "./authorizers";
import { fromGlobalId } from "../../util/globalId";

export const petitionsQuery = queryField((t) => {
  t.paginationField("petitions", {
    type: "Petition",
    description: "The petitions of the user",
    authorize: authenticate(),
    additionalArgs: {
      status: arg({
        type: "PetitionStatus",
        nullable: true,
      }),
    },
    searchable: true,
    resolve: async (_, { offset, limit, search, status }, ctx) => {
      return await ctx.petitions.loadPetitionsForUser(ctx.user!.id, {
        status,
        search,
        offset,
        limit,
      });
    },
  });
});

export const petitionQuery = queryField("petition", {
  type: "Petition",
  args: {
    id: idArg({ required: true }),
  },
  authorize: authorizeAnd(authenticate(), userHasAccessToPetition("id")),
  nullable: true,
  resolve: async (root, args, ctx) => {
    const { id } = fromGlobalId(args.id, "Petition");
    return await ctx.petitions.loadPetition(id);
  },
});
