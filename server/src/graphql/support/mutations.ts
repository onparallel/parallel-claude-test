import { Knex } from "knex";
import { arg, booleanArg, idArg, intArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isDefined, uniq } from "remeda";
import { ApiContext } from "../../context";
import { UserOrganizationRole } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { fromGlobalId } from "../../util/globalId";
import { hash, random } from "../../util/token";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { uploadArg } from "../helpers/upload";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { emailIsAvailable } from "../helpers/validators/emailIsAvailable";
import { validateFile } from "../helpers/validators/validateFile";
import { validateRegex } from "../helpers/validators/validateRegex";
import { validEmail } from "../helpers/validators/validEmail";
import { validateHexColor } from "../tag/validators";
import { supportMethodAccess } from "./authorizers";

async function supportCreateUser(
  args: {
    orgId: number;
    orgName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserOrganizationRole;
    locale?: string;
  },
  ctx: ApiContext,
  t?: Knex.Transaction
) {
  const email = args.email.trim().toLowerCase();
  const cognitoId = await ctx.aws.createCognitoUser(
    email,
    args.password,
    args.firstName,
    args.lastName,
    {
      locale: args.locale ?? "en",
      organizationName: args.orgName,
      organizationUser: fullName(ctx.user!.first_name, ctx.user!.last_name),
    }
  );
  return await ctx.users.createUser(
    {
      cognito_id: cognitoId!,
      org_id: args.orgId,
      organization_role: args.role,
      email,
      first_name: args.firstName,
      last_name: args.lastName,
      details: { source: "parallel", preferredLocale: args.locale ?? "en" },
    },
    `User:${ctx.user!.id}`,
    t
  );
}

