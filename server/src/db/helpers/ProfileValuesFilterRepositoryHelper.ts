import ASCIIFolder from "fold-to-ascii";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { never } from "../../util/never";
import {
  ProfileFieldValuesFilter,
  ProfileFieldValuesFilterOperator,
} from "../../util/ProfileFieldValuesFilter";
import { ProfileTypeField, ProfileTypeFieldType } from "../__types";
import { KNEX } from "../knex";
import { sqlArray, sqlIn } from "./sql";

export const PROFILE_VALUES_FILTER_REPOSITORY_HELPER = Symbol.for(
  "PROFILE_VALUES_FILTER_REPOSITORY_HELPER",
);

@injectable()
export class ProfileValuesFilterRepositoryHelper {
  constructor(@inject(KNEX) private knex: Knex) {}

  public applyProfileValuesFilterJoins(
    q: Knex.QueryBuilder,
    filter: ProfileFieldValuesFilter,
    joins: Record<number, string>,
    profileTypeFieldsById: Record<number, ProfileTypeField>,
  ) {
    if ("conditions" in filter) {
      for (const condition of filter.conditions) {
        this.applyProfileValuesFilterJoins(q, condition, joins, profileTypeFieldsById);
      }
    } else {
      this.applyProfileTypeFieldJoin(q, joins, profileTypeFieldsById[filter.profileTypeFieldId]);
    }
  }

  public getProfileTypeFieldContent(
    joins: Record<number, string>,
    profileTypeField: ProfileTypeField,
  ) {
    const alias = joins[profileTypeField.id];
    if (profileTypeField.type === "FILE") {
      return this.knex.raw(`??.id`, [alias]);
    } else {
      if (
        ["SHORT_TEXT", "SELECT", "CHECKBOX", "DATE", "PHONE", "NUMBER"].includes(
          profileTypeField.type,
        )
      ) {
        return this.knex.raw(`coalesce(p.value_cache->?->'content', ??.content)`, [
          profileTypeField.id,
          alias,
        ]);
      } else {
        return this.knex.raw(`??.content`, [alias]);
      }
    }
  }

  public getProfileTypeFieldExpiryDate(
    joins: Record<number, string>,
    profileTypeField: ProfileTypeField,
  ) {
    const alias = joins[profileTypeField.id];
    if (
      ["SHORT_TEXT", "SELECT", "CHECKBOX", "DATE", "PHONE", "NUMBER"].includes(
        profileTypeField.type,
      )
    ) {
      return this.knex.raw(`coalesce((p.value_cache->?->>'expiry_date')::date, ??.expiry_date)`, [
        profileTypeField.id,
        alias,
      ]);
    } else {
      return this.knex.raw(`??.expiry_date`, [alias]);
    }
  }

  public applyProfileTypeFieldJoin(
    q: Knex.QueryBuilder,
    joins: Record<number, string>,
    profileTypeField: ProfileTypeField,
  ) {
    assert(profileTypeField, `Profile type field ${profileTypeField.id} not found`);
    if (isNullish(joins[profileTypeField.id])) {
      const alias = (joins[profileTypeField.id] = `pfv${profileTypeField.id}`);
      if (profileTypeField.type === "FILE") {
        q.joinRaw(
          /* sql */ `
            left join profile_field_file ${alias} 
              on ${alias}.profile_id = p.id
              and ${alias}.profile_type_field_id = ?
              and ${alias}.deleted_at is null 
              and ${alias}.removed_at is null
            `,
          [profileTypeField.id],
        );
      } else {
        q.joinRaw(
          /* sql */ `
          left join profile_field_value ${alias}
            on not jsonb_exists(p.value_cache, ?)
              and ${alias}.profile_id = p.id
              and ${alias}.profile_type_field_id = ?
              and ${alias}.deleted_at is null 
              and ${alias}.removed_at is null
          `,
          [profileTypeField.id, profileTypeField.id],
        );
      }
    }
  }

