import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { PetitionRepository } from "../../db/repositories/PetitionRepository";
import {
  BACKGROUND_CHECK_SERVICE,
  EntitySearchRequest,
  IBackgroundCheckService,
} from "../../services/BackgroundCheckService";
import { QueueWorker } from "../helpers/createQueueWorker";

export interface BackgroundCheckPetitionSearchQueuePayload {
  petitionId: number;
  petitionFieldId: number;
  parentPetitionFieldReplyId: number | null;
  petitionFieldReplyId: number | null;
  orgId: number;
  query: EntitySearchRequest;
  userId: number | null;
  petitionAccessId: number | null;
}

@injectable()
export class BackgroundCheckPetitionSearchQueue extends QueueWorker<BackgroundCheckPetitionSearchQueuePayload> {
  constructor(
    @inject(BACKGROUND_CHECK_SERVICE) private backgroundCheck: IBackgroundCheckService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
  ) {
    super();
  }

  override async handler(payload: BackgroundCheckPetitionSearchQueuePayload) {
    const search = await this.backgroundCheck.entitySearch(payload.query, payload.orgId);

    if (isNonNullish(payload.petitionFieldReplyId)) {
      await this.petitions.updatePetitionFieldRepliesContent(
        payload.petitionId,
        [
          {
            id: payload.petitionFieldReplyId,
            content: {
              query: payload.query,
              search,
              entity: null,
            },
          },
        ],
        isNonNullish(payload.userId) ? "User" : "PetitionAccess",
        isNonNullish(payload.userId) ? payload.userId : payload.petitionAccessId!,
      );
    } else {
      await this.petitions.createPetitionFieldReply(
        payload.petitionId,
        {
          type: "BACKGROUND_CHECK",
          content: {
            query: payload.query,
            search,
            entity: null,
          },
          ...(isNonNullish(payload.userId) ? { user_id: payload.userId } : {}),
          ...(isNonNullish(payload.petitionAccessId)
            ? { petition_access_id: payload.petitionAccessId }
            : {}),
          petition_field_id: payload.petitionFieldId,
          parent_petition_field_reply_id: payload.parentPetitionFieldReplyId,
          status: "PENDING",
        },
        isNonNullish(payload.userId)
          ? `User:${payload.userId}`
          : `PetitionAccess:${payload.petitionAccessId!}`,
      );
    }
  }
}
