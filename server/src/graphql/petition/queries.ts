import {
  arg,
  queryField,
  stringArg,
  nonNull,
  nullable,
  inputObjectType,
} from "@nexus/schema";
import { authenticate, authenticateAnd, or } from "../helpers/authorize";
import {
  userHasAccessToPetitions,
  petitionsArePublicTemplates,
} from "./authorizers";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { decode } from "jsonwebtoken";
import { parseSortBy } from "../helpers/paginationPlugin";
import { validateAuthTokenPayload } from "./validations";

export const petitionsQuery = queryField((t) => {
  t.paginationField("petitions", {
    type: "PetitionBase",
    description: "The petitions of the user",
    authorize: authenticate(),
    additionalArgs: {
      filters: inputObjectType({
        name: "PetitionFilters",
        definition(t) {
          t.nullable.field("status", {
            type: "PetitionStatus",
          });
          t.nullable.field("locale", {
            type: "PetitionLocale",
          });
          t.nullable.field("type", {
            type: "PetitionBaseType",
          });
          t.nullable.list.nonNull.id("tagIds");
        },
      }).asArg(),
    },
    searchable: true,
    sortableBy: ["createdAt", "name", "lastUsedAt" as any],
    resolve: async (_, { offset, limit, search, sortBy, filters }, ctx) => {
      const columnMap = {
        createdAt: "created_at",
        name: "name",
        lastUsedAt: "last_used_at",
      } as const;
      return await ctx.petitions.loadPetitionsForUser(ctx.user!.id, {
        search,
        offset,
        filters,
        sortBy: (sortBy || ["createdAt_DESC"]).map((value) => {
          const [field, order] = parseSortBy(value);
          return { column: columnMap[field], order };
        }),
        limit,
      });
    },
  });
});

export const petitionQuery = queryField("petition", {
  type: nullable("PetitionBase"),
  args: {
    id: nonNull(globalIdArg("Petition")),
  },
  authorize: authenticateAnd(
    or(userHasAccessToPetitions("id"), petitionsArePublicTemplates("id"))
  ),
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
      locale: arg({ type: "PetitionLocale" }),
    },
    searchable: true,
    resolve: async (_, { limit, offset, locale, search }, ctx) => {
      return await ctx.petitions.loadPublicTemplates(
        {
          search,
          locale,
          limit,
          offset,
        },
        ctx.user!.id
      );
    },
  });
});

export const petitionAuthToken = queryField("petitionAuthToken", {
  type: nullable("Petition"),
  args: {
    token: nonNull(stringArg()),
  },
  authorize: (_, { token }, ctx) => ctx.security.verifyAuthToken(token),
  validateArgs: validateAuthTokenPayload(
    (args) => args.token,
    "petitionId",
    "token"
  ),
  resolve: async (_, { token }, ctx) => {
    const payload: any = decode(token);
    return await ctx.petitions.loadPetition(payload.petitionId);
  },
});
