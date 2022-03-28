import { differenceInMinutes } from "date-fns";
import { arg, booleanArg, enumType, list, mutationField, nonNull, stringArg } from "nexus";
import pMap from "p-map";
import { difference, isDefined, zip } from "remeda";
import { RESULT } from "..";
import { PublicFileUpload } from "../../db/__types";
import { partition } from "../../util/arrays";
import { fullName } from "../../util/fullName";
import { withError } from "../../util/promises/withError";
import { removeNotDefined } from "../../util/remedaExtensions";
import { random } from "../../util/token";
import { Maybe } from "../../util/types";
import {
  and,
  authenticate,
  authenticateAnd,
  ifArgDefined,
  verifyCaptcha,
} from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { uploadArg } from "../helpers/upload";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { emailDomainIsNotSSO } from "../helpers/validators/emailDomainIsNotSSO";
import { emailIsAvailable } from "../helpers/validators/emailIsAvailable";
import { maxActiveUsers } from "../helpers/validators/maxActiveUsers";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { userIdNotIncludedInArray } from "../helpers/validators/notIncludedInArray";
import { validateFile } from "../helpers/validators/validateFile";
import { validEmail } from "../helpers/validators/validEmail";
import { validIsDefined } from "../helpers/validators/validIsDefined";
import { validLocale } from "../helpers/validators/validLocale";
import { validPassword } from "../helpers/validators/validPassword";
import { orgCanCreateNewUser, orgDoesNotHaveSsoProvider } from "../organization/authorizers";
import { argUserHasActiveStatus, userHasAccessToUsers } from "../petition/mutations/authorizers";
import { userHasAccessToUserGroups } from "../user-group/authorizers";
import { contextUserHasRole, contextUserIsNotSso, userIsNotSSO } from "./authorizers";

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
    maxLength((args) => args.lastName, "data.lastName", 255)
  ),
  resolve: async (_, args, ctx) => {
    const { firstName, lastName } = args;
    await ctx.users.updateUserData(
      ctx.user!.user_data_id,
      removeNotDefined({
        first_name: firstName,
        last_name: lastName,
      }),
      `User:${ctx.user!.id}`
    );
    return ctx.user!;
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

export const createOrganizationUser = mutationField("createOrganizationUser", {
  description: "Creates a new user in the same organization as the context user",
  type: "User",
  authorize: authenticateAnd(
    contextUserHasRole("ADMIN"),
    orgDoesNotHaveSsoProvider(),
    orgCanCreateNewUser(),
    ifArgDefined("userGroupIds", userHasAccessToUserGroups("userGroupIds" as never))
  ),
  args: {
    email: nonNull(stringArg()),
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    role: nonNull(arg({ type: "OrganizationRole" })),
    locale: stringArg(),
    userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
  },
  validateArgs: validateAnd(
    validLocale((args) => args.locale, "locale"),
    validEmail((args) => args.email, "email"),
    emailIsAvailable((args) => args.email),
    (_, { role }, ctx, info) => {
      if (role === "OWNER") {
        throw new ArgValidationError(info, "role", "Can't create a new user with OWNER role.");
      }
    }
  ),
  resolve: async (_, args, ctx) => {
    const [organization, userData] = await Promise.all([
      ctx.organizations.loadOrg(ctx.user!.org_id),
      ctx.users.loadUserData(ctx.user!.user_data_id),
    ]);
    const email = args.email.trim().toLowerCase();
    const cognitoId = await ctx.aws.createCognitoUser(
      email,
      null,
      args.firstName,
      args.lastName,
      {
        locale: args.locale ?? "en",
        organizationName: organization!.name,
        organizationUser: fullName(userData!.first_name, userData!.last_name),
      },
      true
    );
    const [user] = await Promise.all([
      ctx.users.createUser(
        {
          org_id: ctx.user!.org_id,
          organization_role: args.role,
        },
        {
          cognito_id: cognitoId!,
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

    if (args.userGroupIds) {
      await pMap(args.userGroupIds, (userGroupId) =>
        ctx.userGroups.addUsersToGroup(userGroupId, user.id, `User:${ctx.user!.id}`)
      );

      ctx.userGroups.loadUserGroupsByUserId.dataloader.clear(user.id);
    }

    return user;
  },
});

export const activateUser = mutationField("activateUser", {
  description: "set user status to ACTIVE.",
  type: list("User"),
  authorize: authenticateAnd(
    contextUserHasRole("ADMIN"),
    userHasAccessToUsers("userIds"),
    userIsNotSSO("userIds")
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.userIds, "userIds"),
    userIdNotIncludedInArray((args) => args.userIds, "userIds"),
    maxActiveUsers((args) => args.userIds)
  ),
  args: {
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
  },
  resolve: async (_, { userIds }, ctx) => {
    return await ctx.users.updateUserById(userIds, { status: "ACTIVE" }, `User:${ctx.user!.id}`);
  },
});

export const deactivateUser = mutationField("deactivateUser", {
  description:
    "Updates user status to INACTIVE, transfers their owned petitions to another user in the org or delete all petitions.",
  type: list("User"),
  authorize: authenticateAnd(
    contextUserHasRole("ADMIN"),
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
    validIsDefined((args) => args.transferToUserId, "transferToUserId"),
    (_, { userIds, transferToUserId, deletePetitions }, ctx, info) => {
      if (deletePetitions) {
        throw new ArgValidationError(info, "transferToUserId", "Can't deletePetitions from user");
      }
      if (transferToUserId && userIds.includes(transferToUserId)) {
        throw new ArgValidationError(
          info,
          "transferToUserId",
          "Can't transfer to a user that will be disabled."
        );
      }
    }
  ),
  args: {
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
    transferToUserId: globalIdArg("User"),
    deletePetitions: booleanArg(),
  },
  resolve: async (_, { userIds, transferToUserId, deletePetitions }, ctx) => {
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
          // until allowed on the UI
          deletePetitions = false;
          const deleteOrTransferPetitionsMethods = deletePetitions
            ? [
                // make sure to also remove every remaining permission on deleted owned petitions
                ctx.petitions.deleteAllPermissions(
                  ownedPermissions.map((p) => p.petition_id),
                  ctx.user!,
                  t
                ),
                //finally, delete only petitions OWNED by me
                ctx.petitions.deletePetition(
                  ownedPermissions.map((p) => p.petition_id),
                  ctx.user!,
                  t
                ),
                // delete every user notification on the deleted petitions
                ctx.petitions.deletePetitionUserNotificationsByPetitionId(
                  userPermissions.map((p) => p.petition_id),
                  undefined,
                  t
                ),
                // TODO: delete all ownership of public links
              ]
            : [
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
                ctx.petitions.transferPublicLinkOwnership(userId, transferToUserId!, ctx.user!, t),
              ];

          const [[user]] = await Promise.all([
            ctx.users.updateUserById(userId, { status: "INACTIVE" }, `User:${ctx.user!.id}`, t),
            // delete permissions with type !== OWNER
            notOwnedPermissions.length > 0
              ? ctx.petitions.deleteUserPermissions(
                  notOwnedPermissions.map((p) => p.petition_id),
                  userId,
                  ctx.user!,
                  t
                )
              : undefined,
            ctx.petitions.removeTemplateDefaultPermissionsForUser(
              userId,
              `User:${ctx.user!.id}`,
              t
            ),
            ...deleteOrTransferPetitionsMethods,
          ]);

          return user;
        },
        { concurrency: 1 }
      );
    });
  },
});

