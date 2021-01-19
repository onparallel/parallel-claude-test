import { objectType } from "@nexus/schema";

export const Subscription = objectType({
  name: "Subscription",
  definition(t) {
    t.implements("Timestamps");
    t.globalId("id");
    t.field("petition", {
      type: "Petition",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetition(root.petition_id))!;
      },
    });
    t.string("endpoint");
  },
  rootTyping: "db.PetitionEventSubscription",
});
