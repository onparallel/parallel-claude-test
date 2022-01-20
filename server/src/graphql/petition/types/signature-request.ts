import { enumType, objectType } from "nexus";

export const PetitionSignatureRequestStatus = enumType({
  name: "PetitionSignatureRequestStatus",
  members: ["ENQUEUED", "PROCESSING", "COMPLETED", "CANCELLED"],
});

export const PetitionSignatureCancelReason = enumType({
  name: "PetitionSignatureCancelReason",
  members: ["CANCELLED_BY_USER", "DECLINED_BY_SIGNER", "REQUEST_ERROR", "REQUEST_RESTARTED"],
});

export const PetitionSignatureRequestSignerStatus = objectType({
  name: "PetitionSignatureRequestSignerStatus",
  sourceType: /* ts */ `{
    firstName: string;
    lastName: string;
    email: string;
    status?:
      | {
          sent_at?: Date;
          opened_at?: Date;
          signed_at?: Date;
          declined_at?: Date;
        }
      | undefined;
  }`,
  definition(t) {
    t.field("signer", {
      type: "PetitionSigner",
      resolve: (o) => ({
        firstName: o.firstName,
        lastName: o.lastName,
        email: o.email,
      }),
    });
    t.string("status", {
      description: "The signing status of the individual contact.",
      resolve: (o) =>
        o.status?.signed_at ? "SIGNED" : o.status?.declined_at ? "DECLINED" : "PENDING",
    });
    t.nullable.datetime("sentAt", {
      resolve: (o) => o.status?.sent_at ?? null,
    });
    t.nullable.datetime("openedAt", {
      resolve: (o) => o.status?.opened_at ?? null,
    });
    t.nullable.datetime("signedAt", {
      resolve: (o) => o.status?.signed_at ?? null,
    });
    t.nullable.datetime("declinedAt", {
      resolve: (o) => o.status?.declined_at ?? null,
    });
  },
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
    t.field("environment", {
      type: "SignatureOrgIntegrationEnvironment",
      description: "The environment of the petition signature.",
      resolve: async (root, _, ctx) => {
        const integration = (await ctx.integrations.loadIntegration(
          root.signature_config.orgIntegrationId
        ))!;
        return integration.settings.ENVIRONMENT === "production" ? "PRODUCTION" : "DEMO";
      },
    });
    t.nonNull.list.nonNull.field("signerStatus", {
      type: "PetitionSignatureRequestSignerStatus",
      resolve: (o) =>
        ((o.signature_config.signersInfo as any[]) ?? []).map((signer, index) => ({
          ...signer,
          status: o.signer_status[index],
        })),
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
