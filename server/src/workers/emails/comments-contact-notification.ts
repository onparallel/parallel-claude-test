import { groupBy, pick, sortBy, uniq } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCommentsContactNotification from "../../emails/components/PetitionCommentsContactNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { isDefined } from "../../util/remedaExtensions";

/*
  from user to petition contacts
*/
export async function commentsContactNotification(
  payload: {
    petition_id: number;
    user_id: number;
    petition_access_ids: number[];
    petition_field_comment_ids: number[];
  },
  context: WorkerContext
) {
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
  const comments = (
    await context.petitions.loadPetitionFieldComment(
      payload.petition_field_comment_ids
    )
  ).filter(isDefined);
  const fieldIds = uniq(comments.map((c) => c!.petition_field_id));
  const _fields = (await context.petitions.loadField(fieldIds)).filter(
    isDefined
  );
  const commentsByField = groupBy(comments, (c) => c.petition_field_id);
  const fields = sortBy(_fields, (f) => f.position).map((f) => ({
    ...pick(f, ["id", "title", "position"]),
    comments: sortBy(commentsByField[f.id], (c) => c.created_at).map(
      pick(["id", "content"])
    ),
  }));

  const emails: EmailLog[] = [];

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
      const { html, text, subject, from } = await buildEmail(
        PetitionCommentsContactNotification,
        {
          authorName: fullName(author.first_name, author.last_name),
          authorEmail: author.email,
          contactFullName: fullName(contact.first_name, contact.last_name),
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
      const email = await context.emailLogs.createEmail({
        from: buildFrom(from, context.config.misc.emailFrom),
        to: contact.email,
        subject,
        text,
        html,
        created_from: `PetitionFieldComment:${payload.petition_field_comment_ids.join(
          ","
        )}`,
      });
      emails.push(email);
    }
  }

  return emails;
}