export const updateOrganizationUser = mutationField("updateOrganizationUser", {
  description: "Updates the role of another user in the organization.",
  type: "User",
  authorize: authenticateAnd(
    contextUserHasRole("ADMIN"),
    userHasAccessToUsers("userId"),
    ifArgDefined("userGroupIds", userHasAccessToUserGroups("userGroupIds" as never))
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
        t
      );

      if (userGroupIds) {
        const userGroups = await ctx.userGroups.loadUserGroupsByUserId(userId);
        const actualUserGroupsIds = userGroups.map((userGroup) => userGroup.id);

        const userGroupsIdsToDelete = difference(actualUserGroupsIds, userGroupIds);
        const userGroupsIdsToAdd = difference(userGroupIds, actualUserGroupsIds);

        await pMap(
          userGroupsIdsToAdd,
          async (userGroupId) =>
            await ctx.userGroups.addUsersToGroup(userGroupId, userId, `User:${ctx.user!.id}`, t),
          { concurrency: 5 }
        );

        await ctx.userGroups.removeUsersFromGroups(
          [userId],
          userGroupsIdsToDelete,
          `User:${ctx.user!.id}`,
          t
        );

        ctx.userGroups.loadUserGroupsByUserId.dataloader.clear(userId);
      }

      return user;
    });
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
    captcha: nonNull(stringArg()),
  },
  authorize: verifyCaptcha("captcha"),
  validateArgs: validateAnd(
    validLocale((args) => args.locale, "locale"),
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
    const email = args.email.trim().toLowerCase();
    const [error, cognitoId] = await withError(
      ctx.aws.signUpUser(email, args.password, args.firstName, args.lastName, {
        locale: args.locale ?? "en",
      })
    );
    if (error) {
      await withError(ctx.aws.deleteUser(email));
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
          status: "DEMO",
          logo_public_file_id: logoFile?.id ?? null,
        },
        undefined,
        t
      );

      const user = await ctx.users.createUser(
        {
          organization_role: "OWNER",
          org_id: org.id,
          status: "ACTIVE",
        },
        {
          cognito_id: cognitoId!,
          email,
          first_name: args.firstName,
          last_name: args.lastName,
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
        ctx.users.updateUserData(
          user.user_data_id,
          { created_by: `User:${user.id}` },
          `User:${user.id}`,
          t
        ),
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
  description:
    "Sends the AccountVerification email with confirmation code to unconfirmed user emails",
  type: "Result",
  args: {
    email: nonNull(stringArg()),
    locale: stringArg(),
  },
  validateArgs: validateAnd(
    validEmail((args) => args.email, "email"),
    validLocale((args) => args.locale, "locale")
  ),
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
          `User:${user.id}`
        );
        await ctx.aws.resendVerificationCode(email, { locale: locale ?? "en" });
      }
    } catch {}
    return RESULT.SUCCESS;
  },
});

