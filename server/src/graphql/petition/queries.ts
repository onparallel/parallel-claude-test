import {
  arg,
  queryField,
  enumType,
  stringArg,
  nonNull,
  nullable,
} from "@nexus/schema";
import { authenticate, authenticateAnd, or } from "../helpers/authorize";
import {
  userHasAccessToPetitions,
  petitionsArePublicTemplates,
  repliesBelongsToPetition,
} from "./authorizers";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { decode } from "jsonwebtoken";
import { parseSortBy } from "../helpers/paginationPlugin";
import { validateAuthTokenPayload } from "./validations";
import { WhitelistedError } from "../helpers/errors";

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

export const petitionReplyTextContent = queryField("petitionReplyTextContent", {
  type: nullable("String"),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId")
  ),
  resolve: async (_, args, ctx) => {
    const reply = await ctx.petitions.loadFieldReply(args.replyId);

    if (reply?.type === "FILE_UPLOAD") {
      const file = await ctx.files.loadFileUpload(
        reply!.content["file_upload_id"]
      );

      if (file && file.upload_complete) {
        return await ctx.aws.fileUploads.getSignedDownloadEndpoint(
          file.path,
          file.filename,
          "inline"
        );
      } else {
        throw new WhitelistedError(
          "Can't find file for reply",
          "FILE_NOT_FOUND"
        );
      }
    } else {
      return reply?.content.text;
    }
  },
});
