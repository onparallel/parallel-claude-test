import { enumType, objectType } from "nexus";
import { renderSlateWithPlaceholdersToHtml } from "../../../util/slate/placeholders";

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

        const [contact, access] = await Promise.all([
          ctx.contacts.loadContactByAccessId(o.petition_access_id),
          ctx.petitions.loadAccess(o.petition_access_id),
        ]);

        const getValues = await ctx.petitionMessageContext.fetchPlaceholderValues(
          {
            petitionId: access?.petition_id,
            userId: o.sender_id,
            contactId: contact?.id,
            petitionAccessId: access?.id,
          },
          { publicContext: true }
        );

        return renderSlateWithPlaceholdersToHtml(JSON.parse(o.email_body), getValues);
      },
    });
    t.nullable.field("sender", {
      type: "User",
      description: "The sender of this petition message.",
      resolve: async (root, _, ctx) => {
        return root.sender_id ? (await ctx.users.loadUser(root.sender_id))! : null;
      },
    });
  },
});
