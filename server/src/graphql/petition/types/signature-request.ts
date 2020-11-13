import { enumType, objectType } from "@nexus/schema";

export const PetitionSignatureRequestStatus = enumType({
  name: "PetitionSignatureRequestStatus",
  members: ["ENQUEUED", "PROCESSING", "COMPLETED", "CANCELLED"],
});

export const PetitionSignatureCancelReason = enumType({
  name: "PetitionSignatureCancelReason",
  members: ["CANCELLED_BY_USER", "DECLINED_BY_SIGNER"],
});

export const PetitionSignatureRequest = objectType({
  name: "PetitionSignatureRequest",
  rootTyping: "db.PetitionSignatureRequest",
  definition(t) {
    t.globalId("id");
    t.implements("Timestamps");
    t.field("petition", {
      type: "Petition",
      resolve: async (o, _, ctx) => {
        return (await ctx.petitions.loadPetition(o.petition_id))!;
      },
    });
    t.field("contacts", {
      type: "Contact",
      list: [false],
      resolve: async (root, _, ctx) => {
        const ids = root.signature_config.contactIds as number[];
        return await ctx.contacts.loadContact(ids);
      },
    });
    t.field("signatureConfig", {
      type: "SignatureConfig",
      description: "The signature configuration for the request.",
      resolve: (o) => o.signature_config,
    });
    t.field("status", {
      type: "PetitionSignatureRequestStatus",
      description: "The status of the petition signature.",
    });
  },
});
