import { objectType } from "nexus";
import { isDefined } from "remeda";
import { PetitionField } from "../../db/__types";

export const PetitionEventSubscription = objectType({
  name: "PetitionEventSubscription",
  definition(t) {
    t.globalId("id");
    t.nonNull.boolean("isEnabled", { resolve: (o) => o.is_enabled });
    t.nonNull.boolean("isFailing", { resolve: (o) => o.is_failing });
    t.nonNull.string("eventsUrl", { resolve: (o) => o.endpoint });
    t.nullable.list.nonNull.field("eventTypes", {
      type: "PetitionEventType",
      resolve: (o) => o.event_types,
    });
    t.nullable.field("fromTemplate", {
      type: "PetitionBaseMini",
      resolve: async (o, _, ctx) => {
        return o.from_template_id ? await ctx.petitions.loadPetition(o.from_template_id) : null;
      },
    });
    t.nullable.list.nonNull.field("fromTemplateFields", {
      type: "PetitionFieldMini",
      resolve: async (o, _, ctx) => {
        return isDefined(o.from_template_field_ids)
          ? ((await ctx.petitions.loadField(o.from_template_field_ids)) as PetitionField[])
          : null;
      },
    });
    t.nullable.string("name");
    t.nonNull.list.nonNull.field("signatureKeys", {
      type: "EventSubscriptionSignatureKey",
      resolve: async (o, _, ctx) =>
        await ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(o.id),
    });
  },
});

export const EventSubscriptionSignatureKey = objectType({
  name: "EventSubscriptionSignatureKey",
  definition(t) {
    t.globalId("id");
    t.nonNull.string("publicKey", { resolve: (o) => o.public_key });
  },
});
