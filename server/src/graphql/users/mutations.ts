import {
  InvalidParameterException,
  InvalidPasswordException,
  LimitExceededException,
  NotAuthorizedException,
} from "@aws-sdk/client-cognito-identity-provider";
import { differenceInMinutes } from "date-fns";
import {
  arg,
  booleanArg,
  enumType,
  list,
  mutationField,
  nonNull,
  nullable,
  stringArg,
} from "nexus";
import pMap from "p-map";
import { difference, isDefined, partition, uniq, zip } from "remeda";
import { LicenseCode, PublicFileUpload } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { withError } from "../../util/promises/withError";
import { removeNotDefined } from "../../util/remedaExtensions";
import { random } from "../../util/token";
import { Maybe } from "../../util/types";
import { RESULT } from "../helpers/Result";
import {
  and,
  authenticate,
  authenticateAnd,
  ifArgDefined,
  or,
  userIsSuperAdmin,
  verifyCaptcha,
} from "../helpers/authorize";
import { ApolloError, ArgValidationError, ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { uploadArg } from "../helpers/scalars/Upload";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { emailDomainIsNotSSO } from "../helpers/validators/emailDomainIsNotSSO";
import { emailIsAvailable } from "../helpers/validators/emailIsAvailable";
import { maxActiveUsers } from "../helpers/validators/maxActiveUsers";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { userIdNotIncludedInArray } from "../helpers/validators/notIncludedInArray";
import { validEmail } from "../helpers/validators/validEmail";
import { validPassword } from "../helpers/validators/validPassword";
import { validateFile } from "../helpers/validators/validateFile";
import { orgCanCreateNewUser, orgDoesNotHaveSsoProvider } from "../organization/authorizers";
import { userHasFeatureFlag } from "../petition/authorizers";
import { argUserHasStatus, userHasAccessToUsers } from "../petition/mutations/authorizers";
import { userHasAccessToTags } from "../tag/authorizers";
import { userGroupHasType, userHasAccessToUserGroups } from "../user-group/authorizers";
import {
  contextUserHasPermission,
  contextUserIsNotSso,
  emailIsNotRegisteredInTargetOrg,
  userHasStatus,
  userIsNotContextUser,
  userIsNotOrgOwner,
  userIsNotSSO,
} from "./authorizers";

export const updateUser = mutationField("updateUser", {
  type: "User",
  description: "Updates the user with the provided data.",
  authorize: authenticateAnd(contextUserIsNotSso()),
  args: {
    firstName: stringArg(),
    lastName: stringArg(),
  },
  validateArgs: validateAnd(
    maxLength((args) => args.firstName, "data.firstName", 255),
    maxLength((args) => args.lastName, "data.lastName", 255),
  ),
  resolve: async (_, args, ctx) => {
    const { firstName, lastName } = args;
    await ctx.users.updateUserData(
      ctx.user!.user_data_id,
      removeNotDefined({
        first_name: firstName,
        last_name: lastName,
      }),
      `User:${ctx.user!.id}`,
    );
    return ctx.user!;
  },
});

export const changePassword = mutationField("changePassword", {
  description: "Changes the password for the current logged in user.",
  type: enumType({
    name: "ChangePasswordResult",
    members: ["SUCCESS", "INCORRECT_PASSWORD", "INVALID_NEW_PASSWORD", "LIMIT_EXCEEDED"],
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
    } catch (error) {
      if (error instanceof NotAuthorizedException || error instanceof InvalidParameterException) {
        return "INCORRECT_PASSWORD";
      } else if (error instanceof InvalidPasswordException) {
        return "INVALID_NEW_PASSWORD";
      } else if (error instanceof LimitExceededException) {
        return "LIMIT_EXCEEDED";
      } else {
        throw error;
      }
    }
  },
});

export const inviteUserToOrganization = mutationField("inviteUserToOrganization", {
  description:
    "Creates a new user in the same organization as the context user if `orgId` is not provided",
  type: "User",
  authorize: authenticateAnd(
    ifArgDefined(
      "orgId",
      userIsSuperAdmin(),
      and(
        orgDoesNotHaveSsoProvider(),
        orgCanCreateNewUser(),
        contextUserHasPermission("USERS:CRUD_USERS"),
        userHasAccessToUserGroups("userGroupIds"),
        userGroupHasType("userGroupIds", ["NORMAL", "INITIAL"]),
      ),
    ),
    emailIsNotRegisteredInTargetOrg("email", "orgId" as never),
  ),
  args: {
    email: nonNull(stringArg()),
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    /** @deprecated remove this argument */
    role: nullable(arg({ type: "OrganizationRole" })),
    locale: nonNull("UserLocale"),
    userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
    orgId: globalIdArg("Organization"),
  },
  validateArgs: validateAnd(
    validEmail((args) => args.email, "email"),
    /** @deprecated remove this validation */
    (_, { role }, ctx, info) => {
      if (role === "OWNER") {
        throw new ArgValidationError(info, "role", "Can't create a new user with OWNER role.");
      }
    },
  ),
  resolve: async (_, args, ctx) => {
    // if orgId is provided the invitation email will be anonymous
    const orgId = args.orgId ?? ctx.user!.org_id;

    const [organization, userData] = await Promise.all([
      ctx.organizations.loadOrg(orgId),
      ctx.users.loadUserData(ctx.user!.user_data_id),
    ]);
    const email = args.email.trim().toLowerCase();
    const firstName = args.firstName.trim();
    const lastName = args.lastName.trim();

    const cognitoId = await ctx.auth.getOrCreateCognitoUser(
      email,
      null,
      firstName,
      lastName,
      {
        locale: args.locale,
        organizationName: organization!.name,
        organizationUser: args.orgId ? "" : fullName(userData!.first_name, userData!.last_name),
      },
      true,
    );
    const [user] = await Promise.all([
      ctx.users.createUser(
        {
          org_id: orgId,
          /** @deprecated */
          organization_role: args.role ?? null,
        },
        {
          cognito_id: cognitoId!,
          email,
          first_name: firstName,
          last_name: lastName,
          details: {
            source: "org-invitation",
          },
          preferred_locale: args.locale,
        },
        `User:${ctx.user!.id}`,
      ),
      ctx.system.createEvent({
        type: "INVITE_SENT",
        data: {
          invited_by: ctx.user!.id,
          email,
          first_name: firstName,
          last_name: lastName,
        },
      }),
    ]);

    const allUsersGroups = await ctx.userGroups.loadAllUsersGroupsByOrgId(orgId);

    await ctx.userGroups.addUsersToGroups(
      uniq([...(args.userGroupIds ?? []), ...allUsersGroups.map((ug) => ug.id)]),
      user.id,
      `User:${ctx.user!.id}`,
    );

    ctx.userGroups.loadUserGroupsByUserId.dataloader.clear(user.id);

    return user;
  },
});

export const activateUser = mutationField("activateUser", {
  description: "set user status to ACTIVE.",
  type: list("User"),
  authorize: authenticateAnd(
    contextUserHasPermission("USERS:CRUD_USERS"),
    userHasAccessToUsers("userIds"),
    userIsNotSSO("userIds"),
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.userIds, "userIds"),
    userIdNotIncludedInArray((args) => args.userIds, "userIds"),
    maxActiveUsers((args) => args.userIds),
  ),
  args: {
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
  },
  resolve: async (_, { userIds }, ctx) => {
    const allUsersGroups = await ctx.userGroups.loadAllUsersGroupsByOrgId(ctx.user!.org_id);
    await ctx.userGroups.addUsersToGroups(
      allUsersGroups.map((ug) => ug.id),
      userIds,
      `User:${ctx.user!.id}`,
    );

    return await ctx.users.updateUserById(userIds, { status: "ACTIVE" }, `User:${ctx.user!.id}`);
  },
});

