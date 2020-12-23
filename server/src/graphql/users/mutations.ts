import {
  enumType,
  inputObjectType,
  mutationField,
  stringArg,
  arg,
  nonNull,
} from "@nexus/schema";
import { removeNotDefined } from "../../util/remedaExtensions";
import {
  argIsContextUserId,
  authenticate,
  authenticateAnd,
  chain,
} from "../helpers/authorize";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { contextUserIsAdmin } from "./authorizers";
import { validEmail } from "../helpers/validators/validEmail";

export const updateUser = mutationField("updateUser", {
  type: "User",
  description: "Updates the user with the provided data.",
  authorize: chain(authenticate(), argIsContextUserId("id")),
  args: {
    id: nonNull(globalIdArg("User")),
    data: nonNull(
      inputObjectType({
        name: "UpdateUserInput",
        definition(t) {
          t.string("firstName");
          t.string("lastName");
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    maxLength((args) => args.data.firstName, "data.firstName", 255),
    maxLength((args) => args.data.lastName, "data.lastName", 255)
  ),
  resolve: async (_, args, ctx) => {
    const { firstName, lastName } = args.data;
    const [user] = await ctx.users.updateUserById(
      args.id,
      removeNotDefined({
        first_name: firstName,
        last_name: lastName,
      }),
      ctx.user!
    );
    return user;
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
    password: nonNull(stringArg()),
    newPassword: nonNull(stringArg()),
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
    key: nonNull(arg({ type: "OnboardingKey" })),
    status: nonNull(arg({ type: "OnboardingStatus" })),
  },
  resolve: async (o, { key, status }, ctx) => {
    return ctx.users.updateUserOnboardingStatus(key, status, ctx.user!);
  },
});

export const createOrganizationUser = mutationField("createOrganizationUser", {
  description:
    "Creates a new user in the same organization as the context user",
  type: "User",
  authorize: authenticateAnd(contextUserIsAdmin()),
  args: {
    email: nonNull(stringArg()),
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    role: nonNull(arg({ type: "OrganizationRole" })),
  },
  validateArgs: validEmail((args) => args.email, "email"),
  resolve: async (_, args, ctx) => {
    const cognitoId = await ctx.aws.createCognitoUser(
      args.email,
      undefined,
      true
    );
    return await ctx.users.createUser(
      {
        cognito_id: cognitoId!,
        org_id: ctx.user!.org_id,
        organization_role: args.role,
        email: args.email,
        first_name: args.firstName,
        last_name: args.lastName,
      },
      ctx.user!
    );
  },
});
