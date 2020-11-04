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

export const publicPetitionSignature = queryField("publicPetitionSignature", {
  type: "PublicPetitionSignature",
  list: [true],
  nullable: false,
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
  },
  resolve: async (_, { petitionId }, ctx) => {
    return (await ctx.petitions.loadPetitionSignature(petitionId)) ?? [];
  },
});

// temporal endpoint until implementing token
export const publicPetitionPdfData = queryField("publicPetitionPdf", {
  type: "Petition",
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
  },
  nullable: true,
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.loadPetition(args.petitionId);
  },
});
