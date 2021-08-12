import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { indexBy } from "remeda";
import { Config, CONFIG } from "../../config";
import { unMaybeArray } from "../../util/arrays";
import { fromDataLoader } from "../../util/fromDataLoader";
import { Maybe, MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  CreateOrganization,
  CreateOrganizationUsageLimit,
  Organization,
  OrganizationStatus,
  OrganizationUsageLimit,
  OrganizationUsageLimitName,
  User,
} from "../__types";

export type OrganizationUsageDetails = {
  USER_SEATS: number;
  PETITION_SEND: {
    limit: number;
    period: "month" | "year";
  };
};

@injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(@inject(CONFIG) private config: Config, @inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly defaultOrganizationUsageDetails: OrganizationUsageDetails = {
    USER_SEATS: 1000,
    PETITION_SEND: {
      limit: 5000,
      period: "month",
    },
  };

  readonly loadOrg = this.buildLoadBy("organization", "id", (q) => q.whereNull("deleted_at"));

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
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const [org] = await this.from("organization", t)
      .where("id", id)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");
    return org;
  }

  async createOrganization(data: CreateOrganization, createdBy?: string, t?: Knex.Transaction) {
    const [org] = await this.insert(
      "organization",
      {
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
        usage_details: data.usage_details || this.defaultOrganizationUsageDetails,
      },
      t
    );
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
          join public_file_upload pfu on o.logo_public_file_id = pfu.id
          where o.id in (${orgIds.map(() => "?").join(",")})
      `,
        [...orgIds]
      );
      const resultsById = indexBy(results, (x) => x.id);
      return orgIds.map((id) =>
        resultsById[id] ? `${this.config.misc.uploadsUrl}/${resultsById[id].path}` : null
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

  async getOrganizationUsageDetails() {
    return await this.from("organization").select("id", "usage_details");
  }

  async getOrganizationCurrentUsageLimit(
    orgId: number,
    limitName: OrganizationUsageLimitName
  ): Promise<OrganizationUsageLimit | null> {
    const [row] = await this.from("organization_usage_limit").where({
      org_id: orgId,
      period_end_date: null,
      limit_name: limitName,
    });

    return row;
  }

  async createOrganizationUsageLimit(
    orgId: number,
    data: MaybeArray<Omit<CreateOrganizationUsageLimit, "org_id">>
  ) {
    const dataArr = unMaybeArray(data).map((d) => ({ org_id: orgId, ...d }));
    return await this.insert("organization_usage_limit", dataArr);
  }

  async updateUsageLimitAsExpired(orgUsageLimitId: number) {
    return await this.from("organization_usage_limit")
      .where("id", orgUsageLimitId)
      .update("period_end_date", this.now());
  }

  async updateOrganizationCurrentUsageLimitCredits(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    creditsSpent: number
  ) {
    return await this.from("organization_usage_limit")
      .where({
        period_end_date: null,
        limit_name: limitName,
        org_id: orgId,
      })
      .update({ used: this.knex.raw(`used + ?`, [creditsSpent]) });
  }
}
