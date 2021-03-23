import { enumType, objectType } from "@nexus/schema";
import { toHtml } from "../../../util/slate";

export const PetitionMessageStatus = enumType({
  name: "PetitionMessageStatus",
  description: "The status of a petition message.",
  members: [
    {
      name: "SCHEDULED",
      description:
        "The message has been scheduled to be sent at a specific time.",
    },
    {
      name: "CANCELLED",
      description: "The message was scheduled but has been cancelled.",
    },
    { name: "PROCESSING", description: "The message is being processed." },
    { name: "PROCESSED", description: "The message has been processed." },
  ],
});

export const PetitionMessage = objectType({
  name: "PetitionMessage",
  description: "A petition message",
  definition(t) {
    t.implements("CreatedAt");
    t.globalId("id", {
      description: "The ID of the petition message.",
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
      description: "The sender of this petition message.",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.sender_id))!;
      },
    });
    t.nullable.json("emailSubject", {
      description: "The subject of the petition message.",
      resolve: (o) => o.email_subject,
    });
    t.nullable.string("emailBody", {
      description: "The body of the petition message on HTML format.",
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
    t.field("status", {
      type: "PetitionMessageStatus",
      description: "The status of the petition message",
    });
    t.nullable.datetime("scheduledAt", {
      description: "Time at which the message will be sent.",
      resolve: (o) => o.scheduled_at,
    });
    t.nullable.datetime("sentAt", {
      description: "If already sent, the date at which the email was sent.",
      resolve: async (root, _, ctx) => {
        if (root.email_log_id) {
          const email = await ctx.emailLogs.loadEmailLog(root.email_log_id);
          return email!.sent_at;
        } else {
          return null;
        }
      },
    });
    t.nullable.datetime("deliveredAt", {
      description: "Tells when the email was delivered.",
      resolve: async (root, _, ctx) => {
        if (!root.email_log_id) {
          return null;
        }
        const events = await ctx.emailLogs.loadEmailEvents(root.email_log_id);
        return events.find((e) => e.event === "delivery")?.created_at ?? null;
      },
    });
    t.nullable.datetime("bouncedAt", {
      description: "Tells when the email bounced.",
      resolve: async (root, _, ctx) => {
        if (!root.email_log_id) {
          return null;
        }
        const events = await ctx.emailLogs.loadEmailEvents(root.email_log_id);
        return events.find((e) => e.event === "bounce")?.created_at ?? null;
      },
    });
    t.nullable.datetime("openedAt", {
      description: "Tells when the email was opened for the first time.",
      resolve: async (root, _, ctx) => {
        if (!root.email_log_id) {
          return null;
        }
        const events = await ctx.emailLogs.loadEmailEvents(root.email_log_id);
        return events.find((e) => e.event === "open")?.created_at ?? null;
      },
    });
  },
});