export const deactivateUser = mutationField("deactivateUser", {
  description:
    "Updates user status to INACTIVE and transfers their owned petitions to another user in the org.",
  type: list("User"),
  authorize: authenticateAnd(
    contextUserHasPermission("USERS:CRUD_USERS"),
    userHasAccessToUsers("userIds"),
    or(userIsNotSSO("userIds"), argUserHasStatus("userIds", "ON_HOLD")),
    userIsNotOrgOwner("userIds"),
    userHasAccessToUsers("transferToUserId"),
    argUserHasStatus("transferToUserId", "ACTIVE"),
    userHasAccessToTags("tagIds"),
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.userIds, "userIds"),
    userIdNotIncludedInArray((args) => args.userIds, "userIds"),
    (_, { userIds, transferToUserId }, ctx, info) => {
      if (userIds.includes(transferToUserId)) {
        throw new ArgValidationError(
          info,
          "transferToUserId",
          "Can't transfer to a user that will be disabled.",
        );
      }
    },
  ),
  args: {
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
    transferToUserId: nonNull(globalIdArg("User")),
    tagIds: list(nonNull(globalIdArg("Tag"))),
    includeDrafts: booleanArg(),
  },
  resolve: async (_, { userIds, transferToUserId, tagIds, includeDrafts }, ctx) => {
    const permissions =
      await ctx.petitions.loadDirectlyAssignedUserPetitionPermissionsByUserId(userIds);

    return await ctx.petitions.withTransaction(async (t) => {
      await ctx.userGroups.removeUsersFromAllGroups(userIds, `User:${ctx.user!.id}`, t);

      return await pMap(
        zip(userIds, permissions),
        async ([userId, userPermissions]) => {
          const [ownedPermissions, notOwnedPermissions] = partition(
            userPermissions,
            (p) => p.type === "OWNER",
          );

          const petitions = (
            await ctx.petitions.loadPetition.raw(
              ownedPermissions.map((p) => p.petition_id),
              t,
            )
          ).filter(isDefined);
          const draftsIds = petitions.filter((p) => p.status === "DRAFT").map((p) => p.id);
          const ownedPetitionIds = petitions
            .filter((p) => (includeDrafts ? true : p.status !== "DRAFT"))
            .map((p) => p.id);

          const [user] = await ctx.users.updateUserById(
            userId,
            { status: "INACTIVE" },
            `User:${ctx.user!.id}`,
            t,
          );

          if (notOwnedPermissions.length > 0) {
            // delete permissions with type !== OWNER
            await ctx.petitions.deleteUserPermissions(
              notOwnedPermissions.map((p) => p.petition_id),
              userId,
              ctx.user!,
              t,
            );
          }

          await ctx.petitions.removeTemplateDefaultPermissionsForUser(
            userId,
            `User:${ctx.user!.id}`,
            t,
          );

          if (ownedPermissions.length > 0) {
            // transfer OWNER permissions to new user and remove original permissions
            await ctx.petitions.transferOwnership(
              ownedPermissions.map((p) => p.petition_id),
              transferToUserId,
              false,
              ctx.user!,
              t,
            );
          }

          await ctx.petitions.transferPublicLinkOwnership(userId, transferToUserId, ctx.user!, t);

          if (isDefined(tagIds) && ownedPetitionIds.length > 0) {
            await ctx.tags.tagPetition(tagIds, ownedPetitionIds, ctx.user!, t);
          }

          if (!includeDrafts && draftsIds.length > 0) {
            await ctx.petitions.deletePetition(draftsIds, ctx.user!, t);
          }

          return user;
        },
        { concurrency: 1 },
      );
    });
  },
});

