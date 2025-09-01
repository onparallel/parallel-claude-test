import { inject, injectable } from "inversify";
import { zip } from "remeda";
import { EmailLog } from "../../../db/__types";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { PetitionApprovalRequestRepository } from "../../../db/repositories/PetitionApprovalRequestRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PetitionApprovalRequestStepCanceledEmail from "../../../emails/emails/app/PetitionApprovalRequestStepCanceledEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { toGlobalId } from "../../../util/globalId";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionApprovalRequestStepCanceledEmailPayload {
  user_id: number;
  petition_approval_request_step_id: number;
}

@injectable()
export class PetitionApprovalRequestStepCanceledEmailBuilder
  implements EmailBuilder<PetitionApprovalRequestStepCanceledEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(UserRepository) private users: UserRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(PetitionApprovalRequestRepository)
    private approvalRequests: PetitionApprovalRequestRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PetitionApprovalRequestStepCanceledEmailPayload) {
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

    const emails: EmailLog[] = [];
    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(user.org_id);

    const stepApprovers =
      await this.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
        payload.petition_approval_request_step_id,
      );
    // do not send email to the user who triggered the approval request
    const otherApprovers = stepApprovers.filter((a) => a.user_id !== payload.user_id);
    const approverUserDatas = await this.users.loadUserDataByUserId(
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
