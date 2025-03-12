import Ajv from "ajv";
import { booleanArg, intArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isNonNullish, isNullish, unique } from "remeda";
import { UserGroupPermissionName } from "../../db/__types";
import { toBytes } from "../../util/fileSize";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { parseStandardListDefinitionsData } from "../../util/parseStandardListDefinitionsData";
import { random } from "../../util/token";
import { RESULT } from "../helpers/Result";
import { and } from "../helpers/authorize";
import { ArgValidationError, ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { importFromExcel } from "../helpers/importDataFromExcel";
import { uploadArg } from "../helpers/scalars/Upload";
import { validateAnd } from "../helpers/validateArgs";
import { validEmail } from "../helpers/validators/validEmail";
import { validUrl } from "../helpers/validators/validUrl";
import { validateFile } from "../helpers/validators/validateFile";
import { validateRegex } from "../helpers/validators/validateRegex";
import { validateHexColor } from "../tag/validators";
import { superAdminAccess } from "./authorizers";
import { validatePublicTemplateCategories } from "./validators";

export const forceUpdateSignatureOrganizationBrandings = mutationField(
  "forceUpdateSignatureOrganizationBrandings",
  {
    description:
      "Forces an update of the branding of every signature integration of the selected organization.",
    type: "SupportMethodResponse",
    args: {
      orgId: nonNull(globalIdArg("Organization", { description: "Global ID of the Organization" })),
    },
    authorize: superAdminAccess(),
    resolve: async (_, { orgId }, ctx) => {
      try {
        const org = await ctx.organizations.loadOrg(orgId);
        if (!org) {
          return {
            result: RESULT.FAILURE,
            message: `Can't find organization with id ${orgId}`,
          };
        }
        await ctx.signature.onOrganizationBrandChange(orgId);
        return {
          result: RESULT.SUCCESS,
          message: `Brandings queued to update successfully`,
        };
      } catch (e: any) {
        return { result: RESULT.FAILURE, message: e.message };
      }
    },
  },
);

export const resetUserPassword = mutationField("resetUserPassword", {
  description:
    "Resets the given user password on AWS Cognito and sends an email with new temporary.",
  type: "SupportMethodResponse",
  args: {
    email: nonNull(stringArg()),
    locale: nonNull("UserLocale"),
  },
  authorize: superAdminAccess(),
  validateArgs: validEmail("email"),
  resolve: async (_, { email, locale }, ctx) => {
    try {
      const users = await ctx.users.loadUsersByEmail(email);
      if (users.length > 0) {
        // the ForgotPassword email will come from the organization of the user selected here
        const [user] = users;
        const [userData, organization] = await Promise.all([
          ctx.users.loadUserData(ctx.user!.user_data_id),
          ctx.organizations.loadOrg(user.org_id),
        ]);

        await ctx.auth.resetUserPassword(email, {
          locale,
          organizationName: organization!.name,
          organizationUser: fullName(userData!.first_name, userData!.last_name),
        });
        return {
          result: RESULT.SUCCESS,
          message: "User will receive an email with new temporary password.",
        };
      } else {
        return {
          result: RESULT.FAILURE,
          message: `User with email ${email} not found.`,
        };
      }
    } catch (error: any) {
      return {
        result: RESULT.FAILURE,
        message: error.message,
      };
    }
  },
});

export const transferOrganizationOwnership = mutationField("transferOrganizationOwnership", {
  description: "Transfers the ownership of an organization to a given user.",
  type: "SupportMethodResponse",
  args: {
    orgId: nonNull(globalIdArg("Organization", { description: "Global ID of the Organization" })),
    userId: nonNull(globalIdArg("User", { description: "Global ID of the new owner" })),
  },
  authorize: superAdminAccess(),
  resolve: async (_, { orgId, userId }, ctx) => {
    const newOwner = await ctx.users.loadUser(userId);
    if (!newOwner) {
      return {
        result: RESULT.FAILURE,
        message: `Can't find user with id ${userId}`,
      };
    }
    if (newOwner.org_id !== orgId) {
      return {
        result: RESULT.FAILURE,
        message: `User ${userId} does not belong to organization ${orgId}.`,
      };
    }

    const currentOwner = await ctx.organizations.getOrganizationOwner(orgId);

    await ctx.users.updateUserById(
      currentOwner.id,
      { is_org_owner: false },
      `User:${ctx.user!.id}`,
    );
    await ctx.users.updateUserById(userId, { is_org_owner: true }, `User:${ctx.user!.id}`);

    return {
      result: RESULT.SUCCESS,
      message: "Ownership transferred successfully",
    };
  },
});

export const updateLandingTemplateMetadata = mutationField("updateLandingTemplateMetadata", {
  description: "Updates the metadata of a public landing template.",
  type: "SupportMethodResponse",
  args: {
    templateId: nonNull(globalIdArg("Petition", { description: "Global ID of the template" })),
    backgroundColor: nullable(
      stringArg({
        description: "for example: #A0FFCE",
      }),
    ),
    categories: nullable(stringArg({ description: "comma-separated list of categories" })),
    description: nullable(stringArg({ description: "short description for the template" })),
    slug: nullable(stringArg({ description: "must be URL-friendly" })),
    image: nullable(uploadArg()),
  },
  validateArgs: validateAnd(
    validatePublicTemplateCategories("categories"),
    validateHexColor("backgroundColor"),
    validateRegex("slug", /^[0-9a-z-]+$/),
    validateFile("image", {
      contentType: ["image/gif", "image/png", "image/jpeg"],
      maxSize: 1024 * 1024,
    }),
  ),
  authorize: superAdminAccess(),
  resolve: async (_, args, ctx, info) => {
    try {
      const template = await ctx.petitions.loadPetition(args.templateId);
      if (!template || !template.is_template) {
        throw new ArgValidationError(info, "templateId", "Id does not correspond to a template");
      }

      const templateMd = template!.public_metadata || {};

      const newMetadata: any = {};

      newMetadata.background_color =
        isNonNullish(args.backgroundColor) && args.backgroundColor.trim() !== ""
          ? args.backgroundColor
          : templateMd.background_color || null;

      newMetadata.categories =
        isNonNullish(args.categories) && args.categories.trim() !== ""
          ? unique(args.categories.split(",").map((w) => w.trim()))
          : templateMd.categories || [];

      newMetadata.description =
        isNonNullish(args.description) && args.description.trim() !== ""
          ? args.description.trim()
          : templateMd.description || null;

      newMetadata.slug =
        isNonNullish(args.slug) && args.slug.trim() !== ""
          ? args.slug.trim()
          : templateMd.slug || null;

      if (args.image) {
        const { createReadStream, mimetype } = await args.image;
        const filename = random(16);
        const path = `uploads/${filename}`;
        const res = await ctx.storage.publicFiles.uploadFile(path, mimetype, createReadStream());
        const file = await ctx.files.createPublicFile(
          {
            path,
            filename,
            content_type: mimetype,
            size: res["ContentLength"]!.toString(),
          },
          `User:${ctx.user!.id}`,
        );

        newMetadata.image_public_file_id = file.id;
      } else {
        newMetadata.image_public_file_id = templateMd.image_public_file_id || null;
      }

      await ctx.petitions.updatePetition(
        template.id,
        { public_metadata: newMetadata },
        `User:${ctx.user!.id}`,
      );

      return {
        result: RESULT.SUCCESS,
        message: "Metadata successfully updated.",
      };
    } catch (error: any) {
      return {
        result: RESULT.FAILURE,
        message: error.message,
      };
    }
  },
});

export const uploadUserAvatar = mutationField("uploadUserAvatar", {
  description: "Uploads a user avatar image",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    userId: nonNull(globalIdArg("User", { description: "Global ID of the user" })),
    image: nonNull(uploadArg()),
  },
  validateArgs: validateFile("image", {
    contentType: ["image/gif", "image/png", "image/jpeg"],
    maxSize: 1024 * 1024,
  }),
  resolve: async (_, { userId, image }, ctx) => {
    try {
      const [{ createReadStream, mimetype }, user] = await Promise.all([
        image,
        ctx.users.loadUser(userId),
      ]);
      const userData = user ? await ctx.users.loadUserData(user.user_data_id) : null;

      if (!userData) {
        throw new Error(`UserData not found for User:${userId}`);
      }

      const filename = random(16);
      const path = `uploads/${filename}`;
      const res = await ctx.storage.publicFiles.uploadFile(path, mimetype, createReadStream());
      const file = await ctx.files.createPublicFile(
        {
          path,
          filename,
          content_type: mimetype,
          size: res["ContentLength"]!.toString(),
        },
        `User:${ctx.user!.id}`,
      );

      await ctx.users.updateUserData(
        userData.id,
        { avatar_public_file_id: file.id },
        `User:${ctx.user!.id}`,
      );
      return {
        result: RESULT.SUCCESS,
        message: "User avatar updated successfully",
      };
    } catch (error: any) {
      return {
        result: RESULT.FAILURE,
        message: error.message,
      };
    }
  },
});