export const updateUserGroupMembership = mutationField("updateUserGroupMembership", {
  description: "Inserts the user into all provided user groups.",
  type: "User",
  authorize: authenticateAnd(
    contextUserHasPermission("USERS:CRUD_USERS"),
    userHasAccessToUsers("userId"),
    userHasAccessToUserGroups("userGroupIds"),
    userHasStatus("userId", ["ACTIVE", "ON_HOLD"]),
    userGroupHasType("userGroupIds", ["NORMAL", "INITIAL"]),
  ),
  args: {
    userId: nonNull(globalIdArg("User")),
    userGroupIds: nonNull(list(nonNull(globalIdArg("UserGroup")))),
  },
  resolve: async (_, { userId, userGroupIds }, ctx) => {
    return await ctx.petitions.withTransaction(async (t) => {
      const userGroups = await ctx.userGroups.loadUserGroupsByUserId(userId);
      const actualUserGroupsIds = userGroups
        .filter((ug) => ug.type !== "ALL_USERS") // avoid removing ALL_USERS group
        .map((userGroup) => userGroup.id);

      const userGroupsIdsToDelete = difference(actualUserGroupsIds, userGroupIds);
      const userGroupsIdsToAdd = difference(userGroupIds, actualUserGroupsIds);

      await ctx.userGroups.addUsersToGroups(userGroupsIdsToAdd, userId, `User:${ctx.user!.id}`, t);

      await ctx.userGroups.removeUsersFromGroups(
        userId,
        userGroupsIdsToDelete,
        `User:${ctx.user!.id}`,
        t,
      );

      ctx.userGroups.loadUserGroupsByUserId.dataloader.clear(userId);

      return (await ctx.users.loadUser(userId))!;
    });
  },
});

