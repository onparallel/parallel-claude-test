import { arg, idArg, mutationField } from "@nexus/schema";
import { authenticate } from "../../helpers/authorize";
import { dateTimeArg } from "../../helpers/date";

export const createPetitionFieldComment = mutationField(
  "createPetitionFieldComment",
  {
    description: "Create a petition field comment.",
    type: "PetitionFieldComment",
    authorize: authenticate(),
    args: {
      petitionId: idArg({ required: true }),
      locale: arg({ type: "PetitionLocale", required: true }),
      deadline: dateTimeArg({}),
    },
    resolve: async (_, { name, locale, deadline }, ctx) => {
      const petition = await ctx.petitions.createPetition(
        { name, locale, deadline: deadline ?? null, email_subject: name },
        ctx.user!
      );
      return petition;
    },
  }
);
