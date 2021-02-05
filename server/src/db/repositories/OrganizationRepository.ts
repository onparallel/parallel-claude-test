import { inject, injectable } from "inversify";
import Knex from "knex";
import { Config, CONFIG } from "../../config";
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

  readonly loadOrg = this.buildLoadById("organization", "id", (q) =>
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
                    return `${s.column} ${s.order} NULLS ${nulls}`;
                  } else if (s.column === "full_name") {
                    const nulls = s.order === "asc" ? "FIRST" : "LAST";
                    return `first_name ${s.order} NULLS ${nulls}, last_name ${s.order} NULLS ${nulls}`;
                  } else {
                    return `${s.column} ${s.order}`;
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

  async updateOrgLogo(id: number, logoUrl: string, user: User) {
    const [org] = await this.from("organization")
      .where("id", id)
      .update({
        logo_url: logoUrl,
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
}
