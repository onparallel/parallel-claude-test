import {
  arg,
  enumType,
  inputObjectType,
  list,
  mutationField,
  nonNull,
  stringArg,
} from "@nexus/schema";
import pMap from "p-map";
import { isDefined, zip } from "remeda";
import { PublicFileUpload } from "../../db/__types";
import { partition } from "../../util/arrays";
import { removeNotDefined } from "../../util/remedaExtensions";
import { random } from "../../util/token";
import { Maybe } from "../../util/types";
import {
  and,
  argIsContextUserId,
  authenticate,
  authenticateAnd,
  ifArgDefined,
} from "../helpers/authorize";
import { ArgValidationError, WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { uploadArg } from "../helpers/upload";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { emailIsAvailable } from "../helpers/validators/emailIsAvailable";
import { maxLength } from "../helpers/validators/maxLength";
import { validPassword } from "../helpers/validators/validPassword";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { userIdNotIncludedInArray } from "../helpers/validators/notIncludedInArray";
import { validateFile } from "../helpers/validators/validateFile";
import { validEmail } from "../helpers/validators/validEmail";
import { validIsDefined } from "../helpers/validators/validIsDefined";
import { orgDoesNotHaveSsoProvider } from "../organization/authorizers";
import { argUserHasActiveStatus, userHasAccessToUsers } from "../petition/mutations/authorizers";
import {
  contextUserIsAdmin,
  contextUserIsNotSso,
  userHasRole,
  userIsNotContextUser,
  userIsNotSSO,
} from "./authorizers";
import { fullName } from "../../util/fullName";

export const updateUser = mutationField("updateUser", {
  type: "User",
  description: "Updates the user with the provided data.",
  authorize: authenticateAnd(argIsContextUserId("id"), contextUserIsNotSso()),
  args: {
    id: nonNull(globalIdArg("User")),
    data: nonNull(
      inputObjectType({
        name: "UpdateUserInput",
        definition(t) {
          t.string("firstName");
          t.string("lastName");
          t.field("role", { type: "OrganizationRole" });
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
      `User:${ctx.user!.id}`
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
  authorize: authenticateAnd(contextUserIsNotSso()),
  args: {
    password: nonNull(stringArg()),
    newPassword: nonNull(stringArg()),
  },
  resolve: async (o, { password, newPassword }, ctx) => {
    try {
      await ctx.auth.changePassword(ctx.req, password, newPassword);
      return "SUCCESS";
    } catch (error: any) {
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
  description: "Creates a new user in the same organization as the context user",
  type: "User",
  authorize: authenticateAnd(contextUserIsAdmin(), orgDoesNotHaveSsoProvider()),
  args: {
    email: nonNull(stringArg()),
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    role: nonNull(arg({ type: "OrganizationRole" })),
    locale: stringArg(),
  },
  validateArgs: validateAnd(
    validEmail((args) => args.email, "email"),
    emailIsAvailable((args) => args.email, "email"),
    (_, { role }, ctx, info) => {
      if (role === "OWNER") {
        throw new ArgValidationError(info, "role", "Can't create a new user with OWNER role.");
      }
    }
  ),
  resolve: async (_, args, ctx) => {
    const organization = await ctx.organizations.loadOrg(ctx.user!.org_id);
    const email = args.email.trim().toLowerCase();
    const cognitoId = await ctx.aws.createCognitoUser(
      email,
      null,
      args.firstName,
      args.lastName,
      {
        locale: args.locale ?? "en",
        organizationName: organization!.name,
        organizationUser: fullName(ctx.user!.first_name, ctx.user!.last_name),
      },
      true
    );
    return await ctx.users.createUser(
      {
        cognito_id: cognitoId!,
        org_id: ctx.user!.org_id,
        organization_role: args.role,
        email,
        first_name: args.firstName,
        last_name: args.lastName,
      },
      `User:${ctx.user!.id}`
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
    userIsNotSSO("userIds"),
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
      (args) => args.status === "INACTIVE",
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
  resolve: async (_, { userIds, status, transferToUserId }, ctx) => {
    if (status === "ACTIVE") {
      return await ctx.users.updateUserById(userIds, { status }, `User:${ctx.user!.id}`);
    } else {
      const permissionsByUserId = await ctx.petitions.loadPetitionPermissionsByUserId(userIds);

      return await ctx.petitions.withTransaction(async (t) => {
        await ctx.userGroups.removeUsersFromAllGroups(userIds, `User:${ctx.user!.id}`, t);
        return await pMap(
          zip(userIds, permissionsByUserId),
          async ([userId, userPermissions]) => {
            const [ownedPermissions, notOwnedPermissions] = partition(
              userPermissions,
              (p) => p.type === "OWNER"
            );
            const [[user]] = await Promise.all([
              ctx.users.updateUserById(userId, { status }, `User:${ctx.user!.id}`, t),
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
          },
          { concurrency: 1 }
        );
      });
    }
  },
});

export const updateOrganizationUser = mutationField("updateOrganizationUser", {
  description: "Updates the role of another user in the organization.",
  type: "User",
  authorize: authenticateAnd(
    contextUserIsAdmin(),
    userIsNotContextUser("userId"),
    userHasAccessToUsers("userId"),
    userHasRole("userId", ["ADMIN", "NORMAL"])
  ),
  args: {
    userId: nonNull(globalIdArg("User")),
    role: nonNull("OrganizationRole"),
  },
  validateArgs: (_, { role }, ctx, info) => {
    if (role === "OWNER") {
      throw new ArgValidationError(info, "role", "Can't update the role of a user to OWNER.");
    }
  },
  resolve: async (_, { userId, role }, ctx) => {
    const [user] = await ctx.users.updateUserById(
      userId,
      { organization_role: role },
      `User:${ctx.user!.id}`
    );

    return user;
  },
});

export const userSignUp = mutationField("userSignUp", {
  description: "Triggered by new users that want to sign up into Parallel",
  type: "User",
  args: {
    email: nonNull(stringArg()),
    password: nonNull(stringArg()),
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    organizationName: nonNull(stringArg()),
    locale: stringArg({
      description: "Preferred locale for AWS Cognito CustomMessages.",
    }),
    organizationLogo: uploadArg(),
    industry: stringArg(),
    role: stringArg(),
    position: stringArg(),
  },
  validateArgs: validateAnd(
    validPassword((args) => args.password),
    validEmail((args) => args.email, "email"),
    emailIsAvailable((args) => args.email, "email"),
    validateIf(
      (args) => isDefined(args.organizationLogo),
      validateFile(
        (args) => args.organizationLogo!,
        { contentType: "image/png", maxSize: 1024 * 50 },
        "organizationLogo"
      )
    )
  ),
  resolve: async (_, args, ctx) => {
    return await ctx.users.withTransaction(async (t) => {
      let logoFile: Maybe<PublicFileUpload> = null;
      if (args.organizationLogo) {
        const { mimetype, createReadStream } = await args.organizationLogo;
        const filename = random(16);
        const path = `uploads/${filename}`;
        const res = await ctx.aws.publicFiles.uploadFile(path, mimetype, createReadStream());
        logoFile = await ctx.files.createPublicFile(
          {
            path,
            filename,
            content_type: mimetype,
            size: res["ContentLength"]!.toString(),
          },
          undefined,
          t
        );
      }

      const org = await ctx.organizations.createOrganization(
        {
          name: args.organizationName,
          identifier: args.organizationName
            .trim()
            .toLowerCase()
            .replace(/ /g, "-")
            // make sure the identifier is unique on organizations with the same name
            // TODO maybe we can drop this column in db
            .concat(`-${random(6)}`),
          status: "ACTIVE",
          logo_public_file_id: logoFile?.id ?? null,
        },
        undefined,
        t
      );

      const cognitoId = await ctx.aws
        .signUpUser(args.email, args.password, args.firstName, args.lastName, {
          locale: args.locale ?? "en",
        })
        .catch(async (e) => {
          // delete user from AWS Cognito, then throw the error to do a transaction rollback
          await ctx.aws.deleteUser(args.email).catch(() => {});
          if (e.code === "InvalidPasswordException") {
            throw new WhitelistedError(e.message, "INVALID_PASSWORD_ERROR");
          } else {
            throw e;
          }
        });

      const user = await ctx.users.createUser(
        {
          cognito_id: cognitoId,
          email: args.email,
          org_id: org.id,
          first_name: args.firstName,
          last_name: args.lastName,
          organization_role: "OWNER",
          status: "ACTIVE",
          details: { industry: args.industry, role: args.role, position: args.position },
        },
        undefined,
        t
      );

      // once the user is created, we need to update the created_by column on the different entries
      const [[newUser]] = await Promise.all([
        ctx.users.updateUserById(user.id, { created_by: `User:${user.id}` }, `User:${user.id}`, t),
        logoFile
          ? ctx.files.updatePublicFile(
              logoFile.id,
              { created_by: `User:${user.id}` },
              `User:${user.id}`,
              t
            )
          : null,
        ctx.organizations.updateOrganization(
          org.id,
          {
            created_by: `User:${user.id}`,
          },
          `User:${user.id}`,
          t
        ),
      ]);
      return newUser;
    });
  },
});

export const resendVerificationCode = mutationField("resendVerificationCode", {
  description: "Sends an email with confirmation code to unconfirmed user emails",
  type: "Result",
  args: {
    email: nonNull(stringArg()),
    locale: stringArg(),
  },
  validateArgs: validEmail((args) => args.email, "email"),
  resolve: async (_, { email, locale }, ctx) => {
    try {
      await ctx.aws.resendVerificationCode(email, { locale: locale ?? "en" });
      return RESULT.SUCCESS;
    } catch {
      return RESULT.FAILURE;
    }
  },
});
