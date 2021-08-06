import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { indexBy } from "remeda";
import { Config, CONFIG } from "../../config";
import { fromDataLoader } from "../../util/fromDataLoader";
import { Maybe } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  CreateOrganization,
  Organization,
  OrganizationStatus,
  User,
} from "../__types";

@injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(KNEX) knex: Knex
  ) {
    super(knex);
  }

  readonly loadOrg = this.buildLoadBy("organization", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async loadOrgUsers(
    orgId: number,
    opts: {
      search?: string | null;
      excludeIds?: number[] | null;
      sortBy?: SortBy<keyof User | "full_name">[];
      includeInactive?: boolean | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("user")
        .where({ org_id: orgId, deleted_at: null })
        .mmodify((q) => {
          const { search, excludeIds, sortBy, includeInactive } = opts;
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
          if (sortBy) {
            q.orderByRaw(
              sortBy
                .map((s) => {
                  // nullable columns
                  if (["last_active_at"].includes(s.column)) {
                    const nulls = s.order === "asc" ? "FIRST" : "LAST";
                    return `"${s.column}" ${s.order} NULLS ${nulls}`;
                  } else if (s.column === "full_name") {
                    const nulls = s.order === "asc" ? "FIRST" : "LAST";
                    return `"first_name" ${s.order} NULLS ${nulls}, "last_name" ${s.order} NULLS ${nulls}`;
                  } else {
                    return `"${s.column}" ${s.order}`;
                  }
                })
                .join(", ")
            );
          }
          if (!includeInactive) {
            q.where("status", "ACTIVE");
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  readonly loadUserCount = this.buildLoadCountBy("user", "org_id", (q) =>
    q.whereNull("deleted_at")
  );

  async updateOrganization(
    id: number,
    data: Partial<CreateOrganization>,
    user: User
  ) {
    const [org] = await this.from("organization")
      .where("id", id)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: `User:${user.id}`,
      })
      .returning("*");
    return org;
  }

  async createOrganization(data: CreateOrganization, user: User) {
    const [org] = await this.insert("organization", {
      ...data,
      created_by: `User:${user.id}`,
      updated_by: `User:${user.id}`,
    });
    return org;
  }

  async loadOrganizations(
    opts: {
      search?: string | null;
      sortBy?: SortBy<keyof Organization>[];
      status?: OrganizationStatus | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("organization")
        .whereNull("deleted_at")
        .mmodify((q) => {
          const { search, status, sortBy } = opts;
          if (search) {
            q.whereIlike("name", `%${escapeLike(search, "\\")}%`, "\\");
          }
          if (status) {
            q.where("status", status);
          }
          if (sortBy) {
            q.orderBy(sortBy);
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  readonly getOrgLogoUrl = fromDataLoader(
    new DataLoader<number, Maybe<string>>(async (orgIds) => {
      const results = await this.raw<{ id: number; path: string }>(
        /* sql */ `
        select o.id, pfu.path from organization o
          join public_file_upload pfu on o.public_file_logo_id = pfu.id
          where o.id in (${orgIds.map(() => "?").join(",")})
      `,
        [...orgIds]
      );
      const resultsById = indexBy(results, (x) => x.id);
      return orgIds.map((id) =>
        resultsById[id]
          ? `${this.config.misc.uploadsUrl}/${resultsById[id].path}`
          : null
      );
    })
  );

  async getOrganizationOwner(orgId: number) {
    const [owner] = await this.from("user")
      .where({
        deleted_at: null,
        org_id: orgId,
        organization_role: "OWNER",
      })
      .select("*");

    return owner;
  }
}
