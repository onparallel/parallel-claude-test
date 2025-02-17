import { unique, zip } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionApprovalRequestStepFinishedEmail from "../../emails/emails/app/PetitionApprovalRequestStepFinishedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { renderSlateToText } from "../../util/slate/render";

export async function petitionApprovalRequestStepFinished(
  payload: {
    user_id: number;
    petition_approval_request_step_id: number;
    petition_comment_id: number;
    rejection_type?: "TEMPORARY" | "DEFINITIVE";
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

  const comment = await context.petitions.loadPetitionFieldComment(payload.petition_comment_id);

  const emails: EmailLog[] = [];
  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(user.org_id);

  const stepApprovers =
    await context.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
      payload.petition_approval_request_step_id,
    );

  const petitionPermissions = await context.petitions.loadEffectivePermissions(petition.id);
  const subscribedUserIds = petitionPermissions
    .filter((p) => p.is_subscribed)
    .map((p) => p.user_id!);

  // do not send email to the user who triggered the approval request
  const userIds = unique([...subscribedUserIds, ...stepApprovers.map((a) => a.user_id)]).filter(
    (id) => id !== payload.user_id,
  );
  const userDatas = await context.users.loadUserDataByUserId(userIds);

  for (const [userId, userData] of zip(userIds, userDatas)) {
    if (!userData) {
      throw new Error(`UserData not found for User:${userId}`);
    }
    const { html, text, subject, from } = await buildEmail(
      PetitionApprovalRequestStepFinishedEmail,
      {
        approvalRequestStepName: approvalRequestStep.step_name,
        petitionName: petition.name,
        isFinal: payload.rejection_type === "DEFINITIVE",
        isRejection: approvalRequestStep.status === "REJECTED",
        message: comment ? renderSlateToText(comment.content_json) : null,
        petitionId: toGlobalId("Petition", petition.id),
        userName: userData.first_name,
        senderFullName: fullName(userData.first_name, userData.last_name),
        ...layoutProps,
      },
      { locale: userData.preferred_locale },
    );

    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: userData.email,
      subject,
      text,
      html,
      created_from: `User:${user.id}`,
    });

    emails.push(email);
  }
  return emails;
}
