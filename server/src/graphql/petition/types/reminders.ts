import { enumType, objectType } from "@nexus/schema";
import { toGlobalId } from "../../../util/globalId";

export const PetitionReminderType = enumType({
  name: "PetitionReminderType",
  description: "The type of a petition reminder.",
  members: [
    {
      name: "MANUAL",
      description: "The reminder has been sent manually by a user.",
    },
    {
      name: "AUTOMATIC",
      description:
        "The reminder has been sent by the system according to the reminders configuration.",
    },
  ],
});

export const PetitionReminder = objectType({
  name: "PetitionReminder",
  definition(t) {
    t.implements("CreatedAt");
    t.id("id", {
      resolve: (o) => toGlobalId("PetitionReminder", o.id),
    });
    t.field("type", {
      type: "PetitionReminderType",
      description: "The type of the reminder.",
    });
    t.field("access", {
      type: "PetitionAccess",
      description: "The access of this petition message.",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.petition_access_id))!;
      },
    });
    t.field("sender", {
      type: "User",
      nullable: true,
      description: "The sender of this petition message.",
      resolve: async (root, _, ctx) => {
        return root.sender_id
          ? (await ctx.users.loadUser(root.sender_id))!
          : null;
      },
    });
  },
});
