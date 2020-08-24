import { enumType, objectType } from "@nexus/schema";
import { toGlobalId } from "../../../util/globalId";

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
    t.id("id", {
      description: "The ID of the petition message.",
      resolve: (o) => toGlobalId("PetitionMessage", o.id),
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
    t.json("emailSubject", {
      description: "The subject of the petition message.",
      nullable: true,
      resolve: (o) => o.email_subject,
    });
    t.json("emailBody", {
      description: "The body of the petition message.",
      nullable: true,
      resolve: (o) => {
        try {
          return o.email_body ? JSON.parse(o.email_body) : null;
        } catch {
          return null;
        }
      },
    });
    t.field("status", {
      type: "PetitionMessageStatus",
      description: "The status of the petition message",
    });
    t.datetime("scheduledAt", {
      description: "Time at which the message will be sent.",
      nullable: true,
      resolve: (o) => o.scheduled_at,
    });
    t.datetime("sentAt", {
      description: "If already sent, the date at which the email was sent.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (root.email_log_id) {
          const email = await ctx.emailLogs.loadEmailLog(root.email_log_id);
          return email!.sent_at;
        } else {
          return null;
        }
      },
    });
    t.datetime("deliveredAt", {
      description: "Tells when the email was delivered.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (!root.email_log_id) {
          return null;
        }
        const events = await ctx.emailLogs.loadEmailEvents(root.email_log_id);
        return events.find((e) => e.event === "delivery")?.created_at ?? null;
      },
    });
    t.datetime("bouncedAt", {
      description: "Tells when the email bounced.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (!root.email_log_id) {
          return null;
        }
        const events = await ctx.emailLogs.loadEmailEvents(root.email_log_id);
        return events.find((e) => e.event === "bounce")?.created_at ?? null;
      },
    });
    t.datetime("openedAt", {
      description: "Tells when the email was opened for the first time.",
      nullable: true,
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
