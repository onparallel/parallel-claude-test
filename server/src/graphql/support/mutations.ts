import { arg, idArg, intArg, mutationField, stringArg } from "@nexus/schema";
import { fromGlobalId } from "../../util/globalId";
import { RESULT } from "../helpers/result";
import { validEmail } from "../helpers/validators/validEmail";
import { supportMethodAccess } from "./authorizers";

export const assignPetitionToUser = mutationField("assignPetitionToUser", {
  description:
    "Clones the petition and assigns the given user as owner and creator.",
  type: "SupportMethodResponse",
  args: {
    petitionId: idArg({
      required: true,
      description: "Global ID of the petition",
    }),
    userId: intArg({
      required: true,
      description: "ID of the user",
    }),
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
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const deletePetition = mutationField("deletePetition", {
  description: "Soft-deletes any given petition on the database.",
  type: "SupportMethodResponse",
  args: {
    petitionId: idArg({
      required: true,
      description: "Global ID of the petition",
    }),
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
        await ctx.petitions.deletePetitionById(petitionId, ctx.user!, t);
      });
      return {
        result: RESULT.SUCCESS,
        message: `Petition ${args.petitionId} deleted.`,
      };
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const createOrganization = mutationField("createOrganization", {
  description: "Creates a new organization.",
  type: "SupportMethodResponse",
  args: {
    name: stringArg({
      required: true,
      description: "Name of the organization",
    }),
    identifier: stringArg({
      required: true,
      description: "Identifier of the organization",
    }),
    status: arg({ type: "OrganizationStatus", required: true }),
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
        ctx.user!
      );
      return {
        result: RESULT.SUCCESS,
        message: `Organization created with id ${org.id}`,
      };
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const createUser = mutationField("createUser", {
  description: "Creates a new user in the specified organization.",
  type: "SupportMethodResponse",
  args: {
    email: stringArg({
      required: true,
      description: "Email of the user",
    }),
    password: stringArg({
      required: true,
      description: "Temporary of the user",
    }),
    firstName: stringArg({
      required: true,
      description: "First name of the user",
    }),
    lastName: stringArg({
      required: true,
      description: "Last name of the user",
    }),
    role: arg({
      type: "OrganizationRole",
      required: true,
      description: "Role of the user",
    }),
    organizationId: intArg({
      required: true,
      description: "ID of the organization",
    }),
  },
  validateArgs: validEmail((args) => args.email, "email"),
  authorize: supportMethodAccess(),
  resolve: async (_, args, ctx) => {
    try {
      const org = await ctx.organizations.loadOrg(args.organizationId);
      if (!org) {
        throw new Error(
          `Organization with id ${args.organizationId} does not exist.`
        );
      }
      const cognitoId = await ctx.aws.createCognitoUser(
        args.email,
        args.password
      );
      const user = await ctx.users.createUser(
        {
          cognito_id: cognitoId!,
          org_id: args.organizationId,
          organization_role: args.role,
          email: args.email,
          first_name: args.firstName,
          last_name: args.lastName,
        },
        ctx.user!
      );
      return {
        result: RESULT.SUCCESS,
        message: `User with email ${user.email} created in org ${org.name}`,
      };
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.message };
    }
  },
});

export const resetSignaturitOrganizationBranding = mutationField(
  "resetSignaturitOrganizationBranding",
  {
    description:
      "Removes the Signaturit Branding Ids of selected organization.",
    type: "SupportMethodResponse",
    args: {
      orgId: arg({ type: "Int", required: true }),
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
      } catch (e) {
        return { result: RESULT.FAILURE, message: e.message };
      }
    },
  }
);

// export const uploadOrgLogo = mutationField("uploadOrganizationLogo", {
//   description: "Uploads a logo for an organization.",
//   type: "SupportMethodResponse",
//   args: {
//     orgId: arg({ type: "Int", required: true }),
//     logo: arg({ type: "Upload", required: true }),
//   },
//   validateArgs: fileIsImage((args) => args.logo, "logo"),
//   authorize: supportMethodAccess(),
//   resolve: async (_, args, ctx) => {
//     const org = await ctx.organizations.loadOrg(args.orgId);
//     if (!org) {
//       throw new WhitelistedError(
//         `Organization with id ${args.orgId} not found`,
//         "ORGANIZATION_NOT_FOUND"
//       );
//     }

//     const file = await (args.logo as Promise<UploadedFile>);
//     console.log(file);

//     return {
//       result: RESULT.SUCCESS,
//     };
//   },
// });
