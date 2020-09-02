import { arg, queryField, enumType } from "@nexus/schema";
import { authenticate, chain, or } from "../helpers/authorize";
import {
  userHasAccessToPetitions,
  petitionsArePublicTemplates,
} from "./authorizers";
import { globalIdArg } from "../helpers/globalIdPlugin";

export const petitionsQuery = queryField((t) => {
  t.paginationField("petitions", {
    type: "PetitionBase",
    description: "The petitions of the user",
    authorize: authenticate(),
    additionalArgs: {
      status: arg({
        type: "PetitionStatus",
        nullable: true,
      }),
      type: arg({
        type: enumType({
          name: "PetitionBaseType",
          members: ["PETITION", "TEMPLATE"],
        }),
      }),
      locale: arg({
        type: "PetitionLocale",
        required: false,
      }),
    },
    searchable: true,
    sortableBy: ["createdAt", "name"],
    resolve: async (
      _,
      { offset, limit, search, sortBy, status, type, locale },
      ctx
    ) => {
      return await ctx.petitions.loadPetitionsForUser(ctx.user!.id, {
        status,
        search,
        offset,
        locale,
        type: type || "PETITION",
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
  type: "PetitionBase",
  args: {
    id: globalIdArg("Petition", { required: true }),
  },
  authorize: chain(
    authenticate(),
    or(userHasAccessToPetitions("id"), petitionsArePublicTemplates("id"))
  ),
  nullable: true,
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.loadPetition(args.id);
  },
});

export const publicTemplatesQuery = queryField((t) => {
  t.paginationField("publicTemplates", {
    type: "PetitionTemplate",
    description: "The publicly available templates",
    authorize: authenticate(),
    additionalArgs: {
      locale: arg({
        type: "PetitionLocale",
        required: false,
      }),
    },
    searchable: true,
    resolve: async (_, { limit, offset, locale, search }, ctx) => {
      return await ctx.petitions.loadPublicTemplates({
        search,
        locale,
        limit,
        offset,
      });
    },
  });
});
