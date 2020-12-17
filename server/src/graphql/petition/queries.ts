import {
  arg,
  queryField,
  enumType,
  stringArg,
  nonNull,
  nullable,
} from "@nexus/schema";
import { authenticate, chain, or } from "../helpers/authorize";
import {
  userHasAccessToPetitions,
  petitionsArePublicTemplates,
} from "./authorizers";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { decode } from "jsonwebtoken";
import { parseSortBy } from "../helpers/paginationPlugin";
import { validateAuthTokenPayload } from "./validations";
import { omit } from "remeda";

export const petitionsQuery = queryField((t) => {
  t.paginationField("petitions", {
    type: "PetitionBase",
    description: "The petitions of the user",
    authorize: authenticate(),
    additionalArgs: {
      status: arg({
        type: "PetitionStatus",
      }),
      type: arg({
        type: enumType({
          name: "PetitionBaseType",
          members: ["PETITION", "TEMPLATE"],
        }),
      }),
      locale: arg({
        type: "PetitionLocale",
      }),
    },
    searchable: true,
    sortableBy: ["createdAt", "name", "lastUsedAt" as any],
    resolve: async (
      _,
      { offset, limit, search, sortBy, status, type, locale },
      ctx
    ) => {
      const columnMap = {
        createdAt: "created_at",
        name: "name",
        lastUsedAt: "last_used_at",
      } as const;
      return await ctx.petitions.loadPetitionsForUser(ctx.user!.id, {
        status,
        search,
        offset,
        locale,
        type: type || "PETITION",
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
  authorize: chain(
    authenticate(),
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
    "petition.id",
    "token"
  ),
  resolve: async (_, { token }, ctx) => {
    const payload: any = decode(token);
    const petition = await ctx.petitions.loadPetition(payload.petition.id);

    // merge any optional payload data before returning the petition
    const payloadPetitionData = omit(payload.petition, ["id"]);
    return petition ? Object.assign(petition, payloadPetitionData) : null;
  },
});

export const petitionSignatureRequestToken = queryField(
  "petitionSignatureRequestAuthToken",
  {
    type: nullable("PetitionSignatureRequest"),
    args: {
      token: nonNull(stringArg()),
    },
    authorize: (_, { token }, ctx) => ctx.security.verifyAuthToken(token),
    resolve: async (_, { token }, ctx) => {
      const payload: any = decode(token);
      return payload.petitionSignatureRequest?.id
        ? await ctx.petitions.loadPetitionSignatureById(
            payload.petitionSignatureRequest.id
          )
        : null;
    },
  }
);
