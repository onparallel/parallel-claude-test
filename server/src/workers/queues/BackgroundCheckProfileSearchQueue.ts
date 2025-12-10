import { inject, injectable } from "inversify";
import { ProfileRepository } from "../../db/repositories/ProfileRepository";
import {
  BACKGROUND_CHECK_SERVICE,
  EntitySearchRequest,
  IBackgroundCheckService,
} from "../../services/BackgroundCheckService";
import { QueueWorker } from "../helpers/createQueueWorker";

export interface BackgroundCheckProfileSearchQueuePayload {
  profileId: number;
  profileTypeFieldId: number;
  orgId: number;
  query: EntitySearchRequest;
}

@injectable()
export class BackgroundCheckProfileSearchQueue extends QueueWorker<BackgroundCheckProfileSearchQueuePayload> {
  constructor(
    @inject(BACKGROUND_CHECK_SERVICE) private backgroundCheck: IBackgroundCheckService,
    @inject(ProfileRepository) private profiles: ProfileRepository,
  ) {
    super();
  }

  override async handler(payload: BackgroundCheckProfileSearchQueuePayload) {
    const search = await this.backgroundCheck.entitySearch(payload.query, payload.orgId);

    const events = await this.profiles.updateProfileFieldValues(
      [
        {
          profileId: payload.profileId,
          profileTypeFieldId: payload.profileTypeFieldId,
          type: "BACKGROUND_CHECK",
          content: {
            query: payload.query,
            search,
            entity: null,
          },
          pendingReview: true,
        },
      ],
      payload.orgId,
      { source: "PARALLEL_MONITORING" },
    );
    await this.profiles.createProfileUpdatedEvents(events, payload.orgId, {
      userId: null,
      source: "PARALLEL_MONITORING",
    });
  }
}
