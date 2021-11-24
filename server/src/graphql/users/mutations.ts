import { arg, enumType, inputObjectType, list, mutationField, nonNull, stringArg } from "nexus";
import pMap from "p-map";
import { isDefined, zip } from "remeda";
import { PublicFileUpload } from "../../db/__types";
import { partition } from "../../util/arrays";
import { fullName } from "../../util/fullName";
import { withError } from "../../util/promises/withError";
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
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { uploadArg } from "../helpers/upload";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { emailDomainIsNotSSO } from "../helpers/validators/emailDomainIsNotSSO";
import { emailIsAvailable } from "../helpers/validators/emailIsAvailable";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { userIdNotIncludedInArray } from "../helpers/validators/notIncludedInArray";
import { validateFile } from "../helpers/validators/validateFile";
import { validEmail } from "../helpers/validators/validEmail";
import { validIsDefined } from "../helpers/validators/validIsDefined";
import { validPassword } from "../helpers/validators/validPassword";
import { orgCanCreateNewUser, orgDoesNotHaveSsoProvider } from "../organization/authorizers";
import { argUserHasActiveStatus, userHasAccessToUsers } from "../petition/mutations/authorizers";
import {
  contextUserIsAdmin,
  contextUserIsNotSso,
  userHasRole,
  userIsNotContextUser,
  userIsNotSSO,
} from "./authorizers";

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
  authorize: authenticateAnd(
    contextUserIsAdmin(),
    orgDoesNotHaveSsoProvider(),
    orgCanCreateNewUser()
  ),
  args: {
    email: nonNull(stringArg()),
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    role: nonNull(arg({ type: "OrganizationRole" })),
    locale: stringArg(),
  },
  validateArgs: validateAnd(
    validEmail((args) => args.email, "email"),
    emailIsAvailable((args) => args.email),
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
    const [user] = await Promise.all([
      ctx.users.createUser(
        {
          cognito_id: cognitoId!,
          org_id: ctx.user!.org_id,
          organization_role: args.role,
          email,
          first_name: args.firstName,
          last_name: args.lastName,
          details: { source: "org-invitation", preferredLocale: args.locale ?? "en" },
        },
        `User:${ctx.user!.id}`
      ),
      ctx.system.createEvent({
        type: "INVITE_SENT",
        data: {
          invited_by: ctx.user!.id,
          email,
          first_name: args.firstName,
          last_name: args.lastName,
          role: args.role,
        },
      }),
    ]);
    return user;
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
      return await ctx.petitions.withTransaction(async (t) => {
        await ctx.userGroups.removeUsersFromAllGroups(userIds, `User:${ctx.user!.id}`, t);
        const permissions = await ctx.petitions.loadDirectlyAssignedUserPetitionPermissionsByUserId(
          userIds
        );
        return await pMap(
          zip(userIds, permissions),
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
              ctx.petitions.transferPublicLinkOwnership([userId], transferToUserId!, ctx.user!, t),
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
    emailIsAvailable((args) => args.email),
    emailDomainIsNotSSO((args) => args.email),
    validateIf(
      (args) => isDefined(args.organizationLogo),
      validateFile(
        (args) => args.organizationLogo!,
        { contentType: "image/png", maxSize: 1024 * 150 },
        "organizationLogo"
      )
    )
  ),
  resolve: async (_, args, ctx) => {
    const [error, cognitoId] = await withError(
      ctx.aws.signUpUser(args.email, args.password, args.firstName, args.lastName, {
        locale: args.locale ?? "en",
      })
    );
    if (error) {
      await withError(ctx.aws.deleteUser(args.email));
      throw error;
    }

    let logoFile: Maybe<PublicFileUpload> = null;
    if (args.organizationLogo) {
      const { mimetype, createReadStream } = await args.organizationLogo;
      const filename = random(16);
      const path = `uploads/${filename}`;
      const res = await ctx.aws.publicFiles.uploadFile(path, mimetype, createReadStream());
      logoFile = await ctx.files.createPublicFile({
        path,
        filename,
        content_type: mimetype,
        size: res["ContentLength"]!.toString(),
      });
    }

    return await ctx.users.withTransaction(async (t) => {
      const org = await ctx.organizations.createOrganization(
        {
          name: args.organizationName,
          status: "ACTIVE",
          logo_public_file_id: logoFile?.id ?? null,
        },
        undefined,
        t
      );

      const user = await ctx.users.createUser(
        {
          cognito_id: cognitoId!,
          email: args.email,
          org_id: org.id,
          first_name: args.firstName,
          last_name: args.lastName,
          organization_role: "OWNER",
          status: "ACTIVE",
          details: {
            source: "self-service",
            industry: args.industry,
            role: args.role,
            position: args.position,
            preferredLocale: args.locale ?? "en",
          },
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

export const setUserPreferredLocale = mutationField("setUserPreferredLocale", {
  description:
    "Sets the locale passed as arg as the preferred language of the user to see the page",
  type: "User",
  args: {
    locale: nonNull(stringArg()),
  },
  authorize: authenticate(),
  validateArgs: (_, { locale }, ctx, info) => {
    // only supported locales
    if (!["en", "es"].includes(locale)) {
      throw new ArgValidationError(info, "locale", `Unknown locale ${locale}.`);
    }
  },
  resolve: async (_, { locale }, ctx) => {
    const [user] = await ctx.users.updateUserById(
      ctx.user!.id,
      {
        details: {
          ...(ctx.user!.details ?? {}),
          preferredLocale: locale,
        },
      },
      `User:${ctx.user!.id}`
    );
    return user;
  },
});
