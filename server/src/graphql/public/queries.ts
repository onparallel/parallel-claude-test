import { idArg, queryField } from "@nexus/schema";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { fetchPetitionAccess } from "./authorizers";

export const accessQuery = queryField("access", {
  type: "PublicPetitionAccess",
  args: {
    keycode: idArg({ required: true }),
  },
  nullable: true,
  authorize: fetchPetitionAccess("keycode"),
  resolve: async (root, args, ctx) => {
    await ctx.petitions.createEvent_old(
      ctx.access!.petition_id,
      "ACCESS_OPENED",
      {
        petition_access_id: ctx.access!.id,
      }
    );
    return ctx.access!;
  },
});

// temporal public endpoint until implementing auth token
export const publicPetitionSignature = queryField("publicPetitionSignature", {
  type: "PetitionSignatureRequest",
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
  },
  nullable: true,
  resolve: async (_, { petitionId }, ctx) => {
    return await ctx.petitions.loadPetitionSignatureByPetitionId(petitionId);
  },
});
