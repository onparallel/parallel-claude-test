import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadOrg = this.buildLoadById("organization", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async loadOrgUsers(orgId: number, opts: PageOpts) {
    return await this.loadPageAndCount(
      this.from("user")
        .where({ org_id: orgId, deleted_at: null })
        .mmodify((q) => {
          q.orderBy("id");
        })
        .select("*"),
      opts
    );
  }
}
