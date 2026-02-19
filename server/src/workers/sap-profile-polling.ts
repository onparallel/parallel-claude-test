import { inject, injectable } from "inversify";
import { IntegrationRepository } from "../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import {
  SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
  SapProfileSyncIntegrationFactory,
} from "../integrations/profile-sync/sap/SapProfileSyncIntegration";
import { LOGGER_FACTORY, LoggerFactory } from "../services/Logger";
import { IRedis, REDIS } from "../services/Redis";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";

@injectable()
export class SapProfilePollingCronWorker extends CronWorker<"sap-profile-polling"> {
  constructor(
    @inject(REDIS) private redis: IRedis,
    @inject(LOGGER_FACTORY) private loggerFactory: LoggerFactory,
    @inject(SAP_PROFILE_SYNC_INTEGRATION_FACTORY)
    private sapProfileSyncIntegrationFactory: SapProfileSyncIntegrationFactory,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
  ) {
    super();
  }

  async handler() {
    const organizations = await this.organizations.getOrganizationsWithFeatureFlag([
      "PROFILES",
      "PROFILE_SYNC",
    ]);

    const orgIntegrations = (
      await Promise.all(
        organizations.map((o) => this.integrations.loadIntegrationsByOrgId(o.id, "PROFILE_SYNC")),
      )
    ).flat();

    for (const integration of orgIntegrations) {
      // use a lock to make sure this job does not run concurrently
      const logger = this.loggerFactory(`SapProfilePolling:${integration.id}`);
      await using lock = await this.redis.withLock({
        key: `sap-profile-sync:${integration.id}`,
        maxTime: 60 * 60,
      });
      if (lock.alreadyLocked) {
        logger.info(`Integration ${integration.id} already syncing, wait for next execution`);
        // either previous cron still running or full sync in progress
        continue;
      }
      const latestLocalSync = await this.integrations.loadLatestCompletedLocalSyncByIntegrationId(
        integration.id,
      );

      if (latestLocalSync) {
        logger.info(
          `Polling for changed entities since ${latestLocalSync.created_at.toISOString()}`,
        );
        await this.sapProfileSyncIntegrationFactory(integration.id).pollForChangedEntities(
          latestLocalSync.created_at,
        );
      } else {
        logger.info("No local sync found, skipping...");
      }
    }
  }
}

createCronWorker("sap-profile-polling", SapProfilePollingCronWorker);
