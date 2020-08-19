import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { Config, CONFIG } from "../../config";
import { escapeLike } from "../helpers/utils";

@injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(KNEX) knex: Knex
  ) {
    super(knex);
  }

  readonly loadOrg = this.buildLoadById("organization", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async loadOrgUsers(
    orgId: number,
    opts: {
      search?: string | null;
      excludeIds?: number[] | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("user")
        .where({ org_id: orgId, deleted_at: null })
        .mmodify((q) => {
          const { search, excludeIds } = opts;
          if (search) {
            q.andWhere((q2) => {
              q2.whereIlike(
                this.knex.raw(`concat("first_name", ' ', "last_name")`) as any,
                `%${escapeLike(search, "\\")}%`,
                "\\"
              ).or.whereIlike("email", `%${escapeLike(search, "\\")}%`, "\\");
            });
          }
          if (excludeIds) {
            q.whereNotIn("id", excludeIds);
          }

          q.orderBy("id");
        })
        .select("*"),
      opts
    );
  }

  async getOrgLogoUrl(orgId: number) {
    const org = await this.loadOrg(orgId);
    if (
      org &&
      [
        "doctoralia",
        "l4law",
        "cecamagan",
        "encomenda",
        "cuatrecasas",
        "cscorporateadvisors",
        "andersen",
        "meetmaps",
        "treinta",
        "iomed",
      ].includes(org.identifier)
    ) {
      return `${this.config.misc.assetsUrl}/static/logos/${org.identifier}.png`;
    }
    return null;
  }
}