/** @deprecated */
export const updateOrganizationUser = mutationField("updateOrganizationUser", {
  deprecation: "use updateUserGroupMembership",
  description: "Updates the role of another user in the organization.",
  type: "User",
  authorize: authenticateAnd(
    contextUserHasPermission("USERS:CRUD_USERS"),
    userHasAccessToUsers("userId"),
    userHasAccessToUserGroups("userGroupIds"),
    userGroupHasType("userGroupIds", ["NORMAL", "INITIAL"]),
  ),
  args: {
    userId: nonNull(globalIdArg("User")),
    role: nonNull("OrganizationRole"),
    userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
  },
  validateArgs: async (_, { role, userId }, ctx, info) => {
    const user = (await ctx.users.loadUser(userId))!;
    if (user.id === ctx.user!.id && user.organization_role !== role) {
      throw new ArgValidationError(info, "role", "Can't update your own role");
    }
    if (role === "OWNER" && user.organization_role !== "OWNER") {
      throw new ArgValidationError(info, "role", "Can't update the role of a user to OWNER.");
    }
    if (user.organization_role === "OWNER" && role !== "OWNER") {
      throw new ArgValidationError(info, "role", "'Can't update the role of an OWNER");
    }
    if (user.status === "INACTIVE") {
      throw new ArgValidationError(info, "role", "'Can't update an INACTIVE user");
    }
  },
  resolve: async (_, { userId, role, userGroupIds }, ctx) => {
    return await ctx.petitions.withTransaction(async (t) => {
      const [user] = await ctx.users.updateUserById(
        userId,
        { organization_role: role },
        `User:${ctx.user!.id}`,
        t,
      );

      if (userGroupIds) {
        const userGroups = await ctx.userGroups.loadUserGroupsByUserId(userId);
        const actualUserGroupsIds = userGroups
          .filter((ug) => ug.type !== "ALL_USERS") // avoid removing ALL_USERS group
          .map((userGroup) => userGroup.id);

        const userGroupsIdsToDelete = difference(actualUserGroupsIds, userGroupIds);
        const userGroupsIdsToAdd = difference(userGroupIds, actualUserGroupsIds);

        await ctx.userGroups.addUsersToGroups(
          userGroupsIdsToAdd,
          userId,
          `User:${ctx.user!.id}`,
          t,
        );

        await ctx.userGroups.removeUsersFromGroups(
          userId,
          userGroupsIdsToDelete,
          `User:${ctx.user!.id}`,
          t,
        );

        ctx.userGroups.loadUserGroupsByUserId.dataloader.clear(userId);
      }

      return user;
    });
  },
});

