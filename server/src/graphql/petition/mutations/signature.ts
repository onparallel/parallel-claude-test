import { mutationField } from "@nexus/schema";
import { toGlobalId } from "../../../util/globalId";
import { chain, authenticate } from "../../helpers/authorize";
import { WhitelistedError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/result";
import { userHasAccessToPetitions } from "../authorizers";

export const startSignatureRequest = mutationField("startSignatureRequest", {
  type: "Result",
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
  },
  authorize: chain(
    authenticate(),
    userHasAccessToPetitions("petitionId", ["OWNER"])
  ),
  resolve: async (_, { petitionId }, ctx) => {
    if (process.env.NODE_ENV !== "production") {
      const petition = await ctx.petitions.loadPetition(petitionId);
      const contacts = await ctx.contacts.loadContact(
        petition?.signature_config.contactIds as number[]
      );
      if (!contacts.every((c) => c && c.email.endsWith("@parallel.so"))) {
        throw new WhitelistedError(
          "DEVELOPMENT: All recipients must have a parallel email.",
          "403"
        );
      }
    }

    await ctx.aws.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", petitionId)}`,
      body: {
        type: "start-signature-process",
        payload: { petitionId: toGlobalId("Petition", petitionId) },
      },
    });

    return RESULT.SUCCESS;
  },
});

export const restartSignatureRequest = mutationField(
  "restartSignatureRequest",
  {
    type: "Result",
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
    },
    authorize: chain(
      authenticate(),
      userHasAccessToPetitions("petitionId", ["OWNER"])
    ),
    resolve: async (_, { petitionId }, ctx) => {
      await ctx.aws.enqueueMessages("signature-worker", {
        groupId: `signature-${toGlobalId("Petition", petitionId)}`,
        body: {
          type: "restart-signature-process",
          payload: { petitionId: toGlobalId("Petition", petitionId) },
        },
      });

      return RESULT.SUCCESS;
    },
  }
);

export const cancelSignatureRequest = mutationField("cancelSignatureRequest", {
  type: "Result",
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
  },
  authorize: chain(
    authenticate(),
    userHasAccessToPetitions("petitionId" as never, ["OWNER"])
  ),
  resolve: async (_, { petitionId }, ctx) => {
    const [signature] = await ctx.petitions.loadPetitionSignaturesByPetitionId(
      petitionId,
      "PROCESSING"
    );

    if (signature) {
      await ctx.aws.enqueueMessages("signature-worker", {
        groupId: `signature-${toGlobalId("Petition", petitionId)}`,
        body: {
          type: "cancel-signature-process",
          payload: { petitionSignatureRequestId: signature.id },
        },
      });

      return RESULT.SUCCESS;
    } else {
      return RESULT.FAILURE;
    }
  },
});
