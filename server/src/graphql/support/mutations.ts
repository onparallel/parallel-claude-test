import { booleanArg, intArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isDefined, uniq } from "remeda";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/Result";
import { uploadArg } from "../helpers/scalars/Upload";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { validateFile } from "../helpers/validators/validateFile";
import { validateRegex } from "../helpers/validators/validateRegex";
import { validEmail } from "../helpers/validators/validEmail";
import { validateHexColor } from "../tag/validators";
import { supportMethodAccess } from "./authorizers";
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
    authorize: supportMethodAccess(),
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
  }
);

export const resetUserPassword = mutationField("resetUserPassword", {
  description:
    "Resets the given user password on AWS Cognito and sends an email with new temporary.",
  type: "SupportMethodResponse",
  args: {
    email: nonNull(stringArg()),
    locale: nonNull("UserLocale"),
  },
  authorize: supportMethodAccess(),
  validateArgs: validEmail((args) => args.email, "email"),
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
  description:
    "Transfers the ownership of an organization to a given user. Old owner will get ADMIN role",
  type: "SupportMethodResponse",
  args: {
    orgId: nonNull(globalIdArg("Organization", { description: "Global ID of the Organization" })),
    userId: nonNull(globalIdArg("User", { description: "Global ID of the new owner" })),
  },
  authorize: supportMethodAccess(),
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

    await ctx.users.withTransaction(async (t) => {
      await ctx.users.updateUserById(
        currentOwner.id,
        { organization_role: "ADMIN" },
        `User:${ctx.user!.id}`,
        t
      );
      await ctx.users.updateUserById(
        userId,
        { organization_role: "OWNER" },
        `User:${ctx.user!.id}`,
        t
      );
    });

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
      })
    ),
    categories: nullable(stringArg({ description: "comma-separated list of categories" })),
    description: nullable(stringArg({ description: "short description for the template" })),
    slug: nullable(stringArg({ description: "must be URL-friendly" })),
    image: nullable(uploadArg()),
  },
  validateArgs: validateAnd(
    validatePublicTemplateCategories((args) => args.categories, "categories"),
    validateHexColor((args) => args.backgroundColor, "backgroundColor"),
    validateRegex((args) => args.slug, "slug", /^[0-9a-z-]+$/),
    validateIf(
      (args) => isDefined(args.image),
      validateFile(
        (args) => args.image!,
        { contentType: ["image/gif", "image/png", "image/jpeg"], maxSize: 1024 * 1024 },
        "image"
      )
    )
  ),
  authorize: supportMethodAccess(),
  resolve: async (_, args, ctx, info) => {
    try {
      const template = await ctx.petitions.loadPetition(args.templateId);
      if (!template || !template.is_template) {
        throw new ArgValidationError(info, "templateId", "Id does not correspond to a template");
      }

      const templateMd = template!.public_metadata || {};

      const newMetadata: any = {};

      newMetadata.background_color =
        isDefined(args.backgroundColor) && args.backgroundColor.trim() !== ""
          ? args.backgroundColor
          : templateMd.background_color || null;

      newMetadata.categories =
        isDefined(args.categories) && args.categories.trim() !== ""
          ? uniq(args.categories.split(",").map((w) => w.trim()))
          : templateMd.categories || [];

      newMetadata.description =
        isDefined(args.description) && args.description.trim() !== ""
          ? args.description.trim()
          : templateMd.description || null;

      newMetadata.slug =
        isDefined(args.slug) && args.slug.trim() !== ""
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
          `User:${ctx.user!.id}`
        );

        newMetadata.image_public_file_id = file.id;
      } else {
        newMetadata.image_public_file_id = templateMd.image_public_file_id || null;
      }

      await ctx.petitions.updatePetition(
        template.id,
        { public_metadata: newMetadata },
        `User:${ctx.user!.id}`
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
  authorize: supportMethodAccess(),
  args: {
    userId: nonNull(globalIdArg("User", { description: "Global ID of the user" })),
    image: nonNull(uploadArg()),
  },
  validateArgs: validateFile(
    (args) => args.image,
    { contentType: ["image/gif", "image/png", "image/jpeg"], maxSize: 1024 * 1024 },
    "image"
  ),
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
        `User:${ctx.user!.id}`
      );

      await ctx.users.updateUserData(
        userData.id,
        { avatar_public_file_id: file.id },
        `User:${ctx.user!.id}`
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
  authorize: supportMethodAccess(),
  resolve: async (_, { templateId, isPublic }, ctx, info) => {
    try {
      const template = await ctx.petitions.loadPetition(templateId);
      if (!template || !template.is_template) {
        throw new ArgValidationError(info, "templateId", "Id does not correspond to a template");
      }

      await ctx.petitions.updatePetition(
        templateId,
        { template_public: isPublic },
        `User:${ctx.user!.id}`
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
  authorize: supportMethodAccess(),
  args: {
    orgId: nonNull(globalIdArg("Organization", { description: "Global ID of the Organization" })),
    tier: nonNull(stringArg({ description: "e.g.: FREE, APPSUMO1, APPSUMO2, APPSUMO3..." })),
  },
  resolve: async (_, args, ctx) => {
    try {
      const org = await ctx.organizations.loadOrg(args.orgId);
      const tier = await ctx.tiers.updateOrganizationTier(org!, args.tier, `User:${ctx.user!.id}`);

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
  authorize: supportMethodAccess(),
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
  authorize: supportMethodAccess(),
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
  authorize: supportMethodAccess(),
  args: {
    json: nonNull(
      stringArg({ description: "Petition to import in json format @form:type=textarea" })
    ),
    userId: nonNull(
      globalIdArg("User", { description: "Global ID of the user to assign this petition" })
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
    authorize: supportMethodAccess(),
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
          `User:${ctx.user!.id}`
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
  }
);

export const removePetitionPassword = mutationField("removePetitionPassword", {
  description: "Removes the password on a petition or template",
  type: "SupportMethodResponse",
  authorize: supportMethodAccess(),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, { petitionId }, ctx) => {
    try {
      await ctx.petitions.updatePetition(
        petitionId,
        {
          restricted_password_hash: null,
          restricted_password_salt: null,
        },
        `User:${ctx.user!.id}`
      );
      return { result: RESULT.SUCCESS, message: "Password removed" };
    } catch (e) {
      ctx.logger.error(e);
      return { result: RESULT.FAILURE, message: "Something went wrong..." };
    }
  },
});
