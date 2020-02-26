import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { Contact } from "../__types";

@injectable()
export class ContactReposistory extends BaseRepository<Contact, "id"> {
  constructor(@inject(KNEX) knex: Knex) {
    super("contact", "id", knex);
  }
}
