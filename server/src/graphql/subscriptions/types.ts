import { objectType } from "nexus";

export const PetitionEventSubscription = objectType({
  name: "PetitionEventSubscription",
  sourceType: /* ts*/ `{
    id: number;
    is_enabled: boolean;
    settings: {
        EVENTS_URL: string;
    };
  }`,
  definition(t) {
    t.globalId("id");
    t.nonNull.boolean("isEnabled", { resolve: (root) => root.is_enabled });
    t.nonNull.string("eventsUrl", { resolve: (root) => root.settings.EVENTS_URL });
  },
});