export const signUp = mutationField("signUp", {
  description: "Triggered by new users that want to sign up into Parallel",
  type: "User",
  args: {
    email: nonNull(stringArg()),
    password: nonNull(stringArg()),
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    organizationName: nonNull(stringArg()),
    locale: nonNull(
      arg({
        type: "UserLocale",
        description: "Preferred locale for AWS Cognito CustomMessages.",
      }),
    ),
    organizationLogo: uploadArg(),
    industry: stringArg(),
    role: stringArg(),
    position: stringArg(),
    captcha: nonNull(stringArg()),
    licenseCode: stringArg(),
  },
  authorize: verifyCaptcha("captcha"),
  validateArgs: validateAnd(
    validPassword((args) => args.password),
    validEmail((args) => args.email, "email"),
    emailIsAvailable((args) => args.email),
    emailDomainIsNotSSO((args) => args.email),
    validateIf(
      (args) => isDefined(args.organizationLogo),
      validateFile(
        (args) => args.organizationLogo!,
        { contentType: ["image/png", "image/jpeg"], maxSize: 1024 * 1024 },
        "organizationLogo",
      ),
    ),
  ),
  resolve: async (_, args, ctx) => {
    let licenseCode: LicenseCode | null = null;
    if (isDefined(args.licenseCode)) {
      licenseCode = await ctx.licenseCodes.loadLicenseCode(args.licenseCode);
      if (licenseCode?.status !== "PENDING") {
        throw new ApolloError(
          `Provided license code is ${licenseCode?.status} and can't be used`,
          "INVALID_LICENSE_CODE",
        );
      }

      await ctx.licenseCodes.updateLicenseCode(
        licenseCode.id,
        { status: "REDEEMED" },
        `UserSignUp:${args.email}`,
      );
    }

    const source = licenseCode?.source ?? "self-service";
    const tierKey = licenseCode?.details.parallel_tier ?? "FREE";

    const email = args.email.trim().toLowerCase();
    const [error, cognitoId] = await withError(
      ctx.auth.signUpUser(email, args.password, args.firstName, args.lastName, {
        locale: args.locale,
      }),
    );
    if (error) {
      await withError(ctx.auth.deleteUser(email));
      throw error;
    }

    let logoFile: Maybe<PublicFileUpload> = null;
    if (args.organizationLogo) {
      const { mimetype, createReadStream } = await args.organizationLogo;
      const filename = random(16);
      const path = `uploads/${filename}`;
      const res = await ctx.storage.publicFiles.uploadFile(path, mimetype, createReadStream());
      logoFile = await ctx.files.createPublicFile(
        {
          path,
          filename,
          content_type: mimetype,
          size: res["ContentLength"]!.toString(),
        },
        `UserSignUp:${args.email}`,
      );
    }

    const { user } = await ctx.accountSetup.createOrganization(
      tierKey,
      {
        name: args.organizationName,
        status: source !== "self-service" ? "ACTIVE" : "DEMO",
        logo_public_file_id: logoFile?.id ?? null,
        appsumo_license:
          licenseCode && licenseCode.source === "AppSumo"
            ? {
                ...licenseCode.details,
                events: [licenseCode.details],
              }
            : null,
      },
      {
        cognito_id: cognitoId!,
        email,
        first_name: args.firstName,
        last_name: args.lastName,
        details: {
          source,
          industry: args.industry,
          role: args.role,
          position: args.position,
        },
        preferred_locale: args.locale,
      },
      `UserSignUp:${args.email}`,
    );

    return user;
  },
});

export const resendVerificationEmail = mutationField("resendVerificationEmail", {
  description:
    "Sends the AccountVerification email with confirmation code to unconfirmed user emails",
  type: "Result",
  args: {
    email: nonNull(stringArg()),
    locale: nonNull("UserLocale"),
  },
  validateArgs: validEmail((args) => args.email, "email"),
  resolve: async (_, { email, locale }, ctx) => {
    try {
      const users = await ctx.users.loadUsersByEmail(email);
      if (users.length === 0) {
        return RESULT.SUCCESS;
      }

      const [user] = users;
      const userData = await ctx.users.loadUserData(user.user_data_id);
      if (!userData) {
        return RESULT.SUCCESS;
      }
      if (
        !userData.is_sso_user &&
        (!userData.details.verificationCodeSentAt ||
          differenceInMinutes(new Date(), new Date(userData.details.verificationCodeSentAt)) >= 60)
      ) {
        await ctx.users.updateUserData(
          userData.id,
          {
            details: {
              ...(userData.details ?? {}),
              verificationCodeSentAt: new Date(),
            },
          },
          `User:${user.id}`,
        );
        await ctx.auth.resendVerificationCode(email, { locale });
      }
    } catch {}
    return RESULT.SUCCESS;
  },
});

