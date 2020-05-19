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
    return ctx.access!;
  },
});
