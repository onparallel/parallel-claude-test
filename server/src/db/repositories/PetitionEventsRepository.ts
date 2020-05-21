import { inject, injectable } from "inversify";
import Knex from "knex";
import { PetitionEventPayload } from "../../graphql/backing/events";
import { MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { PetitionEventType } from "../__types";

@injectable()
export class PetitionEventsRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }
  async loadEventsForPetition(petitionId: number, opts: PageOpts) {
    return await this.loadPageAndCount(
      this.from("petition_event")
        .where("petition_id", petitionId)
        .orderBy([
          { column: "created_at", order: "asc" },
          { column: "id", order: "asc" },
        ])
        .select("*"),
      opts
    );
  }

  async createEvent<TType extends PetitionEventType>(
    petitionId: number,
    type: TType,
    payload: MaybeArray<PetitionEventPayload[TType]>
  ) {
    return await this.insert(
      "petition_event",
      (Array.isArray(payload) ? payload : [payload]).map((data) => ({
        petition_id: petitionId,
        type,
        data,
      }))
    );
  }
}
