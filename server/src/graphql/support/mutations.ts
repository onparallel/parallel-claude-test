import { arg, idArg, intArg, mutationField, nonNull, nullable, stringArg } from "@nexus/schema";
import { isDefined, uniq } from "remeda";
import { fullName } from "../../util/fullName";
import { fromGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import { ArgValidationError } from "../helpers/errors";
import { RESULT } from "../helpers/result";
import { uploadArg } from "../helpers/upload";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { emailIsAvailable } from "../helpers/validators/emailIsAvailable";
import { validateFile } from "../helpers/validators/validateFile";
import { validEmail } from "../helpers/validators/validEmail";
import { validateHexColor } from "../tag/validators";
import { supportMethodAccess } from "./authorizers";

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
        await ctx.petitions.deletePetitionById(petitionId, ctx.user!, t);
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
    identifier: nonNull(stringArg({ description: "Identifier of the organization" })),
    status: nonNull(arg({ type: "OrganizationStatus" })),
  },
  authorize: supportMethodAccess(),
  resolve: async (_, args, ctx) => {
    try {
      const identifier = args.identifier.trim().toLowerCase();
      if (identifier.indexOf(" ") > -1) {
        throw new Error("Identifier must not contain spaces.");
      }

      const org = await ctx.organizations.createOrganization(
        {
          name: args.name.trim(),
          identifier,
          status: args.status,
        },
        `User:${ctx.user!.id}`
      );
      return {
        result: RESULT.SUCCESS,
        message: `Organization created with id ${org.id}`,
      };
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
    emailIsAvailable((args) => args.email, "email")
  ),
  authorize: supportMethodAccess(),
  resolve: async (_, args, ctx) => {
    try {
      const email = args.email.trim().toLowerCase();
      const org = await ctx.organizations.loadOrg(args.organizationId);
      if (!org) {
        throw new Error(`Organization with id ${args.organizationId} does not exist.`);
      }
      const cognitoId = await ctx.aws.createCognitoUser(
        email,
        args.password,
        args.firstName,
        args.lastName,
        {
          locale: args.locale ?? "en",
          organizationName: org.name,
          organizationUser: fullName(ctx.user!.first_name, ctx.user!.last_name),
        }
      );
      const user = await ctx.users.createUser(
        {
          cognito_id: cognitoId!,
          org_id: args.organizationId,
          organization_role: args.role,
          email,
          first_name: args.firstName,
          last_name: args.lastName,
          details: { source: "parallel" },
        },
        `User:${ctx.user!.id}`
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
        await ctx.integrations.removeSignaturitBrandingIds(orgId);
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
  },
  authorize: supportMethodAccess(),
  validateArgs: validEmail((args) => args.email, "email"),
  resolve: async (_, { email }, ctx) => {
    try {
      await ctx.aws.resetUserPassword(email);
      return {
        result: RESULT.SUCCESS,
        message: "User will receive an email with new temporary password.",
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
