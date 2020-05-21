import { inject, injectable } from "inversify";
import Knex, { QueryBuilder } from "knex";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";
import { Petition, PetitionStatus, PetitionEventType } from "../__types";

@injectable()
export class PetitionEventsRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }
  async loadEventsForPetition(petitionId: number, opts: PageOpts) {
    return await this.loadPageAndCount(
      this.from("petition_event")
        .where("petition_id", petitionId)
        .orderBy("created_at", "as")
        .select("*"),
      opts
    );
  }
}
