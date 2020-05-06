import { idArg, queryField } from "@nexus/schema";
import { fetchSendout } from "./authorizers";

export const sendoutsQuery = queryField("sendout", {
  type: "PublicPetitionSendout",
  args: {
    keycode: idArg({ required: true }),
  },
  nullable: true,
  authorize: fetchSendout("keycode"),
  resolve: async (root, args, ctx) => {
    return ctx.sendout!;
  },
});
