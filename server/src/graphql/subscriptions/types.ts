import { objectType } from "nexus";

export const PetitionEventSubscription = objectType({
  name: "PetitionEventSubscription",
  definition(t) {
    t.globalId("id");
    t.nonNull.boolean("isEnabled", { resolve: (root) => root.is_enabled });
    t.nonNull.string("eventsUrl", { resolve: (root) => root.endpoint });
  },
});
