import { idArg, nonNull, queryField, stringArg } from "nexus";
import { outdent } from "outdent";
import { isNonNullish, isNullish, zip } from "remeda";
import { fromGlobalId, isGlobalId, toGlobalId } from "../../util/globalId";
import { hash } from "../../util/token";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/Result";
import { superAdminAccess } from "./authorizers";

export const globalIdDecode = queryField("globalIdDecode", {
  description: "Decodes the given Global ID into an entity in the database.",
  type: "SupportMethodResponse",
  args: {
    id: nonNull(idArg({ description: "Global ID to decode" })),
  },
  authorize: superAdminAccess(),
  resolve: (_, args) => {
    try {
      const { id, type } = fromGlobalId(args.id);
      return { result: RESULT.SUCCESS, message: `${type}:${id}` };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});

export const globalIdEncode = queryField("globalIdEncode", {
  description: "Encodes the given ID into a Global ID.",
  type: "SupportMethodResponse",
  args: {
    id: nonNull(stringArg({ description: "ID to encode" })),
    type: nonNull(stringArg({ description: "ID type" })),
  },
  authorize: superAdminAccess(),
  resolve: (_, args) => {
    try {
      return {
        result: RESULT.SUCCESS,
        message: toGlobalId<string | number>(args.type, args.id),
      };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});

export const getApiTokenOwner = queryField("getApiTokenOwner", {
  description: "Get the user who owns an API Token",
  type: "SupportMethodResponse",
  args: {
    token: nonNull(stringArg()),
  },
  authorize: superAdminAccess(),
  resolve: async (_, { token }, ctx) => {
    try {
      const tokenHash = await hash(token, "");
      const userToken = await ctx.userAuthentication.loadUserAuthenticationByTokenHash(tokenHash);
      if (isNullish(userToken)) {
        throw new Error("Token not found");
      }
      const user = await ctx.users.loadUser(userToken.user_id);
      const userData = user ? await ctx.users.loadUserData(user.user_data_id) : null;

      if (isNullish(user) || isNullish(userData)) {
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

export const exportPetitionToJson = queryField("exportPetitionToJson", {
  description: "Exports basic petition + fields configuration as JSON object",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, { petitionId }, ctx) => {
    try {
      return {
        result: RESULT.SUCCESS,
        type: "copy-to-clipboard",
        message: JSON.stringify(await ctx.petitionImportExport.toJson(petitionId), null, 2),
      };
    } catch (e) {
      console.error(e);
    }
    return { result: RESULT.FAILURE, message: "Something went wrong..." };
  },
});

export const petitionInformation = queryField("petitionInformation", {
  description:
    "Returns information about a petition: The name of the organization and emails of users with access to the petition",
  type: "SupportMethodResponse",
  authorize: superAdminAccess(),
  args: {
    petitionId: nonNull(idArg({ description: "Numeric or global ID of the petition" })),
  },
  resolve: async (_, { petitionId: id }, ctx) => {
    try {
      const petitionId = isGlobalId(id, "Petition") ? fromGlobalId(id).id : parseInt(id, 10);
      if (typeof petitionId !== "number" || Number.isNaN(petitionId)) {
        throw new Error("Invalid petition ID");
      }

      const petition = await ctx.petitions.loadPetition(petitionId);
      if (!petition) {
        throw new Error(`Petition:${petitionId} not found`);
      }

      const org = (await ctx.organizations.loadOrg(petition.org_id))!;
      const permissions = (await ctx.petitions.loadEffectivePermissions(petitionId))!;
      const userDatas = (
        await ctx.users.loadUserDataByUserId(permissions.map((p) => p.user_id!))
      ).filter(isNonNullish);

      return {
        result: RESULT.SUCCESS,
        message: outdent`
          Petition: ${petition.name} (${petition.id} | ${toGlobalId("Petition", petition.id)})
          Organization: ${org.name} (${org.id} | ${toGlobalId("Organization", org.id)})
          Users: 
          ${zip(permissions, userDatas)
            .map(
              ([p, ud]) =>
                `  - ${ud.email} ${p.type} (${p.user_id} | ${toGlobalId("User", p.user_id!)})`,
            )
            .join("\n")}
      `,
      };
    } catch (e) {
      console.error(e);
      return { result: RESULT.FAILURE, message: (e as any).message };
    }
  },
});
