import {
  arg,
  inputObjectType,
  list,
  nonNull,
  nullable,
  queryField,
  stringArg,
} from "@nexus/schema";
import { decode } from "jsonwebtoken";
import { fromGlobalIds } from "../../util/globalId";
import { authenticate, authenticateAnd, or } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import {
  petitionsArePublicTemplates,
  userHasAccessToPetitions,
} from "./authorizers";
import { validateAuthTokenPayload } from "./validations";

export const petitionsQuery = queryField((t) => {
  t.paginationField("petitions", {
    type: "PetitionBase",
    description: "The petitions of the user",
    authorize: authenticate(),
    extendArgs: {
      filters: inputObjectType({
        name: "PetitionFilter",
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
      // move this to validator if it grows in complexity
      if (filters?.tagIds) {
        if (filters.tagIds.length > 10) {
          throw new WhitelistedError("Invalid filter", "INVALID_FILTER");
        }
        const tags = await ctx.tags.loadTag(
          fromGlobalIds(filters?.tagIds, "Tag").ids
        );
        if (!tags.every((tag) => tag?.organization_id === ctx.user!.org_id)) {
          throw new WhitelistedError("Invalid filter", "INVALID_FILTER");
        }
      }
      const columnMap = {
        createdAt: "created_at",
        name: "name",
        lastUsedAt: "last_used_at",
      } as const;
      return await ctx.petitions.loadPetitionsForUser(ctx.user!.id, {
        search,
        offset,
        filters,
        sortBy: sortBy?.map((value) => {
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

export const petitionsByIdQuery = queryField("petitionsById", {
  type: list(nullable("PetitionBase")),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("Petition")))),
  },
  authorize: authenticateAnd(
    or(userHasAccessToPetitions("ids"), petitionsArePublicTemplates("ids"))
  ),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.loadPetition(args.ids);
  },
});

export const publicTemplatesQuery = queryField((t) => {
  t.paginationField("publicTemplates", {
    type: "PetitionTemplate",
    description: "The publicly available templates",
    authorize: authenticate(),
    extendArgs: {
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
