import ASCIIFolder from "fold-to-ascii";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { ProfileQueryFilterProperty } from "../../api/public/__types";
import { never } from "../../util/never";
import { ProfileQueryFilter, ProfileQueryFilterOperator } from "../../util/ProfileQueryFilter";
import { ProfileQuerySortBy } from "../../util/ProfileQuerySortBy";
import { Profile, ProfileTypeField, ProfileTypeFieldType } from "../__types";
import { KNEX } from "../knex";
import { sqlArray, sqlIn } from "./sql";

export const PROFILE_QUERY_HELPER = Symbol.for("PROFILE_QUERY_HELPER");

export const CACHED_PROFILE_TYPE_FIELDS = [
  "SHORT_TEXT",
  "SELECT",
  "CHECKBOX",
  "DATE",
  "PHONE",
  "NUMBER",
  "USER_ASSIGNMENT",
] as const;

const DRAFTABLE_PROFILE_TYPE_FIELDS = ["ADVERSE_MEDIA_SEARCH", "BACKGROUND_CHECK"] as const;

@injectable()
export class ProfileQueryHelper {
  constructor(@inject(KNEX) private knex: Knex) {}

  public applyProfileQueryFilterJoins(
    q: Knex.QueryBuilder,
    filter: ProfileQueryFilter,
    joins: Record<number, string>,
    profileTypeFieldsById: Record<number, ProfileTypeField> | undefined,
  ) {
    if ("conditions" in filter) {
      for (const condition of filter.conditions) {
        this.applyProfileQueryFilterJoins(q, condition, joins, profileTypeFieldsById);
      }
    } else if ("profileTypeFieldId" in filter) {
      assert(
        isNonNullish(profileTypeFieldsById),
        "Must filter by a single profileTypeId when applying a profileTypeFieldId filter",
      );
      const profileTypeField = profileTypeFieldsById[filter.profileTypeFieldId];
      assert(profileTypeField, `ProfileTypeField:${filter.profileTypeFieldId} not found`);
      this.applyProfileTypeFieldJoin(q, joins, profileTypeField);
    }
  }

  public getProfileTypeFieldContent(
    joins: Record<number, string>,
    profileTypeField: ProfileTypeField,
  ) {
    const alias = joins[profileTypeField.id];
    if (profileTypeField.type === "FILE") {
      return this.knex.raw(`??.id`, [alias]);
    } else if (DRAFTABLE_PROFILE_TYPE_FIELDS.includes(profileTypeField.type)) {
      return this.knex.raw(`coalesce(??.content, ??.content)`, [`draft_${alias}`, alias]);
    } else if (CACHED_PROFILE_TYPE_FIELDS.includes(profileTypeField.type)) {
      return this.knex.raw(`p.value_cache->?->'content'`, [profileTypeField.id]);
    } else {
      return this.knex.raw(`??.content`, [alias]);
    }
  }

  private getProfileTypeFieldExpiryDate(
    joins: Record<number, string>,
    profileTypeField: ProfileTypeField,
  ) {
    const alias = joins[profileTypeField.id];
    if (CACHED_PROFILE_TYPE_FIELDS.includes(profileTypeField.type)) {
      return this.knex.raw(`(p.value_cache->?->>'expiry_date')::date`, [profileTypeField.id]);
    } else {
      return this.knex.raw(`??.expiry_date`, [alias]);
    }
  }

