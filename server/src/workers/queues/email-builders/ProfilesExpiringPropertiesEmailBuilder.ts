import { inject, injectable } from "inversify";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import ProfilesExpiringPropertiesEmail from "../../../emails/emails/app/ProfilesExpiringPropertiesEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import { LocalizableUserText } from "../../../graphql/helpers/scalars/LocalizableUserText";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { EmailBuilder } from "../EmailSenderQueue";

export interface ExpiringProperty {
  profileId: string;
  profileName: LocalizableUserText;
  profileTypeFieldId: string;
  profileTypeFieldName: LocalizableUserText;
  expiryDate: string;
  isExpired: boolean;
}

interface ProfilesExpiringPropertiesEmailPayload {
  userId: number;
  organizationName: string;
  properties: {
    items: ExpiringProperty[];
    totalCount: number;
  };
}

@injectable()
export class ProfilesExpiringPropertiesEmailBuilder
  implements EmailBuilder<ProfilesExpiringPropertiesEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(UserRepository) private users: UserRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: ProfilesExpiringPropertiesEmailPayload) {
    const user = await this.users.loadUser(payload.userId);
    if (!user) {
      throw new Error(`User:${payload.userId} not found`);
    }
    if (user.status !== "ACTIVE") {
      // inactive users can still be subscribed to profiles
      return [];
    }
    const userData = (await this.users.loadUserData(user.user_data_id))!;

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(user.org_id);

    const { html, text, subject, from } = await buildEmail(
      ProfilesExpiringPropertiesEmail,
      {
        organizationName: payload.organizationName,
        properties: payload.properties,
        ...layoutProps,
      },
      { locale: userData.preferred_locale },
    );

    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: userData.email,
      subject,
      text,
      html,
      created_from: `ProfilesExpiringProperties:${user.id}`,
    });

    return [email];
  }
}
