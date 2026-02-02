import { inject, injectable } from "inversify";

import { unique } from "remeda";
import { ProfileUpdatedEvent } from "../../../db/events/ProfileEvent";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { IntegrationRepository } from "../../../db/repositories/IntegrationRepository";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import {
  SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
  SapProfileSyncIntegrationFactory,
} from "../../../integrations/profile-sync/sap/SapProfileSyncIntegration";
import { ILogger, LOGGER } from "../../../services/Logger";
import { EventListener } from "../EventProcessorQueue";

export const PROFILE_SYNC_LISTENER = Symbol.for("PROFILE_SYNC_LISTENER");

@injectable()
export class ProfileSyncListener implements EventListener<"PROFILE_UPDATED"> {
  constructor(
    @inject(ProfileRepository) private readonly profiles: ProfileRepository,
    @inject(IntegrationRepository) private readonly integrations: IntegrationRepository,
    @inject(FeatureFlagRepository) private readonly featureFlags: FeatureFlagRepository,
    @inject(SAP_PROFILE_SYNC_INTEGRATION_FACTORY)
    private readonly syncIntegrationFactory: SapProfileSyncIntegrationFactory,
    @inject(LOGGER) private readonly logger: ILogger,
  ) {}

  public types: "PROFILE_UPDATED"[] = ["PROFILE_UPDATED"];

  public async handle(event: ProfileUpdatedEvent) {
    const [hasFeatureFlag, orgIntegrations] = await Promise.all([
      this.featureFlags.orgHasFeatureFlag(event.org_id, "PROFILE_SYNC"),
      this.integrations.loadIntegrationsByOrgId(event.org_id, "PROFILE_SYNC"),
    ]);

    if (!hasFeatureFlag) {
      return;
    }

    if (orgIntegrations.length === 0) {
      return;
    }

    const profile = await this.profiles.loadProfile(event.profile_id);
    if (!profile) {
      return;
    }

    for (const { id } of orgIntegrations
      // exclude the current integration (the one that triggered this event)
      .filter((i) => i.id !== event.data.org_integration_id)) {
      const syncIntegration = this.syncIntegrationFactory(id);

      const hasInitialSync =
        await this.integrations.loadIntegrationHasCompletedInitialProfileSyncToDatabase(id);

      if (hasInitialSync) {
        this.logger.info(`Updating remote entity for integration ${id}`);
        await syncIntegration.updateRemoteEntity(
          profile.id,
          profile.profile_type_id,
          unique(event.data.profile_type_field_ids),
        );
      } else {
        this.logger.info(`No initial sync found for integration ${id}, skipping remote update`);
      }
    }
  }
}
