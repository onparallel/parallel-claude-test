import { arg, idArg, queryField } from "@nexus/schema";
import { fromGlobalId } from "../../util/globalId";
import { authenticate, chain } from "../helpers/authorize";
import { userHasAccessToPetitions } from "./authorizers";

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
    sortableBy: ["createdAt", "name"],
    resolve: async (_, { offset, limit, search, sortBy, status }, ctx) => {
      return await ctx.petitions.loadPetitionsForUser(ctx.user!.id, {
        status,
        search,
        offset,
        sortBy: (sortBy || ["createdAt_DESC"]).map((value) => {
          const [field, order] = value.split("_");
          return {
            column: ({
              createdAt: "created_at",
              name: "name",
            } as any)[field as any],
            order: order.toLowerCase() as "asc" | "desc",
          };
        }),
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
  authorize: chain(authenticate(), userHasAccessToPetitions("id")),
  nullable: true,
  resolve: async (root, args, ctx) => {
    const { id } = fromGlobalId(args.id, "Petition");
    return await ctx.petitions.loadPetition(id);
  },
});
