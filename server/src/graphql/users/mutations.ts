import {
  arg,
  enumType,
  inputObjectType,
  list,
  mutationField,
  nonNull,
  stringArg,
} from "@nexus/schema";
import { mapSeries } from "async";
import { zip } from "remeda";
import { PetitionUser, User } from "../../db/__types";
import { partition } from "../../util/arrays";
import { removeNotDefined } from "../../util/remedaExtensions";
import {
  and,
  argIsContextUserId,
  authenticate,
  authenticateAnd,
  chain,
  ifArgDefined,
} from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { emailIsAvailable } from "../helpers/validators/emailIsAvailable";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { userIdNotIncludedInArray } from "../helpers/validators/notIncludedInArray";
import { validEmail } from "../helpers/validators/validEmail";
import { validIsDefined } from "../helpers/validators/validIsDefined";
import {
  argUserHasActiveStatus,
  userHasAccessToUsers,
} from "../petition/mutations/authorizers";
import { contextUserIsAdmin } from "./authorizers";

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
  validateArgs: validateAnd(
    validEmail((args) => args.email, "email"),
    emailIsAvailable((args) => args.email, "email")
  ),
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

export const updateUserStatus = mutationField("updateUserStatus", {
  description:
    "Updates user status and, if new status is INACTIVE, transfers their owned petitions to another user in the org.",
  type: list("User"),
  authorize: authenticateAnd(
    contextUserIsAdmin(),
    userHasAccessToUsers("userIds"),
    ifArgDefined(
      "transferToUserId",
      and(
        userHasAccessToUsers("transferToUserId" as any),
        argUserHasActiveStatus("transferToUserId" as any)
      )
    )
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.userIds, "userIds"),
    userIdNotIncludedInArray((args) => args.userIds, "userIds"),
    validateIf(
      "status",
      "INACTIVE",
      validateAnd(
        validIsDefined((args) => args.transferToUserId, "transferToUserId"),
        (_, { userIds, transferToUserId }, ctx, info) => {
          if (transferToUserId && userIds.includes(transferToUserId)) {
            throw new ArgValidationError(
              info,
              "transferToUserId",
              "Can't transfer to a user that will be disabled."
            );
          }
        }
      )
    )
  ),
  args: {
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
    status: nonNull(arg({ type: "UserStatus" })),
    transferToUserId: globalIdArg("User"),
  },
  resolve: async (_, { userIds, status, transferToUserId }, ctx, info) => {
    if (status === "ACTIVE") {
      return await ctx.users.updateUserById(userIds, { status }, ctx.user!);
    } else {
      const permissionsByUserId = await ctx.petitions.loadUserPermissionsByUserId(
        userIds
      );
      return await mapSeries<[number, PetitionUser[]], User>(
        zip(userIds, permissionsByUserId),
        async ([userId, userPermissions]) => {
          return await ctx.petitions.withTransaction(async (t) => {
            const [ownedPermissions, notOwnedPermissions] = partition(
              userPermissions,
              (p) => p.permission_type === "OWNER"
            );
            const [[user]] = await Promise.all([
              ctx.users.updateUserById(userId, { status }, ctx.user!, t),
              // delete permissions with type !== OWNER
              notOwnedPermissions.length > 0
                ? ctx.petitions.deleteUserPermissions(
                    notOwnedPermissions.map((p) => p.petition_id),
                    userId,
                    ctx.user!,
                    t
                  )
                : undefined,
              // transfer OWNER permissions to new user and remove original permissions
              ownedPermissions.length > 0
                ? ctx.petitions.transferOwnership(
                    ownedPermissions.map((p) => p.petition_id),
                    transferToUserId!,
                    false,
                    ctx.user!,
                    t
                  )
                : undefined,
            ]);
            return user;
          });
        }
      );
    }
  },
});
