import { idArg, mutationField } from "@nexus/schema";
import { authenticate, chain } from "../helpers/authorize";
import { RESULT } from "../helpers/result";
import { userBelongsToOrg } from "./authorizers";

export const supportTest = mutationField("supportTest", {
  description:
    "test mutation for support methods. Returns success only for id 0",
  type: "Result",
  args: {
    id: idArg({ required: true }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: async (_, args) => {
    return args.id === "0" ? RESULT.SUCCESS : RESULT.FAILURE;
  },
});
