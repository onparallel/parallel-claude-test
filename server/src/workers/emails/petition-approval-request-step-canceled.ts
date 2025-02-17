import { zip } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionApprovalRequestStepCanceledEmail from "../../emails/emails/app/PetitionApprovalRequestStepCanceledEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { toGlobalId } from "../../util/globalId";

export async function petitionApprovalRequestStepCanceled(
  payload: {
    user_id: number;
    petition_approval_request_step_id: number;
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

  const emails: EmailLog[] = [];
  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(user.org_id);

  const stepApprovers =
    await context.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
      payload.petition_approval_request_step_id,
    );
  // do not send email to the user who triggered the approval request
  const otherApprovers = stepApprovers.filter((a) => a.user_id !== payload.user_id);
  const approverUserDatas = await context.users.loadUserDataByUserId(
    otherApprovers.map((a) => a.user_id),
  );

  for (const [approver, approverUserData] of zip(otherApprovers, approverUserDatas)) {
    if (!approverUserData) {
      throw new Error(`UserData not found for User:${approver.user_id}`);
    }
    const { html, text, subject, from } = await buildEmail(
      PetitionApprovalRequestStepCanceledEmail,
      {
        petitionId: toGlobalId("Petition", petition.id),
        petitionName: petition.name,
        stepName: approvalRequestStep.step_name,
        userName: approverUserData.first_name,
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
