import { inject, injectable } from "inversify";
import { OrganizationUsageLimitName } from "../../../db/__types";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { OrganizationRepository } from "../../../db/repositories/OrganizationRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import OrganizationLimitsReachedEmail from "../../../emails/emails/app/OrganizationLimitsReachedEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { EmailBuilder } from "../EmailSenderQueue";

interface OrganizationLimitsReachedEmailPayload {
  org_id: number;
  limit_name: OrganizationUsageLimitName;
}

@injectable()
export class OrganizationLimitsReachedEmailBuilder
  implements EmailBuilder<OrganizationLimitsReachedEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: OrganizationLimitsReachedEmailPayload) {
    const [usageLimit, users, parallelOrg, organization] = await Promise.all([
      this.organizations.loadCurrentOrganizationUsageLimit(payload.org_id, payload.limit_name),
      this.users.getUsersWithPermission(payload.org_id, "ORG_SETTINGS"),
      this.organizations.loadRootOrganization(),
      this.organizations.loadOrg(payload.org_id),
    ]);

    if (!organization) {
      throw new Error(`Could not find Organization:${payload.org_id}`);
    }

    if (!usageLimit) {
      throw new Error(
        `Could not find ${payload.limit_name} usage limit for Organization:${payload.org_id}`,
      );
    }

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(parallelOrg.id);

    const emails = [];
    for (const user of users) {
      const userData = await this.users.loadUserData(user.user_data_id);
      if (!userData) {
        throw new Error(`UserData:${user.user_data_id} not found for User:${user.id}`);
      }
      const { html, text, subject, from } = await buildEmail(
        OrganizationLimitsReachedEmail,
        {
          limitName: payload.limit_name,
          orgName: organization.name,
          senderName: userData.first_name!,
          total: usageLimit.limit,
          used: usageLimit.used,
          ...layoutProps,
        },
        { locale: userData.preferred_locale },
      );

      emails.push(
        await this.emailLogs.createEmail({
          from: buildFrom(from, emailFrom),
          to: userData.email,
          subject,
          text,
          html,
          created_from: `Organization:${payload.org_id}`,
        }),
      );
    }

    return emails;
  }
}
