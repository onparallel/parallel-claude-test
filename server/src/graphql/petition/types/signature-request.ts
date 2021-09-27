import { enumType, objectType } from "nexus";

export const PetitionSignatureRequestStatus = enumType({
  name: "PetitionSignatureRequestStatus",
  members: ["ENQUEUED", "PROCESSING", "COMPLETED", "CANCELLED"],
});

export const PetitionSignatureCancelReason = enumType({
  name: "PetitionSignatureCancelReason",
  members: ["CANCELLED_BY_USER", "DECLINED_BY_SIGNER", "REQUEST_ERROR"],
});

export const PetitionSignatureRequest = objectType({
  name: "PetitionSignatureRequest",
  sourceType: "db.PetitionSignatureRequest",
  definition(t) {
    t.globalId("id");
    t.implements("Timestamps");
    t.field("petition", {
      type: "Petition",
      resolve: async (o, _, ctx) => {
        return (await ctx.petitions.loadPetition(o.petition_id))!;
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
    t.nullable.string("signedDocumentFilename", {
      resolve: async (o, _, ctx) => {
        return o.file_upload_id
          ? (await ctx.files.loadFileUpload(o.file_upload_id))?.filename ?? null
          : null;
      },
    });
    t.nullable.string("auditTrailFilename", {
      resolve: async (o, _, ctx) => {
        return o.file_upload_audit_trail_id
          ? (await ctx.files.loadFileUpload(o.file_upload_audit_trail_id))?.filename ?? null
          : null;
      },
    });
    t.jsonObject("metadata", {
      description: "Metadata for this signature request.",
      resolve: (o) => o.metadata,
    });
  },
});