  public applyProfileTypeFieldJoin(
    q: Knex.QueryBuilder,
    joins: Record<number, string>,
    profileTypeField: ProfileTypeField,
  ) {
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
      } else if (DRAFTABLE_PROFILE_TYPE_FIELDS.includes(profileTypeField.type)) {
        q.joinRaw(
          /* sql */ `
          left join profile_field_value ${alias}
            on ${alias}.profile_id = p.id
              and ${alias}.profile_type_field_id = ?
              and ${alias}.deleted_at is null 
              and ${alias}.removed_at is null
              and ${alias}.is_draft = false
          `,
          [profileTypeField.id],
        ).joinRaw(
          /* sql */ `
            left join profile_field_value draft_${alias}
              on draft_${alias}.profile_id = p.id
              and draft_${alias}.profile_type_field_id = ?
              and draft_${alias}.deleted_at is null 
              and draft_${alias}.removed_at is null
              and draft_${alias}.is_draft = true
            `,
          [profileTypeField.id],
        );
      } else if (CACHED_PROFILE_TYPE_FIELDS.includes(profileTypeField.type)) {
        // cached fields do not need to be joined
      } else {
        q.joinRaw(
          /* sql */ `
          left join profile_field_value ${alias}
            on ${alias}.profile_id = p.id
              and ${alias}.profile_type_field_id = ?
              and ${alias}.deleted_at is null 
              and ${alias}.removed_at is null
              and ${alias}.is_draft = false
          `,
          [profileTypeField.id],
        );
      }
    }
  }

  public applyProfileQueryFilter(
    q: Knex.QueryBuilder,
    filter: ProfileQueryFilter,
    joins: Record<number, string>,
    profileTypeFieldsById: Record<number, ProfileTypeField> | undefined,
    currentOp: "AND" | "OR",
  ) {
    if ("conditions" in filter) {
      const { conditions, logicalOperator } = filter;
      // this simplifies the query avoiding nested unnecessary parentheses
      // a AND (b AND c) => a AND b AND c
      // a OR (b OR c) => a OR b OR c
      if (logicalOperator === currentOp || conditions.length === 1) {
        conditions.forEach((c) =>
          this.applyProfileQueryFilter(q, c, joins, profileTypeFieldsById, logicalOperator),
        );
      } else {
        q.where((q) =>
          conditions.forEach((c) =>
            q[logicalOperator === "AND" ? "andWhere" : "orWhere"]((q) =>
              this.applyProfileQueryFilter(q, c, joins, profileTypeFieldsById, logicalOperator),
            ),
          ),
        );
      }
    } else if ("profileTypeFieldId" in filter) {
      assert(
        isNonNullish(profileTypeFieldsById),
        "Must filter by a single profileTypeId when applying a profileTypeFieldId filter",
      );
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
        ? ([true, filter.operator.slice("NOT_".length) as ProfileQueryFilterOperator] as const)
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
            ["TEXT", "SHORT_TEXT", "NUMBER", "DATE", "SELECT", "PHONE", "USER_ASSIGNMENT"].includes(
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
            never(`Unimplemented operator ${operator} for type ${profileTypeField.type}`);
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
              q.whereRaw(/* sql */ `(? is not null and now() > (? + 'P1D'::interval))`, [
                expiryDate,
                expiryDate,
              ]),
            currentOp === "OR",
          );
          break;
        case "EXPIRES_IN":
          where(
            (q) =>
              q.whereRaw(
                /* sql */ `(? is not null and (now() + ?::interval) > (? + 'P1D'::interval))`,
                [expiryDate, value, expiryDate],
              ),
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
        case "HAS_PENDING_REVIEW":
          const alias = joins[profileTypeField.id];
          if (negated) {
            q.whereRaw(/* sql */ `(??.id is null and ??.pending_review = false)`, [
              `draft_${alias}`,
              alias,
            ]);
          } else {
            q.whereRaw(/* sql */ `(??.id is not null or ??.pending_review = true)`, [
              `draft_${alias}`,
              alias,
            ]);
          }
          break;
        case "HAS_AM_RESULTS":
          if (negated) {
            q.whereRaw(/* sql */ ` (? #>> '{articles,totalCount}')::int = 0`, [content]);
          } else {
            q.whereRaw(/* sql */ ` (? #>> '{articles,totalCount}')::int > 0`, [content]);
          }
          break;
        case "HAS_SAVED_ARTICLES":
          if (negated) {
            q.whereRaw(/* sql */ `jsonb_array_length(? -> 'relevant_articles') = 0`, [content]);
          } else {
            q.whereRaw(/* sql */ `jsonb_array_length(? -> 'relevant_articles') > 0`, [content]);
          }
          break;
        case "HAS_DISMISSED_ARTICLES":
          if (negated) {
            q.whereRaw(
              /* sql */ `((jsonb_array_length(? -> 'dismissed_articles') = 0) and (jsonb_array_length(? -> 'irrelevant_articles') = 0))`,
              [content, content],
            );
          } else {
            q.whereRaw(
              /* sql */ `((jsonb_array_length(? -> 'dismissed_articles') > 0) or (jsonb_array_length(? -> 'irrelevant_articles') > 0))`,
              [content, content],
            );
          }
          break;
        default:
          throw new Error(`Operator ${operator} not implemented`);
      }
    } else if ("property" in filter) {
      const { property, operator, value } = filter;

      const columnMap: Record<ProfileQueryFilterProperty, keyof Profile> = {
        id: "id",
        status: "status",
        createdAt: "created_at",
        updatedAt: "updated_at",
        closedAt: "closed_at",
      };

      const column = columnMap[property];

      if (operator === "HAS_VALUE") {
        q.whereRaw(/* sql */ `?? is not null`, [`p.${column}`]);
      } else if (operator === "NOT_HAS_VALUE") {
        q.whereRaw(/* sql */ `?? is null`, [`p.${column}`]);
      } else if (operator === "EQUAL") {
        q.whereRaw(/* sql */ `?? = ?`, [`p.${column}`, value]);
      } else if (operator === "NOT_EQUAL") {
        q.whereRaw(/* sql */ `?? != ?`, [`p.${column}`, value]);
      } else if (operator === "IS_ONE_OF") {
        assert(Array.isArray(value));
        q.whereRaw(/* sql */ `?? in ?`, [`p.${column}`, sqlIn(this.knex, value)]);
      } else if (operator === "NOT_IS_ONE_OF") {
        assert(Array.isArray(value));
        q.whereRaw(/* sql */ `?? not in ?`, [`p.${column}`, sqlIn(this.knex, value)]);
      } else if (operator === "LESS_THAN") {
        q.whereRaw(/* sql */ `?? < ?`, [`p.${column}`, value]);
      } else if (operator === "LESS_THAN_OR_EQUAL") {
        q.whereRaw(/* sql */ `?? <= ?`, [`p.${column}`, value]);
      } else if (operator === "GREATER_THAN") {
        q.whereRaw(/* sql */ `?? > ?`, [`p.${column}`, value]);
      } else if (operator === "GREATER_THAN_OR_EQUAL") {
        q.whereRaw(/* sql */ `?? >= ?`, [`p.${column}`, value]);
      } else {
        never(`Invalid operator: ${operator}`);
      }
    } else {
      never(`Unknown filter type: ${JSON.stringify(filter)}`);
    }
  }

  public applyProfileQuerySortBy(
    q: Knex.QueryBuilder,
    sortBy: ProfileQuerySortBy[],
    profileTypeFieldsById?: Record<number, ProfileTypeField>,
  ) {
    if (sortBy.length === 0) {
      return;
    }

    const columnMap = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      closedAt: "closed_at",
      name: "name_en",
    } as const;

    const castMap = {
      NUMBER: "float",
      DATE: "date",
    } as Record<ProfileTypeFieldType, string>;

    q.orderByRaw(
      sortBy
        .map((s) => {
          if (s.field.startsWith("field_")) {
            assert(profileTypeFieldsById, "Profile type fields are required");

            const fieldId = parseInt(s.field.split("_")[1]);
            const profileTypeField = profileTypeFieldsById[fieldId];
            assert(profileTypeField, `Profile type field with id ${fieldId} not found`);

            const cast = castMap[profileTypeField.type] ?? "text";

            return `("value_cache"->'${fieldId}'->'content'->>'value')::${cast} ${s.order} nulls last`;
          } else {
            const field = columnMap[s.field as keyof typeof columnMap];
            if (field === "name_en") {
              return `"localizable_name"->>'en' ${s.order} nulls last`;
            } else {
              return `"${field}" ${s.order} nulls last`;
            }
          }
        })
        .join(", "),
    );
  }
}