export const assignPetitionToUser = mutationField("assignPetitionToUser", {
  description: "Clones the petition and assigns the given user as owner and creator.",
  type: "SupportMethodResponse",
  args: {
    petitionId: nonNull(idArg({ description: "Global ID of the petition" })),
    userId: nonNull(intArg({ description: "ID of the user" })),
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
      if (!user) {
        throw new Error(`User ${args.userId} not found`);
      }
      const newPetition = await ctx.petitions.clonePetition(petitionId, user);

      return {
        result: RESULT.SUCCESS,
        message: `Petition successfully assigned to ${user.first_name} ${user.last_name}, new id: ${newPetition.id}`,
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

export const createOrganization = mutationField("createOrganization", {
  description: "Creates a new organization.",
  type: "SupportMethodResponse",
  args: {
    name: nonNull(stringArg({ description: "Name of the organization" })),
    status: nonNull("OrganizationStatus"),
    firstName: nonNull(stringArg({ description: "First name of the organization owner" })),
    lastName: nonNull(stringArg({ description: "Last name of the organization owner" })),
    email: nonNull(stringArg({ description: "Email of the organization owner" })),
    password: nonNull(stringArg({ description: "Temporary password of the organization owner" })),
  },
  authorize: supportMethodAccess(),
  validateArgs: validateAnd(
    validEmail((args) => args.email, "email"),
    emailIsAvailable((args) => args.email),
    (_, { status }, ctx, info) => {
      if (status === "ROOT") {
        throw new ArgValidationError(info, "status", "Can't create an org with ROOT status");
      }
    }
  ),
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.petitions.withTransaction(async (t) => {
        const org = await ctx.organizations.createOrganization(
          {
            name: args.name.trim(),
            status: args.status,
          },
          `User:${ctx.user!.id}`,
          t
        );
        await supportCreateUser(
          {
            orgId: org.id,
            orgName: org.name,
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            password: args.password,
            role: "OWNER",
            locale: "es",
          },
          ctx,
          t
        );
        return {
          result: RESULT.SUCCESS,
          message: `Organization:${org.id} created successfully with owner ${args.email}.`,
        };
      });
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const createUser = mutationField("createUser", {
  description: "Creates a new user in the specified organization.",
  type: "SupportMethodResponse",
  args: {
    email: nonNull(stringArg({ description: "Email of the user" })),
    password: nonNull(stringArg({ description: "Temporary password of the user" })),
    firstName: nonNull(stringArg({ description: "First name of the user" })),
    lastName: nonNull(stringArg({ description: "Last name of the user" })),
    role: nonNull(arg({ type: "OrganizationRole", description: "Role of the user" })),
    organizationId: nonNull(intArg({ description: "ID of the organization" })),
    locale: stringArg(),
  },
  validateArgs: validateAnd(
    validEmail((args) => args.email, "email"),
    emailIsAvailable((args) => args.email)
  ),
  authorize: supportMethodAccess(),
  resolve: async (_, args, ctx) => {
    try {
      const org = await ctx.organizations.loadOrg(args.organizationId);
      if (!org) {
        throw new Error(`Organization with id ${args.organizationId} does not exist.`);
      }
      const user = await supportCreateUser(
        {
          orgId: org.id,
          orgName: org.name,
          email: args.email,
          firstName: args.firstName,
          lastName: args.lastName,
          password: args.password,
          role: args.role,
          locale: args.locale ?? "en",
        },
        ctx
      );
      return {
        result: RESULT.SUCCESS,
        message: `User with email ${user.email} created in org ${org.name}`,
      };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const resetSignaturitOrganizationBranding = mutationField(
  "resetSignaturitOrganizationBranding",
  {
    description: "Removes the Signaturit Branding Ids of selected organization.",
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
        await ctx.integrations.removeSignaturitBrandingIds(orgId, `User:${ctx.user!.id}`);
        return {
          result: RESULT.SUCCESS,
          message: `Brandings resetted successfully`,
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
      const user = await ctx.users.loadUserByEmail(email);
      if (user) {
        const organization = await ctx.organizations.loadOrg(user.org_id);
        await ctx.aws.resetUserPassword(email, {
          locale,
          organizationName: organization!.name,
          organizationUser: fullName(ctx.user!.first_name, ctx.user!.last_name),
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
      if (!isDefined(user)) {
        throw new Error("Token found but user is deleted");
      }
      return {
        result: RESULT.SUCCESS,
        message: `User:${user.id} with email ${user.email}.`,
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
    userId: nonNull(intArg({ description: "Numeric ID of the new owner" })),
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
    validateHexColor((args) => args.backgroundColor, "backgroundColor"),
    validateRegex((args) => args.slug, "slug", /^[a-z-]+$/),
    validateIf(
      (args) => isDefined(args.image),
      validateFile(
        (args) => args.image!,
        { contentType: "image/*", maxSize: 1024 * 1024 * 10 },
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
          : templateMd.categories || null;

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
    userId: nonNull(intArg({ description: "Numeric ID of the user" })),
    image: nonNull(uploadArg()),
  },
  validateArgs: validateFile(
    (args) => args.image,
    { contentType: "image/*", maxSize: 10 * 1024 * 1024 },
    "image"
  ),
  resolve: async (_, { userId, image }, ctx) => {
    try {
      const { createReadStream, mimetype } = await image;

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

      await ctx.users.updateUserById(
        userId,
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
  description: `Shares our SignaturIt production APIKEY with the passed Org, and creates corresponding usage limits.`,
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
        (i) => i.settings.API_KEY === ctx.config.signature.signaturitSharedProductionApiKey
      );

    if (!org) {
      return { result: RESULT.FAILURE, message: `Organization:${orgId} not found` };
    }

    return await ctx.organizations.withTransaction(async (t) => {
      try {
        await Promise.all([
          !hasSharedSignaturitApiKey
            ? ctx.integrations.createOrgIntegration(
                {
                  type: "SIGNATURE",
                  name: "Signaturit",
                  provider: "SIGNATURIT",
                  org_id: orgId,
                  settings: {
                    API_KEY: ctx.config.signature.signaturitSharedProductionApiKey,
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
      await ctx.featureFlags.addOrUpdateFeatureFlagOverride(featureFlag, orgId, value);
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
