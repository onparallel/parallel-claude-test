import { inject, injectable } from "inversify";
import Knex from "knex";
import { KNEX } from "../knex";
import { Organization } from "../__types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";

@injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadOneById = this.createLoadOneById("organization", "id");

  async loadOrgUsers(orgId: number, opts: PageOpts) {
    return await this.loadPageAndCount(
      this.from("user")
        .where({ org_id: orgId, deleted_at: null })
        .modify(q => {
          q.orderBy("id");
        }),
      opts
    );
  }
}
