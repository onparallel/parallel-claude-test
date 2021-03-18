import { groupBy, pick, sortBy, uniq } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCommentsContactNotification from "../../emails/components/PetitionCommentsContactNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { isDefined } from "../../util/remedaExtensions";

/**
  from contact/user to all accesses in `petition_access_ids` arg
*/
export async function commentsContactNotification(
  payload: {
    petition_id: number;
    petition_field_comment_ids: number[];
    petition_access_ids: number[];
  } & (
    | { author: "User"; user_id: number }
    | { author: "PetitionAccess"; petition_access_id: number }
  ),
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
  const _fields = (
    await context.petitions.loadFieldWithNullVisibility(fieldIds)
  ).filter(isDefined);
  const commentsByField = groupBy(comments, (c) => c.petition_field_id);
  const fields = sortBy(_fields, (f) => f.position).map((f) => ({
    ...pick(f, ["id", "title", "position"]),
    comments: sortBy(commentsByField[f.id], (c) => c.created_at).map(
      pick(["id", "content"])
    ),
  }));

  const emails: EmailLog[] = [];

  let authorName, authorEmail;
  if (payload.author === "User") {
    const author = await context.users.loadUser(payload.user_id);
    if (!author) {
      throw new Error(`User not found for user_id ${payload.user_id}`);
    }
    authorName = fullName(author.first_name, author.last_name);
    authorEmail = author.email;
  } else if (payload.author === "PetitionAccess") {
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
    authorName = fullName(contact.first_name, contact.last_name);
    authorEmail = contact.email;
  } else {
    throw new Error(
      `Arguments petition_access_id and user_id can't be both undefined. Payload: ${JSON.stringify(
        payload
      )}`
    );
  }

  const accesses = (
    await context.petitions.loadAccess(payload.petition_access_ids)
  ).filter(isDefined);

  for (const access of accesses) {
    const contact = await context.contacts.loadContact(access.contact_id);
    if (!contact) {
      continue;
    }
    const { html, text, subject, from } = await buildEmail(
      PetitionCommentsContactNotification,
      {
        authorName: authorName || authorEmail,
        authorEmail,
        contactFullName: fullName(contact.first_name, contact.last_name),
        keycode: access.keycode,
        fields,
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
        logoUrl:
          logoUrl ?? `${context.config.misc.assetsUrl}/static/emails/logo.png`,
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

  return emails;
}
