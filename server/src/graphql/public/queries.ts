import { idArg, nonNull, nullable, queryField } from "@nexus/schema";
import { authenticatePublicAccess } from "./authorizers";

export const accessQuery = queryField("access", {
  type: nullable("PublicPetitionAccess"),
  args: {
    keycode: nonNull(idArg()),
  },
  authorize: authenticatePublicAccess("keycode"),
  resolve: async (root, args, ctx) => {
    await ctx.petitions.createEvent_old(
      ctx.access!.petition_id,
      "ACCESS_OPENED",
      { petition_access_id: ctx.access!.id }
    );
    return ctx.access!;
  },
});
