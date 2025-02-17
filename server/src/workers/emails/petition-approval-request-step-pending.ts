import { zip } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionApprovalRequestStepPendingEmail from "../../emails/emails/app/PetitionApprovalRequestStepPendingEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { renderSlateToText } from "../../util/slate/render";

export async function petitionApprovalRequestStepPending(
  payload: {
    user_id: number;
    petition_approval_request_step_id: number;
    petition_comment_id: number | null;
    is_reminder: boolean;
  },
  context: WorkerContext,
) {
  const [user, userData] = await Promise.all([
    context.users.loadUser(payload.user_id),
    context.users.loadUserDataByUserId(payload.user_id),
  ]);
  if (!user) {
    throw new Error(`User:${payload.user_id} not found`);
  }
  if (!userData) {
    throw new Error(`UserData not found for User:${payload.user_id}`);
  }

  const approvalRequestStep = await context.approvalRequests.loadPetitionApprovalRequestStep(
    payload.petition_approval_request_step_id,
  );
  if (!approvalRequestStep) {
    throw new Error(`ApprovalRequestStep:${payload.petition_approval_request_step_id} not found`);
  }

  const petition = await context.petitions.loadPetition(approvalRequestStep.petition_id);
  if (!petition) {
    throw new Error(`Petition:${approvalRequestStep.petition_id} not found`);
  }

  const comment = payload.petition_comment_id
    ? await context.petitions.loadPetitionFieldComment(payload.petition_comment_id)
    : null;
  const commentAttachments = payload.petition_comment_id
    ? await context.petitionComments.loadPetitionCommentAttachmentsByCommentId(
        payload.petition_comment_id,
      )
    : [];

  const emails: EmailLog[] = [];
  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(user.org_id);

  const stepApprovers =
    await context.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
      payload.petition_approval_request_step_id,
    );
  // do not send email to the user who triggered the approval request or anyone that already approved
  const otherApprovers = stepApprovers.filter(
    (a) => a.user_id !== payload.user_id && !a.approved_at && !a.rejected_at,
  );

  if (otherApprovers.length === 0) {
    return [];
  }
  const approverUserDatas = await context.users.loadUserDataByUserId(
    otherApprovers.map((a) => a.user_id),
  );

  for (const [approver, approverUserData] of zip(otherApprovers, approverUserDatas)) {
    if (!approverUserData) {
      throw new Error(`UserData not found for User:${approver.user_id}`);
    }
    const { html, text, subject, from } = await buildEmail(
      PetitionApprovalRequestStepPendingEmail,
      {
        isReminder: payload.is_reminder,
        senderEmail: userData.email,
        senderFullName: fullName(userData.first_name, userData.last_name),
        message: comment ? renderSlateToText(comment.content_json) : null,
        userName: approverUserData.first_name,
        petitionId: toGlobalId("Petition", petition.id),
        petitionName: petition.name,
        numOfAttachments: commentAttachments.length,
        ...layoutProps,
      },
      { locale: approverUserData.preferred_locale },
    );

    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: approverUserData.email,
      subject,
      text,
      html,
      created_from: `User:${user.id}`,
    });

    emails.push(email);
  }
  return emails;
}
