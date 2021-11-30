import { objectType } from "nexus";

export const PetitionEventSubscription = objectType({
  name: "PetitionEventSubscription",
  definition(t) {
    t.globalId("id");
    t.nonNull.boolean("isEnabled", { resolve: (o) => o.is_enabled });
    t.nonNull.string("eventsUrl", { resolve: (o) => o.endpoint });
    t.nullable.list.nonNull.field("eventTypes", {
      type: "PetitionEventType",
      resolve: (o) => o.event_types,
    });
  },
});
