import pMap from "p-map";
import { groupBy, sortBy, uniq } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCommentsUserNotification from "../../emails/components/PetitionCommentsUserNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { toGlobalId } from "../../util/globalId";
import { isDefined } from "../../util/remedaExtensions";
import { buildFieldWithComments } from "../helpers/getFieldWithComments";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function commentsUserNotification(
  payload: {
    user_id: number;
    petition_id: number;
    petition_field_comment_ids: number[];
  },
  context: WorkerContext
) {
  const [petition, _comments, user] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.petitions.loadPetitionFieldComment(
      payload.petition_field_comment_ids
    ),
    context.users.loadUser(payload.user_id),
  ]);
  if (!petition) {
    throw new Error(
      `Petition not found for petition_id ${payload.petition_id}`
    );
  }
  if (!user) {
    throw new Error(`User not found for user_id ${payload.user_id}`);
  }

  const layoutProps = await getLayoutProps(petition.org_id, context);
  const comments = _comments.filter(isDefined);
  const fieldIds = uniq(comments.map((c) => c!.petition_field_id));
  const _fields = (
    await context.petitions.loadFieldWithNullVisibility(fieldIds)
  ).filter(isDefined);
  const commentsByField = groupBy(comments, (c) => c.petition_field_id);
  const fields = await pMap(
    sortBy(_fields, (f) => f.position),
    (f) => buildFieldWithComments(f, commentsByField, context)
  );

  const { html, text, subject, from } = await buildEmail(
    PetitionCommentsUserNotification,
    {
      userName: user.first_name,

      petitionId: toGlobalId("Petition", petition.id),
      petitionName: petition.name,
      fields,
      ...layoutProps,
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

  return email;
}
