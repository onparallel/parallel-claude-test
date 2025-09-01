import { inject, injectable } from "inversify";
import { isNonNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import BackgroundCheckMonitoringChanges from "../../../emails/emails/app/BackgroundCheckMonitoringChanges";
import { buildFrom } from "../../../emails/utils/buildFrom";
import { BackgroundCheckContent } from "../../../services/BackgroundCheckService";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { toGlobalId } from "../../../util/globalId";
import { EmailBuilder } from "../EmailSenderQueue";

interface BackgroundCheckMonitoringChangesEmailPayload {
  userId: number;
  profileFieldValues: { profileId: number; profileTypeFieldId: number }[];
}

@injectable()
export class BackgroundCheckMonitoringChangesEmailBuilder
  implements EmailBuilder<BackgroundCheckMonitoringChangesEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(UserRepository) private users: UserRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: BackgroundCheckMonitoringChangesEmailPayload) {
    const user = await this.users.loadUser(payload.userId);
    if (!user) {
      throw new Error(`User:${payload.userId} not found`);
    }
    if (user.status !== "ACTIVE") {
      // inactive users can still be subscribed to profiles
      return [];
    }

    const profileFieldValues = await this.profiles.loadProfileFieldValueWithDraft(
      payload.profileFieldValues,
    );

    const userData = (await this.users.loadUserData(user.user_data_id))!;

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(user.org_id);

    const { html, text, subject, from } = await buildEmail(
      BackgroundCheckMonitoringChanges,
      {
        userName: userData.first_name,
        properties: profileFieldValues
          .filter(({ value, draftValue }) => isNonNullish(value) || isNonNullish(draftValue))
          .map(({ value, draftValue }) => {
            const currentValue = draftValue ?? value;
            assert(isNonNullish(currentValue));

            const content = currentValue.content as BackgroundCheckContent;
            return {
              content: {
                query: pick(content.query, ["name", "date"]),
                entity: content.entity ? pick(content.entity, ["name", "type"]) : undefined,
              },
              profileId: toGlobalId("Profile", currentValue.profile_id),
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                currentValue.profile_type_field_id,
              ),
            };
          }),
        ...layoutProps,
        logoUrl: `${layoutProps.assetsUrl}/static/emails/logo-bg-check.png`,
        logoAlt: "Parallel - Background Check",
      },
      { locale: userData.preferred_locale },
    );

    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: userData.email,
      subject,
      text,
      html,
      created_from: `BackgroundCheckMonitoringChanges:${user.id}`,
    });

    return [email];
  }
}
