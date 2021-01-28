import {
  list,
  mutationField,
  nonNull,
  objectType,
  stringArg,
} from "@nexus/schema";
import { authenticateAnd } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { userHasFeatureFlag } from "../petition/authorizers";
import { userHasAccessToAuthTokens } from "./authorizers";

export const generateUserAuthToken = mutationField("generateUserAuthToken", {
  description: "Generates a new API token for the context user",
  type: nonNull(
    objectType({
      name: "GenerateUserAuthTokenResponse",
      definition(t) {
        t.nonNull.field("userAuthToken", { type: "UserAuthenticationToken" });
        t.nonNull.string("apiKey");
      },
    })
  ),
  authorize: authenticateAnd(userHasFeatureFlag("API_TOKENS")),
  args: {
    tokenName: nonNull(stringArg()),
  },
  resolve: async (_, { tokenName }, ctx) => {
    try {
      return await ctx.userAuthentication.createUserAuthenticationToken(
        tokenName,
        ctx.user!
      );
    } catch (e) {
      if (e.constraint === "user_authentication_token__token_name_user_id") {
        throw new WhitelistedError(
          "Token name must be unique",
          "UNIQUE_TOKEN_NAME_ERROR"
        );
      } else {
        throw e;
      }
    }
  },
});

export const revokeUserAuthToken = mutationField("revokeUserAuthToken", {
  description:
    "Soft-deletes a given auth token, making it permanently unusable.",
  type: "Result",
  authorize: authenticateAnd(
    userHasFeatureFlag("API_TOKENS"),
    userHasAccessToAuthTokens("authTokenIds")
  ),
  args: {
    authTokenIds: nonNull(
      list(nonNull(globalIdArg("UserAuthenticationToken")))
    ),
  },
  resolve: async (_, { authTokenIds }, ctx) => {
    try {
      await ctx.userAuthentication.deleteUserAuthenticationTokens(
        authTokenIds,
        ctx.user!
      );
      return RESULT.SUCCESS;
    } catch {}
    return RESULT.FAILURE;
  },
});
