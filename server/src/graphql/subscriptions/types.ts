import { interfaceType, objectType } from "nexus";
import { isDefined } from "remeda";

export const EventSubscription = interfaceType({
  name: "EventSubscription",
  definition(t) {
    t.globalId("id");
    t.nullable.string("name");
    t.nonNull.boolean("isEnabled", { resolve: (o) => o.is_enabled });
    t.nonNull.boolean("isFailing", { resolve: (o) => o.is_failing });
    t.nonNull.string("eventsUrl", { resolve: (o) => o.endpoint });
    t.nonNull.list.nonNull.field("signatureKeys", {
      type: "EventSubscriptionSignatureKey",
      resolve: async (o, _, ctx) =>
        await ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(o.id),
    });
  },
  resolveType: (o) =>
    o.type === "PETITION" ? "PetitionEventSubscription" : "ProfileEventSubscription",
});

export const PetitionEventSubscription = objectType({
  name: "PetitionEventSubscription",
  definition(t) {
    t.implements("EventSubscription");
    t.globalId("id", { prefixName: "PetitionEventSubscription" });
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
          ? (await ctx.petitions.loadField(o.from_template_field_ids)).filter(isDefined)
          : null;
      },
    });
  },
  sourceType: "db.EventSubscription",
});

export const ProfileEventSubscription = objectType({
  name: "ProfileEventSubscription",
  definition(t) {
    t.implements("EventSubscription");
    t.globalId("id", { prefixName: "ProfileEventSubscription" });
    t.nullable.list.nonNull.field("eventTypes", {
      type: "ProfileEventType",
      resolve: (o) => o.event_types,
    });
    t.nullable.field("fromProfileType", {
      type: "ProfileType",
      resolve: async (o, _, ctx) => {
        return o.from_profile_type_id
          ? await ctx.profiles.loadProfileType(o.from_profile_type_id)
          : null;
      },
    });
    t.nullable.list.nullable.field("fromProfileTypeFields", {
      type: "ProfileTypeField",
      resolve: async (o, _, ctx) => {
        return isDefined(o.from_profile_type_field_ids)
          ? await ctx.profiles.loadProfileTypeField(o.from_profile_type_field_ids)
          : null;
      },
    });
  },
  sourceType: "db.EventSubscription",
});

export const EventSubscriptionSignatureKey = objectType({
  name: "EventSubscriptionSignatureKey",
  definition(t) {
    t.globalId("id");
    t.nonNull.string("publicKey", { resolve: (o) => o.public_key });
  },
});
