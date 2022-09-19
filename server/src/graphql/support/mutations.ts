import { booleanArg, idArg, intArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isDefined, uniq } from "remeda";
import { fullName } from "../../util/fullName";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { hash, random } from "../../util/token";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { uploadArg } from "../helpers/scalars";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { validateFile } from "../helpers/validators/validateFile";
import { validateRegex } from "../helpers/validators/validateRegex";
import { validEmail } from "../helpers/validators/validEmail";
import { validateHexColor } from "../tag/validators";
import { supportMethodAccess } from "./authorizers";
import { validatePublicTemplateCategories } from "./validators";

export const assignPetitionToUser = mutationField("assignPetitionToUser", {
  description: "Clones the petition and assigns the given user as owner and creator.",
  type: "SupportMethodResponse",
  args: {
    petitionId: nonNull(idArg({ description: "Global ID of the petition" })),
    userId: nonNull(globalIdArg("User", { description: "Global ID of the user" })),
  },
  authorize: supportMethodAccess(),
  resolve: async (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
      const petition = await ctx.petitions.loadPetition(petitionId);
      if (!petition) {
        throw new Error(`Petition ${args.petitionId} not found`);
      }
      const user = await ctx.users.loadUser(args.userId);
      const userData = user ? await ctx.users.loadUserData(user.user_data_id) : null;
      if (!user || !userData) {
        throw new Error(`User ${args.userId} not found`);
      }
      const newPetition = await ctx.petitions.clonePetition(petitionId, user);

      return {
        result: RESULT.SUCCESS,
        message: `Petition successfully assigned to ${userData.first_name} ${
          userData.last_name
        }, new petition id: ${toGlobalId("Petition", newPetition.id)}`,
      };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const deletePetition = mutationField("deletePetition", {
  description: "Soft-deletes any given petition on the database.",
  type: "SupportMethodResponse",
  args: {
    petitionId: nonNull(idArg({ description: "Global ID of the petition" })),
  },
  authorize: supportMethodAccess(),
  resolve: async (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
      const petition = await ctx.petitions.loadPetition(petitionId);
      if (!petition) {
        throw new Error(`Petition ${args.petitionId} not found.`);
      }

      await ctx.petitions.withTransaction(async (t) => {
        await ctx.petitions.deleteAllPermissions([petitionId], ctx.user!, t);
        await ctx.petitions.deletePetitionUserNotificationsByPetitionId([petitionId], undefined, t);
        await ctx.petitions.deletePetition(petitionId, ctx.user!, t);
      });
      return {
        result: RESULT.SUCCESS,
        message: `Petition ${args.petitionId} deleted.`,
      };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const forceUpdateSignatureOrganizationBrandings = mutationField(
  "forceUpdateSignatureOrganizationBrandings",
  {
    description:
      "Forces an update of the branding of every signature integration of the selected organization.",
    type: "SupportMethodResponse",
    args: {
      orgId: nonNull(intArg()),
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
        await ctx.signature.updateBranding(orgId);
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
    locale: nonNull("PetitionLocale"),
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

        await ctx.aws.resetUserPassword(email, {
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

export const getApiTokenOwner = mutationField("getApiTokenOwner", {
  description: "Get the user who owns an API Token",
  type: "SupportMethodResponse",
  args: {
    token: nonNull(stringArg()),
  },
  authorize: supportMethodAccess(),
  resolve: async (_, { token }, ctx) => {
    try {
      const tokenHash = await hash(token, "");
      const userToken = await ctx.userAuthentication.loadUserAuthenticationByTokenHash(tokenHash);
      if (!isDefined(userToken)) {
        throw new Error("Token not found");
      }
      const user = await ctx.users.loadUser(userToken.user_id);
      const userData = user ? await ctx.users.loadUserData(user.user_data_id) : null;

      if (!isDefined(user) || !isDefined(userData)) {
        throw new Error("Token found but user is deleted");
      }
      return {
        result: RESULT.SUCCESS,
        message: `User:${user.id} with email ${userData.email}.`,
      };
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
    organizationId: nonNull(intArg({ description: "Numeric ID of the organization" })),
    userId: nonNull(globalIdArg("User", { description: "Global ID of the new owner" })),
  },
  authorize: supportMethodAccess(),
  resolve: async (_, { organizationId, userId }, ctx) => {
    const newOwner = await ctx.users.loadUser(userId);
    if (!newOwner) {
      return {
        result: RESULT.FAILURE,
        message: `Can't find user with id ${userId}`,
      };
    }
    if (newOwner.org_id !== organizationId) {
      return {
        result: RESULT.FAILURE,
        message: `User ${userId} does not belong to organization ${organizationId}.`,
      };
    }

    const currentOwner = await ctx.organizations.getOrganizationOwner(organizationId);

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
    templateId: nonNull(idArg({ description: "global ID of the template" })),
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
      const { id } = fromGlobalId(args.templateId, "Petition");
      const template = await ctx.petitions.loadPetition(id);
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
        const res = await ctx.aws.publicFiles.uploadFile(path, mimetype, createReadStream());
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
        id,
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
      const res = await ctx.aws.publicFiles.uploadFile(path, mimetype, createReadStream());
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

export const shareSignaturitApiKey = mutationField("shareSignaturitApiKey", {
  description: `Shares our SignaturIt production APIKEY with the passed Org, creates corresponding usage limits and activates PETITION_SIGNATURE feature flag.`,
  type: "SupportMethodResponse",
  args: {
    orgId: nonNull(intArg({ description: "Numeric ID of the Organization" })),
    limit: nonNull(
      intArg({ description: "How many credits allow the org to use in the given period" })
    ),
    period: nonNull(
      stringArg({
        description: "Period of the usage limit. e.g.: 1 month, 1 year, 20 days, etc...",
      })
    ),
  },
  authorize: supportMethodAccess(),
  resolve: async (_, { orgId, period, limit }, ctx) => {
    const org = await ctx.organizations.loadOrg(orgId);
    const signatureIntegrations = await ctx.integrations.loadIntegrationsByOrgId(
      orgId,
      "SIGNATURE"
    );

    const hasSharedSignaturitApiKey =
      signatureIntegrations.length > 0 &&
      signatureIntegrations.some(
        (i) =>
          i.provider.toUpperCase() === "SIGNATURIT" &&
          i.settings.CREDENTIALS.API_KEY === ctx.config.signature.signaturitSharedProductionApiKey
      );

    if (!org) {
      return { result: RESULT.FAILURE, message: `Organization:${orgId} not found` };
    }

    return await ctx.organizations.withTransaction(async (t) => {
      try {
        await Promise.all([
          !hasSharedSignaturitApiKey
            ? ctx.integrations.createOrgIntegration<"SIGNATURE", "SIGNATURIT">(
                {
                  type: "SIGNATURE",
                  provider: "SIGNATURIT",
                  name: "Signaturit",
                  org_id: orgId,
                  settings: {
                    CREDENTIALS: {
                      API_KEY: ctx.config.signature.signaturitSharedProductionApiKey,
                    },
                    ENVIRONMENT: "production",
                  },
                  is_enabled: true,
                },
                `User:${ctx.user!.id}`,
                t
              )
            : null,
          ctx.organizations.createOrganizationUsageLimit(
            orgId,
            {
              limit_name: "SIGNATURIT_SHARED_APIKEY",
              limit,
              period,
            },
            t
          ),
          ctx.featureFlags.addOrUpdateFeatureFlagOverride(
            orgId,
            { name: "PETITION_SIGNATURE", value: true },
            t
          ),
          ctx.organizations.updateOrganization(
            orgId,
            {
              usage_details: {
                ...org.usage_details,
                SIGNATURIT_SHARED_APIKEY: { limit, period },
              },
            },
            `User:${ctx.user!.id}`,
            t
          ),
        ]);
        return { result: RESULT.SUCCESS };
      } catch (error: any) {
        if ((error.message as string).includes("invalid input syntax for type interval")) {
          return {
            result: RESULT.FAILURE,
            message: `"${period}" is not a valid Postgres interval`,
          };
        } else {
          return { result: RESULT.FAILURE, message: error.message };
        }
      }
    });
  },
});

export const updateFeatureFlag = mutationField("updateFeatureFlag", {
  description: "Activate or deactivate an organization feature flag",
  type: "SupportMethodResponse",
  args: {
    featureFlag: nonNull("FeatureFlag"),
    orgId: nonNull(intArg({ description: "Numeric ID of the organization" })),
    value: nonNull(booleanArg({ description: "Feature flag value" })),
  },
  authorize: supportMethodAccess(),
  resolve: async (_, { featureFlag, value, orgId }, ctx) => {
    try {
      await ctx.featureFlags.addOrUpdateFeatureFlagOverride(orgId, { name: featureFlag, value });
      if (["REMOVE_PARALLEL_BRANDING"].includes(featureFlag)) {
        await ctx.signature.updateBranding(orgId);
      }
      return {
        result: RESULT.SUCCESS,
        message: `Organization with ID: ${orgId} now has ${featureFlag} set to ${String(
          value
        ).toUpperCase()}`,
      };
    } catch (error: any) {
      if ((error.message as string).includes("feature_flag_override_org_id_foreign")) {
        return { result: RESULT.FAILURE, message: `Wrong organization ID: ${orgId}` };
      }
      return { result: RESULT.FAILURE, message: error.message };
    }
  },
});

export const updateOrganizationUserLimit = mutationField("updateOrganizationUserLimit", {
  description: "Updates the user limit for a organization",
  type: "SupportMethodResponse",
  args: {
    orgId: nonNull(intArg({ description: "Numeric ID of the organization" })),
    limit: nonNull(intArg({ description: "How many users allow the org to create" })),
  },
  authorize: supportMethodAccess(),
  resolve: async (_, { orgId, limit }, ctx) => {
    try {
      const org = await ctx.organizations.loadOrg(orgId);
      if (!org) {
        return { result: RESULT.FAILURE, message: `Organization:${orgId} not found` };
      }
      await ctx.organizations.updateOrganization(
        orgId,
        {
          usage_details: {
            ...org.usage_details,
            USER_LIMIT: limit,
          },
        },
        `User:${ctx.user!.id}`
      );
      return {
        result: RESULT.SUCCESS,
        message: `Organization "${org.name}" with ID ${orgId}, USER_LIMIT has been updated from ${org.usage_details.USER_LIMIT} to ${limit}.`,
      };
    } catch (error: any) {
      return { result: RESULT.FAILURE, message: error.message };
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

export const updateOrganizationLimits = mutationField("updateOrganizationLimits", {
  type: "SupportMethodResponse",
  description:
    "Updates the limits of a given org. If 'Update Only Current Period' is left unchecked, the changes will be reflected on the next period.",
  authorize: supportMethodAccess(),
  args: {
    orgId: nonNull(intArg({ description: "Numeric ID of the Organization" })),
    type: nonNull("OrganizationUsageLimitName"),
    amount: nonNull(
      intArg({ description: "How many credits allow the org to use in the given period" })
    ),
    period: nullable(
      stringArg({
        description: "e.g.: 1 month, 1 year, 20 days, etc...",
      })
    ),
    updateOnlyCurrentPeriod: nonNull(booleanArg()),
    startNewPeriod: nonNull(
      booleanArg({ description: "End current period and start new with this arguments" })
    ),
  },
  resolve: async (_, args, ctx) => {
    if (args.updateOnlyCurrentPeriod && args.startNewPeriod) {
      return { result: RESULT.FAILURE, message: "Choose only one of the switches" };
    }
    const org = await ctx.organizations.loadOrg(args.orgId);
    if (!org) {
      return { result: RESULT.FAILURE, message: `Organization:${args.orgId} not found` };
    }

    // limit the input of period, as this has to be a valid postgres interval
    if (isDefined(args.period) && !new RegExp(/^\d+ (day|month|year)s?$/).test(args.period)) {
      return {
        result: RESULT.FAILURE,
        message: `Period must match RegExp: ^\d+ (day|month|year)s?$`,
      };
    }

    const period = args.period ?? ((org.usage_details[args.type] as any).period as string);

    if (args.startNewPeriod) {
      const currentPeriod = await ctx.organizations.getOrganizationCurrentUsageLimit(
        org.id,
        args.type
      );
      let newPeriodStartDate: Date | null = null;
      if (currentPeriod) {
        const [oldLimit] = await ctx.organizations.updateUsageLimitAsExpired(currentPeriod.id);
        newPeriodStartDate = oldLimit.period_end_date;
      }
      await ctx.organizations.createOrganizationUsageLimit(org.id, {
        limit_name: args.type,
        limit: args.amount,
        period,
        period_start_date: newPeriodStartDate ?? undefined,
      });
    }

    if (!args.updateOnlyCurrentPeriod) {
      await ctx.organizations.updateOrganization(
        args.orgId,
        {
          usage_details: {
            ...org.usage_details,
            ...{
              [args.type]: {
                limit: args.amount,
                period,
              },
            },
          },
        },
        `User:${ctx.user!.id}`
      );
    } else {
      await ctx.organizations.upsertOrganizationUsageLimit(
        args.orgId,
        args.type,
        args.amount,
        period
      );
    }
    return {
      result: RESULT.SUCCESS,
    };
  },
});

export const updateOrganizationTier = mutationField("updateOrganizationTier", {
  description: "Applies a given tier to the organization",
  type: "SupportMethodResponse",
  authorize: supportMethodAccess(),
  args: {
    orgId: nonNull(intArg({ description: "Numeric ID of the Organization" })),
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
        PETITION_SEND: ${tier.PETITION_SEND.limit} in ${tier.PETITION_SEND.period} 

        Feature Flags: 
        ${tier.FEATURE_FLAGS.map((ff) => `${ff.name}: ${ff.value}`).join("\n")}`,
      };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});
