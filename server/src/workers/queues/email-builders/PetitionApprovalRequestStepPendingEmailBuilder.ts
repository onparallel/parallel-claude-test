import { inject, injectable } from "inversify";
import { zip } from "remeda";
import { EmailLog } from "../../../db/__types";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { PetitionApprovalRequestRepository } from "../../../db/repositories/PetitionApprovalRequestRepository";
import { PetitionCommentRepository } from "../../../db/repositories/PetitionCommentRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PetitionApprovalRequestStepPendingEmail from "../../../emails/emails/app/PetitionApprovalRequestStepPendingEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { renderSlateToText } from "../../../util/slate/render";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionApprovalRequestStepPendingEmailPayload {
  user_id: number;
  petition_approval_request_step_id: number;
  petition_comment_id: number | null;
  is_reminder: boolean;
}

@injectable()
export class PetitionApprovalRequestStepPendingEmailBuilder
  implements EmailBuilder<PetitionApprovalRequestStepPendingEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(UserRepository) private users: UserRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(PetitionApprovalRequestRepository)
    private approvalRequests: PetitionApprovalRequestRepository,
    @inject(PetitionCommentRepository)
    private petitionComments: PetitionCommentRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PetitionApprovalRequestStepPendingEmailPayload) {
    const [user, userData] = await Promise.all([
      this.users.loadUser(payload.user_id),
      this.users.loadUserDataByUserId(payload.user_id),
    ]);
    if (!user) {
      throw new Error(`User:${payload.user_id} not found`);
    }
    if (!userData) {
      throw new Error(`UserData not found for User:${payload.user_id}`);
    }

    const approvalRequestStep = await this.approvalRequests.loadPetitionApprovalRequestStep(
      payload.petition_approval_request_step_id,
    );
    if (!approvalRequestStep) {
      throw new Error(`ApprovalRequestStep:${payload.petition_approval_request_step_id} not found`);
    }

    const petition = await this.petitions.loadPetition(approvalRequestStep.petition_id);
    if (!petition) {
      throw new Error(`Petition:${approvalRequestStep.petition_id} not found`);
    }

    const comment = payload.petition_comment_id
      ? await this.petitions.loadPetitionFieldComment(payload.petition_comment_id)
      : null;
    const commentAttachments = payload.petition_comment_id
      ? await this.petitionComments.loadPetitionCommentAttachmentsByCommentId(
          payload.petition_comment_id,
        )
      : [];

    const emails: EmailLog[] = [];
    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(user.org_id);

    const stepApprovers =
      await this.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
        payload.petition_approval_request_step_id,
      );
    // do not send email to the user who triggered the approval request or anyone that already approved
    const otherApprovers = stepApprovers.filter(
      (a) => a.user_id !== payload.user_id && !a.approved_at && !a.rejected_at,
    );

    if (otherApprovers.length === 0) {
      return [];
    }
    const approverUserDatas = await this.users.loadUserDataByUserId(
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

      const email = await this.emailLogs.createEmail({
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
}
