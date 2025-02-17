import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { assert } from "ts-essentials";
import { fromGlobalId } from "../../util/globalId";
import { KNEX } from "../knex";
import { PetitionFilter } from "../repositories/PetitionRepository";
import { sqlArray, sqlIn } from "./sql";

export const PETITION_FILTER_REPOSITORY_HELPER = Symbol.for("PETITION_FILTER_REPOSITORY_HELPER");

@injectable()
export class PetitionFilterRepositoryHelper {
  constructor(@inject(KNEX) private knex: Knex) {}

  public applyPetitionFilter(
    builders: Knex.QueryCallbackWithArgs[],
    filter: PetitionFilter,
    tables: Record<string, string>,
    type: "PETITION" | "TEMPLATE",
  ) {
    function t(value: string) {
      const [table, column] = value.split(".");
      assert(table in tables, `Table ${table} not found`);
      return `${tables[table]}.${column}`;
    }

    if (filter.locale) {
      builders.push((q) => q.where(t("petition.recipient_locale"), filter.locale));
    }

    if (filter.status && filter.status.length > 0 && type === "PETITION") {
      builders.push((q) =>
        q.whereRaw(`${t("petition.status")} in ?`, [sqlIn(this.knex, filter.status!)]),
      );
    }

    if (filter.tags) {
      const { filters: tagsFilters, operator } = filter.tags;

      builders.push((q) => {
        q.joinRaw(
          /* sql */ `left join petition_tag pt on pt.petition_id = ${t("petition.id")}`,
        ).modify((q) => {
          const conditions: string[] = [];
          const bindings: any[] = [];
          for (const filter of tagsFilters) {
            switch (filter.operator) {
              case "CONTAINS":
              case "DOES_NOT_CONTAIN":
                const condition = /* sql */ `array_agg(distinct pt.tag_id) @> ?`;
                bindings.push(sqlArray(this.knex, filter.value, "int"));
                conditions.push(
                  filter.operator.startsWith("DOES_NOT_") ? `not (${condition})` : condition,
                );
                break;
              case "IS_EMPTY":
                conditions.push(/* sql */ `count(distinct pt.tag_id) = 0`);
                break;
            }
          }
          q.havingRaw("(" + conditions.join(` ${operator.toLowerCase()} `) + ")", bindings);
        });
      });
    }

    if (filter.sharedWith && filter.sharedWith.filters.length > 0) {
      const { filters: sharedWithFilters, operator } = filter.sharedWith;
      builders.push((q) => {
        q.joinRaw(
          /* sql */ `join petition_permission pp2 on pp2.petition_id = ${t("petition.id")} and pp2.deleted_at is null`,
        ).modify((q) => {
          const conditions: string[] = [];
          const bindings: any[] = [];
          for (const filter of sharedWithFilters) {
            const { id, type } = fromGlobalId(filter.value);
            if (type !== "User" && type !== "UserGroup") {
              throw new Error(`Expected User or UserGroup, got ${type}`);
            }
            const column = type === "User" ? "user_id" : "user_group_id";
            switch (filter.operator) {
              case "SHARED_WITH":
              case "NOT_SHARED_WITH": {
                const condition = /* sql */ `? = any(array_remove(array_agg(distinct pp2.${column}), null))`;
                bindings.push(id);
                conditions.push(
                  filter.operator.startsWith("NOT_") ? `not (${condition})` : condition,
                );
                break;
              }
              case "IS_OWNER":
              case "NOT_IS_OWNER": {
                const condition = /* sql */ `sum(case pp2.type when 'OWNER' then (pp2.user_id = ?)::int else 0 end) > 0`;
                bindings.push(id);
                conditions.push(
                  filter.operator.startsWith("NOT_") ? `not (${condition})` : condition,
                );
                break;
              }
            }
          }
          q.havingRaw("(" + conditions.join(` ${operator.toLowerCase()} `) + ")", bindings);
        });
      });
    }

    if (filter.profileIds && filter.profileIds.length > 0) {
      builders.push((q) => {
        q.joinRaw(/* sql */ `join petition_profile pp3 on pp3.petition_id = ${t("petition.id")}`);
        q.whereIn("pp3.profile_id", filter.profileIds!);
      });
    }

    if (filter.signature && filter.signature.length > 0) {
      builders.push((q) =>
        q.where((q) => {
          if (filter.signature!.includes("NO_SIGNATURE")) {
            // no signature configured nor any previous signature request
            q.or.whereRaw(/* sql */ `
              ${t("petition.signature_config")} is null
              and ${t("petition.latest_signature_status")} is null
            `);
          }
          if (filter.signature!.includes("NOT_STARTED")) {
            // signature is configured, awaiting to complete the petition
            q.or.whereRaw(/* sql */ `
              ${t("petition.signature_config")} is not null
              and ${t("petition.latest_signature_status")} is null
              and ${t("petition.status")} in ('DRAFT', 'PENDING')
            `);
          }
          if (filter.signature!.includes("PENDING_START")) {
            // petition is completed, need to manually start the signature
            // also show as pending start when user manually cancels the previous request
            // and signature is still configured
            q.or.whereRaw(/* sql */ `
              ${t("petition.signature_config")} is not null 
              and ${t("petition.status")} in ('COMPLETED', 'CLOSED')
              and (
                ${t("petition.latest_signature_status")} is null
                or ${t("petition.latest_signature_status")} = 'COMPLETED'
                or ${t("petition.latest_signature_status")} = 'CANCELLED_BY_USER'
              )
            `);
          }
          if (filter.signature!.includes("PROCESSING")) {
            // signature is ongoing
            q.or.whereRaw(/* sql */ `
              ${t("petition.latest_signature_status")} is not null
              and ${t("petition.latest_signature_status")} not in ('COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED')
            `);
          }
          if (filter.signature!.includes("COMPLETED")) {
            // signature completed, everyone signed
            q.or.whereRaw(/* sql */ `
              ${t("petition.signature_config")} is null
              and ${t("petition.latest_signature_status")} is not null
              and ${t("petition.latest_signature_status")} = 'COMPLETED'
            `);
          }
          if (filter.signature!.includes("CANCELLED")) {
            // cancelled by a reason external to user (request error, signer declined, etc)
            // or cancelled by user and no signature configured
            q.or.whereRaw(/* sql */ `
              ${t("petition.latest_signature_status")} is not null
              and (
                ${t("petition.latest_signature_status")} = 'CANCELLED'
                or ( 
                  ${t("petition.latest_signature_status")} = 'CANCELLED_BY_USER'
                  and ${t("petition.signature_config")} is null
                )
              )
            `);
          }
        }),
      );
    }

    if (filter.fromTemplateId && filter.fromTemplateId.length > 0) {
      builders.push((q) => q.whereIn(t("petition.from_template_id"), filter.fromTemplateId!));
    }

    if (filter.permissionTypes && filter.permissionTypes.length > 0) {
      builders.push((q) => q.whereIn(t("petition_permission.type"), filter.permissionTypes!));
    }

    if (filter.approvals && filter.approvals.filters.length > 0) {
      const { filters: approvalFilters, operator } = filter.approvals;
      builders.push((q) => {
        q.joinRaw(/* sql */ `
            left join petition_approval_request_step pars 
              on pars.petition_id = ${t("petition.id")}
              and pars.deprecated_at is null
              and pars.status != 'NOT_APPLICABLE'
          `);

        if (approvalFilters.some((f) => f.operator === "ASSIGNED_TO")) {
          q.joinRaw(
            /* sql */ `join petition_approval_request_step_approver parsa on parsa.petition_approval_request_step_id = pars.id`,
          );
        }
        q.modify((q) => {
          const conditions: string[] = [];
          const bindings: any[] = [];
          for (const filter of approvalFilters) {
            if (filter.operator === "STATUS") {
              switch (filter.value) {
                case "WITHOUT_APPROVAL":
                  conditions.push(
                    /* sql */ `count(${t("petition.*")}) filter (where ${t("petition.approval_flow_config")} is null) > 0`,
                  );
                  break;
                case "NOT_STARTED":
                  // all steps in NOT_STARTED status, or no steps created yet but approval_flow_config not null
                  conditions.push(
                    /* sql */ `count(${t("petition.*")}) filter (where (pars.id is null or pars.status = 'NOT_STARTED') and (${t("petition.approval_flow_config")} is not null)) > 0`,
                  );
                  break;
                case "PENDING":
                  // any step in PENDING status
                  conditions.push(
                    /* sql */ `count(pars.*) filter (where pars.status = 'PENDING') > 0`,
                  );
                  break;
                case "APPROVED":
                  // all steps in APPROVED or SKIPPED status
                  conditions.push(
                    /* sql */ `(count(pars.*) > 0 and count(pars.*) filter (where pars.status = 'APPROVED' or pars.status = 'SKIPPED') = count(pars.*))`,
                  );
                  break;
                case "REJECTED":
                  // any step in REJECTED status
                  conditions.push(
                    /* sql */ `count(pars.*) filter (where pars.status = 'REJECTED') > 0`,
                  );
                  break;
                default:
                  break;
              }
            } else if (filter.operator === "ASSIGNED_TO") {
              const { id, type } = fromGlobalId(filter.value);
              if (type !== "User") {
                throw new Error(`Expected User, got ${type}`);
              }
              conditions.push(/* sql */ `? = any(array_agg(distinct parsa.user_id))`);
              bindings.push(id);
            }
          }
          q.havingRaw("(" + conditions.join(` ${operator.toLowerCase()} `) + ")", bindings);
        });
      });
    }
  }
}