export const updatePublicTemplateVisibility = mutationField("updatePublicTemplateVisibility", {
  description: "Updates template_public from template",
  type: "SupportMethodResponse",
  args: {
    templateId: nonNull(globalIdArg({ description: "global ID of the template" })),
    isPublic: nonNull(booleanArg({ description: "Public visiblity of template" })),
  },
  authorize: superAdminAccess(),
  resolve: async (_, { templateId, isPublic }, ctx, info) => {
    try {
      const template = await ctx.petitions.loadPetition(templateId);
      if (!template || !template.is_template) {
        throw new ArgValidationError(info, "templateId", "Id does not correspond to a template");
      }

      await ctx.petitions.updatePetition(
        templateId,
        { template_public: isPublic },
        `User:${ctx.user!.id}`,
      );

      return {
        result: RESULT.SUCCESS,
        message: `Template "${template.name}" with ID ${templateId}, TEMPLATE_PUBLIC has been updated from ${template.template_public} to ${isPublic}.`,
      };
    } catch (error: any) {
      return { result: RESULT.FAILURE, message: error.message };
    }
  },
});

export const updateOrganizationTier = mutationField("updateOrganizationTier", {
  description: "Applies a given tier to the organization",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    orgId: nonNull(globalIdArg("Organization", { description: "Global ID of the Organization" })),
    tier: nonNull(stringArg({ description: "e.g.: FREE, APPSUMO1, APPSUMO2, APPSUMO3..." })),
  },
  resolve: async (_, args, ctx) => {
    try {
      const org = await ctx.organizations.loadOrg(args.orgId);
      const tier = await ctx.orgLimits.updateOrganizationTier(
        org!,
        args.tier,
        `User:${ctx.user!.id}`,
      );

      return {
        result: RESULT.SUCCESS,
        message: `Tier ${args.tier} applied to org ${org!.name}.
        New Usage Limits: 
        USER_LIMIT: ${tier.USER_LIMIT}
        PETITION_SEND: ${tier.PETITION_SEND.limit} in ${tier.PETITION_SEND.duration} 

        Feature Flags: 
        ${tier.FEATURE_FLAGS.map((ff) => `${ff.name}: ${ff.value}`).join("\n")}`,
      };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const restoreDeletedPetition = mutationField("restoreDeletedPetition", {
  description: "Restores a deleted petition if it's not already anonymized.",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, { petitionId }, ctx) => {
    try {
      await ctx.petitions.restoreDeletedPetition(petitionId);
      return { result: RESULT.SUCCESS, message: "Petition restored successfully" };
    } catch {}
    return { result: RESULT.FAILURE, message: "We can't restore this petition :(" };
  },
});

export const anonymizePetition = mutationField("anonymizePetition", {
  description: "Anonymizes a petition",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, { petitionId }, ctx) => {
    try {
      await ctx.petitions.anonymizePetition(petitionId);
      return { result: RESULT.SUCCESS, message: "Petition anonymized successfully" };
    } catch (e) {
      ctx.logger.error(e);
    }
    return { result: RESULT.FAILURE, message: "Something went wrong..." };
  },
});

export const importPetitionFromJson = mutationField("importPetitionFromJson", {
  description: "Imports a petition from a JSON file",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    json: nonNull(
      stringArg({ description: "Petition to import in json format @form:type=textarea" }),
    ),
    userId: nonNull(
      globalIdArg("User", { description: "Global ID of the user to assign this petition" }),
    ),
  },
  resolve: async (_, { json, userId }, ctx) => {
    try {
      const user = await ctx.users.loadUser(userId);
      if (!user) {
        throw new Error(`User:${userId} not found`);
      }

      const petitionId = await ctx.petitionImportExport.fromJson(JSON.parse(json), user);
      return {
        result: RESULT.SUCCESS,
        message: `Petition with id ${toGlobalId("Petition", petitionId)} imported successfully.`,
      };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const signaturitIntegrationShowSecurityStamp = mutationField(
  "signaturitIntegrationShowSecurityStamp",
  {
    description: "Enables/disables security stamp on documents for Signaturit integrations.",
    type: "SupportMethodResponse",
    authorize: superAdminAccess(),
    args: {
      integrationId: nonNull(intArg({ description: "Numeric ID of the integration" })),
      showCsv: nonNull(booleanArg({ description: "Enable CSV stamp" })),
    },
    resolve: async (_, { integrationId, showCsv }, ctx) => {
      const integration = await ctx.integrations.loadIntegration(integrationId);
      if (!integration) {
        return {
          result: RESULT.FAILURE,
          message: `OrgIntegration:${integrationId} not found`,
        };
      }

      if (integration.type !== "SIGNATURE" || integration.provider !== "SIGNATURIT") {
        return {
          result: RESULT.FAILURE,
          message: `OrgIntegration:${integrationId} is not a SIGNATURIT provider`,
        };
      }

      if (integration.settings.SHOW_CSV !== showCsv) {
        await ctx.integrations.updateOrgIntegration(
          integrationId,
          { settings: { ...integration.settings, SHOW_CSV: showCsv } },
          `User:${ctx.user!.id}`,
        );

        await ctx.signature.onOrganizationBrandChange(integration.org_id, {
          integrationId,
        });
      }

      return {
        result: RESULT.SUCCESS,
        message: `OrgIntegration:${integrationId} updated successfully.`,
      };
    },
  },
);

export const removePetitionPassword = mutationField("removePetitionPassword", {
  description: "Removes the password on a petition or template",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, { petitionId }, ctx) => {
    try {
      await ctx.petitions.updatePetition(
        petitionId,
        {
          restricted_by_user_id: null,
          restricted_at: null,
          restricted_password_hash: null,
          restricted_password_salt: null,
        },
        `User:${ctx.user!.id}`,
      );
      return { result: RESULT.SUCCESS, message: "Password removed" };
    } catch (e) {
      ctx.logger.error(e);
      return { result: RESULT.FAILURE, message: "Something went wrong..." };
    }
  },
});

export const createAzureOpenAiIntegration = mutationField("createAzureOpenAiIntegration", {
  description: "Creates a new Azure OpenAI integration on the provided organization",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    orgId: nonNull(globalIdArg("Organization")),
    apiKey: nonNull(stringArg()),
    endpoint: nonNull(stringArg({ description: "https://<resource name>.openai.azure.com/" })),
  },
  validateArgs: validateAnd(
    validUrl("endpoint"),
    validateRegex("endpoint", /^https:\/\/.+\.openai\.azure\.com\/$/),
  ),
  resolve: async (_, args, ctx) => {
    try {
      const integration = await ctx.integrationsSetup.createAzureOpenAiIntegration(
        {
          org_id: args.orgId,
          name: "Open AI",
          is_default: true,
          settings: {
            CREDENTIALS: { API_KEY: args.apiKey },
            ENDPOINT: args.endpoint,
          },
        },
        `User:${ctx.user!.id}`,
      );

      return {
        result: RESULT.SUCCESS,
        message: `Integration ${toGlobalId("OrgIntegration", integration.id)} created successfully`,
      };
    } catch (error) {
      return {
        result: RESULT.FAILURE,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const deleteAzureOpenAiIntegration = mutationField("deleteAzureOpenAiIntegration", {
  description: "Removes the Azure OpenAI integration of the user's organization",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    id: nonNull(globalIdArg("OrgIntegration")),
  },
  resolve: async (_, args, ctx) => {
    try {
      await ctx.petitions.clearPetitionSummaryConfigWithIntegration(
        args.id,
        `User:${ctx.user!.id}`,
      );
      await ctx.integrations.deleteOrgIntegration(args.id, `User:${ctx.user!.id}`);

      return {
        result: RESULT.SUCCESS,
        message: `Integration ${toGlobalId("OrgIntegration", args.id)} deleted successfully`,
      };
    } catch (error) {
      return {
        result: RESULT.FAILURE,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const transferAdminPermissions = mutationField("transferAdminPermissions", {
  description:
    'Creates an "Admins" team on the organization and removes Admin-only permissions from "All Users". Org owner will be added to "Admins" team.',
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    organizationId: nonNull(globalIdArg("Organization")),
  },
  resolve: async (_, { organizationId }, ctx) => {
    try {
      const admins = await ctx.userGroups.createUserGroup(
        {
          name: "Admins",
          type: "INITIAL",
          org_id: organizationId,
        },
        `User:${ctx.user!.id}`,
      );

      // grant every permission for Admins group
      await ctx.userGroups.upsertUserGroupPermissions(
        admins.id,
        (
          [
            "REPORTS:OVERVIEW",
            "REPORTS:TEMPLATE_STATISTICS",
            "REPORTS:TEMPLATE_REPLIES",
            "PROFILES:DELETE_PROFILES",
            "PROFILES:DELETE_PERMANENTLY_PROFILES",
            "PROFILE_TYPES:CRUD_PROFILE_TYPES",
            "INTEGRATIONS:CRUD_INTEGRATIONS",
            "USERS:CRUD_USERS",
            "USERS:GHOST_LOGIN",
            "TEAMS:CRUD_TEAMS",
            "ORG_SETTINGS",
            "CONTACTS:DELETE_CONTACTS",
            "PETITIONS:SEND_ON_BEHALF",
            "PETITIONS:CHANGE_PATH",
            "PETITIONS:CREATE_TEMPLATES",
            "INTEGRATIONS:CRUD_API",
            "PROFILES:SUBSCRIBE_PROFILES",
            "PETITIONS:CREATE_PETITIONS",
            "PROFILES:CREATE_PROFILES",
            "PROFILES:CLOSE_PROFILES",
            "PROFILES:LIST_PROFILES",
            "PROFILE_ALERTS:LIST_ALERTS",
            "CONTACTS:LIST_CONTACTS",
            "USERS:LIST_USERS",
            "TEAMS:LIST_TEAMS",
            "TAGS:CREATE_TAGS",
            "TAGS:UPDATE_TAGS",
            "TAGS:DELETE_TAGS",
            "TEAMS:READ_PERMISSIONS",
            "TEAMS:UPDATE_PERMISSIONS",
            "PETITIONS:LIST_PUBLIC_TEMPLATES",
          ] as UserGroupPermissionName[]
        ).map((name) => ({ effect: "GRANT", name })),
        `User:${ctx.user!.id}`,
      );

      // add org owner to Admins group
      const orgOwner = (await ctx.organizations.loadOrgOwner(organizationId))!;
      await ctx.userGroups.addUsersToGroups(admins.id, [orgOwner.id], `User:${ctx.user!.id}`);

      const allUsersGroups = await ctx.userGroups.loadAllUsersGroupsByOrgId(organizationId);

      for (const allUsers of allUsersGroups) {
        // remove admin permissions from all-users groups
        await ctx.userGroups.upsertUserGroupPermissions(
          allUsers.id,
          (
            [
              "REPORTS:OVERVIEW",
              "REPORTS:TEMPLATE_STATISTICS",
              "REPORTS:TEMPLATE_REPLIES",
              "PROFILES:DELETE_PROFILES",
              "PROFILES:DELETE_PERMANENTLY_PROFILES",
              "PROFILE_TYPES:CRUD_PROFILE_TYPES",
              "INTEGRATIONS:CRUD_INTEGRATIONS",
              "USERS:CRUD_USERS",
              "USERS:GHOST_LOGIN",
              "TEAMS:CRUD_TEAMS",
              "ORG_SETTINGS",
              "CONTACTS:DELETE_CONTACTS",
              "PETITIONS:SEND_ON_BEHALF",
              "TAGS:CREATE_TAGS",
              "TAGS:UPDATE_TAGS",
              "TAGS:DELETE_TAGS",
              "TEAMS:READ_PERMISSIONS",
              "TEAMS:UPDATE_PERMISSIONS",
            ] as UserGroupPermissionName[]
          ).map((name) => ({ name, effect: "NONE" })),
          `User:${ctx.user!.id}`,
        );
      }

      return {
        result: RESULT.SUCCESS,
        message: "Admin permissions transferred successfully",
      };
    } catch (error) {
      return {
        result: RESULT.FAILURE,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const createBankflipIdVerificationIntegration = mutationField(
  "createBankflipIdVerificationIntegration",
  {
    description: "Creates a new Bankflip ID Verification integration on the provided organization",
    type: "SupportMethodResponse",
    authorize: superAdminAccess(),
    args: {
      orgId: nonNull(
        globalIdArg("Organization", { description: `e.g. ${toGlobalId("Organization", 1)}` }),
      ),
      apiKey: nonNull(stringArg({ description: "Bankflip Account API KEY" })),
      host: nonNull(stringArg({ description: "e.g. https://core.bankflip.io" })),
      webhookSecret: nonNull(stringArg({ description: "Secret for webhook verification" })),
    },
    resolve: async (_, args, ctx) => {
      try {
        const data = await ctx.integrationsSetup.createBankflipIdVerificationIntegration(
          {
            org_id: args.orgId,
            name: "ID Verification",
            settings: {
              CREDENTIALS: {
                API_KEY: args.apiKey,
                HOST: args.host,
                WEBHOOK_SECRET: args.webhookSecret,
              },
            },
          },
          `User:${ctx.user!.id}`,
        );

        return {
          result: "SUCCESS",
          message: `Integration:${data.id} created successfully`,
        };
      } catch (error) {
        return {
          result: RESULT.FAILURE,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
);

export const createBankflipDocumentProcessingIntegration = mutationField(
  "createBankflipDocumentProcessingIntegration",
  {
    description:
      "Creates a new Bankflip Document Processing integration on the provided organization",
    type: "SupportMethodResponse",
    authorize: superAdminAccess(),
    args: {
      orgId: nonNull(
        globalIdArg("Organization", { description: `e.g. ${toGlobalId("Organization", 1)}` }),
      ),
      apiKey: nonNull(stringArg({ description: "Bankflip Account API KEY" })),
      host: nonNull(stringArg({ description: "e.g. https://core.bankflip.io" })),
      webhookSecret: nonNull(stringArg({ description: "Secret for webhook verification" })),
    },
    resolve: async (_, args, ctx) => {
      try {
        const data = await ctx.integrationsSetup.createBankflipDocumentProcessingIntegration(
          {
            org_id: args.orgId,
            name: "Document Processing",
            settings: {
              CREDENTIALS: {
                API_KEY: args.apiKey,
                HOST: args.host,
                WEBHOOK_SECRET: args.webhookSecret,
              },
            },
          },
          `User:${ctx.user!.id}`,
        );

        return {
          result: "SUCCESS",
          message: `Integration:${data.id} created successfully`,
        };
      } catch (error) {
        return {
          result: RESULT.FAILURE,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
);

export const createEInformaProfileExternalSourceIntegration = mutationField(
  "createEInformaProfileExternalSourceIntegration",
  {
    description:
      "Creates a new eInforma Profile External Source integration on the provided organization, or updates it if the organization already has one.",
    type: "SupportMethodResponse",
    authorize: superAdminAccess(),
    args: {
      orgId: nonNull(
        globalIdArg("Organization", { description: `e.g. ${toGlobalId("Organization", 1)}` }),
      ),
      clientId: nonNull(stringArg()),
      clientSecret: nonNull(stringArg()),
      isPaidSubscription: nonNull(
        booleanArg({
          description: "Paid subscription will allow to access real data for entity details",
        }),
      ),
    },
    resolve: async (_, args, ctx) => {
      try {
        const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
          args.orgId,
          "PROFILE_EXTERNAL_SOURCE",
          "EINFORMA",
        );
        if (isNonNullish(integration)) {
          await ctx.integrationsSetup.updateEInformaProfileExternalSourceIntegration(
            integration.id,
            {
              settings: {
                CREDENTIALS: {
                  CLIENT_ID: args.clientId,
                  CLIENT_SECRET: args.clientSecret,
                },
                ENVIRONMENT: args.isPaidSubscription ? "production" : "test",
              },
            },
          );
          return {
            result: "SUCCESS",
            message: `Integration:${integration.id} updated successfully`,
          };
        } else {
          const data = await ctx.integrationsSetup.createEInformaProfileExternalSourceIntegration(
            {
              org_id: args.orgId,
              name: "eInforma",
              settings: {
                CREDENTIALS: {
                  CLIENT_ID: args.clientId,
                  CLIENT_SECRET: args.clientSecret,
                },
                ENVIRONMENT: args.isPaidSubscription ? "production" : "test",
              },
            },
            `User:${ctx.user!.id}`,
          );

          return {
            result: "SUCCESS",
            message: `Integration:${data.id} created successfully`,
          };
        }
      } catch (error) {
        return {
          result: RESULT.FAILURE,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
);

export const createCompaniesHouseProfileExternalSourceIntegration = mutationField(
  "createCompaniesHouseProfileExternalSourceIntegration",
  {
    description:
      "Creates a new Companies House Profile External Source integration on the provided organization, or updates it if the organization already has one.",
    type: "SupportMethodResponse",
    authorize: superAdminAccess(),
    args: {
      orgId: nonNull(
        globalIdArg("Organization", { description: `e.g. ${toGlobalId("Organization", 1)}` }),
      ),
      apiKey: nonNull(stringArg()),
    },
    resolve: async (_, args, ctx) => {
      try {
        const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
          args.orgId,
          "PROFILE_EXTERNAL_SOURCE",
          "COMPANIES_HOUSE",
        );
        if (isNonNullish(integration)) {
          await ctx.integrationsSetup.updateCompaniesHouseProfileExternalSourceIntegration(
            integration.id,
            {
              settings: {
                CREDENTIALS: {
                  API_KEY: args.apiKey,
                },
              },
            },
          );
          return {
            result: "SUCCESS",
            message: `Integration:${integration.id} updated successfully`,
          };
        } else {
          const data =
            await ctx.integrationsSetup.createCompaniesHouseProfileExternalSourceIntegration(
              {
                org_id: args.orgId,
                name: "Companies House",
                settings: {
                  CREDENTIALS: {
                    API_KEY: args.apiKey,
                  },
                },
              },
              `User:${ctx.user!.id}`,
            );

          return {
            result: "SUCCESS",
            message: `Integration:${data.id} created successfully`,
          };
        }
      } catch (error) {
        return {
          result: RESULT.FAILURE,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
);

export const createIManageFileExportIntegration = mutationField(
  "createIManageFileExportIntegration",
  {
    description: "Creates a new iManage File Export integration on the provided organization",
    type: "SupportMethodResponse",
    authorize: superAdminAccess(),
    args: {
      orgId: nonNull(
        globalIdArg("Organization", { description: `e.g. ${toGlobalId("Organization", 1)}` }),
      ),
      clientId: nonNull(stringArg()),
    },
    resolve: async (_, args, ctx) => {
      try {
        const integrations = await ctx.integrations.loadIntegrationsByOrgId(
          args.orgId,
          "FILE_EXPORT",
          "IMANAGE",
        );
        if (integrations.length > 0) {
          throw new Error(`Organization already has an iManage File Export integration`);
        }

        const data = await ctx.integrationsSetup.createIManageFileExportIntegration(
          {
            org_id: args.orgId,
            name: "iManage",
            settings: {
              CREDENTIALS: {},
              CLIENT_ID: args.clientId,
            },
          },
          `User:${ctx.user!.id}`,
        );

        return {
          result: "SUCCESS",
          message: `Integration:${data.id} created successfully`,
        };
      } catch (error) {
        return {
          result: RESULT.FAILURE,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
);

export const updateEinformaCustomProperties = mutationField("updateEinformaCustomProperties", {
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    orgId: nonNull(
      globalIdArg("Organization", { description: `e.g. ${toGlobalId("Organization", 1)}` }),
    ),
    json: nonNull(
      stringArg({
        description:
          "{[profileTypeId: number]: {[profileTypeFieldId: number]: string }} @form:type=textarea",
      }),
    ),
  },
  resolve: async (_, { orgId, json }, ctx) => {
    const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
      orgId,
      "PROFILE_EXTERNAL_SOURCE",
      "EINFORMA",
    );
    if (!integration) {
      return {
        result: RESULT.FAILURE,
        message: "Organization does not have an eInforma Profile External Source integration",
      };
    }

    try {
      const parsed = JSON.parse(json);
      const ajv = new Ajv();
      const isValid = ajv.validate(
        {
          type: "object",
          patternProperties: {
            "^[0-9]+$": {
              type: "object",
              patternProperties: {
                "^[0-9]+$": {
                  type: "string",
                  enum: [
                    "cnae",
                    "fechaUltimoBalance",
                    "situacion",
                    "web",
                    "capitalSocial",
                    "ventas",
                    "anioVentas",
                    "empleados",
                    "nombreComercial",
                    "fechaConstitucion",
                  ],
                },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        parsed,
      );

      if (!isValid) {
        return {
          result: RESULT.FAILURE,
          message: ajv.errorsText(),
        };
      }

      const profileTypeIds = Object.keys(parsed).map((id) => parseInt(id));
      const profileTypes = await ctx.profiles.loadProfileType(profileTypeIds);

      if (profileTypes.some((pt) => pt?.org_id !== orgId)) {
        return {
          result: RESULT.FAILURE,
          message: "Some profile types do not belong to the organization",
        };
      }

      if (profileTypes.some((pt) => isNullish(pt?.standard_type))) {
        return {
          result: RESULT.FAILURE,
          message: "Some profile types do not have a defined standard type",
        };
      }

      for (const profileType of profileTypes) {
        const profileTypeFieldIds = Object.keys(parsed[profileType!.id]).map((id) => parseInt(id));
        const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);
        if (profileTypeFields.some((ptf) => ptf?.profile_type_id !== profileType!.id)) {
          return {
            result: RESULT.FAILURE,
            message: "Some profile type fields do not belong to the profile type",
          };
        }
      }

      await ctx.integrations.updateOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "EINFORMA">(
        integration.id,
        {
          settings: {
            ...integration.settings,
            CUSTOM_PROPERTIES_MAP: parsed,
          },
        },
        `User:${ctx.user!.id}`,
      );

      return {
        result: RESULT.SUCCESS,
        message: "OK!",
      };
    } catch (error) {
      return {
        result: RESULT.FAILURE,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const updateCompaniesHouseCustomProperties = mutationField(
  "updateCompaniesHouseCustomProperties",
  {
    type: "SupportMethodResponse",
    authorize: superAdminAccess(),
    args: {
      orgId: nonNull(
        globalIdArg("Organization", { description: `e.g. ${toGlobalId("Organization", 1)}` }),
      ),
      json: nonNull(
        stringArg({
          description:
            "{[profileTypeId: number]: {[profileTypeFieldId: number]: string }} @form:type=textarea",
        }),
      ),
    },
    resolve: async (_, { orgId, json }, ctx) => {
      const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
        orgId,
        "PROFILE_EXTERNAL_SOURCE",
        "COMPANIES_HOUSE",
      );
      if (!integration) {
        return {
          result: RESULT.FAILURE,
          message:
            "Organization does not have a Companies House Profile External Source integration",
        };
      }

      try {
        const parsed = JSON.parse(json);
        const ajv = new Ajv();
        const isValid = ajv.validate(
          {
            type: "object",
            patternProperties: {
              "^[0-9]+$": {
                type: "object",
                patternProperties: {
                  "^[0-9]+$": {
                    type: "string",
                    enum: ["sic_codes"],
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          parsed,
        );

        if (!isValid) {
          return {
            result: RESULT.FAILURE,
            message: ajv.errorsText(),
          };
        }

        const profileTypeIds = Object.keys(parsed).map((id) => parseInt(id));
        const profileTypes = await ctx.profiles.loadProfileType(profileTypeIds);

        if (profileTypes.some((pt) => pt?.org_id !== orgId)) {
          return {
            result: RESULT.FAILURE,
            message: "Some profile types do not belong to the organization",
          };
        }

        if (profileTypes.some((pt) => isNullish(pt?.standard_type))) {
          return {
            result: RESULT.FAILURE,
            message: "Some profile types do not have a defined standard type",
          };
        }

        for (const profileType of profileTypes) {
          const profileTypeFieldIds = Object.keys(parsed[profileType!.id]).map((id) =>
            parseInt(id),
          );
          const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);
          if (profileTypeFields.some((ptf) => ptf?.profile_type_id !== profileType!.id)) {
            return {
              result: RESULT.FAILURE,
              message: "Some profile type fields do not belong to the profile type",
            };
          }
        }

        await ctx.integrations.updateOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "COMPANIES_HOUSE">(
          integration.id,
          {
            settings: {
              ...integration.settings,
              CUSTOM_PROPERTIES_MAP: parsed,
            },
          },
          `User:${ctx.user!.id}`,
        );

        return {
          result: RESULT.SUCCESS,
          message: "OK!",
        };
      } catch (error) {
        return {
          result: RESULT.FAILURE,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
);

export const closePetitionsFromTemplate = mutationField("closePetitionsFromTemplate", {
  description:
    "Closes every parallel with status PENDING or COMPLETED that was created from the selected template. Parallels with ongoing signatures will NOT be closed.",
  type: "SupportMethodResponse",
  authorize: and(superAdminAccess(), async (_, { templateId }, ctx) => {
    const template = await ctx.petitions.loadPetition(templateId);
    if (!template || !template.is_template || template.template_public) {
      throw new ForbiddenError("invalid templateId");
    }
    return true;
  }),
  args: {
    templateId: nonNull(globalIdArg("Petition", { description: "Global ID of the template" })),
  },
  resolve: async (_, { templateId }, ctx) => {
    try {
      await ctx.tasks.createTask(
        {
          name: "CLOSE_PETITIONS",
          user_id: ctx.user!.id,
          input: { template_id: templateId },
        },
        `User:${ctx.user!.id}`,
      );
      return {
        result: RESULT.SUCCESS,
        message: "Petitions will start closing now. Please wait 1 minute.",
      };
    } catch (error) {
      return {
        result: RESULT.FAILURE,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const updateStandardListDefinitions = mutationField("updateStandardListDefinitions", {
  type: "SupportMethodResponse",
  description: "Updates the standard list definitions with values defined in excel file",
  authorize: superAdminAccess(),
  args: {
    file: nonNull(uploadArg()),
  },
  validateArgs: validateFile("file", {
    contentType: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/csv",
    ],
    maxSize: toBytes(10, "MB"),
  }),

  resolve: async (_, args, ctx) => {
    try {
      const file = await args.file;
      const data = await importFromExcel(file.createReadStream());
      const lists = parseStandardListDefinitionsData(data);

      const result = await ctx.petitions.upsertStandardListDefinitions(
        lists,
        `User:${ctx.user!.id}`,
      );

      return {
        result: RESULT.SUCCESS,
        message: `${result.length} lists created or updated succesfully`,
      };
    } catch (error) {
      return {
        result: RESULT.FAILURE,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
