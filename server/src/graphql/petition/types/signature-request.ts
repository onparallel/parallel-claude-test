import { enumType, objectType } from "@nexus/schema";
import { notEmptyObject } from "../../helpers/validators/notEmptyObject";

export const PetitionSignatureRequestStatus = enumType({
  name: "PetitionSignatureRequestStatus",
  members: ["PROCESSING", "COMPLETED", "CANCELLED"],
});

export const PetitionSignatureRequest = objectType({
  name: "PetitionSignatureRequest",
  rootTyping: "db.PetitionSignatureRequest",
  definition(t) {
    t.globalId("id", {
      prefixName: "PetitionSignature",
    });
    t.implements("Timestamps");
    t.field("petition", {
      type: "Petition",
      resolve: async (o, _, ctx) => {
        return (await ctx.petitions.loadPetition(o.petition_id))!;
      },
    });
    t.field("signers", {
      type: "Contact",
      list: [true],
      resolve: async (root, _, ctx) => {
        const ids = root.signature_settings.contactIds as number[];
        return await ctx.contacts.loadContact(ids);
      },
    });
    t.string("externalId", {
      nullable: true,
      resolve: (o) => o.external_id,
    });
    t.jsonObject("settings", {
      validateArgs: notEmptyObject((o) => o.signature_settings, "settings"),
      resolve: (o) => o.signature_settings,
    });
    t.field("status", {
      type: "PetitionSignatureRequestStatus",
      resolve: (o) => o.status,
    });
    t.jsonObject("data", {
      nullable: true,
      resolve: (o) => o.data,
    });
    t.jsonObject("signedDocument", {
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (!root.file_upload_id) return {};
        return await ctx.files.loadFileUpload(root.file_upload_id);
      },
    });
  },
});
