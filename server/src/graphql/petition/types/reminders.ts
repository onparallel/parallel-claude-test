import { enumType, objectType } from "@nexus/schema";
import { toHtml } from "../../../util/slate";

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
    t.globalId("id");
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
    t.nullable.string("emailBody", {
      description: "The body of the message in HTML format.",
      resolve: async (o, _, ctx) => {
        if (!o.email_body) return null;

        const contact = await ctx.contacts.loadContactByAccessId(
          o.petition_access_id
        );
        return toHtml(JSON.parse(o.email_body), {
          contactName: contact?.first_name ?? "",
        });
      },
    });
    t.nullable.field("sender", {
      type: "User",
      description: "The sender of this petition message.",
      resolve: async (root, _, ctx) => {
        return root.sender_id
          ? (await ctx.users.loadUser(root.sender_id))!
          : null;
      },
    });
  },
});
