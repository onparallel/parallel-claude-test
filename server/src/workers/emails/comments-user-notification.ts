import { groupBy, pick, sortBy, uniq } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCommentsUserNotification from "../../emails/components/PetitionCommentsUserNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { isDefined } from "../../util/remedaExtensions";

/*
  from contact/user to all subscribed users
*/
export async function commentsUserNotification(
  payload: {
    petition_id: number;
    petition_access_id?: number; // if set, the comment comes from a Contact
    author_user_id?: number; // if set, the comment comes from a User
    user_ids: number[];
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
  const org = await context.organizations.loadOrg(petition.org_id);
  if (!org) {
    throw new Error(
      `Organization not found for petition.org_id ${petition.org_id}`
    );
  }
  const logoUrl = org.logo_url;
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

  let authorNameOrEmail;
  if (payload.petition_access_id) {
    // Comment author is a contact
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

    authorNameOrEmail =
      fullName(contact.first_name, contact.last_name) || contact.email;
  } else if (payload.author_user_id) {
    // comment author is an User
    const user = await context.users.loadUser(payload.author_user_id);
    if (!user) {
      throw new Error(
        `User not found for payload.author_user_id ${payload.author_user_id}`
      );
    }
    authorNameOrEmail = fullName(user.first_name, user.last_name) || user.email;
  } else {
    throw new Error(
      `Arguments petition_access_id and author_user_id can't be both undefined. Payload: ${JSON.stringify(
        payload
      )}`
    );
  }

  // user_ids arg is already filtered on subscribed only users
  const users = (await context.users.loadUser(payload.user_ids)).filter(
    isDefined
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
          logoUrl ?? `${context.config.misc.assetsUrl}/static/emails/logo.png`,
        logoAlt: logoUrl ? org.name : "Parallel",
      },
      { locale: petition.locale }
    );
    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to: user.email,
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
