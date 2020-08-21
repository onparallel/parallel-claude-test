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
