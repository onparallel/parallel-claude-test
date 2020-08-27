import { mutationField } from "@nexus/schema";
import { chain, authenticate } from "../../helpers/authorize";
import { userHasAccessToPetitions } from "../authorizers";
import { globalIdArg } from "../../helpers/globalIdPlugin";

export const createTemplateFromPetition = mutationField(
  "createTemplateFromPetition",
  {
    description: "Creates a template based on a given petition.",
    type: "PetitionBase",
    authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.clonePetition(args.petitionId, ctx.user!, {
        status: null,
        is_template: true,
      });
    },
  }
);
