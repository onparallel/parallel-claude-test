import {
  enumType,
  inputObjectType,
  mutationField,
  stringArg,
  arg,
} from "@nexus/schema";
import { removeNotDefined } from "../../util/remedaExtensions";
import { argIsContextUserId, authenticate, chain } from "../helpers/authorize";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { globalIdArg } from "../helpers/globalIdPlugin";

export const updateUser = mutationField("updateUser", {
  type: "User",
  description: "Updates the user with the provided data.",
  authorize: chain(authenticate(), argIsContextUserId("id")),
  args: {
    id: globalIdArg("User", { required: true }),
    data: inputObjectType({
      name: "UpdateUserInput",
      definition(t) {
        t.string("firstName");
        t.string("lastName");
      },
    }).asArg({ required: true }),
  },
  validateArgs: validateAnd(
    maxLength((args) => args.data.firstName, "data.firstName", 255),
    maxLength((args) => args.data.lastName, "data.lastName", 255)
  ),
  resolve: async (_, args, ctx) => {
    const { firstName, lastName } = args.data;
    return await ctx.users.updateUserById(
      args.id,
      removeNotDefined({
        first_name: firstName,
        last_name: lastName,
      }),
      ctx.user!
    );
  },
});

export const changePassword = mutationField("changePassword", {
  description: "Changes the password for the current logged in user.",
  type: enumType({
    name: "ChangePasswordResult",
    members: ["SUCCESS", "INCORRECT_PASSWORD", "INVALID_NEW_PASSWORD"],
  }),
  authorize: authenticate(),
  args: {
    password: stringArg({ required: true }),
    newPassword: stringArg({ required: true }),
  },
  resolve: async (o, { password, newPassword }, ctx) => {
    try {
      await ctx.cognito.changePassword(ctx.user!.email, password, newPassword);
      return "SUCCESS";
    } catch (error) {
      switch (error.code) {
        case "NotAuthorizedException":
          return "INCORRECT_PASSWORD";
        case "InvalidPasswordException":
          return "INVALID_NEW_PASSWORD";
      }
      throw error;
    }
  },
});

export const OnboardingKey = enumType({
  name: "OnboardingKey",
  members: [
    "PETITIONS_LIST",
    "PETITION_COMPOSE",
    "PETITION_REVIEW",
    "PETITION_ACTIVITY",
    "CONTACT_LIST",
    "CONTACT_DETAILS",
  ],
});

export const OnboardingStatus = enumType({
  name: "OnboardingStatus",
  members: ["FINISHED", "SKIPPED"],
});

export const updateOnboardingStatus = mutationField("updateOnboardingStatus", {
  description: "Updates the onboarding status for one of the pages.",
  type: "User",
  authorize: authenticate(),
  args: {
    key: arg({ type: "OnboardingKey", required: true }),
    status: arg({ type: "OnboardingStatus", required: true }),
  },
  resolve: async (o, { key, status }, ctx) => {
    return ctx.users.updateUserOnboardingStatus(key, status, ctx.user!);
  },
});
