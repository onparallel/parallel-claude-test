import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { EmailLog } from "../../../db/__types";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import TransferParallelsEmail from "../../../emails/emails/app/TransferParallelsEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { EmailBuilder } from "../EmailSenderQueue";

interface TransferParallelsEmailPayload {
  userExternalId: string;
  orgId: number;
}

@injectable()
export class TransferParallelsEmailBuilder implements EmailBuilder<TransferParallelsEmailPayload> {
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(UserRepository) private users: UserRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: TransferParallelsEmailPayload) {
    const { userExternalId, orgId } = payload;

    const user = await this.users.loadUserByExternalId({ externalId: userExternalId, orgId });
    if (!user) {
      throw new Error(`User not found for externalId ${userExternalId}`);
    }

    if (user.status !== "ON_HOLD") {
      return [];
    }

    const userData = (await this.users.loadUserData(user.user_data_id))!;

    const emailRecipients = await this.users.getUsersWithPermission(orgId, "USERS:CRUD_USERS");

    const emailRecipientDatas = (
      await this.users.loadUserData(emailRecipients.map((a) => a.user_data_id))
    ).filter(isNonNullish);

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(orgId);
    const emails: EmailLog[] = [];

    for (const recipientData of emailRecipientDatas) {
      const { html, text, subject, from } = await buildEmail(
        TransferParallelsEmail,
        {
          name: recipientData.first_name ?? recipientData.last_name ?? "",
          userEmail: userData.email,
          userFullName: fullName(userData.first_name, userData.last_name),
          ...layoutProps,
        },
        { locale: recipientData.preferred_locale },
      );

      const email = await this.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: recipientData.email,
        subject,
        text,
        html,
        created_from: `TransferParallels:${user.id}`,
      });

      emails.push(email);
    }

    return emails;
  }
}