export const publicResetTempPassword = mutationField("publicResetTempPassword", {
  description:
    "Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD",
  type: "Result",
  args: {
    email: nonNull(stringArg()),
    locale: nonNull("UserLocale"),
  },
  validateArgs: validEmail((args) => args.email, "email"),
  resolve: async (_, { email, locale }, ctx) => {
    try {
      await ctx.auth.resetTempPassword(email, locale);
    } catch {}

    // always return SUCCESS to avoid leaking errors and user statuses
    return RESULT.SUCCESS;
  },
});

export const resetTempPassword = mutationField("resetTempPassword", {
  description:
    "Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD",
  type: "Result",
  args: {
    email: nonNull(stringArg()),
    locale: nonNull("UserLocale"),
  },
  authorize: authenticateAnd(contextUserHasPermission("USERS:CRUD_USERS")),
  validateArgs: validEmail((args) => args.email, "email"),
  resolve: async (_, { email, locale }, ctx) => {
    await ctx.auth.resetTempPassword(email, locale);

    return RESULT.SUCCESS;
  },
});

export const updateUserPreferredLocale = mutationField("updateUserPreferredLocale", {
  description:
    "Sets the locale passed as arg as the preferred language of the user to see the page",
  type: "User",
  args: {
    locale: nonNull("UserLocale"),
  },
  authorize: authenticate(),
  resolve: async (_, { locale }, ctx) => {
    const userData = (await ctx.users.loadUserData(ctx.user!.user_data_id))!;
    await ctx.users.updateUserData(
      userData.id,
      {
        details: {
          ...(userData.details ?? {}),
        },
        preferred_locale: locale,
      },
      `User:${ctx.user!.id}`,
    );
    return ctx.user!;
  },
});

export const setUserDelegates = mutationField("setUserDelegates", {
  description: "Set the delegades of a user",
  type: "User",
  args: {
    delegateIds: nonNull(list(nonNull(globalIdArg("User")))),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("ON_BEHALF_OF"),
    userHasAccessToUsers("delegateIds"),
  ),
  resolve: async (_, { delegateIds }, ctx) => {
    await ctx.users.syncDelegates(ctx.user!.id, delegateIds, ctx.user!);
    return ctx.user!;
  },
});

export const loginAs = mutationField("loginAs", {
  type: "Result",
  args: {
    userId: nonNull(globalIdArg("User")),
  },
  authorize: authenticateAnd(
    userIsNotContextUser("userId"),
    or(
      userIsSuperAdmin(),
      and(
        contextUserHasPermission("USERS:GHOST_LOGIN"),
        userHasAccessToUsers("userId"),
        userHasFeatureFlag("GHOST_LOGIN"),
      ),
    ),
  ),
  resolve: async (_, { userId }, ctx) => {
    try {
      await ctx.auth.updateSessionLogin(ctx.req, (ctx.realUser ?? ctx.user!).id, userId);
    } catch {
      throw new ApolloError("Mutation requires session login", "SESSION_REQUIRED");
    }
    return RESULT.SUCCESS;
  },
});

export const restoreLogin = mutationField("restoreLogin", {
  type: "Result",
  authorize: authenticate(),
  resolve: async (_, args, ctx) => {
    try {
      await ctx.auth.restoreSessionLogin(ctx.req, (ctx.realUser ?? ctx.user!).id);
    } catch {
      throw new ApolloError("Mutation requires session login", "SESSION_REQUIRED");
    }
    return RESULT.SUCCESS;
  },
});

export const changeOrganization = mutationField("changeOrganization", {
  type: "Result",
  args: {
    orgId: globalIdArg("Organization"),
  },
  authorize: authenticate(),
  resolve: async (_, args, ctx) => {
    const users = await ctx.users.loadUsersByUserDataId(ctx.realUser!.user_data_id);
    const user = users.find((u) => u.org_id === args.orgId);
    if (!isDefined(user)) {
      throw new ForbiddenError("Not authorized");
    }
    try {
      await ctx.auth.restoreSessionLogin(ctx.req, user.id);
    } catch {
      throw new ApolloError("Mutation requires session login", "SESSION_REQUIRED");
    }
    return RESULT.SUCCESS;
  },
});
