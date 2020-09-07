import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import Knex from "knex";
import { Config, CONFIG } from "../../config";
import { fromDataLoader } from "../../util/fromDataLoader";
import { Maybe } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";

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

  readonly getOrgLogoUrl = fromDataLoader(
    new DataLoader<number, Maybe<string>>(async (orgIds) => {
      const orgs = await this.loadOrg(orgIds);
      return orgs.map((org) =>
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
          "leica",
          "spin",
          "atadvocats",
          "santalucia",
          "payfit",
        ].includes(org.identifier)
          ? `${this.config.misc.assetsUrl}/static/logos/${org.identifier}.png`
          : null
      );
    })
  );
}
