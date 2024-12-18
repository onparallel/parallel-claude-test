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
          for (const filter of tagsFilters) {
            q = operator === "AND" ? q.and : q.or;

            switch (filter.operator) {
              case "CONTAINS":
              case "DOES_NOT_CONTAIN":
                q = filter.operator.startsWith("DOES_NOT_") ? q.not : q;
                q.havingRaw(/* sql */ `array_agg(distinct pt.tag_id) @> ?`, [
                  sqlArray(this.knex, filter.value, "int"),
                ]);
                break;
              case "IS_EMPTY":
                q.havingRaw(/* sql */ `count(distinct pt.tag_id) = 0`);
                break;
            }
          }
        });
      });
    }

    if (filter.sharedWith && filter.sharedWith.filters.length > 0) {
      const { filters: sharedWithFilters, operator } = filter.sharedWith;
      builders.push((q) => {
        q.joinRaw(
          /* sql */ `join petition_permission pp2 on pp2.petition_id = ${t("petition.id")} and pp2.deleted_at is null`,
        ).modify((q) => {
          for (const filter of sharedWithFilters) {
            const { id, type } = fromGlobalId(filter.value);
            if (type !== "User" && type !== "UserGroup") {
              throw new Error(`Expected User or UserGroup, got ${type}`);
            }
            const column = type === "User" ? "user_id" : "user_group_id";
            q = operator === "AND" ? q.and : q.or;
            switch (filter.operator) {
              case "SHARED_WITH":
              case "NOT_SHARED_WITH":
                q = filter.operator.startsWith("NOT_") ? q.not : q;
                q.havingRaw(
                  /* sql */ `? = any(array_remove(array_agg(distinct pp2.${column}), null))`,
                  [id],
                );
                break;
              case "IS_OWNER":
              case "NOT_IS_OWNER":
                q = filter.operator.startsWith("NOT_") ? q.not : q;
                q.havingRaw(
                  /* sql */ `sum(case pp2.type when 'OWNER' then (pp2.user_id = ?)::int else 0 end) > 0`,
                  [id],
                );
                break;
            }
          }
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
  }
}