export const resetTemporaryPassword = mutationField("resetTemporaryPassword", {
  description:
    "Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD",
  type: "Result",
  args: {
    email: nonNull(stringArg()),
    locale: stringArg(),
  },
  validateArgs: validateAnd(
    validEmail((args) => args.email, "email"),
    validLocale((args) => args.locale, "locale")
  ),
  resolve: async (_, { email, locale }, ctx) => {
    try {
      const [users, cognitoUser] = await Promise.all([
        ctx.users.loadUsersByEmail(email),
        ctx.aws.getUser(email),
      ]);
      const definedUsers = users.filter(isDefined);
      if (definedUsers.length === 0) {
        return RESULT.SUCCESS;
      }

      // TODO which org to use??
      const user = definedUsers[0];
      const [organization, userData] = await Promise.all([
        user ? await ctx.organizations.loadOrg(user.org_id) : null,
        user ? await ctx.users.loadUserData(user.user_data_id) : null,
      ]);

      if (
        user &&
        organization &&
        userData &&
        !userData.is_sso_user &&
        cognitoUser.UserStatus === "FORCE_CHANGE_PASSWORD" &&
        cognitoUser.UserLastModifiedDate &&
        // allow 1 reset every hour
        differenceInMinutes(new Date(), cognitoUser.UserLastModifiedDate) >= 60
      ) {
        const orgOwner = await ctx.organizations.getOrganizationOwner(organization.id);
        const orgOwnerData = await ctx.users.loadUserData(orgOwner.user_data_id);
        if (!orgOwnerData) {
          return RESULT.SUCCESS;
        }
        await ctx.aws.resetUserPassword(email, {
          locale: locale ?? "en",
          organizationName: organization.name,
          organizationUser: fullName(orgOwnerData.first_name, orgOwnerData.last_name),
        });
      }
    } catch {}

    // always return SUCCESS to avoid leaking errors and user statuses
    return RESULT.SUCCESS;
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
  validateArgs: validLocale((args) => args.locale, "locale"),
  resolve: async (_, { locale }, ctx) => {
    const userData = (await ctx.users.loadUserData(ctx.user!.user_data_id))!;
    await ctx.users.updateUserData(
      userData.id,
      {
        details: {
          ...(userData.details ?? {}),
          preferredLocale: locale,
        },
      },
      `User:${ctx.user!.id}`
    );
    return ctx.user!;
  },
});
