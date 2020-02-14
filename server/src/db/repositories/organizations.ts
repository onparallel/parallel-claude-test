import { inject, injectable } from "inversify";
import Knex from "knex";
import { KNEX } from "../knex";
import { Organization } from "../__types";
import { BaseRepository, PageOpts } from "./helpers";

@injectable()
export class OrganizationReposistory extends BaseRepository<
  Organization,
  "id"
> {
  constructor(@inject(KNEX) knex: Knex) {
    super("organization", "id", knex);
  }

  async loadOrgUsers(orgId: number, opts: PageOpts) {
    return await this.loadPageAndCount(
      this.users.where({ org_id: orgId, deleted_at: null }),
      opts
    );
  }
}
