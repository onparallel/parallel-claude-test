import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { indexBy } from "remeda";
import { Config, CONFIG } from "../../config";
import { EMAILS, EmailsService } from "../../services/emails";
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
import { SystemRepository } from "./SystemRepository";

export type OrganizationUsageDetails = {
  USER_LIMIT: number;
  PETITION_SEND: {
    limit: number;
    period: string; //pg interval
  };
  // limits the number of uses of the signature production service with our shared API_KEY
  SIGNATURIT_SHARED_APIKEY: {
    limit: number;
    period: string;
  };
};

@injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(KNEX) knex: Knex,
    @inject(EMAILS) private readonly emails: EmailsService,
    @inject(SystemRepository) private system: SystemRepository
  ) {
    super(knex);
  }

  readonly loadOrg = this.buildLoadBy("organization", "id", (q) => q.whereNull("deleted_at"));

  readonly loadOrgOwner = this.buildLoadBy("user", "org_id", (q) =>
    q.whereNull("deleted_at").where("organization_role", "OWNER").where("status", "ACTIVE")
  );

  readonly loadOwnerAndAdmins = this.buildLoadMultipleBy("user", "org_id", (q) =>
    q
      .whereNull("deleted_at")
      .whereIn("organization_role", ["OWNER", "ADMIN"])
      .where("status", "ACTIVE")
  );

  async loadRootOrganization() {
    const [org] = await this.from("organization").where("status", "ROOT").select("*");
    return org;
  }

  async loadOrgUsers(
    orgId: number,
    opts: {
      search?: string | null;
      excludeIds?: number[] | null;
      sortBy?: SortBy<keyof User | "full_name">[];
      includeInactive?: boolean | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount<any, User[]>(
      this.from("user")
        .join("user_data", "user.user_data_id", "user_data.id")
        .where({ org_id: orgId })
        .whereNull("user.deleted_at")
        .whereNull("user_data.deleted_at")
        .mmodify((q) => {
          const { search, excludeIds, sortBy, includeInactive } = opts;
          if (search) {
            q.andWhere((q2) => {
              q2.whereEscapedILike(
                this.knex.raw(`concat(user_data.first_name, ' ', user_data.last_name)`) as any,
                `%${escapeLike(search, "\\")}%`,
                "\\"
              ).or.whereEscapedILike("user_data.email", `%${escapeLike(search, "\\")}%`, "\\");
            });
          }
          if (excludeIds) {
            q.whereNotIn("user.id", excludeIds);
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
                    return `"user_data.first_name" ${s.order} NULLS ${nulls}, "user_data.last_name" ${s.order} NULLS ${nulls}`;
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
        .orderBy("user.id")
        .select("user.*"),
      opts
    );
  }

  readonly loadActiveUserCount = this.buildLoadCountBy("user", "org_id", (q) =>
    q.whereNull("deleted_at").andWhere("status", "ACTIVE")
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
      },
      t
    );

    await this.createSandboxSignatureIntegration(org.id, createdBy, t);

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
            q.whereEscapedILike("name", `%${escapeLike(search, "\\")}%`, "\\");
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

  readonly loadOrgLogoPath = fromDataLoader(
    new DataLoader<number, Maybe<string>>(async (orgIds) => {
      const results = await this.raw<{ id: number; path: string }>(
        /* sql */ `
        select o.id, pfu.path from organization o
          join public_file_upload pfu on o.logo_public_file_id = pfu.id
          where o.id in ?
      `,
        [this.sqlIn(orgIds)]
      );
      const resultsById = indexBy(results, (x) => x.id);
      return orgIds.map((id) => resultsById[id]?.path ?? null);
    })
  );

  readonly loadOrgIconPath = fromDataLoader(
    new DataLoader<number, Maybe<string>>(async (orgIds) => {
      const results = await this.raw<{ id: number; path: string }>(
        /* sql */ `
        select o.id, pfu.path from organization o
          join public_file_upload pfu on o.icon_public_file_id = pfu.id
          where o.id in ?
      `,
        [this.sqlIn(orgIds)]
      );
      const resultsById = indexBy(results, (x) => x.id);
      return orgIds.map((id) => resultsById[id]?.path ?? null);
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

  async getOrganizationExpiredUsageLimitsAndDetails() {
    return await this.raw<
      OrganizationUsageLimit & { usage_details: OrganizationUsageDetails }
    >(/* sql */ `
      select oul.*, o.usage_details
        from organization_usage_limit oul
        join organization o on o.id = oul.org_id
      where period_end_date is null and ("period_start_date" at time zone 'UTC') + "period" < now()
    `);
  }

  async createOrganizationUsageLimit(
    orgId: number,
    data: MaybeArray<Omit<CreateOrganizationUsageLimit, "org_id">>,
    t?: Knex.Transaction
  ) {
    const dataArr = unMaybeArray(data).map((d) => ({ org_id: orgId, ...d }));
    return await this.insert("organization_usage_limit", dataArr, t);
  }

  async upsertOrganizationUsageLimit(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    limit: number,
    period: string,
    t?: Knex.Transaction
  ) {
    return await this.raw(
      /* sql */ `
      ? 
      ON CONFLICT (org_id, limit_name) WHERE period_end_date is NULL
      DO UPDATE SET
        "limit"=EXCLUDED.limit
        "period"=EXCLUDED.period
      RETURNING *;`,
      [
        this.from("organization_usage_limit").insert({
          org_id: orgId,
          limit_name: limitName,
          period,
          limit,
        }),
      ],
      t
    );
  }

  async updateUsageLimitAsExpired(orgUsageLimitId: number) {
    return await this.raw<OrganizationUsageLimit>(
      /* sql */ `UPDATE organization_usage_limit SET "period_end_date" = "period_start_date" + "period" WHERE "id" = ? RETURNING *`,
      [orgUsageLimitId]
    );
  }

  async updateOrganizationCurrentUsageLimitCredits(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    credits: number,
    t?: Knex.Transaction
  ) {
    const [usage] = await this.from("organization_usage_limit", t)
      .where({
        period_end_date: null,
        limit_name: limitName,
        org_id: orgId,
      })
      .update({ used: this.knex.raw(`used + ?`, [credits]) }, "*");

    // if usage reached 80% or 100% of total credits in the period, send warning email to owner and admins
    for (const threshold of [100, 80]) {
      const value = Math.round((usage.limit * threshold) / 100);
      if (usage.used - credits < value && usage.used >= value) {
        const [{ period_end_date: periodEndDate }] = await this.raw(
          `select (?::timestamptz + ?::interval) as period_end_date;`,
          [usage.period_start_date, usage.period]
        );
        await this.emails.sendOrganizationLimitsReachedEmail(orgId, limitName, usage.used, t);
        await this.system.createEvent({
          type: "ORGANIZATION_LIMIT_REACHED",
          data: {
            org_id: usage.org_id,
            limit_name: limitName,
            total: usage.limit,
            used: usage.used,
            period_start_date: usage.period_start_date,
            period_end_date: periodEndDate,
          },
        });
        break;
      }
    }
    return usage;
  }

  async createSandboxSignatureIntegration(orgId: number, createdBy?: string, t?: Knex.Transaction) {
    return await this.from("org_integration", t).insert(
      {
        org_id: orgId,
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        name: "Signaturit Sandbox",
        settings: {
          API_KEY: this.config.signature.signaturitSandboxApiKey,
          environment: "sandbox",
        },
        is_default: true,
        is_enabled: true,
        created_at: this.now(),
        created_by: createdBy,
      },
      "*"
    );
  }
}
