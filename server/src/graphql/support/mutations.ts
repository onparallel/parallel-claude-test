import { arg, mutationField } from "@nexus/schema";
import { authenticate, chain } from "../helpers/authorize";
import { RESULT } from "../helpers/result";
import { userBelongsToOrg } from "./authorizers";

export const supportTest = mutationField("assignPetitionToUser", {
  description: "Assigns any valid petition to a given user.",
  type: "SupportMethodResponse",
  args: {
    petitionId: arg({ type: "Int", required: true }),
    userId: arg({ type: "Int", required: true }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.loadPetition(args.petitionId);
    const user = await ctx.users.loadUser(args.userId);
    console.log(petition, user);
    return args.petitionId === 1
      ? { result: RESULT.SUCCESS, message: "User assigned" }
      : { result: RESULT.FAILURE, message: "an error happened" };
  },
});