  public applyProfileValueFilter(
    q: Knex.QueryBuilder,
    filter: ProfileFieldValuesFilter,
    joins: Record<number, string>,
    profileTypeFieldsById: Record<number, ProfileTypeField>,
    currentOp: "AND" | "OR",
  ) {
    if ("conditions" in filter) {
      const { conditions, logicalOperator } = filter;
      // this simplifies the query avoiding nested unnecessary parentheses
      // a AND (b AND c) => a AND b AND c
      // a OR (b OR c) => a OR b OR c
      if (logicalOperator === currentOp || conditions.length === 1) {
        conditions.forEach((c) =>
          this.applyProfileValueFilter(q, c, joins, profileTypeFieldsById, logicalOperator),
        );
      } else {
        q.where((q) =>
          conditions.forEach((c) =>
            q[logicalOperator === "AND" ? "andWhere" : "orWhere"]((q) =>
              this.applyProfileValueFilter(q, c, joins, profileTypeFieldsById, logicalOperator),
            ),
          ),
        );
      }
    } else {
      const profileTypeField = profileTypeFieldsById[filter.profileTypeFieldId];
      const assertType = (...types: ProfileTypeFieldType[]) => {
        assert(
          types.includes(profileTypeField.type),
          `Invalid operator ${filter.operator} for type ${profileTypeField.type}`,
        );
      };
      const content = this.getProfileTypeFieldContent(joins, profileTypeField);
      const expiryDate = this.getProfileTypeFieldExpiryDate(joins, profileTypeField);
      const [negated, operator] = filter.operator.startsWith("NOT_")
        ? ([
            true,
            filter.operator.slice("NOT_".length) as ProfileFieldValuesFilterOperator,
          ] as const)
        : ([false, filter.operator] as const);
      const value = filter.value;
      const where = (builder: (q: Knex.QueryBuilder) => void, wrap: boolean) => {
        if (wrap) {
          q.where(builder);
        } else {
          builder(q);
        }
      };
      const apply = (sql: string, bindings: readonly Knex.RawBinding[]) => {
        const raw = this.knex.raw(sql, bindings);
        if (negated) {
          where((q) => q.whereRaw(`? is null or not(?)`, [content, raw]), currentOp === "AND");
        } else {
          where((q) => q.whereRaw(`? is not null and ?`, [content, raw]), currentOp === "OR");
        }
      };
      switch (operator) {
        case "HAS_VALUE":
          if (negated) {
            q.whereRaw(/* sql*/ `? is null`, [content]);
          } else {
            q.whereRaw(/* sql*/ `? is not null`, [content]);
          }
          break;
        case "EQUAL":
          if (
            ["TEXT", "SHORT_TEXT", "NUMBER", "DATE", "SELECT", "PHONE"].includes(
              profileTypeField.type,
            )
          ) {
            assert(isNonNullish(value));
            apply(/* sql*/ `?->>'value' = ?`, [content, value]);
          } else if (profileTypeField.type === "CHECKBOX") {
            assert(Array.isArray(value));
            apply(/* sql*/ `(?->'value' @> to_jsonb(?) and ?->'value' <@ to_jsonb(?))`, [
              content,
              sqlArray(this.knex, value),
              content,
              sqlArray(this.knex, value),
            ]);
          } else {
            never();
          }
          break;
        case "START_WITH":
          assertType("TEXT", "SHORT_TEXT");
          assert(typeof value === "string");
          apply(/* sql*/ `starts_with(lower(unaccent(?->>'value')), ?)`, [
            content,
            ASCIIFolder.foldMaintaining(value.toLowerCase()),
          ]);
          break;
        case "END_WITH":
          assertType("TEXT", "SHORT_TEXT");
          assert(typeof value === "string");
          const _value = ASCIIFolder.foldMaintaining(value.toLowerCase());
          apply(/* sql*/ `right(lower(unaccent(?->>'value')), length(?)) = ?`, [
            content,
            _value,
            _value,
          ]);
          break;
        case "CONTAIN":
          assert(isNonNullish(value));
          if (["TEXT", "SHORT_TEXT"].includes(profileTypeField.type)) {
            assert(typeof value === "string");
            apply(/* sql*/ `strpos(lower(unaccent(?->>'value')), ?) > 0`, [
              content,
              ASCIIFolder.foldMaintaining(value.toLowerCase()),
            ]);
          } else if (profileTypeField.type === "CHECKBOX") {
            assert(Array.isArray(value));
            apply(/* sql*/ `?->'value' @> to_jsonb(?)`, [content, sqlArray(this.knex, value)]);
          } else {
            never(`Invalid operator ${operator} for type ${profileTypeField.type}`);
          }
          break;
        case "IS_ONE_OF":
          assertType("SELECT", "TEXT", "SHORT_TEXT");
          assert(Array.isArray(value));
          apply(/* sql*/ `?->>'value' in ?`, [content, sqlIn(this.knex, value)]);
          break;
        case "LESS_THAN":
        case "LESS_THAN_OR_EQUAL":
        case "GREATER_THAN":
        case "GREATER_THAN_OR_EQUAL":
          assertType("NUMBER", "DATE");
          assert(isNonNullish(value));
          const op = {
            LESS_THAN: "<",
            LESS_THAN_OR_EQUAL: "<=",
            GREATER_THAN: ">",
            GREATER_THAN_OR_EQUAL: ">=",
          }[operator];
          const cast = {
            NUMBER: "float",
            DATE: "date",
          }[profileTypeField.type as "NUMBER" | "DATE"];
          apply(/* sql*/ `(?->>'value')::${cast} ${op} ?::${cast}`, [content, value]);
          break;
        case "HAS_BG_CHECK_MATCH":
          apply(/* sql */ `(? -> 'entity' is not null and ? -> 'entity' != 'null'::jsonb)`, [
            content,
            content,
          ]);
          break;
        case "HAS_BG_CHECK_RESULTS":
          apply(
            /* sql */ `(? -> 'search' is not null and ? -> 'search' != 'null'::jsonb and (? #>> '{search,totalCount}')::int > 0)`,
            [content, content, content],
          );
          break;
        case "HAS_BG_CHECK_TOPICS":
          assert(Array.isArray(value));
          apply(
            /* sql */ `((? #> '{entity,properties,topics}') is not null and (? #> '{entity,properties,topics}') @> to_jsonb(?))`,
            [content, content, sqlArray(this.knex, value)],
          );
          break;
        case "HAS_ANY_BG_CHECK_TOPICS":
          apply(
            /* sql */ `((? #> '{entity,properties,topics}') is not null and jsonb_array_length(? #> '{entity,properties,topics}') > 0)`,
            [content, content],
          );
          break;
        case "IS_EXPIRED":
          where(
            (q) =>
              q.whereRaw(`? is not null and now() > (? + 'P1D'::interval)`, [
                expiryDate,
                expiryDate,
              ]),
            currentOp === "OR",
          );
          break;
        case "EXPIRES_IN":
          where(
            (q) =>
              q.whereRaw(`? is not null and (now() + ?::interval) > (? + 'P1D'::interval)`, [
                expiryDate,
                value,
                expiryDate,
              ]),
            currentOp === "OR",
          );
          break;
        case "HAS_EXPIRY":
          if (negated) {
            q.whereRaw(/* sql*/ `? is null`, [expiryDate]);
          } else {
            q.whereRaw(/* sql*/ `? is not null`, [expiryDate]);
          }
          break;
        default:
          throw new Error(`Operator ${operator} not implemented`);
      }
    }
  }
}
