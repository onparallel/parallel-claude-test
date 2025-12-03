import { addDays, startOfWeek } from "date-fns";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { EMAILS, IEmailsService } from "../services/EmailsService";
import { toGlobalId } from "../util/globalId";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";

@injectable()
export class ExpiringPropertiesCronWorker extends CronWorker<"expiring-properties"> {
  constructor(
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(EMAILS) private emails: IEmailsService,
  ) {
    super();
  }

  async handler() {
    // this runs every hour on sunday - tuesday, get the closest monday at 7:00 am
    const nearestMonday7am = startOfWeek(addDays(Date.now(), 1), { weekStartsOn: 1 });
    nearestMonday7am.setHours(7, 0, 0, 0);

    const organizations =
      await this.profiles.getOrganizationsForProfileAlertsDigest(nearestMonday7am);

    await pMap(
      organizations,
      async (org) => {
        await this.organizations.updateOrganizationLastProfileDigest(org.id);
        const orgUsers = await this.profiles.getOrganizationUsersSubscribedToProfileAlerts(org.id);
        await pMap(
          orgUsers,
          async (user) => {
            // queries first 10 properties that are expired or about to expire
            const inAlertProperties = this.profiles.getPaginatedExpirableProfileFieldProperties(
              org.id,
              org.default_timezone,
              {
                limit: 10,
                offset: 0,
                filter: {
                  subscribedByUserId: user.id,
                  isInAlert: true,
                },
              },
            );

            const totalCount = await inAlertProperties.totalCount;

            if (totalCount > 0) {
              const items = await inAlertProperties.items;
              await this.emails.sendProfilesExpiringPropertiesEmail(user.id, {
                organizationName: org.name,
                properties: {
                  totalCount,
                  items: items.map((item) => ({
                    profileId: toGlobalId("Profile", item.profile_id),
                    profileTypeFieldId: toGlobalId("ProfileTypeField", item.profile_type_field_id),
                    profileName: item.profile_name,
                    profileTypeFieldName: item.profile_type_field_name,
                    expiryDate: item.expiry_date,
                    isExpired: item.is_expired,
                  })),
                },
              });
            }
          },
          { concurrency: 5 },
        );
      },
      { concurrency: 1 },
    );
  }
}

createCronWorker("expiring-properties", ExpiringPropertiesCronWorker);
