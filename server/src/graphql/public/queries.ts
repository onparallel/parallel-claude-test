import { idArg, queryField } from "@nexus/schema";
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
  authorize: fetchPetitionAccess("keycode"),
  args: {
    keycode: idArg({ required: true }),
  },
  resolve: async (root, args, ctx) => {
    return (
      (await ctx.petitions.loadPetitionSignature(ctx.access!.petition_id)) ?? []
    );
  },
});
