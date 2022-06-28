import pMap from "p-map";
import { groupBy, isDefined, sortBy, uniq } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCommentsContactNotification from "../../emails/emails/PetitionCommentsContactNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { buildFieldWithComments } from "../helpers/getFieldWithComments";
import { getLayoutProps } from "../helpers/getLayoutProps";
import { loadOriginalMessageByPetitionAccess } from "../helpers/loadOriginalMessageByPetitionAccess";

export async function commentsContactNotification(
  payload: {
    petition_id: number;
    petition_access_id: number;
    petition_field_comment_ids: number[];
  },
  context: WorkerContext
) {
  const [petition, contact, access, _comments, originalMessage] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.contacts.loadContactByAccessId(payload.petition_access_id),
    context.petitions.loadAccess(payload.petition_access_id),
    context.petitions.loadPetitionFieldComment(payload.petition_field_comment_ids),
    loadOriginalMessageByPetitionAccess(payload.petition_access_id, payload.petition_id, context),
  ]);
  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }
  if (!contact) {
    throw new Error(`Contact not found for petition_access_id ${payload.petition_access_id}`);
  }
  if (!access) {
    throw new Error(`Access not found for petition_access_id ${payload.petition_access_id}`);
  }
  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);
  const comments = _comments.filter(isDefined);
  const fieldIds = uniq(comments.map((c) => c!.petition_field_id));
  const _fields = (await context.petitions.loadField(fieldIds)).filter(isDefined);
  const commentsByField = groupBy(comments, (c) => c.petition_field_id);
  const fields = await pMap(
    sortBy(_fields, (f) => f.position!),
    (f) => buildFieldWithComments(f, commentsByField, context)
  );
  const organization = await context.organizations.loadOrg(petition.org_id);

  const hasRemoveParallelBranding = await context.featureFlags.orgHasFeatureFlag(
    organization!.id,
    "REMOVE_PARALLEL_BRANDING"
  );

  const { html, text, subject, from } = await buildEmail(
    PetitionCommentsContactNotification,
    {
      emailSubject: originalMessage?.email_subject ?? null,
      contactName: contact.first_name,
      contactFullName: fullName(contact.first_name, contact.last_name),
      keycode: access.keycode,
      tone: organization!.preferred_tone,
      theme: organization!.brand_theme,
      fields,
      removeParallelBranding: hasRemoveParallelBranding,
      ...layoutProps,
    },
    { locale: petition.locale }
  );
  const email = await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: contact.email,
    reply_to: context.config.misc.emailFrom,
    subject,
    text,
    html,
    created_from: `PetitionFieldComment:${payload.petition_field_comment_ids.join(",")}`,
  });

  return email;
}
