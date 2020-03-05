import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class ContactReposistory extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadOneById = this.buildLoadOneById("contact", "id", q =>
    q.whereNull("deleted_at")
  );
}
