import { groupBy, pick, sortBy, uniq } from "remeda";
import { buildEmail } from "../emails/buildEmail";
import PetitionCommentsContactNotification from "../emails/components/PetitionCommentsContactNotification";
import PetitionCommentsUserNotification from "../emails/components/PetitionCommentsUserNotification";
import { buildFrom } from "../emails/utils/buildFrom";
import { toGlobalId } from "../util/globalId";
import { filterDefined } from "../util/remedaExtensions";
import { createQueueWorker } from "./helpers/createQueueWorker";

type CommentsEmailWorkerPayload =
  | {
      type: "CONTACT_NOTIFICATION";
      petition_id: number;
      user_id: number;
      petition_access_ids: number[];
      petition_field_comment_ids: number[];
    }
  | {
      type: "USER_NOTIFICATION";
      petition_id: number;
      petition_access_id: number;
      user_ids: number[];
      petition_field_comment_ids: number[];
    };

createQueueWorker<CommentsEmailWorkerPayload>(
  "comments-email",
  async (payload, context) => {
    const petition = await context.petitions.loadPetition(payload.petition_id);
    if (!petition) {
      throw new Error(
        `Petition not found for petition_id ${payload.petition_id}`
      );
    }
    const [org, logoUrl] = await Promise.all([
      context.organizations.loadOrg(petition.org_id),
      context.organizations.getOrgLogoUrl(petition.org_id),
    ]);
    if (!org) {
      throw new Error(
        `Organization not found for petition.org_id ${petition.org_id}`
      );
    }
    const comments = filterDefined(
      await context.petitions.loadPetitionFieldComment(
        payload.petition_field_comment_ids
      )
    );
    const fieldIds = uniq(comments.map((c) => c!.petition_field_id));
    const _fields = filterDefined(await context.petitions.loadField(fieldIds));
    const commentsByField = groupBy(comments, (c) => c.petition_field_id);
    const fields = sortBy(_fields, (f) => f.position).map((f) => ({
      ...pick(f, ["id", "title", "position"]),
      comments: sortBy(commentsByField[f.id], (c) => c.created_at).map(
        pick(["id", "content"])
      ),
    }));

    if (payload.type === "CONTACT_NOTIFICATION") {
      const author = await context.users.loadUser(payload.user_id);
      if (!author) {
        throw new Error(`User not found for user_id ${payload.user_id}`);
      }
      const accesses = (
        await context.petitions.loadAccess(payload.petition_access_ids)
      ).filter((a) => a && a.status === "ACTIVE");
      for (const access of accesses) {
        if (access?.status === "ACTIVE") {
          const contact = await context.contacts.loadContact(access.contact_id);
          if (!contact) {
            continue; // Remove after making sure no active accesses with deleted contacts
          }
          const authorName =
            author.first_name && author.last_name
              ? `${author.first_name} ${author.last_name}`
              : author.first_name!;
          const { html, text, subject, from } = await buildEmail(
            PetitionCommentsContactNotification,
            {
              authorName,
              contactName: contact.first_name,
              keycode: access.keycode,
              fields,
              assetsUrl: context.config.misc.assetsUrl,
              parallelUrl: context.config.misc.parallelUrl,
              logoUrl:
                logoUrl ??
                `${context.config.misc.assetsUrl}/static/emails/logo.png`,
              logoAlt: logoUrl ? org.name : "Parallel",
            },
            { locale: petition.locale }
          );
          const email = await context.emails.createEmail({
            from: buildFrom(from, context.config.misc.emailFrom),
            to: contact.email,
            subject,
            text,
            html,
            created_from: `PetitionFieldComment:${payload.petition_field_comment_ids.join(
              ","
            )}`,
          });
          await context.aws.enqueueEmail(email.id);
        }
      }
    } else {
      const access = await context.petitions.loadAccess(
        payload.petition_access_id
      );
      if (!access) {
        throw new Error(
          `PetitionAccess not found for petition_access_id ${payload.petition_access_id}`
        );
      }
      const contact = await context.contacts.loadContact(access.contact_id);
      if (!contact) {
        throw new Error(
          `Contact not found for petition_access.contact_id ${access.contact_id}`
        );
      }
      const authorNameOrEmail =
        (contact.first_name && contact.last_name
          ? `${contact.first_name} ${contact.last_name}`
          : contact.first_name) || contact.email;
      const users = filterDefined(
        await context.users.loadUser(payload.user_ids)
      );
      for (const user of users) {
        const { html, text, subject, from } = await buildEmail(
          PetitionCommentsUserNotification,
          {
            userName: user.first_name,
            authorNameOrEmail,
            petitionId: toGlobalId("Petition", petition.id),
            petitionName: petition.name,
            fields,
            assetsUrl: context.config.misc.assetsUrl,
            parallelUrl: context.config.misc.parallelUrl,
            logoUrl:
              logoUrl ??
              `${context.config.misc.assetsUrl}/static/emails/logo.png`,
            logoAlt: logoUrl ? org.name : "Parallel",
          },
          { locale: petition.locale }
        );
        const email = await context.emails.createEmail({
          from: buildFrom(from, context.config.misc.emailFrom),
          to: user.email,
          subject,
          text,
          html,
          created_from: `PetitionFieldComment:${payload.petition_field_comment_ids.join(
            ","
          )}`,
        });
        await context.aws.enqueueEmail(email.id);
      }
    }
  }
);
