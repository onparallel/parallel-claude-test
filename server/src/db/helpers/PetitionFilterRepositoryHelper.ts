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
    type: "PETITION" | "TEMPLATE",
  ) {
    if (filter.locale) {
      builders.push((q) => q.where("p.recipient_locale", filter.locale));
    }

    if (filter.status && filter.status.length > 0 && type === "PETITION") {
      builders.push((q) => q.whereRaw("p.status in ?", [sqlIn(this.knex, filter.status!)]));
    }

    if (filter.tags && filter.tags.filters.length > 0) {
      const { filters: tagsFilters, operator } = filter.tags;

      builders.push((q) => {
        q.joinRaw(
          /* sql */ `left join lateral (select array_agg(distinct tag_id) as tag_ids from petition_tag where petition_id = p.id) pt on true`,
        ).modify((q) => {
          const conditions: string[] = [];
          const bindings: any[] = [];
          for (const filter of tagsFilters) {
            switch (filter.operator) {
              case "CONTAINS":
              case "DOES_NOT_CONTAIN":
                assert(filter.value.length > 0, "Tag filter value must not be empty");
                const condition = /* sql */ `(pt.tag_ids is not null and pt.tag_ids @> ?)`;
                bindings.push(sqlArray(this.knex, filter.value, "int"));
                conditions.push(
                  filter.operator.startsWith("DOES_NOT_") ? "not " + condition : condition,
                );
                break;
              case "IS_EMPTY":
                conditions.push(/* sql */ `pt.tag_ids is null`);
                break;
            }
          }
          q.whereRaw("(" + conditions.join(` ${operator.toLowerCase()} `) + ")", bindings);
        });
      });
    }

    if (filter.sharedWith && filter.sharedWith.filters.length > 0) {
      const { filters: sharedWithFilters, operator } = filter.sharedWith;
      builders.push((q) => {
        q.joinRaw(
          /* sql */ `
            join lateral (
              select
                (array_agg(distinct user_id) filter (where type = 'OWNER'))[1] as owner_id,
                array_agg(distinct user_id) filter (where user_id is not null) as user_ids,
                array_agg(distinct user_group_id) filter (where user_group_id is not null) user_group_ids
              from petition_permission where petition_id = p.id and deleted_at is null
            ) pp2 on true`,
        ).modify((q) => {
          const conditions: string[] = [];
          const bindings: any[] = [];
          for (const filter of sharedWithFilters) {
            const { id, type } = fromGlobalId(filter.value);
            if (type !== "User" && type !== "UserGroup") {
              throw new Error(`Expected User or UserGroup, got ${type}`);
            }
            const column = type === "User" ? "user_ids" : "user_group_ids";
            switch (filter.operator) {
              case "SHARED_WITH":
              case "NOT_SHARED_WITH": {
                const condition = /* sql */ `(pp2.${column} is not null and pp2.${column} @> ?)`;
                bindings.push(sqlArray(this.knex, [id], "int"));
                conditions.push(
                  filter.operator.startsWith("NOT_") ? "not " + condition : condition,
                );
                break;
              }
              case "IS_OWNER":
              case "NOT_IS_OWNER": {
                const condition = /* sql */ `pp2.owner_id = ?`;
                bindings.push(id);
                conditions.push(
                  filter.operator.startsWith("NOT_") ? `not (${condition})` : condition,
                );
                break;
              }
            }
          }
          q.whereRaw("(" + conditions.join(` ${operator.toLowerCase()} `) + ")", bindings);
        });
      });
    }

    if (filter.profileIds && filter.profileIds.length > 0) {
      builders.push((q) => {
        q.joinRaw(
          /* sql */ `join lateral (select array_agg(distinct profile_ids) as profile_ids from petition_profile where petition_id = p.id) pp3 on true`,
        );
        q.whereRaw(
          `pp3.profile_ids is not null and pp3.profile_ids @> ?`,
          sqlArray(this.knex, filter.profileIds!, "int"),
        );
      });
    }

    if (filter.signature && filter.signature.length > 0) {
      builders.push((q) =>
        q.where((q) => {
          if (filter.signature!.includes("NO_SIGNATURE")) {
            // no signature configured nor any previous signature request
            q.or.whereRaw(/* sql */ `
              (p.signature_config is null or (p.signature_config->>'isEnabled')::boolean = 'false')
              and p.latest_signature_status is null
            `);
          }
          if (filter.signature!.includes("NOT_STARTED")) {
            // signature is configured, awaiting to complete the petition
            q.or.whereRaw(/* sql */ `
              p.signature_config is not null
              and (p.signature_config->>'isEnabled')::boolean = 'true'
              and p.latest_signature_status is null
              and p.status in ('DRAFT', 'PENDING')
            `);
          }
          if (filter.signature!.includes("PENDING_START")) {
            // petition is completed, need to manually start the signature
            // also show as pending start when user manually cancels the previous request
            // and signature is still configured
            q.or.whereRaw(/* sql */ `
              p.signature_config is not null 
              and (p.signature_config->>'isEnabled')::boolean = 'true'
              and p.status in ('COMPLETED', 'CLOSED')
              and (
                p.latest_signature_status is null
                or p.latest_signature_status = 'COMPLETED'
                or p.latest_signature_status = 'CANCELLED_BY_USER'
              )
            `);
          }
          if (filter.signature!.includes("PROCESSING")) {
            // signature is ongoing
            q.or.whereRaw(/* sql */ `
              p.latest_signature_status is not null
              and p.latest_signature_status not in ('COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED')
            `);
          }
          if (filter.signature!.includes("COMPLETED")) {
            // signature completed, everyone signed
            q.or.whereRaw(/* sql */ `
              (p.signature_config is null or (p.signature_config->>'isEnabled')::boolean = 'false')
              and p.latest_signature_status is not null
              and p.latest_signature_status = 'COMPLETED'
            `);
          }
          if (filter.signature!.includes("CANCELLED")) {
            // cancelled by a reason external to user (request error, signer declined, etc)
            // or cancelled by user and no signature configured
            q.or.whereRaw(/* sql */ `
              p.latest_signature_status is not null
              and (
                p.latest_signature_status = 'CANCELLED'
                or ( 
                  p.latest_signature_status = 'CANCELLED_BY_USER'
                  and (p.signature_config is null or (p.signature_config->>'isEnabled')::boolean = 'false')
                )
              )
            `);
          }
        }),
      );
    }

    if (filter.fromTemplateId && filter.fromTemplateId.length > 0) {
      builders.push((q) => q.whereIn("p.from_template_id", filter.fromTemplateId!));
    }

    if (filter.approvals && filter.approvals.filters.length > 0) {
      const { filters: approvalFilters, operator } = filter.approvals;
      builders.push((q) => {
        if (approvalFilters.some((f) => f.operator === "ASSIGNED_TO")) {
          q.joinRaw(/* sql */ `left join lateral (
            select jsonb_agg(jsonb_build_object('status', pars.status, 'approvers', parsa.approvers)) as approval_steps
            from petition_approval_request_step pars
            join lateral (
              select jsonb_agg(user_id) as approvers from petition_approval_request_step_approver where petition_approval_request_step_id = pars.id
            ) parsa on true
            where pars.petition_id = p.id and pars.deprecated_at is null and pars.status != 'NOT_APPLICABLE'
          ) pars on true`);
        } else if (
          approvalFilters.some((f) => f.operator === "STATUS" && f.value !== "WITHOUT_APPROVAL")
        ) {
          // WITHOUT_APPROVAL doesn't need to join the approval steps
          q.joinRaw(/* sql */ `left join lateral (
            select jsonb_agg(jsonb_build_object('status', pars.status)) as approval_steps
            from petition_approval_request_step pars
            where pars.petition_id = p.id and pars.deprecated_at is null and pars.status != 'NOT_APPLICABLE'
          ) pars on true`);
        }
        q.modify((q) => {
          const conditions: string[] = [];
          const bindings: any[] = [];
          for (const filter of approvalFilters) {
            if (filter.operator === "STATUS") {
              switch (filter.value) {
                case "WITHOUT_APPROVAL":
                  conditions.push(/* sql */ `p.approval_flow_config is null`);
                  break;
                case "NOT_STARTED":
                  // all steps in NOT_STARTED status, or no steps created yet but approval_flow_config not null
                  conditions.push(/* sql */ `(
                    (pars.approval_steps is null and p.approval_flow_config is not null)
                      or 
                    (pars.approval_steps is not null and not exists (select 1 from jsonb_array_elements(pars.approval_steps) step where step->>'status' != 'NOT_STARTED'))
                  )`);
                  break;
                case "PENDING":
                  // any step in PENDING status
                  conditions.push(
                    /* sql */ `exists (select 1 from jsonb_array_elements(pars.approval_steps) step where step->>'status' = 'PENDING')`,
                  );
                  break;
                case "APPROVED":
                  // all steps in APPROVED or SKIPPED status
                  conditions.push(/* sql */ `(
                    pars.approval_steps is not null 
                    and 
                    not exists (select 1 from jsonb_array_elements(pars.approval_steps) step where step->>'status' not in ('APPROVED', 'SKIPPED'))
                  )`);
                  break;
                case "REJECTED":
                  // any step in REJECTED status
                  conditions.push(
                    /* sql */ `exists (select 1 from jsonb_array_elements(pars.approval_steps) step where step->>'status' = 'REJECTED')`,
                  );
                  break;
                default:
                  break;
              }
            } else if (filter.operator === "ASSIGNED_TO") {
              conditions.push(
                /* sql */ `exists (select 1 from jsonb_array_elements(pars.approval_steps) step where step->>'status' = 'PENDING' and step->'approvers' @> jsonb_build_array(?::int))`,
              );
              bindings.push(filter.value);
            }
          }
          q.whereRaw("(" + conditions.join(` ${operator.toLowerCase()} `) + ")", bindings);
        });
      });
    }
  }
}
