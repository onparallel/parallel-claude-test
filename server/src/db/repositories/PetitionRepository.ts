import { differenceInSeconds, isSameMonth, isThisMonth, subMonths } from "date-fns";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import pMap from "p-map";
import { DatabaseError } from "pg";
import {
  difference,
  filter,
  firstBy,
  groupBy,
  indexBy,
  isNonNullish,
  isNullish,
  map,
  mapValues,
  omit,
  partition,
  pick,
  pipe,
  sort,
  sortBy,
  unique,
  zip,
} from "remeda";
import { assert } from "ts-essentials";
import { RESULT } from "../../graphql";
import { validateReferencingFieldsPositions } from "../../graphql/helpers/validators/validFieldLogic";
import { ILogger, LOGGER } from "../../services/Logger";
import {
  PETITION_FIELD_SERVICE,
  PetitionFieldOptions,
  PetitionFieldService,
} from "../../services/PetitionFieldService";
import {
  PETITION_VALIDATION_SERVICE,
  PetitionValidationService,
} from "../../services/PetitionValidationService";
import { QUEUES_SERVICE, QueuesService } from "../../services/QueuesService";
import { average } from "../../util/arrays";
import { completedFieldReplies } from "../../util/completedFieldReplies";
import { applyFieldVisibility, evaluateFieldLogic, mapFieldLogic } from "../../util/fieldLogic";
import { fromGlobalId, fromGlobalIds, isGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { isValueCompatible } from "../../util/isValueCompatible";
import { keyBuilder } from "../../util/keyBuilder";
import { never } from "../../util/never";
import { paginationLoader } from "../../util/paginationLoader";
import { LazyPromise } from "../../util/promises/LazyPromise";
import { pMapChunk } from "../../util/promises/pMapChunk";
import { withError } from "../../util/promises/withError";
import { PetitionAccessReminderConfig, calculateNextReminder } from "../../util/reminderUtils";
import { StopRetryError, retry } from "../../util/retry";
import { safeJsonParse } from "../../util/safeJsonParse";
import { collectMentionsFromSlate } from "../../util/slate/mentions";
import {
  replacePlaceholdersInSlate,
  replacePlaceholdersInText,
} from "../../util/slate/placeholders";
import { SlateNode } from "../../util/slate/render";
import { random } from "../../util/token";
import { Maybe, MaybeArray, Replace, UnwrapArray, unMaybeArray } from "../../util/types";
import { TemplateStatsReportInput } from "../../workers/tasks/TemplateStatsReportRunner";
import {
  AiCompletionLog,
  Contact,
  ContactLocale,
  CreateAiCompletionLog,
  CreatePetitionAccess,
  CreatePetitionAttachment,
  CreatePetitionContactNotification,
  CreatePetitionField,
  CreatePetitionFieldAttachment,
  CreatePetitionFieldReply,
  CreatePetitionMessage,
  CreatePetitionReminder,
  CreatePetitionSignatureRequest,
  CreatePublicPetitionLink,
  CreatePublicPetitionLinkPrefillData,
  CreateStandardListDefinition,
  OrgIntegration,
  Petition,
  PetitionAccess,
  PetitionApprovalRequestStepStatus,
  PetitionAttachment,
  PetitionAttachmentType,
  PetitionContactNotification,
  PetitionContactNotificationType,
  PetitionEventType,
  PetitionField,
  PetitionFieldComment,
  PetitionFieldReply,
  PetitionFieldReplyStatus,
  PetitionFieldType,
  PetitionPermission,
  PetitionPermissionType,
  PetitionReminderType,
  PetitionSignatureCancelReason,
  PetitionSignatureRequest,
  PetitionStatus,
  PetitionUserNotificationType,
  ProfileRelationshipTypeDirection,
  PublicPetitionLink,
  StandardListDefinition,
  TemplateDefaultPermission,
  User,
} from "../__types";
import {
  CreatePetitionEvent,
  GenericPetitionEvent,
  GroupPermissionAddedEvent,
  PetitionEvent,
  ReplyCreatedEvent,
  ReplyDeletedEvent,
  ReplyStatusChangedEvent,
  ReplyUpdatedEvent,
  UserPermissionAddedEvent,
} from "../events/PetitionEvent";
import {
  BaseRepository,
  PageOpts,
  Pagination,
  TableCreateTypes,
  TableTypes,
} from "../helpers/BaseRepository";
import {
  PETITION_FILTER_REPOSITORY_HELPER,
  PetitionFilterRepositoryHelper,
} from "../helpers/PetitionFilterRepositoryHelper";
import { SortBy } from "../helpers/utils";
import { KNEX, KNEX_READ_ONLY } from "../knex";
import {
  CommentCreatedUserNotification,
  CreatePetitionUserNotification,
  GenericPetitionContactNotification,
  GenericPetitionUserNotification,
  PetitionUserNotification,
} from "../notifications";
import { FileRepository, ReadOnlyFileRepository } from "./FileRepository";

export interface PetitionVariable {
  name: string;
  default_value: number;
}

export interface PetitionCustomList {
  name: string;
  values: string[];
}

type PetitionType = "PETITION" | "TEMPLATE";

interface PetitionSharedWithFilter {
  operator: "AND" | "OR";
  filters: {
    value: string;
    operator: "SHARED_WITH" | "NOT_SHARED_WITH" | "IS_OWNER" | "NOT_IS_OWNER";
  }[];
}

type PetitionSignatureStatusFilter =
  | "NO_SIGNATURE"
  | "NOT_STARTED"
  | "PENDING_START"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

interface PetitionTagFilter {
  filters: {
    operator: "CONTAINS" | "DOES_NOT_CONTAIN" | "IS_EMPTY";
    value: number[];
  }[];
  operator: "AND" | "OR";
}

interface PetitionApprovalsFilter {
  operator: "AND" | "OR";
  filters: (
    | {
        operator: "STATUS";
        value: "WITHOUT_APPROVAL" | "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
      }
    | { operator: "ASSIGNED_TO"; value: number }
  )[];
}

export interface PetitionFilter {
  path?: string | null;
  status?: PetitionStatus[] | null;
  locale?: ContactLocale | null;
  signature?: PetitionSignatureStatusFilter[] | null;
  type?: PetitionType | null;
  tags?: PetitionTagFilter | null;
  profileIds?: number[] | null;
  sharedWith?: PetitionSharedWithFilter | null;
  fromTemplateId?: number[] | null;
  approvals?: PetitionApprovalsFilter | null;
}

type PetitionUserNotificationFilter =
  | "ALL"
  | "COMMENTS"
  | "COMPLETED"
  | "OTHER"
  | "SHARED"
  | "UNREAD";

type EffectivePetitionPermission = Pick<
  PetitionPermission,
  "petition_id" | "user_id" | "type" | "is_subscribed"
>;
export interface PetitionSignatureConfigSigner {
  firstName: string;
  lastName: string;
  email: string | null;
  isPreset?: boolean; // preset signers can only be edited on compose
  signWithDigitalCertificate?: boolean;
  signWithEmbeddedImageFileUploadId?: number;
}

export interface PetitionSignatureConfig {
  orgIntegrationId: number;
  signersInfo: PetitionSignatureConfigSigner[];
  timezone: string;
  title: string | null;
  review?: boolean;
  reviewAfterApproval?: boolean;
  allowAdditionalSigners?: boolean;
  message?: string;
  additionalSignersInfo?: PetitionSignatureConfigSigner[];
  minSigners: number;
  instructions?: string | null;
  signingMode: "PARALLEL" | "SEQUENTIAL";
  useCustomDocument?: boolean | null;
  customDocumentTemporaryFileId?: number;
  isEnabled: boolean;
}

export interface PetitionSummaryConfig {
  integration_id: number;
  prompt: { role: "system" | "user"; content: string }[];
  model: string;
  api_version: string;
}

export interface AutomaticNumberingConfig {
  numbering_type: "NUMBERS" | "LETTERS" | "ROMAN_NUMERALS";
}

type TemplateDefaultPermissionInput = {
  permissionType: PetitionPermissionType;
  isSubscribed: boolean;
} & ({ userId: number } | { userGroupId: number });

export type PetitionSignatureRequestCancelData<CancelReason extends PetitionSignatureCancelReason> =
  {
    CANCELLED_BY_USER: { user_id: number };
    DECLINED_BY_SIGNER: {
      canceller: Maybe<{ firstName: string; lastName: string; email: string }>;
      decline_reason?: string;
    };
    REQUEST_ERROR: { error: any; error_code: string; file?: string; extra?: any };
    REQUEST_RESTARTED: { petition_access_id?: number; user_id?: number }; // id of the contact or user that restarted the signature request (modify replies and finish petition)
    REQUEST_EXPIRED: {};
  }[CancelReason];

@injectable()
export class PetitionRepository extends BaseRepository {
  private readonly REPLY_EVENTS_DELAY_SECONDS = 15;
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(LOGGER) private logger: ILogger,
    @inject(PETITION_FILTER_REPOSITORY_HELPER)
    private petitionFilter: PetitionFilterRepositoryHelper,
    @inject(QUEUES_SERVICE) private queues: QueuesService,
    @inject(FileRepository) private files: FileRepository,
    @inject(PETITION_VALIDATION_SERVICE) private petitionValidation: PetitionValidationService,
    @inject(PETITION_FIELD_SERVICE) private petitionFields: PetitionFieldService,
  ) {
    super(knex);
  }

  readonly loadPetition = this.buildLoadBy("petition", "id", (q) => q.whereNull("deleted_at"));

  readonly loadField = this.buildLoadBy("petition_field", "id", (q) => q.whereNull("deleted_at"));

  readonly loadFieldReply = this.buildLoadBy("petition_field_reply", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadFieldForReply = this.buildLoader<number, PetitionField | null>(
    async (replyIds, t) => {
      const fields = await this.raw<PetitionField & { _pfr_id: number }>(
        /* sql */ `
        select pf.*, pfr.id as _pfr_id from petition_field_reply pfr
        join petition_field pf on pfr.petition_field_id = pf.id
        where pfr.id in ? and pf.deleted_at is null and pfr.deleted_at is null
      `,
        [this.sqlIn(replyIds)],
        t,
      );
      const byPfrId = indexBy(fields, (f) => f._pfr_id);
      return replyIds.map((id) => (byPfrId[id] ? omit(byPfrId[id], ["_pfr_id"]) : null));
    },
  );

  async getPetitionsForTemplateRepliesReport(
    templateId: number,
    startDate?: Maybe<Date>,
    endDate?: Maybe<Date>,
  ) {
    return await this.from("petition")
      .where({
        from_template_id: templateId,
        deleted_at: null,
        anonymized_at: null,
      })
      .whereNot("status", "DRAFT")
      .mmodify((q) => {
        if (startDate && endDate) {
          q.andWhereBetween("created_at", [startDate, endDate]);
        }
      })
      .select("*");
  }

  async userHasAccessToPetitions(
    userId: number,
    petitionIds: MaybeArray<number>,
    permissionTypes?: PetitionPermissionType[],
  ) {
    const permissions = await this.userHasAccessToPetitionsRaw(
      userId,
      unMaybeArray(petitionIds),
      permissionTypes,
    );
    return permissions.every((p) => p);
  }

  async userHasAccessToPetitionsRaw(
    userId: number,
    petitionIds: number[],
    permissionTypes?: PetitionPermissionType[],
  ) {
    const rows = await this.from("petition_permission")
      .where({ user_id: userId })
      .whereIn("petition_id", petitionIds)
      .whereNull("deleted_at")
      .whereNull("user_group_id")
      .mmodify((q) => {
        if (permissionTypes) {
          q.whereIn("type", permissionTypes);
        }
      })
      .select<{ petition_id: number }[]>(this.knex.raw(`distinct(petition_id)`));
    const ids = new Set(rows.map((r) => r.petition_id));
    return petitionIds.map((id) => ids.has(id));
  }

  async recipientHasAccessToPetition(petitionAccessId: number, petitionId: number) {
    const rows = await this.from("petition_access")
      .where({
        id: petitionAccessId,
        petition_id: petitionId,
        status: "ACTIVE",
      })
      .select("id");
    return rows.length === 1;
  }

  async userHasAccessToPetitionFieldComments(userId: number, petitionFieldCommentIds: number[]) {
    const comments = await this.loadPetitionFieldComment(petitionFieldCommentIds);
    return (
      comments.every((c) => !!c) &&
      (await this.userHasAccessToPetitions(
        userId,
        comments.map((c) => c!.petition_id),
      ))
    );
  }

  async fieldsBelongToPetition(petitionId: number, fieldIds: number[]) {
    const [{ count }] = await this.from("petition_field")
      .where({
        petition_id: petitionId,
        deleted_at: null,
      })
      .whereIn("id", fieldIds)
      .select<{ count: number }[]>(this.count());
    return count === new Set(fieldIds).size;
  }

  async fieldsHaveCommentsEnabled(fieldIds: number[]) {
    if (fieldIds.length === 0) {
      return true;
    }
    const [{ count }] = await this.from("petition_field")
      .whereIn("id", fieldIds)
      .where("has_comments_enabled", true)
      .select<{ count: number }[]>(this.count());

    return count === new Set(fieldIds).size;
  }

  async fieldsAreNotInternal(fieldIds: number[]) {
    if (fieldIds.length === 0) {
      return true;
    }
    const [{ count }] = await this.from("petition_field")
      .whereIn("id", fieldIds)
      .where("is_internal", false)
      .select<{ count: number }[]>(this.count());

    return count === new Set(fieldIds).size;
  }

  async fieldAttachmentBelongsToField(fieldId: number, attachmentIds: number[]) {
    const [{ count }] = await this.from("petition_field_attachment")
      .where({
        petition_field_id: fieldId,
        deleted_at: null,
      })
      .whereIn("id", attachmentIds)
      .select<{ count: number }[]>(this.count());
    return count === new Set(attachmentIds).size;
  }

  async petitionAttachmentBelongsToPetition(petitionId: number, attachmentIds: number[]) {
    const [{ count }] = await this.from("petition_attachment")
      .where({
        petition_id: petitionId,
        deleted_at: null,
      })
      .whereIn("id", attachmentIds)
      .select<{ count: number }[]>(this.count());
    return count === new Set(attachmentIds).size;
  }

  async accessesBelongToPetition(petitionId: number, accessIds: number[]) {
    const [{ count }] = await this.from("petition_access")
      .where({
        petition_id: petitionId,
      })
      .whereIn("id", accessIds)
      .select<{ count: number }[]>(this.count());
    return count === new Set(accessIds).size;
  }

  async messagesBelongToPetition(petitionId: number, messagesIds: number[]) {
    const [{ count }] = await this.from("petition_message")
      .where({
        petition_id: petitionId,
      })
      .whereIn("id", messagesIds)
      .select<{ count: number }[]>(this.count());
    return count === new Set(messagesIds).size;
  }

  async commentsBelongToPetition(petitionId: number, commentIds: number[]) {
    const [{ count }] = await this.from("petition_field_comment")
      .where({
        petition_id: petitionId,
      })
      .whereIn("id", commentIds)
      .whereNull("deleted_at")
      .select<{ count: number }[]>(this.count());
    return count === new Set(commentIds).size;
  }

  async repliesBelongsToField(fieldId: number, replyIds: number[]) {
    const {
      rows: [{ count }],
    } = await this.knex.raw(
      /* sql */ `
      select count(distinct pfr.id)::int as count
        from petition_field_reply as pfr
        where
          pfr.petition_field_id = ?
          and pfr.id in ?
          and pfr.deleted_at is null
    `,
      [fieldId, this.sqlIn(replyIds)],
    );
    return count === new Set(replyIds).size;
  }

  async repliesBelongsToPetition(petitionId: number, replyIds: number[]) {
    const {
      rows: [{ count }],
    } = await this.knex.raw(
      /* sql */ `
      select count(distinct pfr.id)::int as count
          from petition_field as pf
          join petition_field_reply as pfr on pfr.petition_field_id = pf.id
        where
          pf.petition_id = ?
          and pfr.id in ?
          and pf.deleted_at is null and pfr.deleted_at is null
    `,
      [petitionId, this.sqlIn(replyIds)],
    );
    return count === new Set(replyIds).size;
  }

  getPaginatedPetitionsForUser = paginationLoader<
    | Petition
    | {
        name: string;
        petition_count: number;
        min_permission: PetitionPermissionType;
        is_folder: true;
        path: string;
      },
    {
      orgId: number;
      userId: number;
      opts: {
        search?: string | null;
        searchByNameOnly?: boolean;
        excludeAnonymized?: boolean;
        excludePublicTemplates?: boolean;
        sortBy?: SortBy<
          | "name"
          | "lastUsedAt"
          | "sentAt"
          | "createdAt"
          | "lastActivityAt"
          | "lastRecipientActivityAt"
        >[];
        filters?: PetitionFilter | null;
        minEffectivePermission?: PetitionPermissionType | null;
      } & PageOpts;
    }
  >(async ({ orgId, userId, opts }, include) => {
    /**
     * The query has the following structure. Some of the parts are optional depending on wether they are necessary or not
     *
     * with _p as (
     *   ... prefilter of all petitions. if path filter is present this also includes petitions deeper in the path
     * ), ps as (
     *   ... petitions from _p that are exactly in the path, excluding deeper ones, these are candidates for "items"
     * ), fs as (
     *   ... folders to also include in the items list as come from petitions deeper in the path, more candidates for "items"
     * ), items as (
     *  ... union of ps and fs, applying order and slicing for "items"
     * ), count as (
     *  ... total count of ps and fs for "totalCount"
     * ) ... join of count as items to get all info in one query
     */

    const type = opts.filters?.type || "PETITION";
    const { search, filters } = opts;

    const builders: Knex.QueryCallbackWithArgs[] = [];
    if (search) {
      builders.push((q) => {
        if (opts.searchByNameOnly) {
          q.whereSearch("p.name", search);
        } else {
          if (type === "PETITION") {
            q.joinRaw(/* sql */ `
              left join lateral (
                select jsonb_agg(jsonb_build_object('full_name', concat(c.first_name, ' ', c.last_name), 'email', c.email)) as contacts
                from petition_access pa
                join contact c on pa.contact_id = c.id and c.deleted_at is null
                where p.id = pa.petition_id and pa.status = 'ACTIVE'
              ) c on true`);
          }
          q.where((q) => {
            q.whereSearch("p.name", search)
              .orWhere((q) => {
                q.where("p.path", "<>", "/").and.whereExists((q) =>
                  q
                    .select(this.knex.raw("1"))
                    .fromRaw(
                      /* sql */ `unnest(regexp_split_to_array(trim(both '/' from p.path), '/')) part`,
                    )
                    .whereSearch("part", search),
                );
              })
              .orWhere((q) => {
                if (type === "PETITION") {
                  q.whereExists((q) =>
                    q
                      .select(this.knex.raw("1"))
                      .fromRaw(
                        /* sql */ `jsonb_to_recordset(c.contacts) as contact(full_name text, email text)`,
                      )
                      .whereSearch("full_name", search)
                      .or.whereSearch("email", search),
                  );
                } else {
                  q.whereSearch("p.template_description", search);
                }
              });
          });
        }
      });
    }

    if (filters) {
      this.petitionFilter.applyPetitionFilter(builders, omit(filters, ["path"]), type);
      if (isNonNullish(filters.path)) {
        builders.push((q) => q.whereRaw(/* sql */ `starts_with(p.path, ?)`, [filters.path]));
      }
    }

    if (opts.excludeAnonymized) {
      builders.push((q) => {
        q.whereNull("p.anonymized_at");
      });
    }

    if (opts.excludePublicTemplates) {
      builders.push((q) => q.where("p.template_public", false));
    }

    if (isNonNullish(opts.minEffectivePermission)) {
      builders.push((q) =>
        q.whereRaw(
          "pp.effective_permission <= ?::petition_permission_type",
          opts.minEffectivePermission,
        ),
      );
    }

    const needsLastUsedAt =
      opts.sortBy?.some((s) => s.field === "lastUsedAt") && type === "TEMPLATE";
    const needsSentAt = opts.sortBy?.some((s) => s.field === "sentAt") && type === "PETITION";

    let query = this.knex
      .with(
        "_p",
        this.knex
          .fromRaw("petition as p")
          .joinRaw(
            /* sql */ `
            join (
              select pp.petition_id, min(pp.type) as effective_permission
              from petition_permission pp
                where pp.user_id = ? 
                and pp.deleted_at is null
              group by pp.petition_id
            ) pp on pp.petition_id = p.id`,
            [userId],
          )
          .where("p.org_id", orgId)
          .whereNull("p.deleted_at")
          .where("p.is_template", type === "TEMPLATE")
          .modify(function (q) {
            builders.forEach((b) => b.call(this, q));
            if (needsSentAt) {
              q.joinRaw(
                /* sql */ `left join lateral(select min(coalesce(pm.scheduled_at, pm.created_at)) as sent_at from petition_message pm where pm.petition_id = p.id) pm on true`,
              );
            }
            if (needsLastUsedAt) {
              q.joinRaw(
                /* sql */ `left join lateral (select max(plua.created_at) as last_used_at from petition plua where plua.from_template_id = p.id and plua.deleted_at is null and plua.created_by = ?) plua on true`,
                [`User:${userId}`],
              );
            }
          })
          .select(
            "p.*",
            "pp.effective_permission",
            needsSentAt ? "pm.sent_at" : this.knex.raw(/* sql */ `null::timestamptz as sent_at`),
            needsLastUsedAt
              ? this.knex.raw(/* sql */ `greatest(plua.last_used_at, p.created_at) as last_used_at`)
              : this.knex.raw(/* sql */ `null::timestamptz as last_used_at`),
          ),
      )
      .with(
        "ps",
        this.knex
          .from("_p")
          .modify(function (q) {
            if (filters?.path) {
              q.where("_p.path", filters.path);
            }
          })
          .select("_p.*"),
      );

    if (isNonNullish(filters?.path)) {
      query = query.with(
        "fs",
        this.knex
          .from("_p")
          .whereNot("_p.path", filters.path)
          .select(
            this.knex.raw(/* sql */ `get_folder_after_prefix(_p.path, ?) as _name`, [
              filters!.path!,
            ]),
            this.count("petition_count"),
            this.knex.raw(/* sql */ `max(_p.effective_permission) as min_permission`),
          )
          .groupBy("_name"),
      );
    }

    if (include.totalCount) {
      query = query.with(
        "count",
        isNonNullish(filters?.path)
          ? this.knex.select(
              this.knex.raw(/* sql */ `? + ? as total_count`, [
                this.knex.from("ps").select(this.count()),
                this.knex.from("fs").select(this.count()),
              ]),
            )
          : this.knex.from("ps").select(this.count("total_count")),
      );
    } else {
      query = query.with("count", this.knex.raw(/* sql */ `select null::int as total_count`));
    }

    const applyOrderBy: Knex.QueryCallbackWithArgs = (q) => {
      for (const { field: column, order } of opts.sortBy ?? []) {
        const reverse = order === "asc" ? "desc" : "asc";
        if (column === "lastUsedAt") {
          q.orderByRaw(`is_folder ${order}, last_used_at ${order}`);
        } else if (column === "sentAt") {
          q.orderByRaw(
            `is_folder ${order}, sent_at ${order}, status asc, created_at ${order}, _name ${reverse}`,
          );
        } else if (column === "createdAt") {
          q.orderByRaw(`is_folder ${order}, created_at ${order}`);
        } else if (column === "name") {
          q.orderBy(`_name`, order);
        } else if (column === "lastActivityAt") {
          q.orderBy("last_activity_at", order);
        } else if (column === "lastRecipientActivityAt") {
          q.orderBy("last_recipient_activity_at", order);
        }
      }
      // default ordering to avoid ambiguity
      q.orderBy("id");
    };

    if (include.items) {
      query = query.with(
        "items",
        this.knex
          .from("ps")
          .select(
            this.knex.raw(/* sql */ `false as is_folder`),
            "ps.*", // petition.*, effective_permission, sent_at, last_used_at
            this.knex.raw(/* sql */ `null::varchar(255) as _name`),
            this.knex.raw(/* sql */ `null::int as petition_count`),
            this.knex.raw(/* sql */ `null::petition_permission_type as min_permission`),
          )
          .modify((q) => {
            if (isNonNullish(filters?.path)) {
              q.unionAll([
                this.knex
                  .from("fs") // join with any petition so both parts of the union have the same columns.
                  // The value from those columns will be discarded afterwards
                  .joinRaw(/* sql */ `join (select * from _p limit 1) paux on true`)
                  .select(
                    this.knex.raw(/* sql */ `true as is_folder`),
                    "paux.*", // petition_.*, effective_permission, sent_at, last_used_at
                    "fs._name",
                    "fs.petition_count",
                    "fs.min_permission",
                  ),
              ]);
            }
          })
          .modify(applyOrderBy)
          .offset(opts.offset ?? 0)
          .limit(opts.limit ?? 0),
      );
    }

    query = query.from("count");

    if (include.items) {
      query = query.leftJoin("items", this.knex.raw(`true`)).modify(applyOrderBy);
    }

    const [e, items] = await withError(
      query as Knex.QueryBuilder<
        any,
        (Petition & {
          total_count: number | null;
          is_folder: boolean;
          petition_count: number | null;
          min_permission: PetitionPermissionType | null;
          _name: string;
        })[]
      >,
    );
    if (e) {
      throw e;
    }

    const result: any = {};

    if (include.totalCount) {
      result.totalCount = items[0].total_count!;
    }
    if (include.items) {
      result.items = items
        .filter((i) => isNonNullish(i.id))
        .map((i) =>
          i.is_folder
            ? {
                name: i._name,
                petition_count: i.petition_count!,
                min_permission: i.min_permission!,
                is_folder: true as const,
                path: `${filters!.path}${i._name}/`,
              }
            : omit(i, ["total_count", "_name", "petition_count", "is_folder", "min_permission"]),
        );
    }
    return result;
  });

  getPaginatedPetitionsByProfileId(
    orgId: number,
    profileId: number,
    opts: {
      filters?: Pick<PetitionFilter, "fromTemplateId"> | null;
    } & PageOpts,
  ): Pagination<Petition> {
    const { filters } = opts;

    const builders: Knex.QueryCallbackWithArgs[] = [
      (q) =>
        q
          .joinRaw(
            /* sql */ `join petition_profile pp3 on pp3.petition_id = p.id and pp3.profile_id = ?`,
            [profileId],
          )
          .where("p.org_id", orgId)
          .whereNull("p.deleted_at")
          .whereNull("p.anonymized_at")
          .where("p.is_template", false),
    ];

    if (filters?.fromTemplateId && filters.fromTemplateId.length > 0) {
      builders.push((q) => q.whereIn("p.from_template_id", filters.fromTemplateId!));
    }

    const countPromise = LazyPromise.from(async () => {
      const [[{ count: totalCount }]] = await Promise.all([
        this.knex
          .with(
            "ps",
            this.knex
              .fromRaw("petition as p")
              .modify(function (q) {
                builders.forEach((b) => b.call(this, q));
              })
              .select(this.knex.raw(/* sql */ `distinct p.id`)),
          )
          .from("ps")
          .select<[{ count: number }]>(this.count()),
      ]);
      return { totalCount };
    });

    return {
      totalCount: LazyPromise.from(async () => {
        const { totalCount } = await countPromise;
        return totalCount;
      }),
      items: LazyPromise.from(async () => {
        const { totalCount } = await countPromise;
        if (totalCount === 0) {
          return [];
        }

        const petitionsQuery = this.knex
          .fromRaw("petition as p")
          .modify(function (q) {
            builders.forEach((b) => b.call(this, q));
            q.orderBy("p.id", "desc");
          })
          .select("p.*");

        const items: Petition[] = await petitionsQuery
          .clone()
          .offset(opts.offset ?? 0)
          .limit(opts.limit ?? 0);

        return items;
      }),
    };
  }

  readonly loadAllFieldsByPetitionId = this.buildLoadMultipleBy(
    "petition_field",
    "petition_id",
    (q) => q.whereNull("deleted_at"),
  );

  readonly loadFieldsForPetition = this.buildLoadMultipleBy("petition_field", "petition_id", (q) =>
    q.whereNull("deleted_at").whereNull("parent_petition_field_id").orderBy("position"),
  );

  readonly loadFieldCountForPetition = this.buildLoadCountBy("petition_field", "petition_id", (q) =>
    q.whereNull("deleted_at").whereNull("parent_petition_field_id"),
  );

  readonly loadPetitionProgress = this.buildLoader<
    number,
    {
      external: {
        approved: number;
        replied: number;
        optional: number;
        total: number;
      };
      internal: {
        approved: number;
        replied: number;
        optional: number;
        total: number;
      };
    }
  >(async (petitionIds) => {
    const composedPetitions = await this.getComposedPetitionFieldsAndVariables(
      petitionIds as number[],
    );

    return composedPetitions.map((petition) => {
      const visibleFields = applyFieldVisibility(petition).filter((f) => f.type !== "HEADING");

      const visibleExternalFields = visibleFields
        .flatMap((f) => {
          if (f.type === "FIELD_GROUP") {
            return f.replies.flatMap((reply) =>
              reply
                .children!.filter((childReply) => !childReply.field.is_internal)
                .map((childReply) => ({
                  ...childReply.field,
                  children: [],
                  replies: childReply.replies.map((r) => ({ ...r, children: [] })),
                })),
            );
          } else {
            return [f];
          }
        })
        .filter((f) => !f.is_internal);

      const visibleInternalFields = visibleFields
        .flatMap((f) => {
          if (f.type === "FIELD_GROUP") {
            return f.replies.flatMap((reply) =>
              reply
                .children!.filter((childReply) => childReply.field.is_internal)
                .map((childReply) => ({
                  ...childReply.field,
                  children: [],
                  replies: childReply.replies.map((r) => ({ ...r, children: [] })),
                })),
            );
          } else {
            return [f];
          }
        })
        .filter((f) => f.is_internal);

      const validatedExternal = visibleExternalFields.filter(
        (f) => f.replies.length > 0 && f.replies.every((r) => r.status === "APPROVED"),
      ).length;

      const validatedInternal = visibleInternalFields.filter(
        (f) => f.replies.length > 0 && f.replies.every((r) => r.status === "APPROVED"),
      ).length;

      return {
        external: {
          approved: validatedExternal,
          replied: visibleExternalFields.filter(
            (f) =>
              completedFieldReplies(f).length > 0 &&
              f.replies.some((r) => r.status === "PENDING" || r.status === "REJECTED"),
          ).length,
          optional: visibleExternalFields.filter(
            (f) => f.optional && completedFieldReplies(f).length === 0,
          ).length,
          total: visibleExternalFields.length,
        },
        internal: {
          validated: validatedInternal,
          approved: validatedInternal,
          replied: visibleInternalFields.filter(
            (f) =>
              completedFieldReplies(f).length > 0 &&
              f.replies.some((r) => r.status === "PENDING" || r.status === "REJECTED"),
          ).length,
          optional: visibleInternalFields.filter(
            (f) => f.optional && completedFieldReplies(f).length === 0,
          ).length,
          total: visibleInternalFields.length,
        },
      };
    });
  });

  readonly loadPublicPetitionProgress = this.buildLoader<
    number,
    {
      replied: number;
      optional: number;
      total: number;
    }
  >(async (petitionIds) => {
    const composedPetitions = await this.getComposedPetitionFieldsAndVariables(
      petitionIds as number[],
    );

    return composedPetitions.map((petition) => {
      const visibleFields = applyFieldVisibility(petition)
        .filter((f) => f.type !== "HEADING")
        .filter((f) => !f.is_internal)
        .flatMap((f) => {
          if (f.type === "FIELD_GROUP") {
            return f.replies.flatMap((reply) =>
              reply
                .children!.filter((childReply) => !childReply.field.is_internal)
                .map((childReply) => ({
                  ...childReply.field,
                  children: [],
                  replies: childReply.replies.map((r) => ({ ...r, children: [] })),
                })),
            );
          } else {
            return [f];
          }
        });

      return {
        replied: visibleFields.filter((f) => completedFieldReplies(f).length > 0).length,
        optional: visibleFields.filter((f) => f.optional && completedFieldReplies(f).length === 0)
          .length,
        total: visibleFields.length,
      };
    });
  });

  readonly loadAccess = this.buildLoadBy("petition_access", "id");

  readonly loadAccessByKeycode = this.buildLoadBy("petition_access", "keycode");

  readonly loadActiveAccessByContactId = this.buildLoadMultipleBy(
    "petition_access",
    "contact_id",
    (q) => q.where("status", "ACTIVE"),
  );

  readonly loadAccessesForPetition = this.buildLoadMultipleBy(
    "petition_access",
    "petition_id",
    (q) => q.orderBy("id"),
  );

  async createAccesses(
    petitionId: number,
    data: Pick<
      CreatePetitionAccess,
      | "contact_id"
      | "next_reminder_at"
      | "reminders_active"
      | "reminders_config"
      | "reminders_left"
      | "automatic_reminders_left"
      | "delegate_granter_id"
    >[],
    user: User,
    fromPublicPetitionLink: boolean,
    t?: Knex.Transaction,
  ) {
    const rows =
      data.length === 0
        ? []
        : await this.insert(
            "petition_access",
            data.map((item) => ({
              ...item,
              petition_id: petitionId,
              granter_id: user.id,
              keycode: random(16),
              status: "ACTIVE",
              created_by: `User:${item.delegate_granter_id ?? user.id}`,
              updated_by: `User:${item.delegate_granter_id ?? user.id}`,
            })),
            t,
          );
    fromPublicPetitionLink
      ? await this.createEvent(
          rows.map((access) => ({
            type: "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK" as const,
            petition_id: petitionId,
            data: {
              petition_access_id: access.id,
            },
          })),
          t,
        )
      : await this.createEvent(
          rows.map((access) => ({
            type: "ACCESS_ACTIVATED",
            petition_id: petitionId,
            data: {
              petition_access_id: access.id,
              user_id: user.id,
            },
          })),

          t,
        );

    return rows;
  }

  async createContactlessAccess(
    petitionId: number,
    remindersConfig: Maybe<PetitionAccessReminderConfig>,
    user: User,
  ) {
    const [access] = await this.insert("petition_access", {
      petition_id: petitionId,
      granter_id: user.id,
      contact_id: null,
      keycode: random(16),
      reminders_left: 10,
      automatic_reminders_left: Math.min(remindersConfig?.limit ?? 0, 10),
      reminders_active: isNonNullish(remindersConfig),
      reminders_config: remindersConfig,
      next_reminder_at: null, // will be set once this access is linked to a specific contact
      status: "ACTIVE",
      is_shared_by_link: true,
      created_by: `User:${user.id}`,
      updated_by: `User:${user.id}`,
    }).returning("*");

    return access;
  }

  readonly loadContactlessAccessByPetitionId = this.buildLoadBy(
    "petition_access",
    "petition_id",
    (q) => q.where({ status: "ACTIVE", contact_id: null }),
  );

  async createAccessFromRecipient(
    petitionId: number,
    granterId: number,
    contactId: number,
    recipient: Contact,
  ) {
    const [access] = await this.insert("petition_access", {
      petition_id: petitionId,
      granter_id: granterId,
      contact_id: contactId,
      keycode: random(16),
      reminders_left: 10,
      automatic_reminders_left: 0, // no automatic reminders when delegating access
      status: "ACTIVE",
      delegator_contact_id: recipient.id,
      created_by: `Contact:${recipient.id}`,
      updated_by: `Contact:${recipient.id}`,
    }).returning("*");

    return access;
  }

  readonly loadMessage = this.buildLoadBy("petition_message", "id");

  readonly loadMessageByEmailLogId = this.buildLoadBy("petition_message", "email_log_id");

  readonly loadMessagesByPetitionAccessId = this.buildLoadMultipleBy(
    "petition_message",
    "petition_access_id",
    (q) => q.orderBy("created_at", "asc"),
  );

  readonly loadMessagesByPetitionId = this.buildLoadMultipleBy(
    "petition_message",
    "petition_id",
    (q) => q.orderBy("created_at", "asc"),
  );

  async createMessages(
    petitionId: number,
    scheduledAt: Date | null,
    data: Pick<
      CreatePetitionMessage,
      "status" | "petition_access_id" | "email_subject" | "email_body"
    >[],
    user: User,
    t?: Knex.Transaction,
  ) {
    const rows =
      data.length === 0
        ? []
        : await this.insert(
            "petition_message",
            data.map((item) => ({
              ...item,
              email_subject: item.email_subject?.slice(0, 255),
              scheduled_at: scheduledAt,
              petition_id: petitionId,
              sender_id: user.id,
              created_by: `User:${user.id}`,
            })),
            t,
          );

    if (scheduledAt) {
      await this.createEvent(
        rows.map((message) => ({
          type: "MESSAGE_SCHEDULED",
          petition_id: petitionId,
          data: {
            petition_message_id: message.id,
          },
        })),
        t,
      );
    }

    return rows;
  }

  async cancelScheduledMessage(petitionId: number, messageId: number, user: User) {
    const [[row]] = await Promise.all([
      this.from("petition_message").where({ id: messageId, status: "SCHEDULED" }).update(
        {
          status: "CANCELLED",
        },
        "*",
      ),
      this.createEvent({
        type: "MESSAGE_CANCELLED",
        petition_id: petitionId,
        data: {
          petition_message_id: messageId,
          user_id: user.id,
          reason: "CANCELLED_BY_USER",
        },
      }),
    ]);
    return row ?? null;
  }

  async cancelScheduledMessagesByAccessIds(
    accessIds: number[],
    userId?: number,
    t?: Knex.Transaction,
  ) {
    const messages = await this.from("petition_message", t)
      .whereIn("petition_access_id", accessIds)
      .where("status", "SCHEDULED")
      .update(
        {
          status: "CANCELLED",
        },
        "*",
      );

    await this.createEvent(
      messages.map((message) => ({
        type: "MESSAGE_CANCELLED" as const,
        petition_id: message.petition_id,
        data: {
          petition_message_id: message.id,
          user_id: userId,
          reason: (isNonNullish(userId) ? "CANCELLED_BY_USER" : "EMAIL_BOUNCED") as any,
        },
      })),
      t,
    );

    return messages;
  }

  async deactivateAccesses(
    petitionId: number,
    accessIds: number[],
    updatedBy: string,
    userId?: number,
    t?: Knex.Transaction,
  ) {
    const [accesses] = await Promise.all([
      this.from("petition_access", t).whereIn("id", accessIds).where("status", "ACTIVE").update(
        {
          reminders_active: false,
          next_reminder_at: null,
          status: "INACTIVE",
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      ),
      this.cancelScheduledMessagesByAccessIds(accessIds, userId, t),
    ]);

    await this.createEvent(
      accesses.map((access) => ({
        type: "ACCESS_DEACTIVATED" as const,
        petition_id: petitionId,
        data: {
          petition_access_id: access.id,
          user_id: userId,
          reason: isNonNullish(userId) ? "DEACTIVATED_BY_USER" : "EMAIL_BOUNCED",
        },
      })),
      t,
    );
  }

  private async anonymizeAccesses(
    petitionId: number,
    accessIds: number[],
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const [accesses] = await Promise.all([
      this.from("petition_access", t).whereIn("id", accessIds).where("status", "ACTIVE").update(
        {
          reminders_active: false,
          next_reminder_at: null,
          status: "INACTIVE",
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      ),
      this.cancelScheduledMessagesByAccessIds(accessIds, undefined, t),
    ]);

    await this.createEvent(
      accesses.map((access) => ({
        type: "ACCESS_DEACTIVATED" as const,
        petition_id: petitionId,
        data: {
          petition_access_id: access.id,
          reason: "PETITION_ANONYMIZED",
        },
      })),
      t,
    );
  }

  async reactivateAccesses(petitionId: number, accessIds: number[], user: User) {
    const accesses = await this.from("petition_access")
      .whereIn("id", accessIds)
      .where("status", "INACTIVE")
      .update(
        {
          status: "ACTIVE",
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*",
      );
    await this.createEvent(
      accesses.map((access) => ({
        type: "ACCESS_ACTIVATED",
        petition_id: petitionId,
        data: {
          petition_access_id: access.id,
          user_id: user.id,
        },
      })),
    );
  }

  async addContactToPetitionAccess(
    access: PetitionAccess,
    contactId: number,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    return await this.from("petition_access", t)
      .where("id", access.id)
      .where("status", "ACTIVE")
      .whereNull("contact_id")
      .update(
        {
          contact_id: contactId,
          next_reminder_at: isNonNullish(access.reminders_config)
            ? calculateNextReminder(new Date(), access.reminders_config)
            : null,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );
  }

  async updatePetitionAccessNextReminder(accessId: number, nextReminderAt: Date | null) {
    const [row] = await this.from("petition_access")
      .where("id", accessId)
      .update({ next_reminder_at: nextReminderAt }, "*");
    return row;
  }

  async processPetitionMessage(messageId: number, emailLogId: number) {
    const [row] = await this.from("petition_message").where("id", messageId).update(
      {
        status: "PROCESSED",
        email_log_id: emailLogId,
      },
      "*",
    );
    return row;
  }

  async createPetitionFromId(
    petitionId: number,
    {
      name,
      isTemplate,
      creditsUsed,
    }: { name?: Maybe<string>; isTemplate: boolean; creditsUsed?: number },
    user: User,
  ) {
    const original = (await this.loadPetition(petitionId))!;

    const isCreatingFromSameOrgTemplate = original.is_template && original.org_id === user.org_id;

    const defaultPermissions = await this.loadTemplateDefaultPermissions(original.id);

    const hasCustomOwner =
      isCreatingFromSameOrgTemplate &&
      (defaultPermissions.find((p) => p.type === "OWNER")?.user_id ?? user.id) !== user.id;

    const petition = await this.clonePetition(
      petitionId,
      user,
      {
        is_template: isTemplate,
        status: isTemplate ? null : "DRAFT",
        name: original.is_template && !isTemplate ? name : original.name,
        credits_used: creditsUsed ?? 0,
      },
      { insertPermissions: !hasCustomOwner },
    );

    if (hasCustomOwner && !defaultPermissions.find((p) => p.user_id === user.id)) {
      // if the template has a custom template_default_permission OWNER and no permissions set for session user,
      // we have to give them WRITE permissions
      // OWNER will be set inside createPermissionsFromTemplateDefaultPermissions
      await this.addPetitionPermissions(
        [petition.id],
        [
          {
            id: user.id,
            type: "User",
            isSubscribed: true,
            permissionType: "WRITE",
          },
        ],
        "User",
        user.id,
      );
    }

    if (isCreatingFromSameOrgTemplate) {
      await this.createPermissionsFromTemplateDefaultPermissions(
        petition.id,
        original.id,
        "User",
        user.id,
      );
    }

    if (original.is_template && !isTemplate) {
      await this.createEvent({
        type: "TEMPLATE_USED",
        petition_id: original.id,
        data: {
          new_petition_id: petition.id,
          org_id: user.org_id,
          user_id: user.id,
        },
      });
    } else if (!original.is_template) {
      await this.createEvent({
        type: "PETITION_CLONED",
        petition_id: original.id,
        data: {
          new_petition_id: petition.id,
          org_id: petition.org_id,
          user_id: user.id,
          type: petition.is_template ? "TEMPLATE" : "PETITION",
        },
      });
    }

    return petition;
  }

  async createPetition(
    data: Omit<
      TableCreateTypes["petition"],
      "org_id" | "document_organization_theme_id" | "standard_list_definition_override"
    >,
    user: User,
    skipFields?: boolean,
    t?: Knex.Transaction,
  ) {
    return await this.withTransaction(async (t) => {
      const [defaultDocumentTheme] = await this.from("organization_theme", t)
        .where({
          org_id: user.org_id,
          type: "PDF_DOCUMENT",
          is_default: true,
          deleted_at: null,
        })
        .select("*");

      const [petition] = await this.insert(
        "petition",
        {
          org_id: user.org_id,
          document_organization_theme_id: defaultDocumentTheme.id,
          status: data.is_template ? null : (data.status ?? "DRAFT"),
          variables: this.json(data.variables ?? []),
          custom_lists: this.json(data.custom_lists ?? []),
          standard_list_definition_override: this.json([]),
          ...omit(data, ["status", "variables", "custom_lists"]),
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
        },
        t,
      );

      await this.insert(
        "petition_permission",
        {
          petition_id: petition.id,
          user_id: user.id,
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
        },
        t,
      );

      if (!skipFields) {
        await this.insert(
          "petition_field",
          (["HEADING", "SHORT_TEXT"] as PetitionFieldType[]).map((type, index) => ({
            ...this.petitionFields.defaultFieldProperties(type),
            petition_id: petition.id,
            type,
            is_fixed: type === "HEADING",
            position: index,
            created_by: `User:${user.id}`,
            updated_by: `User:${user.id}`,
          })),
          t,
        );
      }

      return petition;
    }, t);
  }

  async deleteUserPermissions(
    petitionIds: number[],
    userId: number,
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    return await pMapChunk(
      petitionIds,
      async (idsChunk) =>
        await this.from("petition_permission", t)
          .whereIn("petition_id", idsChunk)
          .where({
            deleted_at: null,
            user_id: userId,
          })
          .update({
            deleted_at: this.now(),
            deleted_by: deletedBy,
          })
          .returning("*"),
      { concurrency: 1, chunkSize: 1000 },
    );
  }

  async deleteAllPermissions(petitionIds: number[], deletedBy: string, t?: Knex.Transaction) {
    return await pMapChunk(
      petitionIds,
      async (petitionIdsChunk) =>
        await this.from("petition_permission", t)
          .whereIn("petition_id", petitionIdsChunk)
          .where({
            deleted_at: null,
          })
          .update({
            deleted_at: this.now(),
            deleted_by: deletedBy,
          })
          .returning("*"),
      { concurrency: 1, chunkSize: 1000 },
    );
  }

  /**
   * Delete parallel, deactivate all accesses and cancel all scheduled messages
   */
  async deletePetition(petitionId: MaybeArray<number>, deletedBy: User, t?: Knex.Transaction) {
    const petitionIds = unMaybeArray(petitionId);
    if (petitionIds.length === 0) {
      return [];
    }
    return await this.withTransaction(async (t) => {
      return await pMapChunk(
        petitionIds,
        async (chunkIds) => {
          const accesses = await this.from("petition_access", t)
            .whereIn("petition_id", chunkIds)
            .where("status", "ACTIVE")
            .update(
              {
                status: "INACTIVE",
                updated_at: this.now(),
                updated_by: `User:${deletedBy.id}`,
              },
              "*",
            );

          const messages = await this.from("petition_message", t)
            .whereIn("petition_id", chunkIds)
            .where("status", "SCHEDULED")
            .update({ status: "CANCELLED" }, "*");

          await this.deletePetitionAttachmentByPetitionId(chunkIds, deletedBy, t);

          await this.from("petition_profile", t).whereIn("petition_id", chunkIds).delete();

          await this.createEvent(
            accesses.map((access) => ({
              type: "ACCESS_DEACTIVATED",
              petition_id: access.petition_id,
              data: {
                petition_access_id: access.id,
                user_id: deletedBy.id,
                reason: "DEACTIVATED_BY_USER",
              },
            })),
            t,
          );

          await this.createEvent(
            messages.map((message) => ({
              type: "MESSAGE_CANCELLED",
              petition_id: message.petition_id,
              data: {
                petition_message_id: message.id,
                user_id: deletedBy.id,
                reason: "CANCELLED_BY_USER",
              },
            })),
            t,
          );

          return await this.from("petition", t)
            .whereIn("id", chunkIds)
            .update({
              deleted_at: this.now(),
              deleted_by: `User:${deletedBy.id}`,
            })
            .returning("*");
        },
        { concurrency: 1, chunkSize: 1000 },
      );
    }, t);
  }

  async updatePetition(
    petitionIds: MaybeArray<number>,
    data: Partial<TableTypes["petition"]>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(petitionIds);
    if (ids.length === 0) {
      return [];
    }
    return await this.from("petition", t)
      .whereIn("id", ids)
      .update(
        {
          ...data,
          updated_at: this.now(),
          last_change_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );
  }

  async updatePetitionLastActivityDates(
    petitionId: number,
    data: Pick<Partial<TableTypes["petition"]>, "last_activity_at" | "last_recipient_activity_at">,
  ) {
    await this.from("petition")
      .where("id", petitionId)
      .where("status", "<>", "CLOSED")
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          updated_at: this.now(),
        },
        "*",
      );
  }

  async closePetitions(petitionId: MaybeArray<number>, updatedBy: string, t?: Knex.Transaction) {
    const ids = unMaybeArray(petitionId);
    if (ids.length === 0) {
      return [];
    }
    return await this.from("petition", t).whereIn("id", ids).update(
      {
        status: "CLOSED",
        closed_at: this.now(),
        updated_at: this.now(),
        updated_by: updatedBy,
        last_change_at: this.now(),
      },
      "*",
    );
  }

  private validateFieldReorder(
    allFields: TableTypes["petition_field"][],
    fieldIds: number[],
    parentFieldId: Maybe<number> = null,
  ) {
    const _fields = allFields.filter(
      (f) => f.parent_petition_field_id === parentFieldId || f.id === parentFieldId,
    );

    const [[parent], fields] = partition(_fields, (f) => f.id === parentFieldId);

    // check only valid fieldIds and not repeated
    const _fieldIds = unique(fieldIds);
    const ids = new Set(fields.map((f) => f.id));
    if (
      _fieldIds.length !== fieldIds.length ||
      _fieldIds.length !== ids.size ||
      _fieldIds.some((id) => !ids.has(id))
    ) {
      throw new Error("INVALID_PETITION_FIELD_IDS");
    }

    // check fixed positions have not moved
    const fixedPositions = fields
      .map((field, index) => [field, index] as const)
      .filter(([field]) => field.is_fixed);
    if (fixedPositions.some(([field, index]) => fieldIds.indexOf(field.id) !== index)) {
      throw new Error("INVALID_PETITION_FIELD_IDS");
    }

    // first child must not have visibility conditions after reorder
    if (isNonNullish(parent)) {
      const firstChild = fields.find((f) => f.id === fieldIds[0]);
      if (isNonNullish(firstChild?.visibility)) {
        throw new Error("FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR");
      }
      // first child of an external field must be external
      if (!parent.is_internal && firstChild?.is_internal) {
        throw new Error("FIRST_CHILD_IS_INTERNAL_ERROR");
      }
      if (firstChild?.profile_type_field_id && firstChild?.options.replyOnlyFromProfile) {
        // fields with replyOnlyFromProfile enabled are always optional.
        // This reorder would make it required, so we need to prevent it
        throw new Error("FIRST_CHILD_IS_REPLY_ONLY_FROM_PROFILE_ERROR");
      }
    }

    try {
      // check that reordered fields respect visibility conditions
      // build fields array with positions as it will be after reordering
      const reorderedFields = allFields.map((field) => {
        if (fieldIds.includes(field.id)) {
          return { ...field, position: fieldIds.indexOf(field.id) };
        }
        return field;
      });

      for (const field of reorderedFields.filter(
        (f) => isNonNullish(f.visibility) || isNonNullish(f.math),
      )) {
        if (isNonNullish(field.visibility)) {
          for (const condition of field.visibility.conditions) {
            if ("fieldId" in condition) {
              const referencedField = reorderedFields.find((f) => f.id === condition.fieldId)!;
              validateReferencingFieldsPositions(field, referencedField, reorderedFields);
            }
          }
        }

        if (isNonNullish(field.math)) {
          for (const math of field.math) {
            for (const condition of math.conditions) {
              if ("fieldId" in condition) {
                const referencedField = reorderedFields.find((f) => f.id === condition.fieldId)!;
                validateReferencingFieldsPositions(field, referencedField, reorderedFields);
              }
            }
            for (const { operand } of math.operations) {
              if (operand.type === "FIELD") {
                const referencedField = reorderedFields.find((f) => f.id === operand.fieldId)!;
                validateReferencingFieldsPositions(field, referencedField, reorderedFields);
              }
            }
          }
        }
      }
    } catch {
      throw new Error("INVALID_FIELD_CONDITIONS_ORDER");
    }
  }

  async updateFieldPositions(
    petitionId: number,
    fieldIds: number[],
    parentFieldId: Maybe<number>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    await this.withTransaction(async (t) => {
      await this.transactionLock(`reorderPetitionFields(${petitionId})`, t);
      const allFields = await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .orderBy("id", "asc")
        .select("*");

      this.validateFieldReorder(allFields, fieldIds, parentFieldId);

      const parent = isNonNullish(parentFieldId)
        ? allFields.find((f) => f.id === parentFieldId)
        : undefined;

      // [id, position]
      // filter all fields that will not change its position
      const fieldsToUpdate = pipe(
        allFields,
        filter((f) => f.parent_petition_field_id === parentFieldId),
        sortBy([(f) => f.position, "asc"]),
      )
        .map((f, i) => (fieldIds[i] === f.id ? null : [f.id, fieldIds.indexOf(f.id)]))
        .filter(isNonNullish);

      if (fieldsToUpdate.length > 0) {
        await this.raw(
          /* sql */ `
        update petition_field as pf set
          position = t.position,
          optional = (
            -- first child is always required
            case when (t.position = 0 and pf.parent_petition_field_id is not null) then false else pf.optional end
          ),
          is_internal = (
            -- children of internal field will always be internal
            case when (pf.parent_petition_field_id is not null and ?) then true else pf.is_internal end
          ),
          updated_at = NOW(),
          updated_by = ?
        from (?) as t (id, position)
        where t.id = pf.id and pf.position != t.position;
      `,
          [parent?.is_internal ?? false, updatedBy, this.sqlValues(fieldsToUpdate, ["int", "int"])],
          t,
        );
      }
    }, t);

    const [petition] = await this.from("petition", t).where("id", petitionId).update(
      {
        updated_at: this.now(),
        updated_by: updatedBy,
      },
      "*",
    );
    return petition;
  }

  async clonePetitionField(petitionId: number, fieldId: number, user: User) {
    const [field] = await this.from("petition_field").where({
      id: fieldId,
      petition_id: petitionId,
      deleted_at: null,
    });

    if (!field) {
      throw new Error("invalid fieldId: " + fieldId);
    }

    const [cloned] = await this.createPetitionFieldsAtPosition(
      petitionId,
      omit(field, [
        "id",
        "petition_id",
        "position",
        "created_at",
        "updated_at",
        "is_fixed",
        "from_petition_field_id",
        "alias",
      ]),
      field.parent_petition_field_id,
      field.position + 1,
      user,
    );

    const clonedFields = [{ originalFieldId: fieldId, cloned }];
    if (field.type === "FIELD_GROUP") {
      const children = await this.loadPetitionFieldChildren(field.id);
      if (children.length) {
        const clonedChildren = await this.createPetitionFieldsAtPosition(
          petitionId,
          children.map((child) =>
            omit(child, [
              "id",
              "petition_id",
              "position",
              "created_at",
              "updated_at",
              "is_fixed",
              "from_petition_field_id",
              "alias",
            ]),
          ),
          cloned.id,
          0,
          user,
        );

        clonedFields.push(
          ...zip(children, clonedChildren).map(([original, cloned]) => ({
            originalFieldId: original.id,
            cloned,
          })),
        );

        // if inside the cloned FIELD_GROUP exists a field with autoSearchConfig
        // and fields referenced in autoSearch are also children of the FIELD_GROUP
        // we need to update the ids of the autoSearchConfig to reference to the cloned children
        const originalChildrenIds = children.map((c) => c.id);
        const childrenForAutoSearchUpdate = await pMap(
          clonedChildren
            .filter((f) => ["BACKGROUND_CHECK", "ADVERSE_MEDIA_SEARCH"].includes(f.type))
            .filter((f) => {
              if (f.type === "BACKGROUND_CHECK") {
                const o = f.options as PetitionFieldOptions["BACKGROUND_CHECK"];
                return (
                  isNonNullish(o.autoSearchConfig) &&
                  (o.autoSearchConfig.name.some((id) => originalChildrenIds.includes(id)) ||
                    (isNonNullish(o.autoSearchConfig.date) &&
                      originalChildrenIds.includes(o.autoSearchConfig.date)) ||
                    (isNonNullish(o.autoSearchConfig.country) &&
                      originalChildrenIds.includes(o.autoSearchConfig.country)) ||
                    (isNonNullish(o.autoSearchConfig.birthCountry) &&
                      originalChildrenIds.includes(o.autoSearchConfig.birthCountry)))
                );
              } else if (f.type === "ADVERSE_MEDIA_SEARCH") {
                const o = f.options as PetitionFieldOptions["ADVERSE_MEDIA_SEARCH"];
                return (
                  isNonNullish(o.autoSearchConfig) &&
                  (o.autoSearchConfig.name?.some((id) => originalChildrenIds.includes(id)) ||
                    (isNonNullish(o.autoSearchConfig.backgroundCheck) &&
                      originalChildrenIds.includes(o.autoSearchConfig.backgroundCheck)))
                );
              } else {
                never();
              }
            }),
          async (field) => ({
            id: field.id,
            options: await this.petitionFields.mapFieldOptions(field, (type, id) => {
              assert(type === "PetitionField", "type must be PetitionField");
              return clonedFields.find((f) => f.originalFieldId === id)?.cloned.id ?? id;
            }),
          }),
        );

        if (childrenForAutoSearchUpdate.length > 0) {
          await this.raw(
            /* sql */ `
            update petition_field as pf set
              options = t.options
            from (?) as t (id, options)
            where t.id = pf.id;
          `,
            [
              this.sqlValues(
                childrenForAutoSearchUpdate.map((field) => [field.id, this.json(field.options)]),
                ["int", "jsonb"],
              ),
            ],
          );
        }
      }
    }

    // when cloning, we need to check if the fields have math conditions or operations that references to themselves.
    // if so, we need to update the cloned field math to reference to the cloned field id instead of the original field id
    const clonedFieldsForMathUpdate = clonedFields
      .filter(({ originalFieldId, cloned }) =>
        cloned.math?.some(
          (m) =>
            m.conditions.some((c) => "fieldId" in c && c.fieldId === originalFieldId) ||
            m.operations.some(
              (op) => op.operand.type === "FIELD" && op.operand.fieldId === originalFieldId,
            ),
        ),
      )
      .map(({ originalFieldId, cloned }) => ({
        id: cloned.id,
        math: mapFieldLogic({ math: cloned.math ?? null }, (fieldId) =>
          fieldId === originalFieldId ? cloned.id : fieldId,
        ).field.math,
      }));

    if (clonedFieldsForMathUpdate.length > 0) {
      const updatedFields = await this.raw<PetitionField>(
        /* sql */ `
        update petition_field as pf set
          math = t.math
        from (?) as t (id, math)
        where t.id = pf.id
        returning *;
      `,
        [
          this.sqlValues(
            clonedFieldsForMathUpdate.map((child) => [
              child.id,
              child.math ? this.json(child.math) : null,
            ]),
            ["int", "jsonb"],
          ),
        ],
      );

      const updatedCloned = updatedFields.find((f) => f.id === cloned.id);
      // if the cloned field was updated, we need to return the updated version
      if (isNonNullish(updatedCloned)) {
        return updatedCloned;
      }
    }

    return cloned;
  }

  async updatePetitionToPendingStatus(petitionId: number, updatedBy: string, t?: Knex.Transaction) {
    return await this.from("petition", t)
      .where("id", petitionId)
      .update(
        {
          status: this.knex.raw(/* sql */ `
            case status 
              when 'COMPLETED' then 'PENDING'
              when 'CLOSED' then 'PENDING'
              else status
            end`) as any,
          closed_at: null,
          updated_at: this.now(),
          updated_by: updatedBy,
          last_change_at: this.now(),
        },
        "*",
      );
  }

  async createPetitionFieldsAtPosition(
    petitionId: number,
    data: MaybeArray<
      Omit<CreatePetitionField, "petition_id" | "position" | "parent_petition_field_id">
    >,
    parentFieldId: number | null,
    position: number,
    user: User,
    t?: Knex.Transaction<any, any>,
  ) {
    const dataArr = unMaybeArray(data);
    if (dataArr.length === 0) {
      return [];
    }
    const parent = isNonNullish(parentFieldId) ? await this.loadField(parentFieldId) : null;
    const fields = await this.withTransaction(async (t) => {
      const [{ max }] = await this.from("petition_field", t)
        .where({
          petition_id: petitionId,
          parent_petition_field_id: parentFieldId,
          deleted_at: null,
        })
        .max("position");
      if (max === null) {
        position = 0;
      } else {
        position = position === -1 ? max + 1 : Math.min(max + 1, position);
      }

      await this.from("petition_field", t)
        .where({
          petition_id: petitionId,
          parent_petition_field_id: parentFieldId,
          deleted_at: null,
        })
        .where("position", ">=", position)
        .update(
          {
            position: this.knex.raw(`position + ?`, [dataArr.length]),
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
          },
          "id",
        );

      return await this.insert(
        "petition_field",
        dataArr.map((field) => ({
          ...omit(field, ["math"]),
          is_internal: parent?.is_internal ? true : field.is_internal,
          math: field.math ? this.json(field.math) : null,
          parent_petition_field_id: parentFieldId,
          petition_id: petitionId,
          position: position++,
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
        })),
        t,
      );
    }, t);

    const petition = (await this.loadPetition.raw(petitionId, t))!;
    if (!petition.is_template) {
      // insert an empty FIELD_GROUP reply for every required FIELD_GROUP field
      await this.createEmptyFieldGroupReply(
        fields.filter((f) => f.type === "FIELD_GROUP" && !f.optional).map((f) => f.id),
        {},
        user,
        t,
      );
    }

    return fields;
  }

  /**
   * deletes all replies on passed field ids and their respective child fields.
   * if parentReplyId is not null, it only deletes the replies for the field on that field group reply.
   */
  async deletePetitionFieldReplies(
    fields: { id: number; parentReplyId?: number | null }[],
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    if (fields.length === 0) {
      return;
    }

    await this.raw(
      /* sql */ `
      with fields as (
        select * from (?) as t(field_id, parent_reply_id)
      )
      update "petition_field_reply" as pfr
      set
        deleted_at = NOW(),
        deleted_by = ?
      from fields f
      join petition_field pf on (pf.id = f.field_id or pf.parent_petition_field_id = f.field_id)
      where 
        (f.parent_reply_id is null or pfr.parent_petition_field_reply_id = f.parent_reply_id)
        and pfr.petition_field_id = pf.id
        and pfr.deleted_at is null
        and pf.deleted_at is null;
    `,
      [
        this.sqlValues(
          fields.map((f) => [f.id, f.parentReplyId ?? null]),
          ["int", "int"],
        ),
        deletedBy,
      ],
      t,
    );
  }

  async deletePetitionField(petitionId: number, fieldId: number, user: User) {
    await this.withTransaction(async (t) => {
      const fields = await this.from("petition_field", t)
        .update(
          {
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          },
          ["id", "position", "parent_petition_field_id"],
        )
        .where({
          petition_id: petitionId,
          deleted_at: null,
          is_fixed: false,
        })
        .andWhere((q) => {
          q.where("id", fieldId).orWhere("parent_petition_field_id", fieldId);
        });

      const field = fields.find((f) => f.id === fieldId);

      if (!field) {
        throw new Error("Invalid petition field id");
      }

      // update position of every posterior field
      await this.from("petition_field", t)
        .update({
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
          position: this.knex.raw(`"position" - 1`) as any,
        })
        .where({
          petition_id: petitionId,
          parent_petition_field_id: field.parent_petition_field_id,
          deleted_at: null,
        })
        .where("position", ">", field.position);

      // safe-delete attachments on this field (same attachment can be linked to another field)
      await this.deletePetitionFieldAttachmentByFieldId(
        fields.map((f) => f.id),
        user,
        t,
      );

      // delete replies on the fields
      await this.deletePetitionFieldRepliesByFieldIds(
        fields.map((f) => f.id),
        `User:${user.id}`,
        t,
      );

      // delete comments on the fields and their notifications
      await this.deletePetitionFieldCommentsByFieldIds(
        petitionId,
        fields.map((f) => f.id),
        `User:${user.id}`,
        t,
      );

      // delete every relationship with this fields
      await this.deletePetitionFieldRelationshipsByFieldIds(
        petitionId,
        fields.map((f) => f.id),
        `User:${user.id}`,
        t,
      );
    });
  }

  async updatePetitionField(
    petitionId: number,
    fieldId: MaybeArray<number>,
    data: Partial<CreatePetitionField>,
    updatedBy: string,
    t?: Knex.Transaction<any, any>,
  ) {
    const fieldIds = unMaybeArray(fieldId);
    if (fieldIds.length === 0) {
      return [];
    }
    return this.withTransaction(async (t) => {
      const fields = await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .whereIn("id", fieldIds)
        .update(
          {
            ...data,
            // math is required to be explicitly casted into jsonb as it is an array object
            ...("math" in data ? { math: data.math ? this.json(data.math) : null } : {}),
            updated_at: this.now(),
            updated_by: updatedBy,
          },
          "*",
        );

      if (data.type !== undefined && fields.some((field) => field.is_fixed)) {
        throw new Error("UPDATE_FIXED_FIELD_ERROR");
      }

      return fields;
    }, t);
  }

  readonly loadRepliesForField = this.buildLoadMultipleBy(
    "petition_field_reply",
    "petition_field_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at").orderBy("id"),
  );

  async updateRemindersForPetitions(
    petitionId: MaybeArray<number>,
    nextReminderAt: Maybe<Date>,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(petitionId);
    if (ids.length === 0) {
      return [];
    }
    return await this.from("petition_access", t)
      .whereIn("petition_id", ids)
      .update({ next_reminder_at: nextReminderAt }, "*");
  }

  private async createReplyCreatedOrUpdatedEvents(
    petitionId: number,
    replies: PetitionFieldReply[],
    eventType: "REPLY_CREATED" | "REPLY_UPDATED",
    t?: Knex.Transaction,
  ) {
    const events: CreatePetitionEvent[] = replies.map((reply) => ({
      type: eventType,
      petition_id: petitionId,
      data: {
        ...(isNonNullish(reply.user_id)
          ? { user_id: reply.user_id }
          : { petition_access_id: reply.petition_access_id! }),
        petition_field_id: reply.petition_field_id,
        petition_field_reply_id: reply.id,
      },
    }));

    // delay event processing only in the case the user is creating a single text reply
    // for massive reply creation (import from profile, prefill) we don't want to delay
    const delayEvents = replies.length === 1 && !isFileTypeField(replies[0].type);
    if (delayEvents) {
      await this.createEventWithDelay(events, this.REPLY_EVENTS_DELAY_SECONDS, t);
    } else {
      await this.createEvent(events, t);
    }
  }

  async createPetitionFieldReply(
    petitionId: number,
    data: MaybeArray<CreatePetitionFieldReply>,
    createdBy: string,
  ) {
    const dataArray = unMaybeArray(data);
    if (dataArray.length === 0) {
      return [];
    }

    const fieldIds = unique(dataArray.map((d) => d.petition_field_id));
    const fields = await this.loadField(fieldIds);

    for (const fieldId of fieldIds) {
      this.loadRepliesForField.dataloader.clear(fieldId);
    }

    const replies = await this.insert(
      "petition_field_reply",
      dataArray.map((data) => ({
        ...data,
        updated_by: createdBy,
        created_by: createdBy,
      })),
    );
    const petition = (await this.loadPetition(petitionId))!;

    if (fields.some((f) => !f!.is_internal) || !petition.enable_interaction_with_recipients) {
      await this.updatePetition(
        petitionId,
        {
          status: "PENDING",
          closed_at: null,
        },
        createdBy,
      );
      // clear cache to make sure petition status is updated in next graphql calls
      this.loadPetition.dataloader.clear(petitionId);
    }

    await this.createReplyCreatedOrUpdatedEvents(petitionId, replies, "REPLY_CREATED");

    return replies;
  }

  async updatePetitionFieldRepliesContent(
    petitionId: number,
    data: { id: number; content: any; metadata?: any }[],
    updater: "User" | "PetitionAccess",
    updaterId: number,
    skipEventCreation?: boolean,
    t?: Knex.Transaction,
  ) {
    const replyIds = unique(data.map((d) => d.id));

    const [fields, oldReplies] = await Promise.all([
      this.loadFieldForReply(replyIds),
      this.loadFieldReply(replyIds),
    ]);

    const updatedBy = `${updater}:${updaterId}`;

    const replies = await this.raw<PetitionFieldReply>(
      /* sql */ `
      with input_data as (
        select * from (?) as t(reply_id, content, metadata)
      )
      update petition_field_reply pfr
      set
        content = id.content,
        metadata = pfr.metadata || id.metadata,
        status = 'PENDING',
        updated_at = NOW(),
        updated_by = ?,
        user_id = ?,
        petition_access_id = ?
      from input_data id
      where pfr.id = id.reply_id
      and pfr.deleted_at is null
      returning pfr.*;
  `,
      [
        this.sqlValues(
          data.map((d) => [d.id, JSON.stringify(d.content), JSON.stringify(d.metadata ?? {})]),
          ["int", "jsonb", "jsonb"],
        ),
        updatedBy,
        updater === "User" ? updaterId : null,
        updater === "PetitionAccess" ? updaterId : null,
      ],
      t,
    );

    const petition = (await this.loadPetition(petitionId))!;

    if (fields.some((f) => !f!.is_internal) || !petition.enable_interaction_with_recipients) {
      await this.updatePetition(
        petitionId,
        {
          status: "PENDING",
          closed_at: null,
        },
        updatedBy,
        t,
      );
      // clear cache to make sure petition status is updated in next graphql calls
      this.loadPetition.dataloader.clear(petitionId);
    }

    if (skipEventCreation) {
      return replies;
    }

    const petitionAccessIdOrUserId =
      updater === "User" ? { user_id: updaterId } : { petition_access_id: updaterId };

    await this.createOrUpdateReplyEvents(petitionId, replies, petitionAccessIdOrUserId, t);

    const events: ReplyStatusChangedEvent<true>[] = [];
    for (const reply of replies) {
      const oldReply = oldReplies.find((r) => r?.id === reply.id);
      if (oldReply && oldReply.status !== "PENDING") {
        events.push({
          type: "REPLY_STATUS_CHANGED",
          petition_id: petitionId,
          data: {
            status: "PENDING",
            petition_field_id: reply.petition_field_id,
            petition_field_reply_id: reply.id,
            ...petitionAccessIdOrUserId,
          },
        });
      }
    }

    await this.createEvent(events, t);

    return replies;
  }

  async updateAdverseMediaFieldReplyContentBySearchId(
    petitionId: number,
    replyId: number,
    searchId: string,
    content: any,
    userId: number,
    t?: Knex.Transaction,
  ) {
    const oldReply = await this.loadFieldReply(replyId);
    const [reply] = await this.raw<PetitionFieldReply | undefined>(
      /* sql */ `
      with input_data as (
        select * from (?) as t(reply_id, content)
      )
      update petition_field_reply pfr
      set
        content = id.content,
        status = 'PENDING',
        updated_at = NOW(),
        updated_by = ?
      from input_data id
      where pfr.id = id.reply_id
      and pfr.content->>'search_id' = ?
      and pfr.deleted_at is null
      returning pfr.*;
  `,
      [
        this.sqlValues([[replyId, JSON.stringify(content)]], ["int", "jsonb"]),
        `User:${userId}`,
        searchId,
      ],
      t,
    );

    if (!reply) {
      return null;
    }

    await this.updatePetition(
      petitionId,
      {
        status: "PENDING",
        closed_at: null,
      },
      `User:${userId}`,
      t,
    );

    await this.createOrUpdateReplyEvents(petitionId, [reply], { user_id: userId }, t);
    if (oldReply && oldReply.status !== "PENDING") {
      await this.createEvent(
        {
          type: "REPLY_STATUS_CHANGED",
          petition_id: petitionId,
          data: {
            status: "PENDING",
            petition_field_id: reply.petition_field_id,
            petition_field_reply_id: reply.id,
            user_id: userId,
          },
        },
        t,
      );
    }

    return reply;
  }

  async updatePetitionMetadata(petitionId: number, metadata: any) {
    const [petition] = await this.from("petition")
      .where("id", petitionId)
      .update({ metadata }, "*");

    return petition;
  }

  async updatePetitionFieldReply(
    replyId: number,
    data: Partial<PetitionFieldReply>,
    updatedBy: string,
    skipFieldCheck?: boolean,
  ) {
    if (!skipFieldCheck) {
      const field = await this.loadFieldForReply(replyId);
      if (!field) {
        throw new Error("Petition field not found");
      }
    }
    const [reply] = await this.from("petition_field_reply")
      .where("id", replyId)
      .update(
        {
          ...data,
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*",
      );
    return reply;
  }

  async deletePetitionFieldReply(replyId: number, deleter: User | PetitionAccess) {
    const isContact = "keycode" in deleter;
    const deletedBy = isContact ? `Contact:${deleter.contact_id}` : `User:${deleter.id}`;

    const reply = await this.loadFieldReply(replyId);
    const field = await this.loadField(reply!.petition_field_id);
    if (!field) {
      throw new Error("Petition field not found");
    }
    if (!reply) {
      throw new Error("Petition field reply not found");
    }

    const petition = (await this.loadPetition(field.petition_id))!;

    if (!petition.enable_interaction_with_recipients || !field.is_internal) {
      await this.updatePetition(
        field.petition_id,
        {
          status: "PENDING",
          closed_at: null,
        },
        deletedBy,
      );
      // clear cache to make sure petition status is updated in next graphql calls
      this.loadPetition.dataloader.clear(field.petition_id);
    }

    const [deletedReplies] = await Promise.all([
      this.from("petition_field_reply")
        .update({
          deleted_at: this.now(),
          deleted_by: deletedBy,
        })
        .whereNull("deleted_at")
        .where((q) => q.where("id", replyId).orWhere("parent_petition_field_reply_id", replyId))
        .returning("*"),
      this.createEventWithDelay(
        {
          type: "REPLY_DELETED",
          petition_id: field!.petition_id,
          data: {
            ...(isContact ? { petition_access_id: deleter.id } : { user_id: deleter.id }),
            petition_field_id: reply.petition_field_id,
            petition_field_reply_id: reply.id,
          },
        },
        this.REPLY_EVENTS_DELAY_SECONDS, // delay webhook notification to allow other REPLY_CREATED and REPLY_UPDATED events to arrive before
      ),
    ]);

    const fileUploadIds = deletedReplies
      .filter((r) => isFileTypeField(r.type))
      .map((r) => r.content["file_upload_id"] as number)
      .filter(isNonNullish);

    if (fileUploadIds.length > 0) {
      await this.files.deleteFileUpload(fileUploadIds, deletedBy);
    }

    return { field, reply };
  }

  /**
   * removes profile association on the petition only if there are no FIELD_GROUP replies that are associated with this profile
   */
  async safeRemovePetitionProfileAssociation(petitionId: number, profileId: number) {
    const groupReplies = await this.from("petition_field_reply")
      .whereIn(
        "petition_field_id",
        this.from("petition_field")
          .where({
            petition_id: petitionId,
            type: "FIELD_GROUP",
            deleted_at: null,
          })
          .whereNotNull("profile_type_id")
          .select("id"),
      )
      .whereNotNull("associated_profile_id")
      .whereNull("deleted_at")
      .select("associated_profile_id");

    const activeProfileIds = groupReplies.map((r) => r.associated_profile_id!);
    if (!activeProfileIds.includes(profileId)) {
      const [association] = await this.from("petition_profile")
        .where("petition_id", petitionId)
        .where("profile_id", profileId)
        .delete()
        .returning("*");
      return association;
    }

    return undefined;
  }

  async deletePetitionFieldRepliesByFieldIds(
    fieldIds: number[],
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    await this.from("petition_field_reply", t)
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      })
      .whereNull("deleted_at")
      .whereIn("petition_field_id", fieldIds);
  }

  async reopenPetition(petitionId: number, updatedBy: string, t?: Knex.Transaction) {
    await this.from("petition", t)
      .where({ id: petitionId, deleted_at: null })
      .whereIn("status", ["COMPLETED", "CLOSED"])
      .update({
        status: "PENDING",
        closed_at: null,
        updated_at: this.now(),
        updated_by: updatedBy,
        last_change_at: this.now(),
      });

    // clear cache to make sure petition status is updated in next graphql calls
    this.loadPetition.dataloader.clear(petitionId);
  }

  async updatePendingPetitionFieldRepliesStatusByPetitionId(
    petitionId: number,
    status: PetitionFieldReplyStatus,
    updater: User,
  ) {
    const fields = await this.loadAllFieldsByPetitionId(petitionId);
    // only update reply status on fields that have require_approval set to true
    const fieldIds = fields.filter((f) => f.require_approval).map((f) => f.id);

    if (fieldIds.length === 0) {
      return [];
    }

    const replies = await this.from("petition_field_reply")
      .whereIn("petition_field_id", fieldIds)
      .whereNot("type", "FIELD_GROUP")
      .andWhere("status", "PENDING")
      .andWhere("deleted_at", null)
      .update(
        {
          status,
          updated_at: this.now(),
          updated_by: `User:${updater!.id}`,
        },
        "*",
      );

    await this.createEvent(
      replies.map((reply) => ({
        type: "REPLY_STATUS_CHANGED",
        petition_id: petitionId,
        data: {
          status,
          petition_field_id: reply.petition_field_id,
          petition_field_reply_id: reply.id,
          user_id: updater.id,
        },
      })),
    );

    return replies;
  }

  async updatePetitionFieldRepliesStatus(
    replyIds: number[],
    status: PetitionFieldReplyStatus,
    updatedBy: string,
  ) {
    return await this.from("petition_field_reply").whereIn("id", replyIds).update(
      {
        status,
        updated_at: this.now(),
        updated_by: updatedBy,
      },
      "*",
    );
  }

  async updatePetitionFieldReplyStatusesByPetitionFieldId(
    petitionFieldId: number,
    status: PetitionFieldReplyStatus,
    updatedBy: string,
  ) {
    return await this.from("petition_field_reply")
      .where("petition_field_id", petitionFieldId)
      .whereNot("status", status)
      .whereNull("deleted_at")
      .update(
        {
          status,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );
  }

  async getPetitionFieldsWithReplies(petitionIds: number[]) {
    const fields = await this.raw<
      PetitionField & {
        replies: PetitionFieldReply[];
      }
    >(
      /* sql */ `
        select
            pf.*,
            coalesce(pfr_replies.replies, '[]'::jsonb) as replies
        from petition_field pf
        left join lateral (
          select jsonb_agg(pfr.* order by pfr.created_at) as replies
          from petition_field_reply pfr
          left join file_upload fu on
              pfr.type in ('FILE_UPLOAD', 'ES_TAX_DOCUMENTS', 'ID_VERIFICATION', 'DOW_JONES_KYC') and fu.upload_complete = true
              and fu.id = (pfr.content->>'file_upload_id')::int and fu.deleted_at is null
          where pfr.petition_field_id = pf.id
            and pfr.deleted_at is null
            -- if field is "file" check if upload is complete
            and (pfr.type not in ('FILE_UPLOAD', 'ES_TAX_DOCUMENTS', 'ID_VERIFICATION', 'DOW_JONES_KYC') or fu.id is not null)
        ) pfr_replies on true
        where pf.petition_id in ? and pf.deleted_at is null
      `,
      [this.sqlIn(petitionIds)],
    );

    const fieldsByPetition = pipe(
      fields,
      groupBy((f) => f.petition_id),
      mapValues((fields) => sortBy(fields, [(f) => f.position!, "asc"])),
    );
    return petitionIds.map((id) => fieldsByPetition[id] ?? []);
  }

  private async getComposedPetitionProperties(petitionIds: number[]) {
    const properties = await this.from("petition")
      .whereIn("id", petitionIds)
      .whereNull("deleted_at")
      .select(["id", "variables", "custom_lists", "automatic_numbering_config", "metadata"]);

    const propertiesByPetitionId = indexBy(properties, (p) => p.id);

    const standardLists = zip(
      petitionIds,
      await this.loadResolvedStandardListDefinitionsByPetitionId(petitionIds),
    );

    return petitionIds.map((id) => {
      const petitionProperties = propertiesByPetitionId[id];
      return {
        id,
        variables: (petitionProperties?.variables ?? []).map((v) => ({
          name: v.name,
          defaultValue: v.default_value,
        })),
        customLists: petitionProperties?.custom_lists ?? [],
        automaticNumberingConfig: petitionProperties?.automatic_numbering_config
          ? { numberingType: petitionProperties.automatic_numbering_config.numbering_type }
          : null,
        standardListDefinitions: (
          standardLists.find(([petitionId]) => petitionId === id)?.[1] ?? []
        ).map((l) => ({
          listName: l.list_name,
          values: l.values,
        })),
        metadata: petitionProperties?.metadata ?? {},
      };
    });
  }

  async getPetitionVariables(petitionIds: number[]) {
    const petitionVariables = await this.from("petition")
      .whereIn("id", petitionIds)
      .whereNull("deleted_at")
      .select(["id", "variables"]);

    const variablesByPetitionId = indexBy(petitionVariables, (v) => v.id);

    return petitionIds.map((id) => variablesByPetitionId[id]?.variables ?? []);
  }

  async getLastPetitionReplyStatusChangeEvents(petitionIds: number[]) {
    const rows = await this.raw<ReplyStatusChangedEvent & { rn: number }>(
      /* sql */ `
      with ordered_events as (
        select *,
          row_number() over (partition by "data"->>'petition_field_reply_id' order by created_at desc) as rn
        from petition_event
        where petition_id in ? and type = 'REPLY_STATUS_CHANGED'
      )
      select * from ordered_events where rn = 1;
    `,
      [this.sqlIn(petitionIds)],
    );
    return rows.map(omit(["rn"])) as ReplyStatusChangedEvent[];
  }

  async getComposedPetitionFieldsAndVariables(petitionIds: number[]) {
    const [fieldsWithRepliesByPetition, propertiesByPetition] = await Promise.all([
      this.getPetitionFieldsWithReplies(petitionIds),
      this.getComposedPetitionProperties(petitionIds),
    ]);

    return zip(fieldsWithRepliesByPetition, propertiesByPetition).map(
      ([fieldsWithReplies, petition]) => {
        const [fields, children] = partition(
          fieldsWithReplies,
          (f) => f.parent_petition_field_id === null,
        );

        return {
          ...pick(petition, [
            "id",
            "variables",
            "customLists",
            "automaticNumberingConfig",
            "standardListDefinitions",
            "metadata",
          ]),
          fields: sortBy(fields, [(f) => f.position, "asc"]).map((field) => {
            const fieldChildren =
              field.type === "FIELD_GROUP"
                ? pipe(
                    children,
                    filter((c) => c.parent_petition_field_id! === field.id),
                    sortBy([(f) => f.position, "asc"]),
                    map((child) => ({
                      ...child,
                      parent: field,
                    })),
                  )
                : [];

            const fieldReplies = field.replies.map((reply) => ({
              ...reply,
              children:
                field.type === "FIELD_GROUP"
                  ? fieldChildren.map((child) => ({
                      field: child,
                      replies: child.replies.filter(
                        (cr) => cr.parent_petition_field_reply_id === reply.id,
                      ),
                    }))
                  : null,
            }));

            return {
              ...field,
              children: field.type === "FIELD_GROUP" ? fieldChildren : null,
              replies: fieldReplies,
            };
          }),
        };
      },
    );
  }

  async processScheduledMessages() {
    return await this.from("petition_message")
      .where("status", "SCHEDULED")
      .whereNotNull("scheduled_at")
      .where("scheduled_at", "<=", this.knex.raw("CURRENT_TIMESTAMP"))
      .update({ status: "PROCESSING" }, "*");
  }

  async getAutomaticRemindableAccesses() {
    return await this.from("petition_access")
      .where("status", "ACTIVE")
      .where("reminders_active", true)
      .whereNotNull("next_reminder_at")
      .where("next_reminder_at", "<=", this.knex.raw("CURRENT_TIMESTAMP"))
      .where("reminders_left", ">", 0)
      .where("automatic_reminders_left", ">", 0);
  }

  async clonePetition(
    petitionId: number,
    owner: User,
    // never expose document_organization_theme_id as this must be fetched from the owner's organization
    data: Partial<Omit<TableTypes["petition"], "document_organization_theme_id">> = {},
    options?: {
      insertPermissions?: boolean;
      cloneReplies?: boolean;
      /** @default true */
      createEmptyFieldGroups?: boolean;
    },
    createdBy = `User:${owner.id}`,
    t?: Knex.Transaction,
  ) {
    const [sourcePetition, userPermissions] = await Promise.all([
      this.loadPetition(petitionId),
      this.loadUserPermissionsByPetitionId(petitionId),
    ]);

    if (isNullish(sourcePetition)) {
      throw new Error(`Petition:${petitionId} not found`);
    }

    return await this.withTransaction(async (t) => {
      // if cloning a petition, clone the petition from_template_id
      let fromTemplateId: Maybe<number>;
      if (data.is_template ?? sourcePetition.is_template) {
        // if we are creating a template then from_template_id is null
        fromTemplateId = null;
      } else {
        // if we are creating a petition, use the source petition id as
        // from_template_id only if it's a template. otherwise copy it.
        fromTemplateId = sourcePetition.is_template
          ? sourcePetition.id
          : sourcePetition.from_template_id;
      }

      const defaultSignatureOrgIntegration = await this.getDefaultSignatureOrgIntegration(
        owner.org_id,
        t,
      );
      const [defaultOrganizationTheme] = await this.from("organization_theme", t)
        .where({
          org_id: owner.org_id,
          type: "PDF_DOCUMENT",
          is_default: true,
          deleted_at: null,
        })
        .select("*");

      let [cloned] = await this.insert(
        "petition",
        {
          ...omit(sourcePetition, [
            "id",
            "created_at",
            "updated_at",
            "template_public",
            "from_template_id",
            "anonymized_at",
            "credits_used",
            "last_activity_at",
            "last_recipient_activity_at",
            "last_change_at",
            "summary_ai_completion_log_id",
            "latest_signature_status",
            // avoid copying deadline data if creating a template or cloning from a template
            ...(data?.is_template || sourcePetition.is_template
              ? (["deadline"] as const)
              : ([] as const)),
            // avoid copying template_description if creating a petition
            ...(sourcePetition.is_template && (data?.is_template === undefined || data?.is_template)
              ? ([] as const)
              : (["template_description"] as const)),
            // avoid copying public_metadata and custom_properties if creating from a public template
            ...(sourcePetition.is_template && sourcePetition.template_public
              ? (["public_metadata", "custom_properties"] as const)
              : ([] as const)),
          ]),
          org_id: owner.org_id,
          status: sourcePetition.is_template ? null : "DRAFT",
          created_by: createdBy,
          updated_by: createdBy,
          from_template_id: fromTemplateId,
          // if source petition is from another organization, update signatureConfig org_integration.id and empty signers array
          signature_config:
            sourcePetition.signature_config && sourcePetition.org_id !== owner.org_id
              ? defaultSignatureOrgIntegration
                ? {
                    ...sourcePetition.signature_config,
                    signersInfo: [],
                    allowAdditionalSigners: true,
                    orgIntegrationId: defaultSignatureOrgIntegration.id,
                  }
                : null // if new owner does not have a default signature integration, remove the signature config on the cloned petition
              : sourcePetition.signature_config,

          // if coming from a public template, update document_organization_theme_id to the default of user organization
          document_organization_theme_id: sourcePetition.template_public
            ? defaultOrganizationTheme.id
            : sourcePetition.document_organization_theme_id,
          path:
            sourcePetition.is_template && data?.is_template === false
              ? sourcePetition.default_path // if creating a petition from a template, use default_path
              : sourcePetition.path, // else, use path
          variables: this.json(sourcePetition.variables ?? []),
          custom_lists: this.json(sourcePetition.custom_lists ?? []),
          // copy summary config if creating a petition from a template and the template is from the same org
          summary_config:
            sourcePetition.is_template &&
            data?.is_template === false &&
            sourcePetition.org_id === owner.org_id
              ? sourcePetition.summary_config
              : null,
          standard_list_definition_override: this.json([]), // will be updated later
          approval_flow_config: sourcePetition.approval_flow_config
            ? this.json(sourcePetition.approval_flow_config)
            : null,
          ...data,
        },
        t,
      );

      // insert PETITION_CREATED events for cloned petitions
      await this.createEvent(
        {
          type: "PETITION_CREATED",
          data: { user_id: owner.id },
          petition_id: cloned.id,
        },
        t,
      );

      const columns = difference(
        [
          "id",
          "petition_id",
          "position",
          "type",
          "title",
          "description",
          "optional",
          "multiple",
          "options",
          "created_at",
          "created_by",
          "updated_at",
          "updated_by",
          "deleted_at",
          "deleted_by",
          "is_fixed",
          "visibility",
          "from_petition_field_id",
          "alias",
          "is_internal",
          "show_in_pdf",
          "has_comments_enabled",
          "show_activity_in_pdf",
          "require_approval",
          "parent_petition_field_id",
          "math",
          "profile_type_id",
          "profile_type_field_id",
        ],
        [
          "id",
          "petition_id",
          "created_at",
          "created_by",
          "updated_at",
          "updated_by",
          "deleted_at",
          "deleted_by",
          "from_petition_field_id",
          "parent_petition_field_id",
        ],
      );

      const clonedFields = await this.raw<TableTypes["petition_field"] & { from_id: number }>(
        /* sql */ `
        with all_petition_fields as (
          select *
          from petition_field
          where petition_id = :petitionId and deleted_at is null
        ),
        -- insert fields without a parent
        no_parent_petition_fields as (
          insert into petition_field(${columns.join(", ")}, petition_id, created_by, updated_by, from_petition_field_id, parent_petition_field_id)
          select ${columns.map((c) => `apf.${c}`).join(", ")},
            :newPetitionId as petition_id, :createdBy as created_by, :createdBy as updated_by, :fromPetitionFieldId as from_petition_field_id, null as parent_petition_field_id
          from all_petition_fields apf
          where apf.parent_petition_field_id is null
          returning *
        ),
        -- map ids for newly created fields
        no_parent_petition_fields_map as (
          select apf.id as old_id, nppf.id as new_id
          from all_petition_fields apf join no_parent_petition_fields nppf on apf.position = nppf.position
          where apf.parent_petition_field_id is null
        ),
        -- insert fields with a parent
        child_petition_fields as (
          insert into petition_field(${columns.join(", ")}, petition_id, created_by, updated_by, from_petition_field_id, parent_petition_field_id)
          select ${columns.map((c) => `apf.${c}`).join(", ")},
            :newPetitionId as petition_id, :createdBy as created_by, :createdBy as updated_by, :fromPetitionFieldId as from_petition_field_id, nppfm.new_id as parent_petition_field_id
          from all_petition_fields apf join no_parent_petition_fields_map nppfm on apf.parent_petition_field_id = nppfm.old_id
          where apf.parent_petition_field_id is not null
          returning *
        ),
        -- map ids for newly created fields
        child_petition_fields_map as (
          select apf.id as old_id, cpf.id as new_id
          from all_petition_fields apf join no_parent_petition_fields_map nppfm on apf.parent_petition_field_id = nppfm.old_id
          join child_petition_fields cpf on apf.position = cpf.position and cpf.parent_petition_field_id = nppfm.new_id
          where apf.parent_petition_field_id is not null
        ),
        -- clone any petition_field_group_relationship
        _pfgr as (
          insert into petition_field_group_relationship(petition_id, left_side_petition_field_id, right_side_petition_field_id, profile_relationship_type_id, direction, created_by)
          select
            :newPetitionId as petition_id,
            l_nppfm.new_id as left_side_petition_field_id,
            r_nppfm.new_id as right_side_petition_field_id,
            pfgr.profile_relationship_type_id,
            pfgr.direction,
            :createdBy as created_by
          from petition_field_group_relationship pfgr
          join no_parent_petition_fields_map l_nppfm on pfgr.left_side_petition_field_id = l_nppfm.old_id
          join no_parent_petition_fields_map r_nppfm on pfgr.right_side_petition_field_id = r_nppfm.old_id
          where pfgr.petition_id = :petitionId and pfgr.deleted_at is null
        )
        select nppf.*, nppfm.old_id as from_id from no_parent_petition_fields nppf join no_parent_petition_fields_map nppfm on nppf.id = nppfm.new_id
        union
        select cpf.*, cpfm.old_id as from_id from child_petition_fields cpf join child_petition_fields_map cpfm on cpf.id = cpfm.new_id
      `,
        {
          petitionId,
          newPetitionId: cloned.id,
          createdBy,
          fromPetitionFieldId:
            (data.is_template ?? sourcePetition.is_template)
              ? this.knex.raw(`null`)
              : sourcePetition.is_template
                ? this.knex.raw(`apf.id`)
                : this.knex.raw(`apf.from_petition_field_id`),
        },
        t,
      );

      if (!cloned.is_template && (options?.createEmptyFieldGroups ?? true)) {
        // insert an empty FIELD_GROUP reply for every required FIELD_GROUP field
        await this.createEmptyFieldGroupReply(
          clonedFields.filter((f) => f.type === "FIELD_GROUP" && !f.optional).map((f) => f.id),
          {},
          owner,
          t,
        );
      }

      if (options?.insertPermissions ?? true) {
        // copy permissions
        await this.insert(
          "petition_permission",
          {
            petition_id: cloned.id,
            user_id: owner.id,
            type: "OWNER",
            // if cloning a petition clone, the is_subscribed from the original
            is_subscribed: sourcePetition.is_template
              ? true
              : (userPermissions.find((p) => p.user_id === owner.id)?.is_subscribed ?? true),
            created_by: createdBy,
            updated_by: createdBy,
          },
          t,
        );
      }

      // clone tags if source petition is from same org
      if (sourcePetition.org_id === owner.org_id) {
        await this.raw(
          /* sql */ `
            insert into petition_tag (petition_id, tag_id, created_by)
            select ?, tag_id, ? from petition_tag where petition_id = ?
          `,
          [cloned.id, createdBy, petitionId],
          t,
        );
      }

      // clone default permissions if source petition is from same org
      // and we are creating a template from another template
      if (
        sourcePetition.org_id === owner.org_id &&
        sourcePetition.is_template &&
        (data.is_template === undefined || data.is_template === true)
      ) {
        await this.raw(
          /* sql */ `
            insert into template_default_permission (
              template_id, "type", user_id, user_group_id, is_subscribed, created_by, updated_by)
            select ?, "type", user_id, user_group_id, is_subscribed, ?, ?
              from template_default_permission where template_id = ? and deleted_at is null
          `,
          [cloned.id, createdBy, createdBy, petitionId],
          t,
        );
      }

      // map[old field id] = cloned field id
      const newFieldIds = Object.fromEntries(clonedFields.map((f) => [f.from_id, f.id]));

      // on RTE texts, replace globalId placeholders with the field ids of the cloned petition
      const petitionUpdateData: Partial<Petition> = {};
      for (const [key, type] of [
        ["email_subject", "text"],
        ["email_body", "slate"],
        ["closing_email_body", "slate"],
        ["completing_message_body", "slate"],
      ] as [keyof Petition, "text" | "slate"][]) {
        if (isNonNullish(cloned[key])) {
          petitionUpdateData[key] =
            type === "text"
              ? replacePlaceholdersInText(cloned[key], (placeholder) => {
                  if (isGlobalId(placeholder, "PetitionField")) {
                    return toGlobalId("PetitionField", newFieldIds[fromGlobalId(placeholder).id]);
                  }
                  return placeholder;
                })
              : JSON.stringify(
                  replacePlaceholdersInSlate(
                    safeJsonParse(cloned[key]) as SlateNode[],
                    (placeholder) => {
                      if (isGlobalId(placeholder, "PetitionField")) {
                        return toGlobalId(
                          "PetitionField",
                          newFieldIds[fromGlobalId(placeholder).id],
                        );
                      }
                      return placeholder;
                    },
                  ),
                );
        }
      }

      const allReferencedLists: string[] = [];
      // in approval flow config logic, update referenced field IDS with new fields
      if (
        isNonNullish(cloned.approval_flow_config) &&
        cloned.approval_flow_config.some((c) => isNonNullish(c.visibility))
      ) {
        petitionUpdateData.approval_flow_config = JSON.stringify(
          cloned.approval_flow_config.map((c) => {
            const fieldLogic = c.visibility
              ? mapFieldLogic<number, number>(
                  { visibility: c.visibility },
                  (oldId) => newFieldIds[oldId],
                )
              : null;

            // accumulate list references on logic to later update standard list definitions override
            allReferencedLists.push(...(fieldLogic?.referencedLists ?? []));
            return {
              ...c,
              visibility: fieldLogic?.field.visibility ?? null,
            };
          }),
        );
      }

      // update petition if there are any changes
      if (Object.keys(petitionUpdateData).length > 0) {
        [cloned] = await this.updatePetition(cloned.id, petitionUpdateData, createdBy, t);
      }

      if (options?.cloneReplies) {
        // insert petition replies into cloned fields
        const newReplyIds = await this.clonePetitionReplies(newFieldIds, t);
        // clone some petition events into new petition
        await this.clonePetitionReplyEvents(petitionId, cloned.id, newFieldIds, newReplyIds, t);
      }

      const fieldIdUpdates = clonedFields.filter(
        (f) =>
          // update field visibility and math on cloned fields
          isNonNullish(f.visibility) ||
          isNonNullish(f.math) ||
          // update field references in autoSearchConfig to point to cloned fields
          (f.type === "BACKGROUND_CHECK" && isNonNullish(f.options.autoSearchConfig)) ||
          (f.type === "ADVERSE_MEDIA_SEARCH" && isNonNullish(f.options.autoSearchConfig)),
      );

      const profileTypesUpdates =
        // updates are only required if coming from another organization
        sourcePetition.org_id !== owner.org_id
          ? clonedFields.filter(
              (f) =>
                // update standard profile types and fields references in searchIn to ids on the user's organization
                (f.type === "PROFILE_SEARCH" && isNonNullish(f.options.searchIn)) ||
                // update linked profile types on FIELD_GROUP
                (f.type === "FIELD_GROUP" && isNonNullish(f.profile_type_id)) ||
                // update linked profile type fields in FIELD_GROUP children
                (isNonNullish(f.parent_petition_field_id) && isNonNullish(f.profile_type_field_id)),
            )
          : [];

      const allFieldUpdates = [...fieldIdUpdates, ...profileTypesUpdates];

      if (allFieldUpdates.length > 0) {
        const profileTypes =
          profileTypesUpdates.length > 0
            ? await this.from("profile_type", t)
                .whereNull("deleted_at")
                .whereNotNull("standard_type")
                .whereIn("org_id", [sourcePetition.org_id, owner.org_id])
                .select("*")
            : null;
        // map profile type ids from source org to user org
        const profileTypeIdMap =
          profileTypes?.reduce(
            (acc, type) => {
              if (type.org_id === sourcePetition.org_id) {
                const matchingType = profileTypes.find(
                  (t) => t.org_id === owner.org_id && t.standard_type === type.standard_type,
                );
                acc[type.id] = matchingType?.id ?? null;
              }
              return acc;
            },
            {} as Record<number, number | null>,
          ) ?? {};

        const profileTypeFields = profileTypes
          ? await this.from("profile_type_field", t)
              .whereNull("deleted_at")
              .whereIn(
                "profile_type_id",
                profileTypes.map((pt) => pt.id),
              )
              .select("*")
          : null;
        // map profile type field ids from source org to user org
        const profileTypeFieldIdMap =
          profileTypeFields?.reduce(
            (acc, field) => {
              const profileType = profileTypes?.find((pt) => pt.id === field.profile_type_id);
              assert(profileType, `Profile type ${field.profile_type_id} not found`);
              if (profileType.org_id === sourcePetition.org_id) {
                const matchingProfileType = profileTypes?.find(
                  (pt) =>
                    pt.org_id === owner.org_id && pt.standard_type === profileType.standard_type,
                );
                const matchingField = profileTypeFields?.find(
                  (ft) =>
                    ft.profile_type_id === matchingProfileType?.id && ft.alias === field.alias,
                );
                acc[field.id] = matchingField?.id ?? null;
              }
              return acc;
            },
            {} as Record<number, number | null>,
          ) ?? {};

        await this.raw<PetitionField>(
          /* sql */ `
          update petition_field as pf set
            visibility = t.visibility,
            math = t.math,
            options = t.options,
            profile_type_id = t.profile_type_id,
            profile_type_field_id = t.profile_type_field_id
          from (?) as t (id, visibility, math, options, profile_type_id, profile_type_field_id)
          where t.id = pf.id
          returning *;
        `,
          [
            this.sqlValues(
              await pMap(
                allFieldUpdates,
                async (field) => {
                  const {
                    field: { visibility: mappedVisibility, math: mappedMath },
                    referencedLists,
                    // map field visibility and math field IDs into new IDs
                  } = mapFieldLogic<number, number>(field, (id) => newFieldIds[id]);

                  const mappedOptions = await this.petitionFields.mapFieldOptions(
                    field,
                    (type, id) => {
                      if (type === "PetitionField") {
                        return newFieldIds[id];
                      } else if (type === "ProfileType") {
                        return sourcePetition.org_id !== owner.org_id
                          ? (profileTypeIdMap[id] ?? id)
                          : id;
                      } else if (type === "ProfileTypeField") {
                        return sourcePetition.org_id !== owner.org_id
                          ? (profileTypeFieldIdMap[id] ?? id)
                          : id;
                      }

                      return id;
                    },
                  );

                  const mappedProfileTypeId =
                    sourcePetition.org_id !== owner.org_id
                      ? isNonNullish(field.profile_type_id)
                        ? (profileTypeIdMap[field.profile_type_id] ?? null)
                        : null
                      : field.profile_type_id;

                  const mappedProfileTypeFieldId =
                    sourcePetition.org_id !== owner.org_id
                      ? isNonNullish(field.profile_type_field_id)
                        ? (profileTypeFieldIdMap[field.profile_type_field_id] ?? null)
                        : null
                      : field.profile_type_field_id;

                  allReferencedLists.push(...referencedLists);
                  return [
                    field.id,
                    mappedVisibility ? this.json(mappedVisibility) : null,
                    mappedMath ? this.json(mappedMath) : null,
                    this.json(mappedOptions),
                    mappedProfileTypeId,
                    mappedProfileTypeFieldId,
                  ];
                },
                { concurrency: 10 },
              ),
              ["int", "jsonb", "jsonb", "jsonb", "int", "int"],
            ),
          ],
          t,
        );
      }

      // after searching every place where a standard list could be referenced, update the standard list definitions override
      if (!cloned.is_template && allReferencedLists.length > 0) {
        await this.updateStandardListDefinitionOverride(cloned.id, unique(allReferencedLists), t);
      }

      if (sourcePetition.org_id !== owner.org_id) {
        const clonedFieldGroupRelationships = await this.from(
          "petition_field_group_relationship",

          t,
        )
          .where({ petition_id: cloned.id, deleted_at: null })
          .select("id", "profile_relationship_type_id");

        if (clonedFieldGroupRelationships.length > 0) {
          const relationshipTypes = await this.from("profile_relationship_type", t)
            .whereIn("org_id", [sourcePetition.org_id, owner.org_id])
            .whereNull("deleted_at")
            .select("id", "org_id", "alias");

          const relationshipTypesMap = relationshipTypes.reduce(
            (acc, type) => {
              if (type.org_id === sourcePetition.org_id) {
                const matchingType = relationshipTypes.find(
                  (t) => t.org_id === owner.org_id && t.alias === type.alias,
                );

                acc[type.id] = matchingType?.id ?? null;
              }

              return acc;
            },
            {} as Record<number, number | null>,
          );

          await this.raw(
            /* sql */ `
            update petition_field_group_relationship as pfr set
              profile_relationship_type_id = t.profile_relationship_type_id
            from (?) as t (id, profile_relationship_type_id)
            where t.id = pfr.id
            returning *;
          `,
            [
              this.sqlValues(
                clonedFieldGroupRelationships.map((r) => [
                  r.id,
                  relationshipTypesMap[r.profile_relationship_type_id] ?? null,
                ]),
                ["int", "int"],
              ),
            ],
            t,
          );
        }
      }

      if (clonedFields.length > 0) {
        // copy field attachments to new fields, making a copy of the file_upload
        await this.cloneFieldAttachments(
          clonedFields.map((f) => f.from_id),
          newFieldIds,
          t,
        );
      }

      await this.clonePetitionAttachments(petitionId, cloned.id, createdBy, t);

      if (sourcePetition.is_template && cloned.is_template) {
        await this.clonePublicPetitionLinks(petitionId, cloned.id, createdBy, t);
      }

      return cloned;
    }, t);
  }

  private async clonePetitionReplies(newFieldsMap: Record<string, number>, t?: Knex.Transaction) {
    const replies = (
      await this.loadRepliesForField(Object.keys(newFieldsMap).map((v) => parseInt(v)))
    ).flat();
    if (replies.length > 0) {
      const [fileReplies, otherReplies] = partition(replies, (r) => isFileTypeField(r.type));
      // for downloadable replies, we have to make a copy of the file_upload entry
      const newFileReplies = await pMap(fileReplies, async (r) => ({
        ...r,
        content: {
          file_upload_id: (await this.files.cloneFileUpload(r.content["file_upload_id"], t))[0].id,
        },
      }));

      const originalReplies = [...newFileReplies, ...otherReplies];
      const newReplies = await this.from("petition_field_reply", t).insert(
        originalReplies.map((r) => ({
          ...omit(r, ["id", "anonymized_at"]),
          petition_field_id: newFieldsMap[r.petition_field_id],
        })),
        "*",
      );

      return Object.fromEntries(
        zip(
          originalReplies.map((r) => r.id),
          newReplies.map((r) => r.id),
        ),
      );
    } else {
      return {};
    }
  }

  private async clonePetitionReplyEvents(
    fromPetitionId: number,
    toPetitionId: number,
    fieldsMap: Record<string, number>,
    repliesMap: Record<string, number>,
    t?: Knex.Transaction,
  ) {
    const events = (
      await this.getPetitionEventsByType(fromPetitionId, [
        "REPLY_CREATED",
        "REPLY_UPDATED",
        "REPLY_DELETED",
      ])
    ).filter(
      (e) =>
        // there could be events for fields and replies that are deleted in the original petition
        // so we need to make sure the petition_field_id and petition_field_reply_id in the events are present in the maps before inserting
        isNonNullish(fieldsMap[e.data.petition_field_id]) &&
        isNonNullish(repliesMap[e.data.petition_field_reply_id]),
    );

    if (events.length > 0) {
      await this.from("petition_event", t).insert(
        events.map((e) => ({
          data: {
            ...e.data,
            petition_field_id: fieldsMap[e.data.petition_field_id],
            petition_field_reply_id: repliesMap[e.data.petition_field_reply_id],
          },
          petition_id: toPetitionId,
          type: e.type,
          processed_at: e.created_at,
          processed_by: e.processed_by,
        })) as any[],
      );
    }
  }

  private async cloneFieldAttachments(
    fieldIds: number[],
    newIds: Record<string, number>,
    t?: Knex.Transaction,
  ) {
    const attachmentsByFieldId = (await this.loadFieldAttachmentsByFieldId(fieldIds)).flat();

    await pMap(attachmentsByFieldId, async (attachment) => {
      // for each existing attachment, clone its file_upload and insert a new field_attachment on the new field
      const [fileUploadCopy] = await this.files.cloneFileUpload(attachment.file_upload_id);
      await this.from("petition_field_attachment", t).insert({
        ...omit(attachment, ["id"]),
        file_upload_id: fileUploadCopy.id,
        petition_field_id: newIds[attachment.petition_field_id],
      });
    });
  }

  private async clonePetitionAttachments(
    fromPetitionId: number,
    toPetitionId: number,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    await this.withTransaction(async (t) => {
      const petitionAttachments = await this.loadPetitionAttachmentsByPetitionId.raw(
        fromPetitionId,
        t,
      );

      if (petitionAttachments.length === 0) {
        return;
      }

      const clonedFileUploads = await this.files.cloneFileUpload(
        petitionAttachments.map((a) => a.file_upload_id),
        t,
      );

      await this.raw(
        /* sql */ `
      with nfus as (
        select * from (?) as t(file_upload_id, new_file_upload_id)
      )
      insert into petition_attachment (petition_id, file_upload_id, type, position, created_by)
      select ?, nfus.new_file_upload_id, pa.type, pa.position, ?
      from petition_attachment pa
      join nfus on nfus.file_upload_id = pa.file_upload_id
      where pa.petition_id = ? and pa.deleted_at is null;
    `,
        [
          this.sqlValues(
            zip(
              petitionAttachments.map((a) => a.file_upload_id),
              clonedFileUploads.map((f) => f.id),
            ),
            ["int", "int"],
          ),
          toPetitionId,
          createdBy,
          fromPetitionId,
        ],
        t,
      );
    }, t);
  }

  private async clonePublicPetitionLinks(
    fromTemplateId: number,
    toTemplateId: number,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const publicLinks = await this.loadPublicPetitionLinksByTemplateId.raw(fromTemplateId, t);
    // we allow to have more than 1 public link on the same template, but always use the first one
    const publicLink = publicLinks.at(0);

    if (isNonNullish(publicLink)) {
      await retry(
        async () => {
          try {
            const randomSuffix = `-${random(4)}`;
            await this.insert(
              "public_petition_link",
              {
                template_id: toTemplateId,
                slug: publicLink.slug.slice(0, 30 - randomSuffix.length).concat(randomSuffix), // slugs should not contain more than 30 chars
                created_by: createdBy,
                ...pick(publicLink, [
                  "title",
                  "description",
                  "is_active",
                  "prefill_secret",
                  "allow_multiple_petitions",
                  "petition_name_pattern",
                ]),
              },
              t,
            );
          } catch (error) {
            if (
              error instanceof DatabaseError &&
              error.constraint === "public_petition_link__slug__unique"
            ) {
              // if slug is already taken, retry with new one
              throw error;
            } else {
              throw new StopRetryError(error);
            }
          }
        },
        { maxRetries: 5 },
      );
    }
  }

  private async getDefaultSignatureOrgIntegration(
    orgId: number,
    t?: Knex.Transaction,
  ): Promise<OrgIntegration | null> {
    const [orgIntegration] = await this.from("org_integration", t)
      .where({
        deleted_at: null,
        org_id: orgId,
        is_default: true,
        is_enabled: true,
        type: "SIGNATURE",
      })
      .select("*");

    return orgIntegration;
  }

  readonly loadReminder = this.buildLoadBy("petition_reminder", "id");

  readonly loadReminderByEmailLogId = this.buildLoadBy("petition_reminder", "email_log_id");

  readonly loadReminderCountForAccess = this.buildLoadCountBy(
    "petition_reminder",
    "petition_access_id",
  );

  readonly loadRemindersByAccessId = this.buildLoadMultipleBy(
    "petition_reminder",
    "petition_access_id",
    (q) => q.orderBy("created_at", "desc"),
  );

  async createReminders(
    type: PetitionReminderType,
    data: Omit<CreatePetitionReminder, "type" | "status">[],
  ) {
    if (data.length === 0) {
      return [];
    }
    return await this.withTransaction(async (t) => {
      const updatedAccesses = await this.from("petition_access", t)
        .whereIn("id", unique(data.map((r) => r.petition_access_id)))
        .where("reminders_left", ">", 0)
        .mmodify((q) => {
          if (type === "AUTOMATIC") {
            q.where("automatic_reminders_left", ">", 0);
          }
        })
        .update(
          {
            reminders_left: this.knex.raw(`"reminders_left" - 1`),
            automatic_reminders_left:
              type === "AUTOMATIC"
                ? this.knex.raw(`"automatic_reminders_left" - 1`)
                : this.knex.raw(`least("reminders_left" - 1, "automatic_reminders_left")`),
            // if only one automatic reminder left, deactivate automatic reminders
            next_reminder_at: this.knex.raw(/* sql */ `
            case when "automatic_reminders_left" <= 1 then null else "next_reminder_at" end
          `),
            reminders_active: this.knex.raw(/* sql */ `
            case when "automatic_reminders_left" <= 1 then false else "reminders_active" end
          `),
          },
          "*",
        );

      // make sure to only process reminders for accesses that have reminders left
      const reminders = updatedAccesses
        .map((a) => data.find((d) => d.petition_access_id === a.id))
        .filter(isNonNullish);

      if (reminders.length === 0) {
        return [];
      }

      return await this.insert(
        "petition_reminder",
        reminders.map((r) => ({
          ...r,
          type,
          status: "PROCESSING",
        })),
        t,
      ).returning("*");
    });
  }

  async processReminder(reminderId: number, emailLogId: number) {
    const [row] = await this.from("petition_reminder")
      .where("id", reminderId)
      .update({ status: "PROCESSED", email_log_id: emailLogId }, "*");
    return row;
  }

  async reminderFailed(reminderId: number) {
    const [row] = await this.from("petition_reminder")
      .where("id", reminderId)
      .update({ status: "ERROR" }, "*");
    return row;
  }

  async optOutReminders(accessIds: number[]) {
    return await this.from("petition_access").whereIn("id", accessIds).update(
      {
        reminders_active: false,
        next_reminder_at: null,
        reminders_opt_out: true,
      },
      "*",
    );
  }

  async stopAccessReminders(accessIds: number[]) {
    return await this.from("petition_access")
      .whereIn("id", accessIds)
      .update({ reminders_active: false, next_reminder_at: null }, "*");
  }

  async startAccessReminders(accessIds: number[], reminderConfig: PetitionAccessReminderConfig) {
    return await this.raw<PetitionAccess>(
      /* sql */ `
      update petition_access
      set
        reminders_active = true,
        reminders_config = ?,
        next_reminder_at = ?,
        automatic_reminders_left = least(reminders_left, ?)
      where id in ?
      returning *
    `,
      [
        this.json(reminderConfig),
        calculateNextReminder(new Date(), reminderConfig),
        reminderConfig.limit ?? 10,
        this.sqlIn(accessIds),
      ],
    );
  }

  readonly loadPetitionEventsByPetitionId = this.buildLoadMultipleBy(
    "petition_event",
    "petition_id",
  );

  readonly loadPetitionFieldReplyEvents = this.buildLoader<
    number,
    (ReplyCreatedEvent | ReplyUpdatedEvent | ReplyDeletedEvent | ReplyStatusChangedEvent)[]
  >(async (keys, t) => {
    const petitions = await this.raw<{ id: number }>(
      /* sql */ `
        select distinct pf.petition_id as id from petition_field_reply pfr
        join petition_field pf on pfr.petition_field_id = pf.id
        where pfr.id in ?
      `,
      [this.sqlIn(keys)],
      t,
    );
    const events = await this.raw<
      ReplyCreatedEvent | ReplyUpdatedEvent | ReplyDeletedEvent | ReplyStatusChangedEvent
    >(
      /* sql */ `
        select * from petition_event
        where petition_id in ?
          and type in ('REPLY_CREATED', 'REPLY_UPDATED', 'REPLY_DELETED', 'REPLY_STATUS_CHANGED')
          and data->>'petition_field_reply_id' in ?
      `,
      [this.sqlIn(petitions.map((p) => p.id)), this.sqlIn(keys)],
      t,
    );

    const byReplyId = pipe(
      events,
      groupBy((e) => e.data.petition_field_reply_id),
      mapValues(
        sort((a, b) => new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf()),
      ),
    );
    return keys.map((id) => byReplyId[id] ?? []);
  });

  getPaginatedEventsForPetition(petitionId: number, opts: PageOpts) {
    return this.getPagination<PetitionEvent>(
      this.from("petition_event")
        .where("petition_id", petitionId)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*"),
      opts,
    );
  }

  async getPetitionEventsByType<T extends PetitionEventType>(
    petitionIds: MaybeArray<number>,
    eventType: T[],
  ): Promise<GenericPetitionEvent<T>[]> {
    const ids = unMaybeArray(petitionIds);
    return pMapChunk(
      ids,
      async (chunk) => {
        return await this.from("petition_event")
          .whereIn("petition_id", chunk)
          .whereIn("type", eventType)
          .orderBy("created_at", "desc")
          .select("*");
      },
      { chunkSize: 1_000, concurrency: 1 },
    ) as any;
  }

  async getPetitionEventsForUser(
    userId: number,
    options: {
      eventTypes?: Maybe<PetitionEventType[]>;
      before?: Maybe<number>;
      limit: number;
    },
  ) {
    return await this.raw<PetitionEvent>(
      /* sql */ `
      select pe.* from user_petition_event_log upel
      join petition_event pe on upel.petition_event_id = pe.id
      where upel.user_id = ?
        ${isNonNullish(options.before) ? /* sql */ `and upel.petition_event_id < ?` : ""}
        ${isNonNullish(options.eventTypes) ? /* sql */ `and pe.type in ?` : ""}
      order by pe.id desc
      limit ${options.limit};
    `,
      [
        userId,
        ...(isNonNullish(options.before) ? [options.before] : []),
        ...(isNonNullish(options.eventTypes) ? [this.sqlIn(options.eventTypes)] : []),
      ],
    );
  }

  async attachPetitionEventsToUsers(petitionEventId: number, userIds: number[]) {
    await this.insert(
      "user_petition_event_log",
      userIds.map((userId) => ({
        petition_event_id: petitionEventId,
        user_id: userId,
      })),
    );
  }

  async shouldNotifyPetitionClosed(petitionId: number) {
    const [lastEvent] = await this.from("petition_event")
      .where("petition_id", petitionId)
      .whereIn("type", ["PETITION_CLOSED_NOTIFIED", "REPLY_CREATED"])
      .select("type", this.knex.raw("max(created_at) as created_at"))
      .groupBy("type")
      .orderBy("created_at", "desc")
      .limit(1);
    if (lastEvent?.type === "PETITION_CLOSED_NOTIFIED") {
      return false;
    }

    return true;
  }

  readonly loadPetitionEvent = this.buildLoadBy("petition_event", "id");

  async createEvent(events: MaybeArray<CreatePetitionEvent>, t?: Knex.Transaction) {
    if (Array.isArray(events) && events.length === 0) {
      return [];
    }

    const petitionEvents = await pMapChunk(
      unMaybeArray(events),
      async (chunk) => await this.insert("petition_event", chunk, t),
      { chunkSize: 100, concurrency: 1 },
    );

    await this.queues.enqueueEvents(petitionEvents, "petition_event", undefined, t);

    return petitionEvents;
  }

  async createEventWithDelay(
    events: MaybeArray<CreatePetitionEvent>,
    notifyAfter: number,
    t?: Knex.Transaction,
  ) {
    const eventsArray = unMaybeArray(events);
    if (eventsArray.length === 0) {
      return [];
    }

    const petitionEvents = await pMapChunk(
      unMaybeArray(events),
      async (chunk) => await this.insert("petition_event", chunk, t),
      { chunkSize: 100, concurrency: 1 },
    );

    await this.queues.enqueueEvents(petitionEvents, "petition_event", notifyAfter, t);

    return petitionEvents;
  }

  private async getLatestEventForPetitionId(petitionId: number) {
    const [event] = await this.raw<PetitionEvent | null>(
      /* sql */ `
      select * from petition_event where id in (
        select max(id) from petition_event where petition_id = ? 
      )`,
      [petitionId],
    );
    return event;
  }

  private async createOrUpdateReplyEvents(
    petitionId: number,
    replies: PetitionFieldReply[],
    updater: Pick<ReplyUpdatedEvent["data"], "petition_access_id" | "user_id">,
    t?: Knex.Transaction,
  ) {
    const latestEvent = await this.getLatestEventForPetitionId(petitionId);
    if (
      latestEvent &&
      (latestEvent.type === "REPLY_CREATED" || latestEvent.type === "REPLY_UPDATED") &&
      replies.find((r) => r.id === latestEvent.data.petition_field_reply_id) &&
      ((isNonNullish(updater.user_id) && latestEvent.data.user_id === updater.user_id) ||
        (isNonNullish(updater.petition_access_id) &&
          latestEvent.data.petition_access_id === updater.petition_access_id)) &&
      differenceInSeconds(new Date(), latestEvent.created_at) < this.REPLY_EVENTS_DELAY_SECONDS &&
      // if all replies are file uploads, we will create a new REPLY_UPDATED event instead of updating the REPLY_CREATED
      // this will allow document-processor to trigger requests for the new files
      !replies.every((r) => isFileTypeField(r.type))
    ) {
      const delayEvents = replies.length === 1 && !isFileTypeField(replies[0].type);
      await this.updateEvent(
        latestEvent.id,
        { created_at: new Date() },
        delayEvents ? this.REPLY_EVENTS_DELAY_SECONDS : undefined,
        t,
      );
    } else {
      await this.createReplyCreatedOrUpdatedEvents(petitionId, replies, "REPLY_UPDATED", t);
    }
  }

  async updateEvent(
    eventId: number,
    data: Partial<PetitionEvent>,
    notifyAfter?: number,
    t?: Knex.Transaction,
  ) {
    const [event] = await this.from("petition_event", t).where("id", eventId).update(data, "*");
    await this.queues.enqueueEvents(event, "petition_event", notifyAfter, t);

    return event;
  }

  async mergePetitionEventData(eventId: number, data: any) {
    await this.raw(
      /* sql */ `
      update petition_event set "data" = "data" || ? where id = ?;
    `,
      [this.json(data), eventId],
    );
  }

  readonly loadPetitionFieldCommentsForField = this.buildLoader<
    {
      loadInternalComments?: boolean;
      petitionId: number;
      petitionFieldId: number;
    },
    PetitionFieldComment[],
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_field_comment", t)
        .modify((q) => {
          if (!keys.some((k) => k.loadInternalComments)) {
            q.where({ is_internal: false, approval_metadata: null });
          }
        })
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .whereIn("petition_field_id", unique(keys.map((x) => x.petitionFieldId)))
        .whereNotNull("petition_field_id")
        .whereNull("deleted_at")
        .select<PetitionFieldComment[]>("*");

      const byId = groupBy(rows, (r) => r.petition_field_id!);
      return keys.map((id) => {
        const comments = this.sortComments(byId[id.petitionFieldId] ?? []);
        return id.loadInternalComments
          ? comments
          : comments.filter((c) => c.is_internal === false && c.approval_metadata === null);
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId", "loadInternalComments"]) },
  );

  readonly loadGeneralPetitionCommentsForPetition = this.buildLoader<
    {
      loadInternalComments?: boolean;
      petitionId: number;
    },
    PetitionFieldComment[],
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_field_comment", t)
        .modify((q) => {
          if (!keys.some((k) => k.loadInternalComments)) {
            q.where({ is_internal: false, approval_metadata: null });
          }
        })
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .whereNull("petition_field_id")
        .whereNull("deleted_at")
        .select<PetitionFieldComment[]>("*");

      const byId = groupBy(rows, (r) => r.petition_id);
      return keys.map((key) => {
        const comments = this.sortComments(byId[key.petitionId] ?? []);
        return key.loadInternalComments
          ? comments
          : comments.filter((c) => c.is_internal === false && c.approval_metadata === null);
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "loadInternalComments"]) },
  );

  readonly loadLastPetitionFieldCommentsForField = this.buildLoader<
    {
      loadInternalComments?: boolean;
      petitionId: number;
      petitionFieldId: number;
    },
    PetitionFieldComment | null,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_field_comment", t)
        .modify((q) => {
          if (keys.every((k) => k.loadInternalComments)) {
            q.distinctOn("petition_field_id").orderBy("petition_field_id");
          } else if (keys.every((k) => !k.loadInternalComments)) {
            q.where({ is_internal: false, approval_metadata: null })
              .distinctOn("petition_field_id")
              .orderBy("petition_field_id");
          } else {
            // on mixed keys we need to obtain both
            q.distinctOn("petition_field_id", "is_internal")
              .orderBy("petition_field_id")
              .orderBy("is_internal");
          }
        })
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .whereIn("petition_field_id", unique(keys.map((x) => x.petitionFieldId)))
        .whereNotNull("petition_field_id")
        .whereNull("deleted_at")
        .orderBy("petition_field_id", "desc")
        .orderBy("created_at", "desc")
        .select<PetitionFieldComment[]>("*");

      const byId = groupBy(rows, (r) => r.petition_field_id!);
      return keys.map((id) => {
        const comments = this.sortComments(byId[id.petitionFieldId] ?? []);
        return id.loadInternalComments
          ? (comments[0] ?? null)
          : (comments.filter((c) => c.is_internal === false && c.approval_metadata === null)[0] ??
              null);
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId", "loadInternalComments"]) },
  );

  readonly loadLastGeneralPetitionCommentForPetition = this.buildLoader<
    {
      loadInternalComments?: boolean;
      petitionId: number;
    },
    PetitionFieldComment | null,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_field_comment", t)
        .modify((q) => {
          if (keys.every((k) => k.loadInternalComments)) {
            q.distinctOn("petition_id").orderBy("petition_id");
          } else if (keys.every((k) => !k.loadInternalComments)) {
            q.where({ is_internal: false, approval_metadata: null })
              .distinctOn("petition_id")
              .orderBy("petition_id");
          } else {
            // on mixed keys we need to obtain both
            q.distinctOn("petition_id", "is_internal")
              .orderBy("petition_id")
              .orderBy("is_internal");
          }
        })
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .whereNull("petition_field_id")
        .whereNull("deleted_at")
        .orderBy("petition_id", "desc")
        .orderBy("created_at", "desc")
        .select<PetitionFieldComment[]>("*");

      const byId = groupBy(rows, (r) => r.petition_id);
      return keys.map((key) => {
        const comments = this.sortComments(byId[key.petitionId] ?? []);
        return key.loadInternalComments
          ? (comments[0] ?? null)
          : (comments.filter((c) => c.is_internal === false && c.approval_metadata === null)[0] ??
              null);
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "loadInternalComments"]) },
  );

  readonly loadPetitionFieldUnreadCommentCountForFieldAndAccess = this.buildLoader<
    { accessId: number; petitionId: number; petitionFieldId: number },
    number,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_contact_notification", t)
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .whereIn("petition_access_id", unique(keys.map((x) => x.accessId)))
        .whereNotNull(this.knex.raw(/* sql */ `"data" ->> 'petition_field_id'`) as any)
        .whereIn(
          this.knex.raw("(data ->> 'petition_field_id')::int") as any,
          unique(keys.map((x) => x.petitionFieldId)),
        )
        .where("type", "COMMENT_CREATED")
        .whereNull("read_at")
        .groupBy(
          "petition_id",
          "petition_access_id",
          this.knex.raw("(data ->> 'petition_field_id')::int"),
        )
        .select<
          (Pick<PetitionContactNotification, "petition_id" | "petition_access_id"> & {
            petition_field_id: number;
            unread_count: number;
          })[]
        >(
          "petition_id",
          "petition_access_id",
          this.knex.raw("(data ->> 'petition_field_id')::int as petition_field_id"),
          this.count("unread_count"),
        );

      const rowsById = indexBy(
        rows,
        keyBuilder(["petition_id", "petition_field_id", "petition_access_id"]),
      );

      return keys.map(keyBuilder(["petitionId", "petitionFieldId", "accessId"])).map((key) => {
        return rowsById[key]?.unread_count ?? 0;
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId", "accessId"]) },
  );

  readonly loadPetitionUnreadGeneralCommentCountForPetitionAndAccess = this.buildLoader<
    { accessId: number; petitionId: number },
    number,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_contact_notification", t)
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .whereIn("petition_access_id", unique(keys.map((x) => x.accessId)))
        .whereNull(this.knex.raw(/* sql */ `"data" ->> 'petition_field_id'`) as any)
        .where("type", "COMMENT_CREATED")
        .whereNull("read_at")
        .groupBy("petition_id", "petition_access_id")
        .select<
          (Pick<PetitionContactNotification, "petition_id" | "petition_access_id"> & {
            unread_count: number;
          })[]
        >("petition_id", "petition_access_id", this.count("unread_count"));

      const rowsById = indexBy(rows, keyBuilder(["petition_id", "petition_access_id"]));

      return keys.map(keyBuilder(["petitionId", "accessId"])).map((key) => {
        return rowsById[key]?.unread_count ?? 0;
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "accessId"]) },
  );

  readonly loadContactHasUnreadCommentsInPetition = this.buildLoader<
    {
      contactId: number;
      petitionId: number;
    },
    boolean,
    string
  >(
    async (keys, t) => {
      const rows = await this.raw<{ contact_id: number; petition_id: number }>(
        /* sql */ `
        select pa.contact_id, pa.petition_id from petition_access pa
        join petition_contact_notification pcn
          on pcn.petition_access_id = pa.id and pcn.petition_id = pa.petition_id
        where pa.contact_id in ? and pa.petition_id in ? and pa.status = 'ACTIVE' 
          and pcn.type = 'COMMENT_CREATED'
          and pcn.read_at is null
      `,
        [
          this.sqlIn(unique(keys.map((k) => k.contactId))),
          this.sqlIn(unique(keys.map((k) => k.petitionId))),
        ],
        t,
      );
      const byKey = indexBy(rows, keyBuilder(["contact_id", "petition_id"]));
      return keys.map(keyBuilder(["contactId", "petitionId"])).map((k) => isNonNullish(byKey[k]));
    },
    { cacheKeyFn: keyBuilder(["contactId", "petitionId"]) },
  );

  readonly loadPetitionFieldUnreadCommentCountForFieldAndUser = this.buildLoader<
    { userId: number; petitionId: number; petitionFieldId: number },
    number,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_user_notification", t)
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .whereIn("user_id", unique(keys.map((x) => x.userId)))
        .whereNotNull(this.knex.raw(/* sql */ `"data" ->> 'petition_field_id'`) as any)
        .whereIn(
          this.knex.raw("(data ->> 'petition_field_id')::int") as any,
          unique(keys.map((x) => x.petitionFieldId)),
        )
        .where("type", "COMMENT_CREATED")
        .whereNull("read_at")
        .groupBy("petition_id", "user_id", this.knex.raw("(data ->> 'petition_field_id')::int"))
        .select<
          (Pick<PetitionUserNotification, "petition_id" | "user_id"> & {
            petition_field_id: number;
            unread_count: number;
          })[]
        >(
          "petition_id",
          "user_id",
          this.knex.raw("(data ->> 'petition_field_id')::int as petition_field_id"),
          this.count("unread_count"),
        );

      const rowsById = indexBy(rows, keyBuilder(["petition_id", "petition_field_id", "user_id"]));

      return keys.map(keyBuilder(["petitionId", "petitionFieldId", "userId"])).map((key) => {
        return rowsById[key]?.unread_count ?? 0;
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId", "userId"]) },
  );

  readonly loadPetitionUnreadGeneralCommentCountForPetitionAndUser = this.buildLoader<
    { userId: number; petitionId: number },
    number,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_user_notification", t)
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .whereIn("user_id", unique(keys.map((x) => x.userId)))
        .whereNull(this.knex.raw(/* sql */ `"data" ->> 'petition_field_id'`) as any)
        .where("type", "COMMENT_CREATED")
        .whereNull("read_at")
        .groupBy("petition_id", "user_id")
        .select<
          (Pick<PetitionUserNotification, "petition_id" | "user_id"> & {
            unread_count: number;
          })[]
        >("petition_id", "user_id", this.count("unread_count"));

      const rowsById = indexBy(rows, keyBuilder(["petition_id", "user_id"]));

      return keys.map(keyBuilder(["petitionId", "userId"])).map((key) => {
        return rowsById[key]?.unread_count ?? 0;
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "userId"]) },
  );

  async canBeMentionedInPetitionFieldComment(
    orgId: number,
    userIds: number[],
    userGroupIds: number[],
  ) {
    // deleted entities can still be mentioned to avoid issues updating old comments
    // where deleted entities are deleted
    const [[{ count: userCount }], [{ count: userGroupCount }]] = await Promise.all([
      this.from("user")
        .where("org_id", orgId)
        .whereIn("id", userIds)
        .select(this.knex.raw(`count(distinct id)::int as count`)) as Promise<{ count: number }[]>,
      this.from("user_group")
        .where("org_id", orgId)
        .whereIn("id", userGroupIds)
        .select(this.knex.raw(`count(distinct id)::int as count`)) as Promise<{ count: number }[]>,
    ]);
    return userCount === new Set(userIds).size && userGroupCount === new Set(userGroupIds).size;
  }

  private sortComments(comments: PetitionFieldComment[]) {
    return comments.sort((a, b) => a.created_at.valueOf() - b.created_at.valueOf());
  }

  readonly loadPetitionFieldComment = this.buildLoadBy("petition_field_comment", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  async getUnprocessedUserNotificationsOfType<Type extends PetitionUserNotificationType>(
    type: Type,
  ) {
    return await this.knex<GenericPetitionUserNotification<Type>>("petition_user_notification")
      .where({
        processed_at: null,
        read_at: null,
        type,
      })
      .orderBy("created_at", "desc")
      .select("*");
  }

  async getUnprocessedContactNotificationsOfType<Type extends PetitionContactNotificationType>(
    type: Type,
  ) {
    return await this.knex<GenericPetitionContactNotification<Type>>(
      "petition_contact_notification",
    )
      .where({
        processed_at: null,
        read_at: null,
        type,
      })
      .orderBy("created_at", "desc")
      .select("*");
  }

  readonly loadPetitionUserNotifications = this.buildLoadBy("petition_user_notification", "id");

  readonly loadUnreadPetitionUserNotificationsIdsByUserId = this.buildLoader<number, number[]>(
    async (keys, t) => {
      const notifications = await this.from("petition_user_notification", t)
        .whereIn("user_id", keys)
        .whereNull("read_at")
        .select(["user_id", "id"])
        .orderBy("created_at", "desc");
      const byUserId = groupBy(notifications, (n) => n.user_id);
      return keys.map((k) => byUserId[k]?.map((n) => n.id) ?? []);
    },
  );

  readonly loadUnreadPetitionUserNotificationCountByUserId = this.buildLoader<number, number>(
    async (keys, t) => {
      const notifications = await this.from("petition_user_notification", t)
        .whereIn("user_id", keys)
        .whereNull("read_at")
        .groupBy("user_id")
        .select<{ user_id: number; count: number }[]>(["user_id", this.count()]);
      const byUserId = indexBy(notifications, (n) => n.user_id);
      return keys.map((k) => byUserId[k]?.count ?? 0);
    },
  );

  async markOldPetitionUserNotificationsAsRead(months: number) {
    await this.from("petition_user_notification")
      .whereNull("read_at")
      .whereRaw(/* sql */ `created_at < NOW() - make_interval(months => ?)`, [months])
      .update({
        read_at: this.now(),
        processed_at: this.now(),
      });
  }

  async deleteOldPetitionUserNotifications(months: number) {
    await this.from("petition_user_notification")
      .whereRaw(/* sql */ `created_at < NOW() - make_interval(months => ?)`, [months])
      .delete();
  }

  private filterPetitionUserNotificationQueryBuilder(
    filter?: Maybe<PetitionUserNotificationFilter>,
  ): Knex.QueryCallback<PetitionUserNotification<false>> {
    return (q) => {
      if (filter === "UNREAD") {
        q.whereNull("read_at");
      } else if (filter === "COMMENTS") {
        q.where("type", "COMMENT_CREATED");
      } else if (filter === "COMPLETED") {
        q.whereIn("type", ["PETITION_COMPLETED", "SIGNATURE_COMPLETED"]);
      } else if (filter === "SHARED") {
        q.where("type", "PETITION_SHARED");
      } else if (filter === "OTHER") {
        q.whereIn("type", [
          "MESSAGE_EMAIL_BOUNCED",
          "REMINDER_EMAIL_BOUNCED",
          "SIGNATURE_CANCELLED",
          "REMINDERS_OPT_OUT",
          "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
        ]);
      }
    };
  }

  async loadPetitionUserNotificationsByUserId(
    userId: number,
    opts: {
      limit?: Maybe<number>;
      filter?: Maybe<PetitionUserNotificationFilter>;
      before?: Maybe<Date>;
    },
  ) {
    return this.from("petition_user_notification")
      .where("user_id", userId)
      .mmodify(this.filterPetitionUserNotificationQueryBuilder(opts.filter))
      .mmodify((q) => {
        if (opts.before) {
          q.where("created_at", "<", opts.before);
        }
        q.limit(opts.limit ?? 0);
      })
      .orderBy("created_at", "desc");
  }

  async updatePetitionUserNotificationsProcessedAt(petitionUserNotificationIds: number[]) {
    return await this.from("petition_user_notification")
      .whereIn("id", petitionUserNotificationIds)
      .update({ processed_at: this.now() }, "*");
  }

  async updatePetitionContactNotificationsProcessedAt(petitionContactNotificationIds: number[]) {
    return await this.from("petition_contact_notification")
      .whereIn("id", petitionContactNotificationIds)
      .update({ processed_at: this.now() }, "*");
  }

  async updatePetitionUserNotificationsReadStatus(
    petitionUserNotificationIds: number[],
    isRead: boolean,
    userId: number,
    filter?: Maybe<PetitionUserNotificationFilter>,
  ) {
    return await pMapChunk(
      petitionUserNotificationIds,
      async (idsChunk) => {
        return await this.from("petition_user_notification")
          .whereIn("id", idsChunk)
          .where("user_id", userId)
          .mmodify((q) => {
            // to return only the updated notifications
            if (isRead) {
              q.whereNull("read_at");
            } else {
              q.whereNotNull("read_at");
            }
          })
          .mmodify(this.filterPetitionUserNotificationQueryBuilder(filter))
          .update(
            {
              read_at: isRead ? this.now() : null,
              ...(isRead ? { processed_at: this.now() } : {}),
            },
            "*",
          );
      },
      { chunkSize: 500, concurrency: 1 },
    );
  }

  async updatePetitionUserNotificationsReadStatusByPetitionId(
    petitionIds: number[],
    isRead: boolean,
    userId: number,
    filter?: Maybe<PetitionUserNotificationFilter>,
  ) {
    return await pMapChunk(
      petitionIds,
      async (idsChunk) => {
        return await this.from("petition_user_notification")
          .whereIn("petition_id", idsChunk)
          .where("user_id", userId)
          .mmodify((q) => {
            // to return only the updated notifications
            if (isRead) {
              q.whereNull("read_at");
            } else {
              q.whereNotNull("read_at");
            }
          })
          .whereNot("type", "COMMENT_CREATED")
          .mmodify(this.filterPetitionUserNotificationQueryBuilder(filter))
          .update(
            {
              read_at: isRead ? this.now() : null,
              ...(isRead ? { processed_at: this.now() } : {}),
            },
            "*",
          );
      },
      { chunkSize: 500, concurrency: 1 },
    );
  }

  async updatePetitionUserNotificationsReadStatusByCommentIds(
    petitionFieldCommentIds: number[],
    isRead: boolean,
    userId: number,
    filter?: Maybe<PetitionUserNotificationFilter>,
  ) {
    return await pMapChunk(
      petitionFieldCommentIds,
      async (idsChunk) => {
        const comments = (await this.loadPetitionFieldComment.raw(
          idsChunk,
        )) as PetitionFieldComment[];
        return await this.from("petition_user_notification")
          .where({
            user_id: userId,
            type: "COMMENT_CREATED",
          })
          .mmodify((q) => {
            // to return only the updated notifications
            if (isRead) {
              q.whereNull("read_at");
            } else {
              q.whereNotNull("read_at");
            }
          })
          .whereIn("petition_id", unique(comments.map((c) => c.petition_id)))
          .where((q) => {
            q.whereIn(
              this.knex.raw("data ->> 'petition_field_id'") as any,
              unique(comments.map((c) => c.petition_field_id).filter(isNonNullish)),
            );
            if (comments.some((c) => c.petition_field_id === null)) {
              q.orWhereNull(this.knex.raw("data ->> 'petition_field_id'") as any);
            }
          })
          .whereIn(
            this.knex.raw("data ->> 'petition_field_comment_id'") as any,
            unique(comments.map((c) => c.id)),
          )
          .mmodify(this.filterPetitionUserNotificationQueryBuilder(filter))
          .update(
            {
              read_at: isRead ? this.now() : null,
              ...(isRead ? { processed_at: this.now() } : {}),
            },
            "*",
          );
      },
      {
        chunkSize: 500,
        concurrency: 1,
      },
    );
  }

  async updatePetitionUserNotificationsReadStatusByUserId(
    filter: PetitionUserNotificationFilter,
    isRead: boolean,
    userId: number,
  ) {
    return await this.from("petition_user_notification")
      .where("user_id", userId)
      .mmodify((q) => {
        // to return only the updated notifications
        if (isRead) {
          q.whereNull("read_at");
        } else {
          q.whereNotNull("read_at");
        }
      })
      .mmodify(this.filterPetitionUserNotificationQueryBuilder(filter))
      .update(
        {
          read_at: isRead ? this.now() : null,
          ...(isRead ? { processed_at: this.now() } : {}),
        },
        "*",
      );
  }

  async createPetitionUserNotification(data: CreatePetitionUserNotification[]) {
    if (data.length === 0) {
      return [];
    }
    return await this.insert("petition_user_notification", data);
  }

  async deletePetitionUserNotificationsByPetitionId(
    petitionIds: number[],
    userIds?: number[],
    t?: Knex.Transaction,
  ) {
    if (petitionIds.length === 0) {
      return [];
    }
    return await this.from("petition_user_notification", t)
      .whereIn("petition_id", petitionIds)
      .mmodify((q) => {
        if (userIds && userIds.length > 0) {
          q.whereIn("user_id", userIds);
        }
      })
      .delete();
  }

  async createPetitionContactNotification(data: CreatePetitionContactNotification[]) {
    if (data.length === 0) {
      return [];
    }
    return await this.insert("petition_contact_notification", data);
  }

  async updatePetitionContactNotifications(
    petitionContactNotificationIds: number[],
    data: Partial<CreatePetitionContactNotification>,
  ) {
    return await this.from("petition_contact_notification")
      .whereIn("id", petitionContactNotificationIds)
      .update(data, "*");
  }

  readonly loadPetitionFieldCommentIsUnreadForUser = this.buildLoader<
    {
      userId: number;
      petitionId: number;
      petitionFieldId: number | null;
      petitionFieldCommentId: number;
    },
    boolean,
    string
  >(
    async (keys, t) => {
      const rows = await this.from<"petition_user_notification", CommentCreatedUserNotification>(
        "petition_user_notification",
        t,
      )
        .where("type", "COMMENT_CREATED")
        .whereIn("user_id", unique(keys.map((x) => x.userId)))
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .where((q) => {
          q.whereIn(
            this.knex.raw("data ->> 'petition_field_id'") as any,
            unique(keys.map((x) => x.petitionFieldId).filter(isNonNullish)),
          );
          if (keys.some((x) => x.petitionFieldId === null)) {
            q.orWhereNull(this.knex.raw("data ->> 'petition_field_id'") as any);
          }
        })
        .whereIn(
          this.knex.raw("data ->> 'petition_field_comment_id'") as any,
          unique(keys.map((x) => x.petitionFieldCommentId)),
        )
        .select("*");

      const byId = indexBy(
        rows,
        keyBuilder([
          "user_id",
          "petition_id",
          (r) => r.data.petition_field_id,
          (r) => r.data.petition_field_comment_id,
        ]),
      );
      return keys
        .map(keyBuilder(["userId", "petitionId", "petitionFieldId", "petitionFieldCommentId"]))
        .map((key) => byId[key]?.read_at === null);
    },
    {
      cacheKeyFn: keyBuilder(["userId", "petitionId", "petitionFieldId", "petitionFieldCommentId"]),
    },
  );

  readonly loadPetitionFieldCommentIsUnreadForContact = this.buildLoader<
    {
      petitionAccessId: number;
      petitionId: number;
      petitionFieldId: number | null;
      petitionFieldCommentId: number;
    },
    boolean,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_contact_notification", t)
        .where("type", "COMMENT_CREATED")
        .whereIn("petition_access_id", unique(keys.map((x) => x.petitionAccessId)))
        .whereIn("petition_id", unique(keys.map((x) => x.petitionId)))
        .where((q) => {
          q.whereIn(
            this.knex.raw("data ->> 'petition_field_id'") as any,
            unique(keys.map((x) => x.petitionFieldId).filter(isNonNullish)),
          );
          if (keys.some((x) => x.petitionFieldId === null)) {
            q.orWhereNull(this.knex.raw("data ->> 'petition_field_id'") as any);
          }
        })
        .whereIn(
          this.knex.raw("data ->> 'petition_field_comment_id'") as any,
          unique(keys.map((x) => x.petitionFieldCommentId)),
        )
        .select("*");

      const byId = indexBy(
        rows,
        keyBuilder([
          "petition_access_id",
          "petition_id",
          (r) => r.data.petition_field_id,
          (r) => r.data.petition_field_comment_id,
        ]),
      );
      return keys
        .map(
          keyBuilder([
            "petitionAccessId",
            "petitionId",
            "petitionFieldId",
            "petitionFieldCommentId",
          ]),
        )
        .map((key) => byId[key]?.read_at === null);
    },
    {
      cacheKeyFn: keyBuilder([
        "petitionAccessId",
        "petitionId",
        "petitionFieldId",
        "petitionFieldCommentId",
      ]),
    },
  );

  async createPetitionFieldCommentFromUser(
    data: {
      petitionId: number;
      petitionFieldId: number | null;
      contentJson: any;
      isInternal: boolean;
      approvalMetadata?: {
        stepName: string;
        status: PetitionApprovalRequestStepStatus;
        rejectionType?: "TEMPORARY" | "DEFINITIVE";
      };
    },
    user: User,
  ) {
    return await this.withTransaction(async (t) => {
      const [comment] = await this.insert(
        "petition_field_comment",
        {
          petition_id: data.petitionId,
          petition_field_id: data.petitionFieldId,
          content_json: this.json(data.contentJson),
          user_id: user.id,
          is_internal: data.isInternal,
          approval_metadata: data.approvalMetadata ? this.json(data.approvalMetadata) : null,
          created_by: `User:${user.id}`,
        },
        t,
      );

      await this.createEvent(
        {
          type: "COMMENT_PUBLISHED",
          petition_id: data.petitionId,
          data: {
            petition_field_id: comment.petition_field_id,
            petition_field_comment_id: comment.id,
            is_internal: comment.is_internal,
          },
        },
        t,
      );

      return comment;
    });
  }

  async createPetitionFieldCommentFromAccess(
    data: {
      petitionId: number;
      petitionFieldId: number | null;
      contentJson: any;
    },
    access: PetitionAccess,
  ) {
    return await this.withTransaction(async (t) => {
      const [comment] = await this.insert(
        "petition_field_comment",
        {
          petition_id: data.petitionId,
          petition_field_id: data.petitionFieldId,
          content_json: this.json(data.contentJson),
          petition_access_id: access.id,
          created_by: `PetitionAccess:${access.id}`,
        },
        t,
      );

      await this.createEvent(
        {
          type: "COMMENT_PUBLISHED",
          petition_id: data.petitionId,
          data: {
            petition_field_id: comment.petition_field_id,
            petition_field_comment_id: comment.id,
          },
        },
        t,
      );

      return comment;
    });
  }

  async deletePetitionFieldCommentFromUser(
    petitionId: number,
    petitionFieldCommentId: number,
    user: User,
  ) {
    const comment = await this.deletePetitionFieldComment(
      petitionFieldCommentId,
      `User:${user.id}`,
    );

    if (isNonNullish(comment)) {
      await this.createEvent({
        type: "COMMENT_DELETED",
        petition_id: petitionId,
        data: {
          petition_field_id: comment.petition_field_id,
          petition_field_comment_id: comment.id,
          user_id: user.id,
          is_internal: comment.is_internal,
        },
      });
    }
    return comment;
  }

  async deletePetitionFieldCommentFromAccess(
    petitionId: number,
    petitionFieldCommentId: number,
    access: PetitionAccess,
  ) {
    const comment = await this.deletePetitionFieldComment(
      petitionFieldCommentId,
      `PetitionAccess:${access.id}`,
    );

    if (isNonNullish(comment)) {
      await this.createEvent({
        type: "COMMENT_DELETED",
        petition_id: petitionId,
        data: {
          petition_field_id: comment.petition_field_id,
          petition_field_comment_id: comment.id,
          petition_access_id: access.id,
        },
      });
    }

    return comment;
  }

  private async deletePetitionFieldComment(
    petitionFieldCommentId: number,
    deletedBy: string,
  ): Promise<PetitionFieldComment | undefined> {
    const [comment] = await this.from("petition_field_comment")
      .where("id", petitionFieldCommentId)
      .whereNull("deleted_at")
      .update(
        {
          deleted_at: this.now(),
          deleted_by: deletedBy,
        },
        "*",
      );

    if (isNonNullish(comment)) {
      await this.deleteCommentCreatedNotifications(comment.petition_id, [comment.id]);
    }

    return comment;
  }

  private async deletePetitionFieldCommentsByFieldIds(
    petitionId: number,
    fieldIds: number[],
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    const comments = await this.from("petition_field_comment", t)
      .update(
        {
          deleted_at: this.now(),
          deleted_by: deletedBy,
        },
        "*",
      )
      .whereNull("deleted_at")
      .whereIn("petition_field_id", fieldIds);

    await this.deleteCommentCreatedNotifications(
      petitionId,
      comments.map((c) => c.id),
      t,
    );
  }

  private async deletePetitionFieldRelationshipsByFieldIds(
    petitionId: number,
    fieldIds: number[],
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    await this.from("petition_field_group_relationship", t)
      .where("petition_id", petitionId)
      .whereNull("deleted_at")
      .where((q) =>
        q
          .whereIn("left_side_petition_field_id", fieldIds)
          .orWhereIn("right_side_petition_field_id", fieldIds),
      )
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }

  async deleteCommentCreatedNotifications(
    petitionId: number,
    commentIds: number[],
    t?: Knex.Transaction,
  ) {
    if (commentIds.length === 0) {
      return;
    }
    await Promise.all([
      // delete user notifications related to this petition field
      this.from("petition_user_notification", t)
        .where({ petition_id: petitionId, type: "COMMENT_CREATED" })
        .whereRaw("data ->> 'petition_field_comment_id' in ?", this.sqlIn(commentIds))
        .delete(),
      // delete contact notifications related to this petition field
      this.from("petition_contact_notification", t)
        .where({ petition_id: petitionId, type: "COMMENT_CREATED" })
        .whereRaw("data ->> 'petition_field_comment_id' in ?", this.sqlIn(commentIds))
        .delete(),
    ]);
  }

  async updatePetitionFieldCommentFromUser(
    petitionFieldCommentId: number,
    data: {
      contentJson: any;
    },
    updatedBy: User,
  ) {
    const [comment] = await this.from("petition_field_comment")
      .where("id", petitionFieldCommentId)
      .update(
        {
          content_json: this.json(data.contentJson),
          updated_at: this.now(),
          updated_by: `User:${updatedBy.id}`,
        },
        "*",
      );
    return comment;
  }

  async updatePetitionFieldCommentFromContact(
    petitionFieldCommentId: number,
    data: {
      contentJson: any;
    },
    updatedBy: Contact,
  ) {
    const [comment] = await this.from("petition_field_comment")
      .where("id", petitionFieldCommentId)
      .whereNull("deleted_at")
      .update(
        {
          content_json: this.json(data.contentJson),
          updated_at: this.now(),
          updated_by: `Contact:${updatedBy.id}`,
        },
        "*",
      );
    return comment;
  }

  async markPetitionFieldCommentsAsReadForAccess(
    petitionFieldCommentIds: number[],
    accessId: number,
  ) {
    const comments = (await this.loadPetitionFieldComment.raw(
      petitionFieldCommentIds,
    )) as PetitionFieldComment[];
    await this.from("petition_contact_notification")
      .where("petition_access_id", accessId)
      .where("type", "COMMENT_CREATED")
      .whereIn("petition_id", unique(comments.map((c) => c.petition_id)))
      .where((q) => {
        q.whereIn(
          this.knex.raw("data ->> 'petition_field_id'") as any,
          unique(comments.map((c) => c.petition_field_id)).filter(isNonNullish),
        );
        if (comments.some((c) => c.petition_field_id === null)) {
          q.orWhereNull(this.knex.raw("data ->> 'petition_field_id'") as any);
        }
      })
      .whereIn(
        this.knex.raw("data ->> 'petition_field_comment_id'") as any,
        unique(comments.map((c) => c.id)),
      )
      .update({ read_at: this.now(), processed_at: this.now() });
    return comments;
  }

  async accessesBelongToValidContacts(accessIds: number[]) {
    const {
      rows: [{ count }],
    } = await this.knex.raw(
      /* sql */ `
      select count(distinct pa.id)::int as count
        from petition_access as pa
          left join contact as c on c.id = pa.contact_id
        where
          pa.id in ?
          and (pa.contact_id is null or c.deleted_at is null)
    `,
      [this.sqlIn(accessIds)],
    );
    return count === new Set(accessIds).size;
  }

  async changePetitionFieldType(
    petitionId: number,
    fieldId: number,
    type: PetitionFieldType,
    user: User,
  ) {
    return this.withTransaction(async (t) => {
      const [field] = await this.from("petition_field", t)
        .where({
          id: fieldId,
          deleted_at: null,
        })
        .select("*");

      if (field.type === type) {
        return field;
      }

      if (isValueCompatible(field.type, type)) {
        await this.from("petition_field_reply", t)
          .where({
            petition_field_id: fieldId,
            deleted_at: null,
          })
          .update({
            type: type,
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
            status: "PENDING",
          });
      } else {
        await this.from("petition_field_reply", t)
          .where({
            petition_field_id: fieldId,
            deleted_at: null,
          })
          .update({
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          });
      }

      if (field.type === "FIELD_GROUP") {
        await this.unlinkPetitionFieldChildren(petitionId, field.id, null, `User:${user.id}`, t);
        this.loadFieldsForPetition.dataloader.clear(petitionId);
      }

      const [petition] = await this.from("petition", t)
        .where({ id: petitionId, deleted_at: null })
        .select("automatic_numbering_config");
      const props = this.petitionFields.defaultFieldProperties(type, field, petition);
      if (type === "PROFILE_SEARCH") {
        props.options = await this.buildDefaultProfileSearchOptions(user.org_id, t);
      }

      const [updated] = await this.updatePetitionField(
        petitionId,
        fieldId,
        {
          type,
          ...props,
        },
        `User:${user.id}`,
        t,
      );

      return updated;
    });
  }

  async buildDefaultProfileSearchOptions(orgId: number, t?: Knex.Transaction) {
    const standardProfileTypes = await this.from("profile_type", t)
      .where("org_id", orgId)
      .whereNotNull("standard_type")
      .whereNull("deleted_at")
      .whereNull("archived_at")
      .orderBy("id", "asc");

    const searchIn = [];
    const individual = standardProfileTypes.find((pt) => pt.standard_type === "INDIVIDUAL");
    if (individual) {
      searchIn.push({ profileTypeId: individual.id, profileTypeFieldIds: [] });
    }

    const legalEntity = standardProfileTypes.find((pt) => pt.standard_type === "LEGAL_ENTITY");
    if (legalEntity) {
      const profileTypeFields = await this.from("profile_type_field", t)
        .where("profile_type_id", legalEntity.id)
        .whereNull("deleted_at")
        .whereIn("alias", ["p_trade_name", "p_entity_name"])
        .select("id");
      searchIn.push({
        profileTypeId: legalEntity.id,
        profileTypeFieldIds: profileTypeFields.map((f) => f.id),
      });
    }

    const contract = standardProfileTypes.find((pt) => pt.standard_type === "CONTRACT");
    if (contract) {
      const profileTypeFields = await this.from("profile_type_field", t)
        .where("profile_type_id", contract.id)
        .whereNull("deleted_at")
        .whereIn("alias", ["p_counterparty"])
        .select("id");
      searchIn.push({
        profileTypeId: contract.id,
        profileTypeFieldIds: profileTypeFields.map((f) => f.id),
      });
    }

    return { searchIn };
  }

  readonly loadPetitionPermission = this.buildLoadBy("petition_permission", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadEffectivePermissions = this.buildLoader<number, EffectivePetitionPermission[]>(
    async (petitionIds, t) => {
      const rows = await this.raw<EffectivePetitionPermission>(
        /* sql */ `
          select petition_id, user_id, min("type") as type, bool_or(is_subscribed) is_subscribed 
          from petition_permission 
            where deleted_at is null 
            and user_group_id is null
            and petition_id in ? 
            group by user_id, petition_id
        `,
        [this.sqlIn(petitionIds)],
        t,
      );

      const byPetitionId = groupBy(rows, (r) => r.petition_id);
      return petitionIds.map((id) => byPetitionId[id] ?? []);
    },
  );

  async getPetitionIdsWithUserPermissions(
    petitionIds: number[],
    folders: string[],
    isTemplate: boolean,
    user: User,
    permissions: PetitionPermissionType[],
  ) {
    const ids: number[] = petitionIds;
    if (folders.length > 0) {
      const folderIds = fromGlobalIds(folders, "PetitionFolder", true).ids;
      const folderPetitions = await this.getUserPetitionsInsideFolders(folderIds, isTemplate, user);
      ids.push(...folderPetitions.map((p) => p.id));
    }

    if (ids.length === 0) {
      return [];
    }

    const rows = await this.raw<{ petition_id: number }>(
      /* sql */ `
        select distinct(petition_id)
        from petition_permission 
          where deleted_at is null 
          and user_group_id is null
          and petition_id in ? 
          and user_id = ?
          and "type" in ?
      `,
      [this.sqlIn(unique(ids)), user.id, this.sqlIn(permissions)],
    );

    return rows.map((r) => r.petition_id);
  }

  readonly loadEffectiveTemplateDefaultPermissions = this.buildLoader<
    number,
    EffectivePetitionPermission[]
  >(async (templateIds, t) => {
    const rows = await this.raw<EffectivePetitionPermission>(
      /* sql */ `
        with ps as (
          select template_id, user_id, type, is_subscribed
          from template_default_permission
            where deleted_at is null
            and user_id is not null
            and template_id in ?
          union
          select template_id, ugm.user_id, type, is_subscribed
          from template_default_permission tdf
          join user_group_member ugm on tdf.user_group_id = ugm.user_group_id and ugm.deleted_at is null
          where tdf.deleted_at is null
            and tdf.user_group_id is not null
            and template_id in ?
        )
        select template_id as petition_id, user_id, min("type") as type, bool_or(is_subscribed) is_subscribed
        from ps
        group by user_id, template_id
      `,
      [this.sqlIn(templateIds), this.sqlIn(templateIds)],
      t,
    );

    const byPetitionId = groupBy(rows, (r) => r.petition_id);
    return templateIds.map((id) => byPetitionId[id] ?? []);
  });

  readonly loadUserPermissionsByPetitionId = this.buildLoadMultipleBy(
    "petition_permission",
    "petition_id",
    (q) =>
      q
        .whereNull("deleted_at")
        .whereNull("user_group_id")
        .orderByRaw("type asc, from_user_group_id asc nulls first, user_id asc, created_at"),
  );

  readonly loadPetitionPermissionsByUserId = this.buildLoadMultipleBy(
    "petition_permission",
    "user_id",
    (q) => q.whereNull("deleted_at").orderByRaw("type asc, created_at"),
  );

  readonly loadUserAndUserGroupPermissionsByPetitionId = this.buildLoadMultipleBy(
    "petition_permission",
    "petition_id",
    (q) =>
      q
        .whereNull("deleted_at")
        .whereNull("from_user_group_id")
        .orderByRaw("type asc, user_group_id nulls first, created_at, id"),
  );

  readonly loadPetitionOwner = this.buildLoader<number, User | null>(async (ids, t) => {
    const rows = await this.from("petition_permission", t)
      .leftJoin("user", "petition_permission.user_id", "user.id")
      .whereIn("petition_id", ids)
      .where("type", "OWNER")
      .whereNull("petition_permission.deleted_at")
      // required whereNull for using index on query
      .whereNull("petition_permission.from_user_group_id")
      .whereNull("petition_permission.user_group_id")
      .whereNull("user.deleted_at")
      .select("petition_permission.petition_id", "user.*");
    const rowsByPetitionId = indexBy(rows, (r) => r.petition_id);
    return ids.map((id) =>
      rowsByPetitionId[id] ? (omit(rowsByPetitionId[id], ["petition_id"]) as User) : null,
    );
  });

  /**
   * clones every permission on `fromPetitionId` into `toPetitionIds`
   */
  async clonePetitionPermissions(
    fromPetitionId: number,
    toPetitionIds: number[],
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    await this.raw(
      /* sql */ `
        with
          u as (select user_id, type, is_subscribed, user_group_id, from_user_group_id from petition_permission where petition_id = ? and deleted_at is null),
          p as (select * from (?) as t (petition_id))
        insert into petition_permission(petition_id, user_id, type, is_subscribed, user_group_id, from_user_group_id, created_by, updated_by)
        select p.petition_id, u.user_id, u.type, u.is_subscribed, u.user_group_id, u.from_user_group_id, ?, ? from u cross join p
        on conflict do nothing 
        `,
      [
        fromPetitionId,
        this.sqlValues(
          toPetitionIds.map((id) => [id]),
          ["int"],
        ),
        createdBy,
        createdBy,
      ],
      t,
    );
  }

  async addPetitionPermissions(
    petitionIds: number[],
    data: {
      type: "User" | "UserGroup";
      id: number;
      permissionType: PetitionPermissionType;
      isSubscribed: boolean;
    }[],
    creator: "User" | "PublicPetitionLink",
    creatorId: number,
    createEvents?: boolean,
    t?: Knex.Transaction,
  ) {
    const createdBy = `${creator}:${creatorId}`;
    const [newUsers, newUserGroups] = partition(data, (d) => d.type === "User");
    return await this.withTransaction(async (t) => {
      const permissionType =
        newUsers.length > 0 ? newUsers[0].permissionType : newUserGroups[0].permissionType;

      const newUserPermissions =
        newUsers.length > 0
          ? await pMapChunk(
              petitionIds.flatMap((petitionId) =>
                newUsers.map((user) => ({
                  petition_id: petitionId,
                  user_id: user.id,
                  is_subscribed: user.isSubscribed,
                  type: user.permissionType,
                  created_by: createdBy,
                  updated_by: createdBy,
                })),
              ),
              async (chunk) =>
                await this.raw<PetitionPermission>(
                  /* sql */ `
                    ? on conflict (petition_id, user_id)
                    where deleted_at is null and from_user_group_id is null and user_group_id is null 
                      do update set
                      type = ?,
                      updated_by = ?,
                      updated_at = ?,
                      deleted_by = null,
                      deleted_at = null where petition_permission.type > ?
                    returning *;
                  `,
                  [
                    // directly-assigned user permissions
                    this.from("petition_permission").insert(chunk),
                    permissionType,
                    createdBy,
                    this.now(),
                    permissionType,
                  ],
                  t,
                ),
              {
                chunkSize: 100,
                concurrency: 1,
              },
            )
          : [];

      const newGroupPermissions =
        newUserGroups.length > 0
          ? await pMapChunk(
              petitionIds.flatMap((petitionId) =>
                newUserGroups.map((userGroup) => ({
                  petition_id: petitionId,
                  user_group_id: userGroup.id,
                  is_subscribed: userGroup.isSubscribed,
                  type: userGroup.permissionType,
                  created_by: createdBy,
                  updated_by: createdBy,
                })),
              ),
              async (chunk) =>
                await this.raw<PetitionPermission>(
                  /* sql */ `
                    ? on conflict (petition_id, user_group_id)
                    where deleted_at is null and user_group_id is not null
                      do update set
                      type = ?,
                      updated_by = ?,
                      updated_at = ?,
                      deleted_by = null,
                      deleted_at = null  where petition_permission.type > ?
                    returning *;
                  `,
                  [
                    // group permissions
                    this.from("petition_permission").insert(chunk),
                    permissionType,
                    createdBy,
                    this.now(),
                    permissionType,
                  ],
                  t,
                ),
              { chunkSize: 100, concurrency: 1 },
            )
          : [];

      // user permissions through a user group
      const groupAssignedNewUserPermissions =
        newUserGroups.length > 0
          ? await pMapChunk(
              newUserGroups,
              async (chunk) =>
                await this.raw<PetitionPermission>(
                  /* sql */ `
                    with gm as (
                      select ugm.user_id, ugm.user_group_id, ugm_info.is_subscribed, ugm_info.permission_type
                      from user_group_member ugm
                      -- each user group may have different is_subscribed and permission_type values assigned
                      join (
                        select * from (?) as t(user_group_id, is_subscribed, permission_type)
                      ) as ugm_info on ugm_info.user_group_id = ugm.user_group_id
                      where ugm.deleted_at is null and ugm.user_group_id in ?
                    ),
                    p as (
                      select petition_id from (?) as t(petition_id)
                    )
                    insert into petition_permission(petition_id, user_id, from_user_group_id, is_subscribed, type, created_by, updated_by)
                    select p.petition_id, gm.user_id, gm.user_group_id, gm.is_subscribed, gm.permission_type, ?, ? 
                    from gm cross join p
                    on conflict do nothing returning *;
                  `,
                  [
                    this.sqlValues(
                      chunk.map((ug) => [ug.id, ug.isSubscribed, ug.permissionType]),
                      ["int", "bool", "petition_permission_type"],
                    ),
                    this.sqlIn(
                      chunk.map((ug) => ug.id),
                      "int",
                    ),
                    this.sqlValues(
                      petitionIds.map((id) => [id]),
                      ["int"],
                    ),
                    createdBy,
                    createdBy,
                  ],
                  t,
                ),
              { chunkSize: 100, concurrency: 1 },
            )
          : [];

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      if (createEvents && creator === "User") {
        await pMapChunk(
          [
            ...newUserPermissions.map(
              (p) =>
                ({
                  petition_id: p.petition_id,
                  type: "USER_PERMISSION_ADDED",
                  data: {
                    user_id: creatorId,
                    permission_type: p.type,
                    permission_user_id: p.user_id!,
                  },
                }) satisfies UserPermissionAddedEvent<true>,
            ),
            ...newGroupPermissions.map(
              (p) =>
                ({
                  petition_id: p.petition_id,
                  type: "GROUP_PERMISSION_ADDED",
                  data: {
                    user_id: creatorId,
                    permission_type: p.type,
                    user_group_id: p.user_group_id!,
                  },
                }) satisfies GroupPermissionAddedEvent<true>,
            ),
          ],
          async (chunk) => await this.createEvent(chunk, t),
          { chunkSize: 100, concurrency: 1 },
        );
      }

      return [...newUserPermissions, ...newGroupPermissions, ...groupAssignedNewUserPermissions];
    }, t);
  }

  async editPetitionPermissions(
    petitionIds: number[],
    userIds: number[],
    userGroupIds: number[],
    newPermissionType: PetitionPermissionType,
    user: User,
  ) {
    await this.withTransaction(async (t) => {
      const updateUserData = petitionIds.flatMap((petitionId) =>
        userIds.map((userId) => ({ petitionId, userId })),
      );

      const updatedUserPermissions = await pMapChunk(
        updateUserData,
        async (data) =>
          await this.from("petition_permission", t)
            .whereIn(
              "petition_id",
              data.map((d) => d.petitionId),
            )
            .whereNull("deleted_at")
            .whereIn(
              "user_id",
              data.map((d) => d.userId),
            )
            .whereNull("from_user_group_id")
            .whereNull("user_group_id")
            .update(
              {
                updated_at: this.now(),
                updated_by: `User:${user.id}`,
                type: newPermissionType,
              },
              "*",
            ),
        {
          chunkSize: 100,
          concurrency: 1,
        },
      );

      const updateGroupData = petitionIds.flatMap((petitionId) =>
        userGroupIds.map((userGroupId) => ({ petitionId, userGroupId })),
      );

      const updatedGroupPermissions = await pMapChunk(
        updateGroupData,
        async (data) =>
          await this.from("petition_permission", t)
            .whereIn(
              "petition_id",
              data.map((d) => d.petitionId),
            )
            .whereNull("deleted_at")
            .andWhere((q) =>
              q
                .orWhere((q) =>
                  q
                    .whereIn(
                      "user_group_id",
                      data.map((d) => d.userGroupId),
                    )
                    .whereNotNull("user_group_id"),
                )
                .orWhere((q) =>
                  q
                    .whereIn(
                      "from_user_group_id",
                      data.map((d) => d.userGroupId),
                    )
                    .whereNotNull("from_user_group_id"),
                ),
            )
            .update(
              {
                updated_at: this.now(),
                updated_by: `User:${user.id}`,
                type: newPermissionType,
              },
              "*",
            ),
        {
          chunkSize: 100,
          concurrency: 1,
        },
      );

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      const [directlyAssigned, groupAssigned] = partition(
        [...updatedUserPermissions, ...updatedGroupPermissions].filter(
          (p) => p.from_user_group_id === null,
        ),
        (p) => p.user_group_id === null,
      );

      await this.createEvent(
        [
          ...directlyAssigned.map((p) => ({
            petition_id: p.petition_id,
            type: "USER_PERMISSION_EDITED" as const,
            data: {
              user_id: user.id,
              permission_type: p.type,
              permission_user_id: p.user_id!,
            },
          })),
          ...groupAssigned.map((p) => ({
            petition_id: p.petition_id,
            type: "GROUP_PERMISSION_EDITED" as const,
            data: {
              user_id: user.id,
              permission_type: p.type,
              user_group_id: p.user_group_id!,
            },
          })),
        ],
        t,
      );
    });
  }

  async removePetitionPermissions(
    petitionIds: number[],
    userIds: number[],
    userGroupIds: number[],
    removeAll: boolean,
    user: User,
    t?: Knex.Transaction,
  ) {
    return await this.withTransaction(async (t) => {
      const removeUserData: { petitionId: number; userId: number | null }[] = removeAll
        ? petitionIds.map((petitionId) => ({ petitionId, userId: null }))
        : petitionIds.flatMap((petitionId) => userIds.map((userId) => ({ petitionId, userId })));

      const removedUserPermissions = await pMapChunk(
        removeUserData,
        async (data) =>
          await this.from("petition_permission", t)
            .whereIn(
              "petition_id",
              data.map((d) => d.petitionId),
            )
            .whereNull("deleted_at")
            .whereNot((q) => q.where("user_id", user.id).andWhere("type", "OWNER"))
            .mmodify((q) => {
              if (!removeAll) {
                q.andWhere((q) =>
                  q.orWhere((q) =>
                    q
                      .whereIn(
                        "user_id",
                        data.map((d) => d.userId!),
                      )
                      .whereNull("from_user_group_id")
                      .whereNull("user_group_id"),
                  ),
                );
              }
            })
            .update(
              {
                deleted_at: this.now(),
                deleted_by: `User:${user.id}`,
              },
              "*",
            ),
        { chunkSize: 100, concurrency: 1 },
      );

      const removedGroupData: { petitionId: number; userGroupId: number | null }[] = removeAll
        ? petitionIds.map((petitionId) => ({ petitionId, userGroupId: null }))
        : petitionIds.flatMap((petitionId) =>
            userGroupIds.map((userGroupId) => ({ petitionId, userGroupId })),
          );

      const removedGroupPermissions = await pMapChunk(
        removedGroupData,
        async (data) =>
          await this.from("petition_permission", t)
            .whereIn(
              "petition_id",
              data.map((d) => d.petitionId),
            )
            .whereNull("deleted_at")
            .whereNot((q) => q.where("user_id", user.id).andWhere("type", "OWNER"))
            .mmodify((q) => {
              if (!removeAll) {
                q.andWhere((q) =>
                  q
                    .orWhere((q) =>
                      q
                        .whereIn(
                          "user_group_id",
                          data.map((d) => d.userGroupId!),
                        )
                        .whereNotNull("user_group_id"),
                    )
                    .orWhere((q) =>
                      q
                        .whereIn(
                          "from_user_group_id",
                          data.map((d) => d.userGroupId!),
                        )
                        .whereNotNull("from_user_group_id"),
                    ),
                );
              }
            })
            .update(
              {
                deleted_at: this.now(),
                deleted_by: `User:${user.id}`,
              },
              "*",
            ),
        { chunkSize: 100, concurrency: 1 },
      );

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      const [directlyAssigned, groupAssigned] = partition(
        [...removedUserPermissions, ...removedGroupPermissions].filter(
          (p) => p.from_user_group_id === null,
        ),
        (p) => p.user_group_id === null,
      );

      await this.createEvent(
        [
          ...directlyAssigned.map((p) => ({
            petition_id: p.petition_id,
            type: "USER_PERMISSION_REMOVED" as const,
            data: {
              user_id: user.id,
              permission_user_id: p.user_id!,
            },
          })),
          ...groupAssigned.map((p) => ({
            petition_id: p.petition_id,
            type: "GROUP_PERMISSION_REMOVED" as const,
            data: {
              user_id: user.id,
              user_group_id: p.user_group_id!,
            },
          })),
        ],
        t,
      );
      return [...removedUserPermissions, ...removedGroupPermissions];
    }, t);
  }

  /** ensures every user in array has at least READ permission on the petition */
  async ensureMinimalPermissions(petitionId: number, userIds: number[], createdBy: string) {
    if (userIds.length === 0) {
      return [];
    }
    return await pMapChunk(
      userIds.map((userId) => ({
        petition_id: petitionId,
        user_id: userId,
        type: "READ" as const,
        created_by: createdBy,
        updated_by: createdBy,
      })),
      async (chunk) =>
        await this.raw<PetitionPermission>(
          /* sql */ `
            ? on conflict (petition_id, user_id)
            where deleted_at is null and from_user_group_id is null and user_group_id is null 
              do nothing returning *;
          `,
          [this.from("petition_permission").insert(chunk)],
        ),
      {
        chunkSize: 100,
        concurrency: 1,
      },
    );
  }

  private async removePetitionPermissionsById(
    petitionUserPermissionIds: number[],
    user: User,
    t?: Knex.Transaction,
  ) {
    return this.withTransaction(async (t) => {
      const removedPermissions = await pMapChunk(
        petitionUserPermissionIds,
        async (ids) =>
          await this.from("petition_permission", t)
            .whereIn("id", ids)
            .update(
              {
                deleted_at: this.now(),
                deleted_by: `User:${user.id}`,
              },
              "*",
            ),
        { chunkSize: 100, concurrency: 1 },
      );

      const [directlyAssigned, groupAssigned] = partition(
        removedPermissions.filter((p) => p.from_user_group_id === null),
        (p) => p.user_group_id === null,
      );

      await this.createEvent(
        [
          ...directlyAssigned.map((p) => ({
            petition_id: p.petition_id,
            type: "USER_PERMISSION_REMOVED" as const,
            data: {
              user_id: user.id,
              permission_user_id: p.user_id!,
            },
          })),
          ...groupAssigned.map((p) => ({
            petition_id: p.petition_id,
            type: "GROUP_PERMISSION_REMOVED" as const,
            data: {
              user_id: user.id,
              user_group_id: p.user_group_id!,
            },
          })),
        ],
        t,
      );

      return removedPermissions;
    }, t);
  }

  /**
   * Update the owner of the petition links owned by one of the given ownerIds
   */
  async transferPublicLinkOwnership(userIds: number[], newOwnerId: number, updatedBy: User) {
    await pMapChunk(
      userIds,
      async (userIdsChunk) => {
        await this.raw(
          /* sql */ `
          with deleted_permission as (
            update template_default_permission
            set 
              deleted_at = now(),
              deleted_by = ?
            where
              user_id in ?
              and type = 'OWNER'
              and deleted_at is null
              and exists(
                select * from public_petition_link ppl 
                where ppl.template_id = template_default_permission.template_id
              )
            returning *
          )
          insert into template_default_permission ("user_id", "template_id", "type", "is_subscribed", "created_by")
          select ?, "template_id", 'OWNER', "is_subscribed", ?
          from deleted_permission dp;
        `,
          [`User:${updatedBy.id}`, this.sqlIn(userIdsChunk), newOwnerId, `User:${updatedBy.id}`],
        );
      },
      { concurrency: 1, chunkSize: 1000 },
    );
  }

  /**
   * sets new OWNER of petitions to @param toUserId.
   * original owner gets a WRITE permission.
   */
  async transferOwnership(
    petitionIds: number[],
    toUserId: number,
    keepOriginalPermissions: boolean,
    updatedBy: string,
  ) {
    return await pMapChunk(
      petitionIds,
      async (petitionIdsChunk) =>
        await this.raw<PetitionPermission & { previous_owner_id: number }>(
          /* sql */ `
          with previous_owner_permissions as (
            update petition_permission
            set
              type = 'WRITE',
              updated_at = now(),
              updated_by = ?,
              deleted_at = ?,
              deleted_by = ?
            where petition_id in ?
            and type = 'OWNER'
            and deleted_at is null
            returning *
          ),
          inserted_rows as (
            insert into petition_permission ("petition_id", "user_id", "type", "created_by", "updated_by", "updated_at")
            select pop.petition_id, ?, 'OWNER', ?, ?, now()
            from previous_owner_permissions pop
            on conflict (petition_id, user_id) where deleted_at is null and from_user_group_id is null and user_group_id is null
            do update set
              type = 'OWNER',
              updated_at = EXCLUDED.updated_at,
              updated_by = EXCLUDED.updated_by
            returning *
          )
          select i.*, pop.user_id as previous_owner_id
          from inserted_rows i
          join previous_owner_permissions pop on i.petition_id = pop.petition_id;
      `,
          [
            updatedBy,
            keepOriginalPermissions ? null : this.now(),
            keepOriginalPermissions ? null : updatedBy,
            this.sqlIn(petitionIdsChunk),
            toUserId,
            updatedBy,
            updatedBy,
          ],
        ),
      {
        concurrency: 1,
        chunkSize: 1000,
      },
    );
  }

  readonly loadTemplateDefaultPermissions = this.buildLoadMultipleBy(
    "template_default_permission",
    "template_id",
    (q) => q.whereNull("deleted_at").orderByRaw(`"type" asc, "id" desc`),
  );

  async resetTemplateDefaultPermissions(
    templateId: number,
    permissions: TemplateDefaultPermissionInput[],
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const [[newOwner], rwPermissions] = partition(permissions, (p) => p.permissionType === "OWNER");

    return await this.withTransaction(async (t) => {
      // first of all, replace current owner to avoid triggering template_default_permission__owner constraint
      await this.replaceTemplateDefaultPermissionOwner(
        templateId,
        newOwner && "userId" in newOwner
          ? { userId: newOwner.userId, isSubscribed: newOwner.isSubscribed }
          : null,
        updatedBy,
        t,
      );
      //now upsert every read/write permission
      await this.upsertTemplateDefaultRWPermissions(templateId, rwPermissions, updatedBy, t);
    }, t);
  }

  private async replaceTemplateDefaultPermissionOwner(
    templateId: number,
    newOwner: Maybe<{ userId: number; isSubscribed: boolean }>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    await this.from("template_default_permission", t)
      .where({
        template_id: templateId,
        deleted_at: null,
        type: "OWNER",
      })
      .update({ deleted_at: this.now(), deleted_by: updatedBy }, "*");

    // insert new owner if its found on permissions array
    // upsert to update permission type if the new owner already has R/W
    if (newOwner) {
      await this.raw<TemplateDefaultPermission>(
        /* sql */ `
        ?
        on conflict (template_id, user_id) where deleted_at is null
          do update set
            type = EXCLUDED.type, is_subscribed = EXCLUDED.is_subscribed, updated_by = ?, updated_at = NOW()
        returning *;
      `,
        [
          this.knex.from({ tdp: "template_default_permission" }).insert({
            template_id: templateId,
            type: "OWNER",
            user_id: newOwner.userId,
            is_subscribed: newOwner.isSubscribed,
            created_by: updatedBy,
            updated_by: updatedBy,
          }),
          updatedBy,
        ],
        t,
      );
    }
  }

  private async upsertTemplateDefaultRWPermissions(
    templateId: number,
    permissions: TemplateDefaultPermissionInput[],
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    if (permissions.some((p) => p.permissionType === "OWNER")) {
      throw new Error("There should be no OWNER permission in the array");
    }
    return await this.withTransaction(async (t) => {
      const rows = await pMap(
        permissions,
        async (p, i) => {
          const conflictTarget = `(template_id, ${"userId" in p ? "user_id" : "user_group_id"})`;
          const [row] = await this.raw<TemplateDefaultPermission>(
            /* sql */ `
              ?
              on conflict ${conflictTarget} where deleted_at is null
                do update set
                  type = EXCLUDED.type, is_subscribed = EXCLUDED.is_subscribed, updated_by = ?, updated_at = NOW()
              returning *;
            `,
            [
              this.knex.from({ tdp: "template_default_permission" }).insert({
                template_id: templateId,
                type: p.permissionType,
                ...("userId" in p ? { user_id: p.userId } : { user_group_id: p.userGroupId }),
                is_subscribed: p.isSubscribed,
                created_by: updatedBy,
                updated_by: updatedBy,
              }),
              updatedBy,
            ],
            t,
          );
          return row;
        },
        { concurrency: 1 },
      );
      await this.from("template_default_permission", t)
        .where("template_id", templateId)
        .whereNull("deleted_at")
        .whereNot("type", "OWNER")
        .whereNotIn(
          "id",
          rows.map((p) => p.id),
        )
        .update({
          deleted_at: this.now(),
          deleted_by: updatedBy,
        });
    }, t);
  }

  async createPermissionsFromTemplateDefaultPermissions(
    petitionId: number,
    templateId: number,
    creator: "User" | "PublicPetitionLink",
    creatorId: number,
    t?: Knex.Transaction,
  ) {
    const defaultPermissions = await this.loadTemplateDefaultPermissions(templateId);
    if (defaultPermissions.length > 0) {
      await this.addPetitionPermissions(
        [petitionId],
        defaultPermissions.map((p) => ({
          type: p.user_id ? "User" : "UserGroup",
          id: p.user_id ?? p.user_group_id!,
          permissionType: p.type,
          isSubscribed: p.is_subscribed,
        })),
        creator,
        creatorId,
        false,
        t,
      );
    }
  }

  getPaginatedPublicTemplates(
    opts: {
      search?: string | null;
      locale?: ContactLocale | null;
      categories?: string[] | null;
    } & PageOpts,
  ) {
    return this.getPagination<Petition>(
      this.from("petition")
        .where({
          template_public: true,
          deleted_at: null,
        })
        .mmodify((q) => {
          const { search, locale, categories } = opts;
          if (locale) {
            q.where("recipient_locale", locale);
          }
          if (search) {
            q.andWhere((q2) => {
              q2.whereSearch("name", search).or.whereSearch("template_description", search);
            });
          }
          if (categories) {
            const placeholders = categories.map((_) => "?").join(",");
            /* array overlap operator.
              selects every template with any of the passed categories */
            q.whereRaw(/* sql */ `public_metadata->'categories' \\?| array[${placeholders}]`, [
              ...categories,
            ]);
          }
          q.leftJoin(
            this.from("petition")
              .whereIn(
                "from_template_id",
                this.from("petition")
                  .where({
                    template_public: true,
                    deleted_at: null,
                  })
                  .select("id"),
              )
              .whereNull("deleted_at")
              .groupBy("from_template_id")
              .select<{ template_id: number; used_count: number }[]>(
                this.knex.raw(`"from_template_id" as template_id`),
                this.knex.raw(`count(*) as used_count`),
              )
              .as("t"),
            "t.template_id",
            "petition.id",
          );
          q.orderByRaw(/* sql */ `t.used_count DESC NULLS LAST`).orderBy("created_at", "desc");
        })
        .select("petition.*"),
      opts,
    );
  }

  async loadPublicTemplateBySlug(slug: string): Promise<Petition | null> {
    let templateId: number | null = null;
    try {
      // if slug is not set on a template metadata, we try to search by id using the slug as a globalId
      templateId = fromGlobalId(slug, "Petition").id;
    } catch {}

    const [row] = await this.from("petition")
      .where({
        is_template: true,
        template_public: true,
        deleted_at: null,
      })
      .whereRaw(
        /* sql */ `
        (("public_metadata" ->> 'slug') is not null and ("public_metadata" ->> 'slug') = ?) or (("public_metadata" ->> 'slug') is null and "id" = ?)
      `,
        [slug, templateId],
      );

    return row;
  }

  async getPublicTemplatesCategories() {
    const rows = await this.raw<{ category: string }>(/* sql */ `
      select distinct jsonb_array_elements(public_metadata->'categories') as category
      from petition
      where is_template and template_public and deleted_at is null
    `);
    return rows.map((r) => r.category);
  }

  readonly loadPetitionSignatureByExternalId = this.buildLoadBy(
    "petition_signature_request",
    "external_id",
  );

  readonly loadPetitionSignatureById = this.buildLoadBy("petition_signature_request", "id");

  readonly loadPetitionSignaturesByPetitionId = this.buildLoadMultipleBy(
    "petition_signature_request",
    "petition_id",
    (q) =>
      q.orderBy([
        { column: "created_at", order: "desc" },
        { column: "id", order: "desc" },
      ]),
  );

  readonly loadLatestPetitionSignatureByPetitionId = this.buildLoader<
    number,
    PetitionSignatureRequest | null
  >(async (petitionIds, t) => {
    const signatures = await this.raw<PetitionSignatureRequest & { _rank: number }>(
      /* sql */ `
        with cte as (
          select *, rank() over (partition by petition_id order by created_at desc) _rank
          from petition_signature_request
          where petition_id in ?
        ) 
        select * from cte where _rank = 1
      `,
      [this.sqlIn(petitionIds)],
      t,
    );
    const byPetitionId = indexBy(signatures, (r) => r.petition_id);
    return petitionIds.map((key) =>
      byPetitionId[key] ? omit(byPetitionId[key], ["_rank"]) : null,
    );
  });

  async loadPendingSignatureRequestsByIntegrationId(orgIntegrationId: number) {
    return await this.from("petition_signature_request")
      .whereRaw("signature_config ->> 'orgIntegrationId' = ?", orgIntegrationId)
      .whereIn("status", ["ENQUEUED", "PROCESSING", "PROCESSED"]);
  }

  async loadPetitionsByOrgIntegrationId(orgIntegrationId: number) {
    return await this.from("petition")
      .whereRaw("signature_config ->> 'orgIntegrationId' = ?", orgIntegrationId)
      .whereNull("deleted_at");
  }

  async getTaggedPetitions(tagId: MaybeArray<number>) {
    const tagIds = unMaybeArray(tagId);
    if (tagIds.length === 0) {
      return [];
    }
    return await this.raw<Petition>(
      /* sql */ `
      select p.* from petition_tag pt
      join petition p on pt.petition_id = p.id
      where pt.tag_id in ? and p.deleted_at is null
    `,
      [this.sqlIn(tagIds)],
    );
  }

  async createPetitionSignature(
    petitionId: number,
    data: Omit<CreatePetitionSignatureRequest, "petition_id">,
    t?: Knex.Transaction,
  ) {
    const [row] = await this.insert(
      "petition_signature_request",
      {
        petition_id: petitionId,
        ...data,
      },
      t,
    ).returning("*");

    await this.from("petition", t)
      .where("id", petitionId)
      .update({ latest_signature_status: data.status ?? "ENQUEUED" });

    return row;
  }

  async updatePetitionSignatures(
    petitionSignatureId: MaybeArray<number>,
    data: Partial<PetitionSignatureRequest>,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(petitionSignatureId);
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.from("petition_signature_request", t)
      .whereIn("id", ids)
      .update({
        ...data,
        updated_at: this.now(),
        processed_at: data.status === "PROCESSED" ? this.now() : undefined,
      })
      .returning("*");

    if (isNonNullish(data.status) && rows.length > 0) {
      await this.from("petition", t)
        .whereIn("id", unique(rows.map((r) => r.petition_id)))
        .update({
          latest_signature_status:
            data.cancel_reason === "CANCELLED_BY_USER" ? "CANCELLED_BY_USER" : data.status,
        });
    }

    return rows;
  }

  async updatePetitionSignatureByExternalId(
    prefixedExternalId: string,
    data: Partial<Omit<PetitionSignatureRequest, "event_logs">>,
  ) {
    const [row] = await this.from("petition_signature_request")
      .where("external_id", prefixedExternalId)
      .update({
        ...data,
        updated_at: this.now(),
      })
      .returning("*");

    if (isNonNullish(data.status)) {
      await this.from("petition")
        .where("id", row.petition_id)
        .update({
          latest_signature_status:
            data.cancel_reason === "CANCELLED_BY_USER" ? "CANCELLED_BY_USER" : data.status,
        });
    }

    return row;
  }

  async updatePetitionSignatureSignerStatusByExternalId(
    prefixedExternalId: string,
    signerIndex: number,
    status: { opened_at?: Date; signed_at?: Date; sent_at?: Date },
  ) {
    if (Object.keys(status).length > 1) {
      throw new Error("Only one of opened_at, signed_at, sent_at can be set");
    }
    const key =
      "opened_at" in status ? "opened_at" : "signed_at" in status ? "signed_at" : "sent_at";
    const value = status[key];
    if (!value) {
      throw new Error("Value must be set");
    }

    await this.raw(
      /* sql */ `
      update petition_signature_request
      set signer_status = 
        signer_status || jsonb_build_object(
          ?::text, jsonb_set(
            coalesce(signer_status->?, '{}'::jsonb),
            ?,
            to_jsonb(?::text)
          )
        )
      where external_id = ?;
    `,
      [signerIndex, signerIndex, this.sqlArray([key]), value, prefixedExternalId],
    );
  }

  async updatePetitionSignatureRequestAsCancelled<
    CancelReason extends PetitionSignatureCancelReason,
  >(
    ids: MaybeArray<number>,
    data?: Replace<
      Partial<PetitionSignatureRequest>,
      { cancel_reason: CancelReason; cancel_data: PetitionSignatureRequestCancelData<CancelReason> }
    >,
    t?: Knex.Transaction,
  ) {
    const signatureIds = unMaybeArray(ids);
    if (signatureIds.length === 0) {
      return [];
    }
    const rows = await this.from("petition_signature_request", t)
      .whereIn("id", signatureIds)
      .whereNotIn("status", ["COMPLETED", "CANCELLED"])
      .update({
        ...data,
        status: "CANCELLED",
        updated_at: this.now(),
      })
      .returning("*");

    const byPetitionId = groupBy(rows, (r) => r.petition_id);

    await pMap(
      Object.values(byPetitionId),
      async (signatures) => {
        const [latestSignature] = sortBy(signatures, [(s) => s.created_at, "desc"]);
        await this.from("petition", t)
          .where("id", latestSignature.petition_id)
          .update({
            latest_signature_status:
              latestSignature.cancel_reason === "CANCELLED_BY_USER"
                ? "CANCELLED_BY_USER"
                : "CANCELLED",
          });
      },
      { concurrency: 5 },
    );

    await this.createEvent(
      rows.map((signature) => ({
        type: "SIGNATURE_CANCELLED",
        petition_id: signature.petition_id,
        data: {
          petition_signature_request_id: signature.id,
          cancel_reason: signature.cancel_reason!,
          cancel_data: signature.cancel_data,
        },
      })),
      t,
    );

    return rows;
  }

  async appendPetitionSignatureEventLogs(prefixedExternalId: string, logs: any[]) {
    return await this.knex.raw(
      /* sql */ `
        UPDATE petition_signature_request
        SET event_logs = event_logs || ${logs.map(() => "?::jsonb").join(" || ")},
        updated_at = NOW()
        WHERE external_id = ?
      `,
      [...logs, prefixedExternalId],
    );
  }

  readonly loadUsersOnPetition = this.buildLoader<number, (User & { is_subscribed: boolean })[]>(
    async (petitionIds) => {
      const rows = await this.from("user")
        .join("petition_permission", "user.id", "petition_permission.user_id")
        .whereIn("petition_permission.petition_id", petitionIds)
        .whereNotNull("petition_permission.user_id")
        .whereNull("petition_permission.deleted_at")
        .where("user.status", "ACTIVE")
        .whereNull("user.deleted_at")
        .distinctOn("user.id", "petition_permission.petition_id")
        .select<
          (User & { is_subscribed: boolean; petition_id: number })[]
        >("user.*", "petition_permission.is_subscribed", "petition_permission.petition_id");

      const byPetitionId = groupBy(rows, (r) => r.petition_id);
      return petitionIds.map((petitionId) => byPetitionId[petitionId] ?? []);
    },
  );

  async isUserSubscribedToPetition(userId: number, petitionId: number) {
    return await this.exists(
      /* sql */ `
        select pp.*
          from petition_permission pp
          join "user" u on u.id = pp.user_id
        where 
          pp.user_id = ? 
          and pp.petition_id = ? 
          and pp.is_subscribed 
          and pp.deleted_at is null 
          and u.status = 'ACTIVE'
          and u.deleted_at is null
    `,
      [userId, petitionId],
    );
  }

  async updatePetitionPermissionSubscription(
    petitionId: number,
    isSubscribed: boolean,
    user: User,
  ) {
    const [row] = await this.from("petition_permission")
      .where({
        petition_id: petitionId,
        user_id: user.id,
        deleted_at: null,
      })
      .update(
        {
          is_subscribed: isSubscribed,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*",
      );

    return row;
  }

  readonly loadPetitionAttachment = this.buildLoadBy("petition_attachment", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadPetitionAttachmentsByPetitionId = this.buildLoadMultipleBy(
    "petition_attachment",
    "petition_id",
    (q) => q.whereNull("deleted_at").orderBy("position", "asc"),
  );

  async createPetitionAttachment(data: CreatePetitionAttachment[], user: User) {
    return await this.from("petition_attachment").insert(
      data.map((attachment) => ({
        ...attachment,
        created_by: `User:${user.id}`,
      })),
      "*",
    );
  }

  readonly loadFieldAttachment = this.buildLoadBy("petition_field_attachment", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadFieldAttachmentsByFieldId = this.buildLoadMultipleBy(
    "petition_field_attachment",
    "petition_field_id",
    (q) => q.whereNull("deleted_at"),
  );

  async createPetitionFieldAttachment(data: CreatePetitionFieldAttachment, user: User) {
    const [row] = await this.insert("petition_field_attachment", {
      ...data,
      created_by: `User:${user.id}`,
    });
    return row;
  }

  async deletePetitionAttachment(attachmentId: number, user: User, t?: Knex.Transaction) {
    return await this.withTransaction(async (t) => {
      const [row] = await this.from("petition_attachment", t)
        .where("id", attachmentId)
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .returning("*");

      return await this.files.deleteFileUpload(row.file_upload_id, `User:${user.id}`, t);
    }, t);
  }

  async deletePetitionFieldAttachment(attachmentId: number, user: User) {
    return await this.withTransaction(async (t) => {
      const [row] = await this.from("petition_field_attachment", t)
        .where("id", attachmentId)
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .returning("*");

      return await this.files.deleteFileUpload(row.file_upload_id, `User:${user.id}`, t);
    });
  }

  private async deletePetitionFieldAttachmentByFieldId(
    petitionFieldIds: number[],
    user: User,
    t?: Knex.Transaction,
  ) {
    if (petitionFieldIds.length === 0) {
      return;
    }
    const deletedAttachments = await this.from("petition_field_attachment", t)
      .whereNull("deleted_at")
      .whereIn("petition_field_id", petitionFieldIds)
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      })
      .returning("*");

    await this.files.deleteFileUpload(
      deletedAttachments.map((a) => a.file_upload_id),
      `User:${user.id}`,
      t,
    );
  }

  public async deletePetitionAttachmentByPetitionId(
    petitionIds: number[],
    user: User,
    t?: Knex.Transaction,
  ) {
    const deletedAttachments = await this.from("petition_attachment", t)
      .where({
        deleted_at: null,
      })
      .whereIn("petition_id", petitionIds)
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      })
      .returning("*");

    await this.files.deleteFileUpload(
      deletedAttachments.map((a) => a.file_upload_id),
      `User:${user.id}`,
      t,
    );
  }

  async updatePetitionAttachmentPositions(
    petitionId: number,
    attachmentType: PetitionAttachmentType,
    ids: number[],
    updatedBy: string,
  ) {
    return await this.withTransaction(async (t) => {
      await this.raw(
        /* sql */ `
        update petition_attachment pa set 
        position = t.position, 
        updated_at = NOW(),
        updated_by = ?
        from (?) as t (id, position)
        where pa.id = t.id
        and pa.type = ?
        and pa.petition_id = ?
        and pa.deleted_at is null;
      `,
        [
          updatedBy,
          this.sqlValues(
            ids.map((id, i) => [id, i]),
            ["int", "int"],
          ),
          attachmentType,
          petitionId,
        ],
        t,
      );

      const [petition] = await this.from("petition", t).where("id", petitionId).update(
        {
          updated_at: this.now(),
          updated_by: updatedBy,
          last_change_at: this.now(),
        },
        "*",
      );
      return petition;
    });
  }

  async updatePetitionAttachmentType(
    petitionId: number,
    attachmentId: number,
    newType: PetitionAttachmentType,
    updatedBy: string,
  ) {
    const target = (await this.loadPetitionAttachment(attachmentId))!;
    return await this.withTransaction(async (t) => {
      const [result] = await this.raw<PetitionAttachment>(
        /* sql */ `
            with max_pos as (
              select coalesce(max(position) + 1, 0) as position from petition_attachment where petition_id = ? and type = ? and deleted_at is null
            ) update petition_attachment pa set
              type = ?,
              position = mp.position,
              updated_at = NOW(),
              updated_by = ?
              from max_pos mp
              where pa.id = ?
              and pa.deleted_at is null
              returning *;
        `,
        [petitionId, newType, newType, updatedBy, attachmentId],
        t,
      );

      // we also need to update positions of target type attachments so the sequence is 0...x
      await this.from("petition_attachment", t)
        .where({ deleted_at: null, type: target.type, petition_id: petitionId })
        .whereRaw(`"position" > ?`, [target.position])
        .update({ position: this.knex.raw(`"position" - 1`) });

      return result;
    });
  }

  readonly loadPublicPetitionLink = this.buildLoadBy("public_petition_link", "id");

  readonly loadPublicPetitionLinkBySlug = this.buildLoadBy("public_petition_link", "slug");

  readonly loadPublicPetitionLinksByTemplateId = this.buildLoadMultipleBy(
    "public_petition_link",
    "template_id",
    (q) => q.orderBy("created_at", "asc"),
  );

  readonly loadTemplateDefaultOwner = this.buildLoader<
    number,
    { isDefault: boolean; user: User } | null
  >(async (templateIds, t) => {
    const [templateDefaultOwners, templateOwners] = await Promise.all([
      this.from("template_default_permission", t)
        .whereNull("deleted_at")
        .where({ type: "OWNER" })
        .whereIn("template_id", templateIds)
        .select("*"),
      this.from("petition_permission", t)
        .whereNull("deleted_at")
        .where({ type: "OWNER" })
        .whereIn("petition_id", templateIds)
        .select("*"),
    ]);

    const defaultOwnerByTemplateId = indexBy(templateDefaultOwners, (tdp) => tdp.template_id);
    const templateOwnerByTemplateId = indexBy(templateOwners, (t) => t.petition_id);

    const userIds = unique(
      [
        ...templateDefaultOwners.map((tdp) => tdp.user_id),
        ...templateOwners.map((t) => t.user_id),
      ].filter(isNonNullish),
    );

    const users = await this.from("user", t)
      .whereIn("id", userIds)
      .whereNull("deleted_at")
      .select("*");

    return templateIds.map((templateId) => {
      const isDefault = isNonNullish(defaultOwnerByTemplateId[templateId]?.user_id);
      const ownerId =
        defaultOwnerByTemplateId[templateId]?.user_id ??
        templateOwnerByTemplateId[templateId]?.user_id;
      const user = users.find((u) => u.id === ownerId) ?? null;

      return user ? { isDefault, user } : null;
    });
  });

  async createPublicPetitionLink(
    data: CreatePublicPetitionLink,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const [row] = await this.insert(
      "public_petition_link",
      {
        ...data,
        created_by: createdBy,
      },
      t,
    ).select("*");
    this.loadPublicPetitionLinksByTemplateId.dataloader.clear(data.template_id);
    return row;
  }

  async updatePublicPetitionLink(
    publicPetitionLinkId: number,
    data: Partial<PublicPetitionLink>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const [row] = await this.from("public_petition_link", t)
      .where("id", publicPetitionLinkId)
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );

    return row;
  }

  async contactHasAccessFromPublicPetitionLink(contactEmail: string, publicPetitionLinkId: number) {
    const [{ count }] = await this.knex
      .from("petition_access")
      .join("contact", "contact.id", "petition_access.contact_id")
      .join("petition", "petition.id", "petition_access.petition_id")
      .whereNull("petition.deleted_at")
      .whereNull("contact.deleted_at")
      .where("petition_access.status", "ACTIVE")
      .where("petition.status", "PENDING")
      .where("petition.from_public_petition_link_id", publicPetitionLinkId)
      .where("contact.email", contactEmail)
      .select(this.count());

    return count > 0;
  }

  async getLatestPetitionAccessFromPublicPetitionLink(
    publicPetitionLinkId: number,
    contactEmail: string,
  ) {
    const [access] = await this.from("petition_access")
      .join("petition", "petition.id", "petition_access.petition_id")
      .join("contact", "contact.id", "petition_access.contact_id")
      .whereNull("petition.deleted_at")
      .whereNull("contact.deleted_at")
      .where("petition.from_public_petition_link_id", publicPetitionLinkId)
      .where("contact.email", contactEmail)
      .where("petition.status", "PENDING")
      .select<PetitionAccess[]>("petition_access.*")
      .orderBy("petition_access.created_at", "desc");

    return access;
  }

  async getPetitionStatsForUser(userId: number) {
    const petitions = await this.raw<{ status: PetitionStatus; sent_at: Date }>(
      /* sql */ `
      select p.status, pa.created_at sent_at from petition p 
      join petition_permission pp on pp.petition_id = p.id 
      join petition_access pa on pa.petition_id = p.id
      where p.is_template = false
      and p.deleted_at is null
      and pp."type" = 'OWNER' 
      and pp.deleted_at is null
      and pp.user_id = ?;
    `,
      [userId],
    );

    return {
      petitions_sent: petitions.length,
      petitions_sent_this_month: petitions.filter((p) => isThisMonth(p.sent_at)).length,
      petitions_sent_last_month: petitions.filter((p) =>
        isSameMonth(p.sent_at, subMonths(new Date(), 1)),
      ).length,
      petitions_pending: petitions.filter((s) => s.status === "PENDING").length,
    };
  }

  async markPetitionAccessEmailBounceStatus(
    petitionAccessId: number,
    hasBounced: boolean,
    updatedBy: string,
  ) {
    await this.from("contact")
      .update({
        last_email_bounced: hasBounced,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .where(
        "id",
        this.from("contact")
          .join("petition_access", "contact.id", "petition_access.contact_id")
          .whereNull("contact.deleted_at")
          .where("contact.last_email_bounced", !hasBounced) // make sure to update only if there is a change
          .where("petition_access.id", petitionAccessId)
          .select("contact.id"),
      );
  }

  async modifyPetitionCustomProperty(
    petitionId: number,
    key: string,
    value: Maybe<string>,
    updatedBy: string,
  ) {
    const [petition] = await this.raw<Petition>(
      /* sql */ `
      update petition p set custom_properties = 
        (case 
          when (?::text) is null then (p.custom_properties - ?) 
          else jsonb_set(p.custom_properties, array_append('{}', ?::text), to_jsonb(?::text))
        end),
        updated_at = NOW(),
        updated_by = ? 
      where id = ?
      returning *;
    `,
      [value, key, key, value, updatedBy, petitionId],
    );
    return petition;
  }

  async getClosedPetitionsToAnonymize(orgId: number) {
    return await this.raw<Petition>(
      /* sql */ `
      select p.* from petition p join organization o on o.id = p.org_id
      where p.deleted_at is null 
      and p.anonymized_at is null 
      and p.org_id = ?
      and p.status = 'CLOSED' 
      and p.closed_at is not null
      and ((
          p.anonymize_after_months is not null
          and p.closed_at < NOW() - make_interval(months => p.anonymize_after_months)
        ) or (
          p.anonymize_after_months is null 
          and o.anonymize_petitions_after_months is not null 
          and p.closed_at < NOW() - make_interval(months => o.anonymize_petitions_after_months)
        ))
    `,
      [orgId],
    );
  }

  async getDeletedPetitionIdsToAnonymize(daysAfterDeletion: number) {
    const petitions = await this.from("petition")
      .whereNotNull("deleted_at")
      .whereNull("anonymized_at")
      .whereRaw(/* sql */ `"deleted_at" < NOW() - make_interval(days => ?)`, [daysAfterDeletion])
      .select("id");

    return petitions.map((p) => p.id);
  }

  async getDeletedPetitionFieldRepliesToAnonymize(daysAfterDeletion: number) {
    return await this.from("petition_field_reply")
      .whereNotNull("deleted_at")
      .whereNull("anonymized_at")
      .whereRaw(/* sql */ `"deleted_at" < NOW() - make_interval(days => ?)`, [daysAfterDeletion])
      .select("*");
  }

  async getDeletedPetitionFieldCommentIdsToAnonymize(daysAfterDeletion: number) {
    const comments = await this.from("petition_field_comment")
      .whereNotNull("deleted_at")
      .whereNull("anonymized_at")
      .whereRaw(/* sql */ `"deleted_at" < NOW() - make_interval(days => ?)`, [daysAfterDeletion])
      .select("id");

    return comments.map((c) => c.id);
  }

  async anonymizePetition(petitionId: number) {
    const [accesses, fields] = await Promise.all([
      this.from("petition_access").where("petition_id", petitionId).select("id"),
      this.from("petition_field")
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .select("id"),
    ]);

    const fieldIds = fields.map((f) => f.id);

    const replies = await pMapChunk(
      fieldIds,
      async (fieldIdsChunk) =>
        await this.from("petition_field_reply")
          .whereIn("petition_field_id", fieldIdsChunk)
          .whereNull("anonymized_at")
          .whereNull("deleted_at")
          .select("id", "type", "content", "anonymized_at"),
      { concurrency: 1, chunkSize: 200 },
    );

    // field and general comments on the petition are included here
    const comments = await this.from("petition_field_comment")
      .where("petition_id", petitionId)
      .whereNull("anonymized_at")
      .select("id");

    await this.withTransaction(async (t) => {
      const [petition] = await this.updatePetition(
        petitionId,
        { signature_config: null, anonymized_at: this.now() },
        "AnonymizerWorker",
        t,
      );

      if (isNonNullish(petition.summary_ai_completion_log_id)) {
        await this.updatePetitionSummaryAiCompletionLogId(petition, null, "AnonymizerWorker", t);
      }

      const [messages, reminders, events] = await Promise.all([
        this.anonymizePetitionMessages(petitionId, t),
        this.anonymizePetitionReminders(
          accesses.map((a) => a.id),
          t,
        ),
        this.anonymizePetitionEvents(petitionId, t),
        this.anonymizePetitionFieldReplies(replies, t),
        this.anonymizePetitionComments(
          comments.map((c) => c.id),
          t,
        ),
        this.anonymizeAccesses(
          petitionId,
          accesses.map((a) => a.id),
          "AnonymizerWorker",
          t,
        ),
      ]);

      await this.anonymizeEmailLogs(
        [
          ...messages.filter((m) => isNonNullish(m.email_log_id)).map((m) => m.email_log_id!),
          ...reminders.filter((m) => isNonNullish(m.email_log_id)).map((m) => m.email_log_id!),
          ...events
            .filter((e) => isNonNullish((e.data as any).email_log_id))
            .map((e) => (e.data as any).email_log_id!),
        ],
        t,
      );

      await this.anonymizePetitionSignatureRequests(petitionId, t);

      await this.deactivatePublicPetitionLinks(petitionId, "AnonymizerWorker", t);

      await this.createEvent(
        {
          type: "PETITION_ANONYMIZED",
          petition_id: petitionId,
          data: {},
        },
        t,
      );
    });
  }

  async anonymizePetitionEvents(petitionId: number, t?: Knex.Transaction) {
    return await this.from("petition_event", t)
      .where("petition_id", petitionId)
      .update(
        {
          data: this.knex.raw(/* sql */ `
        case "type"
          when 'PETITION_CLOSED_NOTIFIED' then
            "data" || jsonb_build_object('email_body', null)
          else 
            "data"
          end
      `),
        },
        "*",
      );
  }

  async anonymizePetitionFieldReplies(
    replies: MaybeArray<Pick<PetitionFieldReply, "id" | "type" | "content" | "anonymized_at">>,
    t?: Knex.Transaction,
  ) {
    const repliesArray = unMaybeArray(replies);
    if (repliesArray.length === 0) return;

    const fileUploadIds = repliesArray
      .filter(
        (r) =>
          isFileTypeField(r.type) &&
          isNonNullish(r.content.file_upload_id) &&
          r.anonymized_at === null,
      )
      .map((r) => r.content.file_upload_id as number);

    await pMapChunk(
      repliesArray.map((r) => r.id),
      async (ids) => {
        await this.from("petition_field_reply", t)
          .whereIn("id", ids)
          .whereNull("anonymized_at")
          .update({
            anonymized_at: this.now(),
            metadata: this.knex.raw(/* sql */ `metadata - 'inferred_data' - 'inferred_type'`),
            content: this.knex.raw(/* sql */ `
          case "type"
            when 'FILE_UPLOAD' then
              content || jsonb_build_object('file_upload_id', null)
            when 'DOW_JONES_KYC' then
              content || jsonb_build_object('file_upload_id', null, 'entity', null)
            when 'ES_TAX_DOCUMENTS' then
              content || jsonb_build_object('file_upload_id', null, 'json_contents', null)
            when 'ID_VERIFICATION' then
              content || jsonb_build_object('file_upload_id', null)
            when 'FIELD_GROUP' then 
              '{}'::jsonb
            when 'BACKGROUND_CHECK' then 
              content || jsonb_build_object('query', null, 'search', null, 'entity', null)
            else 
              content || jsonb_build_object('value', null)
            end
        `),
          });
      },
      { chunkSize: 200, concurrency: 5 },
    );

    await this.files.deleteFileUpload(fileUploadIds, "AnonymizerWorker", t);
  }

  async anonymizePetitionComments(ids: MaybeArray<number>, t?: Knex.Transaction) {
    const commentIds = unMaybeArray(ids);
    if (commentIds.length === 0) return;

    await pMapChunk(
      commentIds,
      async (ids) => {
        await this.from("petition_field_comment", t)
          .whereIn("id", ids)
          .whereNull("anonymized_at")
          .update({
            anonymized_at: this.now(),
            content_json: null,
          });
      },
      { chunkSize: 200, concurrency: 5 },
    );
  }

  private async anonymizePetitionMessages(petitionId: number, t: Knex.Transaction) {
    return await this.from("petition_message", t)
      .where("petition_id", petitionId)
      .whereNull("anonymized_at")
      .update(
        {
          anonymized_at: this.now(),
          email_body: null,
        },
        "email_log_id",
      );
  }

  private async anonymizePetitionReminders(petitionAccessIds: number[], t: Knex.Transaction) {
    if (petitionAccessIds.length === 0) {
      return [];
    }
    return await this.from("petition_reminder", t)
      .whereIn("petition_access_id", petitionAccessIds)
      .whereNull("anonymized_at")
      .update(
        {
          anonymized_at: this.now(),
          email_body: null,
        },
        "email_log_id",
      );
  }

  private async anonymizeEmailLogs(emailLogIds: number[], t: Knex.Transaction) {
    if (emailLogIds.length === 0) {
      return;
    }
    await this.from("email_log", t).whereIn("id", emailLogIds).whereNull("anonymized_at").update(
      {
        anonymized_at: this.now(),
        html: "",
        text: "",
        to: "",
        subject: "",
      },
      "*",
    );
  }

  private async anonymizePetitionSignatureRequests(petitionId: number, t: Knex.Transaction) {
    const signatures = await this.from("petition_signature_request", t)
      .where("petition_id", petitionId)
      .whereNull("anonymized_at")
      .update(
        {
          anonymized_at: this.now(),
          signature_config: this.knex.raw(/* sql */ `
            -- replace every entry in 'signersInfo' with null 
            "signature_config" || jsonb_build_object('signersInfo', array_to_json(
              array_fill(null::jsonb, array[jsonb_array_length("signature_config"->'signersInfo')])
            ))
          `),
          data: null,
          event_logs: null,
          // DECLINED_BY_SIGNER signatures have text written by recipient on cancel_data
          cancel_data: this.knex.raw(/* sql */ `
            case cancel_reason when 'DECLINED_BY_SIGNER' then '{}'::jsonb else cancel_data end
          `),
        },
        "*",
      );

    const fileUploadIds = [
      ...signatures.filter((s) => isNonNullish(s.file_upload_id)).map((s) => s.file_upload_id!),
      ...signatures
        .filter((s) => isNonNullish(s.file_upload_audit_trail_id))
        .map((s) => s.file_upload_audit_trail_id!),
    ];

    await this.files.deleteFileUpload(fileUploadIds, "AnonymizerWorker", t);
  }

  private async deactivatePublicPetitionLinks(
    petitionId: number,
    updatedBy: string,
    t: Knex.Transaction,
  ) {
    await this.from("public_petition_link", t).where("template_id", petitionId).update({
      is_active: false,
      updated_at: this.now(),
      updated_by: updatedBy,
    });
  }

  async getPetitionsForTemplateStatsReport(
    fromTemplateId: number,
    orgId: number,
    startDate?: Date | null,
    endDate?: Date | null,
  ) {
    return await this.raw<TemplateStatsReportInput>(
      /* sql */ `
      select 
        distinct on (p.id) p.id,
        p.name, 
        p.status, 
        p.latest_signature_status, 
        (pa.id is not null) as is_sent
      from petition p 
      left join petition_access pa on p.id = pa.petition_id
      where p.from_template_id = ? 
        and p.org_id = ? 
        and p.is_template = false
        and p.status != 'DRAFT' 
        and p.deleted_at is null
        and (?::timestamptz is null or ?::timestamptz is null or p.created_at between ? and ?)
    `,
      [
        fromTemplateId,
        orgId,
        startDate ?? null,
        endDate ?? null,
        startDate ?? null,
        endDate ?? null,
      ],
    );
  }

  async getPetitionStatsOverview(
    orgId: number,
    userId: number,
    startDate?: Date | null,
    endDate?: Date | null,
  ) {
    // list of all the organization's petitions (excluding templates)
    const orgPetitions = await this.raw<{
      id: number;
      status: PetitionStatus;
      from_template_id: Maybe<number>;
      latest_signature_status: Maybe<string>;
    }>(
      /* sql */ `
        select distinct on (p.id) p.id, p.status, p.from_template_id, p.latest_signature_status
        from petition p
        where p.org_id = ? 
          and p.is_template = false
          and p.status != 'DRAFT' 
          and p.deleted_at is null 
          and (?::timestamptz is null or ?::timestamptz is null or created_at between ? and ?)
      `,
      [orgId, startDate ?? null, endDate ?? null, startDate ?? null, endDate ?? null],
    );

    const fromTemplateIds = unique(
      orgPetitions.map((p) => p.from_template_id).filter(isNonNullish),
    );

    const templates =
      fromTemplateIds.length > 0
        ? await this.raw<{
            id: number;
            name: string;
            has_access: boolean;
          }>(
            /* sql */ `
              select distinct on (p.id)
                p.id, p.name, coalesce(pp.id::bool, false) as has_access
              from petition p
              left join petition_permission pp on p.id = pp.petition_id and pp.user_id = ? and pp.deleted_at is null
              where p.id in ? and p.deleted_at is null
            `,
            [userId, this.sqlIn(fromTemplateIds)],
          )
        : [];

    const petitionsWithStats = await pMapChunk(
      orgPetitions,
      async (chunk) => {
        return zip(
          chunk,
          await retry(async () => await this.getPetitionTimes(chunk.map((p) => p.id)), {
            maxRetries: 2,
          }),
        ).map(([petition, stats]) => ({ ...petition, ...stats }));
      },
      { chunkSize: 200, concurrency: 5 },
    );

    const templatesWithPetitionsWithStats = Object.values(
      groupBy(petitionsWithStats, (p) => p.from_template_id ?? 0),
    ).map((group) => {
      const template = isNonNullish(group[0].from_template_id)
        ? (templates.find((t) => t.id === group[0].from_template_id) ?? null)
        : null;
      return [template, group] as const;
    });

    function groupStats(petitions: UnwrapArray<typeof petitionsWithStats>[]) {
      return {
        status: {
          all: petitions.length,
          pending: petitions.filter((p) => p.status === "PENDING").length,
          completed: petitions.filter((p) => p.status === "COMPLETED").length,
          closed: petitions.filter((p) => p.status === "CLOSED").length,
          signed: petitions.filter((p) => p.latest_signature_status === "COMPLETED").length,
        },
        times: {
          pending_to_complete: average(
            petitions.map((p) => p.pending_to_complete).filter(isNonNullish),
          ),
          complete_to_close: average(
            petitions.map((p) => p.complete_to_close).filter(isNonNullish),
          ),
          signature_completed: average(
            petitions.map((p) => p.signature_completed).filter(isNonNullish),
          ),
        },
      };
    }

    return sortBy(
      [
        ...templatesWithPetitionsWithStats
          .filter(([t]) => t?.has_access === true)
          .map(([template, petitions]) => {
            return {
              aggregation_type: "TEMPLATE" as const,
              template_id: toGlobalId("Petition", template!.id),
              template_name: template?.name,
              ...groupStats(petitions),
            };
          }),
        (() => {
          const noAccess = templatesWithPetitionsWithStats.filter(([t]) => t?.has_access === false);
          return {
            aggregation_type: "NO_ACCESS" as const,
            template_count: noAccess.length,
            ...groupStats(noAccess.flatMap(([, petitions]) => petitions)),
          };
        })(),
        {
          aggregation_type: "NO_TEMPLATE" as const,
          ...groupStats(
            templatesWithPetitionsWithStats
              .filter(([t]) => isNullish(t))
              .flatMap(([, petitions]) => petitions),
          ),
        },
      ].filter((r) => r.status.all > 0),
      [(t) => t.status.all, "desc"],
    );
  }

  private async getPetitionTimes(petitionIds: number[]) {
    const events = await this.raw<{
      petition_id: number;
      type: PetitionEventType;
      min: Date;
      max: Date;
    }>(
      /* sql */ `
      select 
        "petition_id",
        "type",
        min("created_at"),
        max("created_at")
      from "petition_event"
      where "type" in ?
        and "petition_id" in ?
      group by 
        "petition_id",
        "type"
    `,
      [
        this.sqlIn([
          "ACCESS_ACTIVATED",
          "REPLY_CREATED",
          "PETITION_COMPLETED",
          "PETITION_CLOSED",
          "SIGNATURE_STARTED",
          "SIGNATURE_COMPLETED",
        ]),
        this.sqlIn(petitionIds),
      ],
    );

    const eventsByPetitionId = groupBy(events, (e) => e.petition_id);

    return petitionIds.map((petitionId) => {
      const events = eventsByPetitionId[petitionId] ?? [];
      // first ACCESS_ACTIVATED or REPLY_CREATED event marks the first time the petition moved to PENDING status
      const pendingAt = pipe(
        events,
        filter((e) => e.type === "ACCESS_ACTIVATED" || e.type === "REPLY_CREATED"),
        map((e) => e.min.getTime()),
        firstBy([(t) => t, "desc"]),
      );

      const completedAt = events.find((e) => e.type === "PETITION_COMPLETED")?.max.getTime();
      const closedAt = events.find((e) => e.type === "PETITION_CLOSED")?.max.getTime();
      const signatureStartedAt = events.find((e) => e.type === "SIGNATURE_STARTED")?.max.getTime();
      const signatureCompletedAt = events
        .find((e) => e.type === "SIGNATURE_COMPLETED")
        ?.max.getTime();

      return {
        pending_to_complete:
          isNonNullish(completedAt) && isNonNullish(pendingAt) && completedAt > pendingAt
            ? (completedAt - pendingAt) / 1000
            : null,
        complete_to_close:
          isNonNullish(closedAt) && isNonNullish(completedAt) && closedAt > completedAt
            ? (closedAt - completedAt) / 1000
            : null,
        signature_completed:
          isNonNullish(signatureStartedAt) &&
          isNonNullish(signatureCompletedAt) &&
          signatureCompletedAt > signatureStartedAt
            ? (signatureCompletedAt - signatureStartedAt) / 1000
            : null,
      };
    });
  }

  async getFirstDefinedTitleFromHeadings(petitionId: number) {
    const fields = await this.from("petition_field")
      .where({ deleted_at: null, petition_id: petitionId, type: "HEADING" })
      .whereNotNull("title")
      .orderBy("position", "asc")
      .limit(1)
      .select("title");

    return fields[0]?.title ?? null;
  }

  async getUserPetitionFoldersList(userId: number, orgId: number, isTemplate: boolean) {
    const paths = await this.raw<{ path: string }>(
      /* sql */ `
      select distinct("path") from petition p
      join petition_permission pp on p.id = pp.petition_id and pp.user_id = ? and pp.deleted_at is null
      where p.deleted_at is null and p.is_template = ? and p.org_id = ?
      order by "path" asc;
    `,
      [userId, isTemplate, orgId],
    );

    return paths.map((p) => p.path);
  }

  /**
   * Check that there's no petition with permission lower than required in the specified folders
   */
  async userHasPermissionInFolders(
    userId: number,
    orgId: number,
    isTemplate: boolean,
    paths: string[],
    permissionType: PetitionPermissionType,
  ) {
    const hasPetitionWithLowerPermission = await this.exists(
      /* sql */ `
        select min(pp.type) from petition p
          join petition_permission pp on pp.petition_id = p.id
        where pp.user_id = ? and pp.deleted_at is null
          and p.is_template = ? and p.deleted_at is null and p.org_id = ?
          and exists(
            select * from unnest(?::text[]) as t(prefix) where starts_with(p.path, prefix)
          )
        group by p.id
        having min(pp.type) > ?
      `,
      [userId, isTemplate, orgId, this.sqlArray(paths), permissionType],
    );
    return !hasPetitionWithLowerPermission;
  }

  async updatePetitionPaths(
    petitionIds: number[],
    paths: string[],
    source: string,
    destination: string,
    isTemplate: boolean,
    user: User,
  ) {
    await this.raw(
      /* sql */ `
        with user_petition_ids as (
          select p.id from petition p
            join petition_permission pp on pp.petition_id = p.id
          where pp.user_id = ? and pp.deleted_at is null
            and p.is_template = ? and p.deleted_at is null and p.org_id = ?
            and (p.id in ? or exists(
              select * from unnest(?::text[]) as t(prefix) where starts_with(p.path, prefix)
            ))
        )
        update petition p
        set
          "path" = concat(?::text, substring("path", length(?) + 1)),
          updated_at = NOW(),
          updated_by = ?,
          last_change_at = NOW()
        from user_petition_ids ids where ids.id = p.id;
      `,
      [
        user.id,
        isTemplate,
        user.org_id,
        this.sqlIn(petitionIds.length > 0 ? petitionIds : [-1]),
        this.sqlArray(paths),
        destination,
        source,
        `User:${user.id}`,
      ],
    );
  }

  async getUserPetitionsInsideFolders(paths: string[], isTemplate: boolean, user: User) {
    return await this.raw<Petition>(
      /* sql */ `
      select p.* from petition p
        join petition_permission pp on p.id = pp.petition_id
      where pp.user_id = ? and pp.deleted_at is null
        and p.is_template = ? and p.deleted_at is null and p.org_id = ?
        and exists(
          select * from unnest(?::text[]) as t(prefix) where starts_with(p.path, prefix)
        )
        group by p.id
        order by p.path asc, p.id asc;
    `,
      [user.id, isTemplate, user.org_id, this.sqlArray(paths)],
    );
  }

  async checkUserMentions(
    mentions: ReturnType<typeof collectMentionsFromSlate>,
    petitionId: number,
    throwOnNoPermission: boolean,
    userId: number,
    sharePetition?: { permissionType: PetitionPermissionType; isSubscribed: boolean },
  ) {
    if (mentions.length === 0) {
      return;
    }
    const [userMentions, userGroupMentions] = partition(mentions, (m) => m.type === "User");
    const permissions = await this.from("petition_permission")
      .where("petition_id", petitionId)
      .whereNull("deleted_at")
      .andWhere((q) => {
        q.whereIn(
          "user_id",
          userMentions.map((u) => u.id),
        ).orWhereIn(
          "user_group_id",
          userGroupMentions.map((ug) => ug.id),
        );
      })
      .select("user_id", "user_group_id");

    const userIdsWithNoPermissions = userMentions
      .map((m) => m.id)
      .filter((id) => !permissions.some((p) => p.user_id === id));
    const userGroupIdsWithNoPermissions = userGroupMentions
      .map((m) => m.id)
      .filter((id) => !permissions.some((p) => p.user_group_id === id));

    if (userIdsWithNoPermissions.length > 0 || userGroupIdsWithNoPermissions.length > 0) {
      if (throwOnNoPermission) {
        throw {
          code: "NO_PERMISSIONS_MENTION_ERROR",
          ids: [
            ...userIdsWithNoPermissions.map((id) => toGlobalId("User", id)),
            ...userGroupIdsWithNoPermissions.map((id) => toGlobalId("UserGroup", id)),
          ],
        };
      } else if (isNonNullish(sharePetition)) {
        await this.addPetitionPermissions(
          [petitionId],
          [
            ...userIdsWithNoPermissions.map((userId) => ({
              type: "User" as const,
              id: userId,
              isSubscribed: sharePetition.isSubscribed,
              permissionType: sharePetition.permissionType,
            })),
            ...userGroupIdsWithNoPermissions.map((groupId) => ({
              type: "UserGroup" as const,
              id: groupId,
              isSubscribed: sharePetition.isSubscribed,
              permissionType: sharePetition.permissionType,
            })),
          ],
          "User",
          userId,
          true,
        );
      }
    }
  }

  /**
   * creates the required accesses and messages to send a petition to a single contact group
   */
  async createAccessesAndMessages(
    petition: Pick<Petition, "id" | "name" | "reminders_config">,
    contactIds: number[],
    args: {
      skipEmailSend?: boolean | null;
      remindersConfig?: PetitionAccessReminderConfig | null;
      scheduledAt?: Date | null;
      subject: string;
      body: any;
    },
    user: User,
    userDelegate: User | null,
    fromPublicPetitionLink: boolean,
  ) {
    try {
      const remindersConfig =
        args.remindersConfig === undefined
          ? (petition.reminders_config as PetitionAccessReminderConfig | null)
          : args.remindersConfig;
      const accesses = await this.createAccesses(
        petition.id,
        contactIds.map((contactId) => ({
          petition_id: petition.id,
          contact_id: contactId,
          delegate_granter_id: userDelegate ? user.id : null,
          automatic_reminders_left: Math.min(remindersConfig?.limit ?? 0, 10),
          reminders_left: 10,
          reminders_active: Boolean(remindersConfig),
          reminders_config: remindersConfig,
          next_reminder_at: remindersConfig
            ? calculateNextReminder(args.scheduledAt ?? new Date(), remindersConfig)
            : null,
        })),
        userDelegate ? userDelegate : user,
        fromPublicPetitionLink,
      );
      const messages = await this.createMessages(
        petition.id,
        args.skipEmailSend ? null : (args.scheduledAt ?? null),
        accesses.map((access) => ({
          petition_access_id: access.id,
          status: args.skipEmailSend ? "PROCESSED" : args.scheduledAt ? "SCHEDULED" : "PROCESSING",
          email_subject: args.subject,
          email_body: JSON.stringify(args.body ?? []),
        })),
        userDelegate ? userDelegate : user,
      );

      return {
        accesses,
        messages,
        result: RESULT.SUCCESS,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message, { stack: error.stack });
      }
      return { result: RESULT.FAILURE, error };
    }
  }

  /** prefills a given petition with replies defined in prefill argument,
   * where each key inside the object is a field alias and the value is the reply content.
   * based on the field type the value could be an array for creating multiple replies.
   * If no field is found for a given key/alias, that entry is ignored.
   * If the reply is invalid given the field options, it will be ignored.
   * If the field is configured to be replied only from profile, the reply will be ignored.
   */
  async prefillPetition(petitionId: number, prefill: Record<string, any>, owner: User) {
    const fields = await this.loadAllFieldsByPetitionId(petitionId);
    const parsedReplies = await this.parsePrefillReplies(prefill, fields);

    const [fieldGroupReplies, otherReplies] = partition(
      parsedReplies,
      (r) => r.fieldType === "FIELD_GROUP",
    );

    // first create every other reply that has type !== FIELD_GROUP
    if (otherReplies.length > 0) {
      await this.createPetitionFieldReply(
        petitionId,
        otherReplies.map((reply) => ({
          user_id: owner.id,
          petition_field_id: reply.fieldId,
          content: this.petitionFields.mapReplyContentToDatabase(reply.fieldType, reply.content),
          type: reply.fieldType,
        })),
        `User:${owner.id}`,
      );
    }

    if (fieldGroupReplies.length > 0) {
      // load empty FIELD_GROUP replies to be able to use those instead of creating new ones
      const emptyFieldGroupReplies = (
        await this.loadEmptyFieldGroupReplies(unique(fieldGroupReplies.map((r) => r.fieldId)))
      ).flat();

      const emptyFieldGroupRepliesByFieldId = groupBy(
        emptyFieldGroupReplies,
        (r) => r.petition_field_id,
      );

      const emptyGroupReplies = await pMap(
        fieldGroupReplies,
        async (reply) => {
          const field = fields.find((f) => f.id === reply.fieldId);
          assert(field, "Field not found for reply");
          if (!field.multiple) {
            // on non-multiple fields, we can only have one reply, so we need to delete the existing one
            await this.deletePetitionFieldReplies([{ id: field.id }], `User:${owner.id}`);
          }

          // prioritize using empty replies over creating new ones
          const emptyReply = field.multiple
            ? emptyFieldGroupRepliesByFieldId[reply.fieldId]?.pop()
            : undefined;

          if (isNonNullish(emptyReply)) {
            return emptyReply;
          }

          const [newReply] = await this.createPetitionFieldReply(
            petitionId,
            {
              user_id: owner.id,
              petition_field_id: reply.fieldId,
              content: {},
              type: "FIELD_GROUP",
            },
            `User:${owner.id}`,
          );
          return newReply;
        },
        { concurrency: 1 },
      );

      // create "children" replies for each FIELD_GROUP reply
      for (const [parentReply, { childrenReplies }] of zip(emptyGroupReplies, fieldGroupReplies)) {
        if (isNonNullish(childrenReplies) && childrenReplies.length > 0) {
          await this.createPetitionFieldReply(
            petitionId,
            childrenReplies.map((reply) => ({
              user_id: owner.id,
              petition_field_id: reply.fieldId,
              content: this.petitionFields.mapReplyContentToDatabase(
                reply.fieldType,
                reply.content,
              ),
              type: reply.fieldType,
              parent_petition_field_reply_id: parentReply.id,
            })),
            `User:${owner.id}`,
          );
        }
      }
    }

    return (await this.loadPetition(petitionId))!;
  }

  readonly loadEmptyFieldGroupReplies = this.buildLoadMultipleBy(
    "petition_field_reply",
    "petition_field_id",
    (q) =>
      q
        .whereNull("parent_petition_field_reply_id")
        .whereNull("deleted_at")
        .whereRaw(
          /* sql */ `
      not exists (
        select pfr.id from petition_field_reply pfr
          where pfr.parent_petition_field_reply_id = petition_field_reply.id
          and pfr.deleted_at is null
      )
    `,
        )
        .orderBy("id", "desc"),
  );

  private async parsePrefillReplies(
    prefill: Record<string, any>,
    fields: Pick<
      PetitionField,
      | "id"
      | "type"
      | "alias"
      | "options"
      | "parent_petition_field_id"
      | "multiple"
      | "profile_type_field_id"
    >[],
    parentFieldId: number | null = null,
  ) {
    const entries = Object.entries(prefill);
    const result: {
      fieldId: number;
      fieldType: PetitionFieldType;
      content: any;
      childrenReplies?: {
        fieldId: number;
        fieldType: PetitionFieldType;
        content: any;
      }[];
    }[] = [];

    const rootFields = fields.filter((f) => f.parent_petition_field_id === parentFieldId);

    for (const [alias, value] of entries) {
      const field = rootFields.find((f) => f.alias === alias);

      if (
        !field ||
        ![
          "TEXT",
          "SELECT",
          "DYNAMIC_SELECT",
          "SHORT_TEXT",
          "CHECKBOX",
          "NUMBER",
          "PHONE",
          "DATE",
          "DATE_TIME",
          "FIELD_GROUP",
        ].includes(field.type)
      ) {
        continue;
      }

      if (field.options.replyOnlyFromProfile) {
        continue;
      }

      const fieldReplies = unMaybeArray(
        (field.multiple || field.type === "CHECKBOX" || field.type === "DYNAMIC_SELECT") &&
          typeof value === "string"
          ? // allow multiple replies on a single string, like "Option1,Option2,Option4"
            // If reply contains a comma, it must be escaped.
            // e.g.: "Yes\,i want to...,No\, i don't want to..." will be split as: ["Yes, i want to...", "No, i don't want to..."]
            value.split(/(?<!\\),/).map((part) => part.replace(/\\,/g, ","))
          : value,
      );
      const singleReplies: {
        content: any;
        childrenReplies?: { fieldId: number; fieldType: PetitionFieldType; content: any }[];
      }[] = [];

      if (field.type === "CHECKBOX") {
        // for CHECKBOX fields, a single reply can contain more than 1 option, so each reply is a string[]
        if (fieldReplies.every((r) => typeof r === "string")) {
          singleReplies.push({ content: { value: unique(fieldReplies) } });
        } else if (fieldReplies.every((r) => Array.isArray(r))) {
          singleReplies.push(...fieldReplies.map((r) => ({ content: { value: unique(r) } })));
        }
      } else if (field.type === "DYNAMIC_SELECT") {
        // for DYNAMIC_SELECT field, a single reply is like ["Cataluña", "Barcelona"]. each element on the array is a selection of that level.
        // here we need to add the label for sending it to the backend with correct format. e.g.: [["Comunidad Autónoma", "Cataluña"], ["Provincia", "Barcelona"]]
        if (fieldReplies.every((r) => typeof r === "string")) {
          singleReplies.push({
            content: { value: fieldReplies.map((value, i) => [field.options.labels[i], value]) },
          });
        } else if (fieldReplies.every((r) => Array.isArray(r))) {
          singleReplies.push(
            ...fieldReplies.map((reply: string[]) => ({
              content: { value: reply.map((value, i) => [field.options.labels[i], value]) },
            })),
          );
        }
      } else if (field.type === "DATE_TIME") {
        singleReplies.push(...fieldReplies.map((r) => ({ content: r }))); // DATE_TIME replies already are objects with { datetime, timezone } format
      } else if (field.type === "FIELD_GROUP") {
        // for FIELD_GROUP field, a single reply is an object with the child field alias as key and the reply as value
        if (typeof value === "object") {
          singleReplies.push(
            ...(await pMap(fieldReplies, async (childPrefill) => ({
              content: {},
              childrenReplies: await this.parsePrefillReplies(childPrefill, fields, field.id),
            }))),
          );
        }
      } else if (field.type === "NUMBER") {
        singleReplies.push(
          // try to parse reply as a number with decimals. If NaN, validateReplyContent will ignore it
          ...fieldReplies.map((value) => ({ content: { value: parseFloat(value) } })),
        );
      } else {
        singleReplies.push(...fieldReplies.map((value) => ({ content: { value } })));
      }

      for (const { content, childrenReplies } of singleReplies) {
        try {
          await this.petitionValidation.validateFieldReplyContent(field, content);
          result.push({ fieldId: field.id, fieldType: field.type, content, childrenReplies });
        } catch {}
      }
    }

    return result;
  }

  async createPublicPetitionLinkPrefillData(
    data: CreatePublicPetitionLinkPrefillData,
    createdBy: string,
  ) {
    const [row] = await this.insert("public_petition_link_prefill_data", {
      ...data,
      created_by: createdBy,
    }).select("*");

    return row;
  }

  readonly loadPublicPetitionLinkPrefillDataByKeycode = this.buildLoadBy(
    "public_petition_link_prefill_data",
    "keycode",
    (q) => q.whereNull("deleted_at"),
  );

  async restoreDeletedPetition(petitionId: number) {
    const [petition] = await this.from("petition")
      .where({ id: petitionId })
      .whereNull("anonymized_at")
      .whereNotNull("deleted_at")
      .select("*");

    if (!petition) {
      throw new Error("PETITION_NOT_FOUND");
    }

    await this.withTransaction(async (t) => {
      // restore last OWNER permission to be deleted
      await this.from("petition_permission", t)
        .where(
          "id",
          this.from("petition_permission")
            .where({ petition_id: petitionId, type: "OWNER" })
            .whereNotNull("deleted_at")
            .orderBy("deleted_at", "desc")
            .limit(1)
            .select("id"),
        )
        .update({ deleted_at: null, deleted_by: null });

      await this.from("petition", t)
        .where("id", petitionId)
        .update({ deleted_at: null, deleted_by: null });
    });
  }

  async loadOriginalMessageByPetitionAccess(petitionAccessId: number, petitionId: number) {
    const allAccesses = await this.loadAccessesForPetition(petitionId);
    let access = await this.loadAccess(petitionAccessId);

    let triesLeft = 10;
    while (access?.delegator_contact_id && triesLeft > 0) {
      access = allAccesses.find((a) => a.contact_id === access!.delegator_contact_id) ?? null;
      triesLeft--;
    }
    if (access) {
      const [firstMessage] = await this.loadMessagesByPetitionAccessId(access.id);
      return firstMessage;
    }
    return null;
  }

  async userHasAccessToPetitionFieldReply(petitionFieldReplyId: number, userId: number) {
    const [reply, field] = await Promise.all([
      this.loadFieldReply(petitionFieldReplyId),
      this.loadFieldForReply(petitionFieldReplyId),
    ]);

    if (!reply || !field) {
      return false;
    }

    return await this.userHasAccessToPetitions(userId, [field.petition_id]);
  }

  readonly loadPetitionFieldChildren = this.buildLoadMultipleBy(
    "petition_field",
    "parent_petition_field_id",
    (q) => {
      q.whereNull("deleted_at").whereNotNull("parent_petition_field_id").orderBy("position", "asc");
    },
  );

  async linkPetitionFieldChildren(
    petitionId: number,
    parentFieldId: number,
    childrenFieldIds: number[],
    updatedBy: string,
  ) {
    await this.withTransaction(async (t) => {
      await this.transactionLock(`reorderPetitionFields(${petitionId})`, t);

      const allFields = await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .orderBy("id", "asc")
        .select("*");

      const rootFields = allFields.filter((f) => f.parent_petition_field_id === null);
      const currentChildren = allFields.filter((f) => f.parent_petition_field_id === parentFieldId);
      const parent = allFields.find((f) => f.id === parentFieldId)!;

      const newRootFields = rootFields.filter((f) => !childrenFieldIds.includes(f.id));

      const newChildrenFields = [
        ...currentChildren,
        ...childrenFieldIds.map((id) => allFields.find((f) => f.id === id)!), // insert new children below current ones
      ];

      const allUpdatedFields: PetitionField[] = [
        // update position and parent_id of new root fields after unlink
        ...newRootFields.map((f, i) => ({ ...f, position: i, parent_petition_field_id: null })),
        // update positions and parent_id of new children of parent
        ...newChildrenFields.map((f, i) => ({
          ...f,
          position: i,
          parent_petition_field_id: parentFieldId,
        })),
        // also pass every child of other FIELD_GROUP's so we can validate reorder
        ...allFields.filter(
          (f) =>
            isNonNullish(f.parent_petition_field_id) &&
            f.parent_petition_field_id !== parentFieldId,
        ),
      ];

      this.validateFieldReorder(
        allUpdatedFields,
        newRootFields.map((f) => f.id),
      );

      this.validateFieldReorder(
        allUpdatedFields,
        newChildrenFields.map((f) => f.id),
        parentFieldId,
      );

      // [id, position, parent_petition_field_id]
      // filter all fields that will not change its position nor parent
      const fieldsToUpdate = allFields
        .map((field) => {
          const updatedField = allUpdatedFields.find((f) => f.id === field.id)!;
          return updatedField.position === field.position &&
            updatedField.parent_petition_field_id === field.parent_petition_field_id
            ? null
            : [updatedField.id, updatedField.position, updatedField.parent_petition_field_id];
        })
        .filter(isNonNullish);

      if (fieldsToUpdate.length > 0) {
        await this.raw(
          /* sql */ `
        update petition_field pf
        set
          position = t.position,
          parent_petition_field_id = t.parent_petition_field_id,
          optional = (
            -- first child is always required
            case when (t.position = 0 and t.parent_petition_field_id is not null) then false else pf.optional end
          ),
          is_internal = (
            -- children of internal field will always be internal
            case when (t.parent_petition_field_id is not null and ?) then true else pf.is_internal end
          ),
          updated_at = now(),
          updated_by = ?
        from (?) as t (id, position, parent_petition_field_id)
        where pf.id = t.id
          and pf.petition_id = ?
          and pf.deleted_at is null
      `,
          [
            parent.is_internal,
            updatedBy,
            this.sqlValues(fieldsToUpdate, ["int", "int", "int"]),
            petitionId,
          ],
          t,
        );
      }
    });

    await this.deletePetitionFieldRepliesByFieldIds(childrenFieldIds, updatedBy);
    await this.deletePetitionFieldCommentsByFieldIds(petitionId, childrenFieldIds, updatedBy);
  }

  async unlinkPetitionFieldChildren(
    petitionId: number,
    parentFieldId: number,
    childrenFieldIds: Maybe<number[]>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    if (isNonNullish(childrenFieldIds) && childrenFieldIds.length === 0) {
      throw new Error("childrenFieldIds can't be empty");
    }

    const unlinkedChildrenIds = await this.withTransaction(async (t) => {
      await this.transactionLock(`reorderPetitionFields(${petitionId})`, t);

      const allFields = await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .orderBy("id", "asc")
        .select("*");

      const rootFields = allFields.filter((f) => f.parent_petition_field_id === null);
      const rootFieldIds = rootFields.map((f) => f.id);
      const currentChildren = allFields.filter((f) => f.parent_petition_field_id === parentFieldId);
      const parent = allFields.find((f) => f.id === parentFieldId)!;

      const childrenIdsToUnlink = childrenFieldIds ?? currentChildren.map((f) => f.id);

      const newChildrenFields = currentChildren.filter((f) => !childrenIdsToUnlink.includes(f.id));

      const parentFieldIndex = rootFieldIds.indexOf(parentFieldId);
      const newRootFields = [
        ...rootFieldIds.slice(0, parentFieldIndex + 1),
        ...childrenIdsToUnlink, // insert new fields below parent field
        ...rootFieldIds.slice(parentFieldIndex + 1),
      ].map((id) => allFields.find((f) => f.id === id)!);

      const allUpdatedFields: PetitionField[] = [
        // update position and parent_id of new root fields after unlink
        ...newRootFields.map((f, i) => ({ ...f, position: i, parent_petition_field_id: null })),
        // update positions and parent_id of new children of parent
        ...newChildrenFields.map((f, i) => ({
          ...f,
          position: i,
          parent_petition_field_id: parentFieldId,
        })),
        // also pass every child of other FIELD_GROUP's so we can validate reorder
        ...allFields.filter(
          (f) =>
            isNonNullish(f.parent_petition_field_id) &&
            f.parent_petition_field_id !== parentFieldId,
        ),
      ];

      this.validateFieldReorder(
        allUpdatedFields,
        newRootFields.map((f) => f.id),
      );

      this.validateFieldReorder(
        allUpdatedFields,
        newChildrenFields.map((f) => f.id),
        parentFieldId,
      );

      // [id, position, parent_petition_field_id]
      // filter all fields that will not change its position nor parent
      const fieldsToUpdate = allFields
        .map((field) => {
          const updatedField = allUpdatedFields.find((f) => f.id === field.id)!;
          return updatedField.position === field.position &&
            updatedField.parent_petition_field_id === field.parent_petition_field_id
            ? null
            : [updatedField.id, updatedField.position, updatedField.parent_petition_field_id];
        })
        .filter(isNonNullish);

      if (fieldsToUpdate.length > 0) {
        await this.raw(
          /* sql */ `
        update petition_field pf
        set
          position = t.position,
          parent_petition_field_id = t.parent_petition_field_id,
          optional = (
            -- first child is always required
            case when (t.position = 0 and t.parent_petition_field_id is not null) then false else pf.optional end
          ),
          is_internal = (
            -- children of internal field will always be internal
            case when (t.parent_petition_field_id is not null and ?) then true else pf.is_internal end
          ),
          updated_at = now(),
          updated_by = ?
        from (?) as t (id, position, parent_petition_field_id)
        where pf.id = t.id
          and pf.petition_id = ?
          and pf.deleted_at is null
      `,
          [
            parent.is_internal,
            updatedBy,
            this.sqlValues(fieldsToUpdate, ["int", "int", "int"]),
            petitionId,
          ],
          t,
        );
      }
      return childrenIdsToUnlink;
    }, t);

    await this.deletePetitionFieldRepliesByFieldIds(unlinkedChildrenIds, updatedBy);
    await this.deletePetitionFieldCommentsByFieldIds(petitionId, unlinkedChildrenIds, updatedBy);
  }

  readonly loadPetitionFieldGroupChildReplies = this.buildLoader<
    { parentPetitionFieldReplyId: number; petitionFieldId: number },
    PetitionFieldReply[],
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_field_reply", t)
        .whereIn("petition_field_id", unique(keys.map((x) => x.petitionFieldId)))
        .whereIn(
          "parent_petition_field_reply_id",
          unique(keys.map((x) => x.parentPetitionFieldReplyId)),
        )
        .whereNotNull("parent_petition_field_reply_id")
        .whereNull("deleted_at")
        .orderBy([
          { column: "created_at", order: "asc" },
          { column: "id", order: "asc" },
        ])
        .select("*");

      const results = groupBy(
        rows,
        keyBuilder(["parent_petition_field_reply_id", "petition_field_id"]),
      );
      return keys
        .map(keyBuilder(["parentPetitionFieldReplyId", "petitionFieldId"]))
        .map((key) => results[key] ?? []);
    },
    { cacheKeyFn: keyBuilder(["parentPetitionFieldReplyId", "petitionFieldId"]) },
  );

  async deleteEmptyFieldGroupReplies(fieldId: number, deletedBy: string) {
    await this.raw(
      /* sql */ `
      update petition_field_reply pfr
      set
        deleted_at = NOW(),
        deleted_by = ?
      where 
        type = 'FIELD_GROUP'
        and petition_field_id = ?
        and deleted_at is null
        and not exists (
          select 
            id 
          from 
            petition_field_reply
          where
            parent_petition_field_reply_id = pfr.id
            and deleted_at is null
        )
    `,
      [deletedBy, fieldId],
    );
  }
  async createEmptyFieldGroupReply(
    fieldIds: number[],
    data: Pick<CreatePetitionFieldReply, "associated_profile_id">,
    user: User,
    t?: Knex.Transaction,
  ) {
    if (fieldIds.length === 0) {
      return [];
    }

    return await this.insert(
      "petition_field_reply",
      fieldIds.map((fieldId) => ({
        ...data,
        petition_field_id: fieldId,
        user_id: user.id,
        type: "FIELD_GROUP",
        content: {},
        status: "PENDING",
        created_by: `User:${user.id}`,
        updated_by: `User:${user.id}`,
      })),
      t,
    );
  }

  async createVariable(petitionId: number, data: PetitionVariable, updatedBy: string) {
    const [petition] = await this.raw<Petition>(
      /* sql */ `
        update petition
        set 
          variables = coalesce(variables, '[]') || jsonb_build_object('name', ?::text, 'default_value', ?::float),
          last_change_at = now(),
          updated_at = now(),
          updated_by = ?
        where id = ?
        returning *;
      `,
      [data.name, data.default_value, updatedBy, petitionId],
    );

    return petition;
  }

  async updateVariable(
    petitionId: number,
    key: string,
    data: Omit<PetitionVariable, "name">,
    updatedBy: string,
  ) {
    const [petition] = await this.raw<Petition>(
      /* sql */ `
      update petition
      set 
        variables = (
        select jsonb_agg(
          case
            when element->>'name' = ? then jsonb_build_object('name', ?::text, 'default_value', ?::float)
            else element
          end
        )
        from jsonb_array_elements(variables) as element
        ),
        last_change_at = now(),
        updated_at = now(),
        updated_by = ?
      where id = ?
      returning *;
      `,
      [key, key, data.default_value, updatedBy, petitionId],
    );

    return petition;
  }

  async deleteVariable(petitionId: number, key: string, updatedBy: string) {
    const [petition] = await this.raw<Petition>(
      /* sql */ `
      update petition
      set variables = coalesce(
        (
          select jsonb_agg(element)
          from jsonb_array_elements(variables) as element
          where element->>'name' != ?
        ), 
        '[]'::jsonb -- if there's no variables left, set it to empty array
      ),
      last_change_at = now(),
      updated_at = now(),
      updated_by = ?
      where id = ?
      returning *;
    `,
      [key, updatedBy, petitionId],
    );

    return petition;
  }

  readonly loadResolvedPetitionVariables = this.buildLoader<
    number,
    { name: string; value: number | null }[]
  >(async (petitionIds) => {
    const composedPetitions = await this.getComposedPetitionFieldsAndVariables(
      petitionIds as number[],
    );

    return composedPetitions.map((petition) => {
      const evaluatedFields = evaluateFieldLogic(petition);

      const finalVariables = evaluatedFields[0].finalVariables;
      return petition.variables.map((variable) => {
        const total = finalVariables[variable.name];
        return {
          name: variable.name,
          value: isFinite(total) ? total : null,
        };
      });
    });
  });

  async updatePetitionLastChangeAt(petitionId: number) {
    const [petition] = await this.from("petition")
      .where("id", petitionId)
      .whereNull("deleted_at")
      .update({ last_change_at: this.now() }, "*");

    this.loadPetition.dataloader.clear(petitionId);
    return petition;
  }

  async createAiCompletionLog(data: CreateAiCompletionLog, createdBy: string) {
    const [row] = await this.insert("ai_completion_log", {
      ...data,
      created_by: createdBy,
      created_at: this.now(),
    }).returning("*");

    return row;
  }

  async updateAiCompletionLog(id: number, data: Partial<AiCompletionLog>, updatedBy: string) {
    const [row] = await this.from("ai_completion_log")
      .where({ id })
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");

    return row;
  }

  readonly loadPetitionSummaryRequest = this.buildLoadBy("ai_completion_log", "id", (q) =>
    q.where({ type: "PETITION_SUMMARY", deprecated_at: null }),
  );

  async updatePetitionSummaryAiCompletionLogId(
    petition: Pick<Petition, "id" | "summary_ai_completion_log_id">,
    summaryId: number | null,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    if (isNonNullish(petition.summary_ai_completion_log_id)) {
      await this.from("ai_completion_log", t)
        .where({
          id: petition.summary_ai_completion_log_id,
          deprecated_at: null,
        })
        .update({
          deprecated_at: this.now(),
        });
    }

    await this.from("petition", t)
      .where({
        id: petition.id,
        deleted_at: null,
      })
      .update({
        summary_ai_completion_log_id: summaryId,
        updated_at: this.now(),
        updated_by: updatedBy,
      });
  }

  async clearPetitionSummaryConfigWithIntegration(integrationId: number, updatedBy: string) {
    await this.raw(
      /* sql */ `
      update petition
      set 
        summary_config = null,
        updated_at = now(),
        updated_by = ?
      where deleted_at is null
      and "summary_config" is not null
      and ("summary_config"->>'integration_id')::int = ?
    `,
      [updatedBy, integrationId],
    );
  }

  async fieldsCanBeReplied(
    fields: { id: number; parentReplyId?: number | null }[],
    overwrite: boolean,
  ) {
    const [_fieldsNoParent, _fieldsWithParent] = partition(fields, (f) =>
      isNullish(f.parentReplyId),
    );

    const [fieldsNoParent, fieldsNoParentReplies, fieldsWithParent, fieldsChildReplies] =
      await Promise.all([
        this.loadField(_fieldsNoParent.map((f) => f.id)),
        this.loadRepliesForField(_fieldsNoParent.map((f) => f.id)),
        this.loadField(_fieldsWithParent.map((f) => f.id)),
        this.loadPetitionFieldGroupChildReplies.raw(
          _fieldsWithParent.map((f) => ({
            petitionFieldId: f.id,
            parentPetitionFieldReplyId: f.parentReplyId!,
          })),
        ),
      ]);

    for (const [field, replies] of [
      ...zip(fieldsNoParent, fieldsNoParentReplies),
      ...zip(fieldsWithParent, fieldsChildReplies),
    ]) {
      if (!field || (!field.multiple && replies.length > 0 && !overwrite)) {
        return "FIELD_ALREADY_REPLIED";
      }

      if (field.options.replyOnlyFromProfile === true) {
        return "REPLY_ONLY_FROM_PROFILE";
      }
    }

    return true;
  }

  async replyIsForFieldOfType(replyIds: number[], types: PetitionFieldType[]) {
    const [fields, replies] = await Promise.all([
      this.loadFieldForReply(replyIds),
      this.loadFieldReply(replyIds),
    ]);

    const invalidField = fields.find((field) => !types.includes(field!.type));
    const invalidReply = replies.find((reply) => !types.includes(reply!.type));

    if (invalidField || invalidReply) {
      return false;
    }

    return true;
  }

  async fieldHasType(fieldIds: number[], types: PetitionFieldType[]) {
    const fields = await this.loadField(fieldIds);
    return fields.every((field) => types.includes(field!.type));
  }

  async repliesCanBeUpdated(replyIds: number[]) {
    const replies = await this.loadFieldReply(replyIds);
    if (replies.some((r) => isNullish(r))) {
      // field or reply could be already deleted, throw FORBIDDEN error
      return "REPLY_NOT_FOUND";
    }

    const fields = await this.loadFieldForReply(replyIds);
    if (
      fields.some(
        (f) =>
          f?.parent_petition_field_id &&
          f?.profile_type_field_id &&
          f?.options.replyOnlyFromProfile === true,
      )
    ) {
      return "REPLY_ONLY_FROM_PROFILE";
    }

    const fieldGroupReplies = replies.filter(isNonNullish).filter((r) => r.type === "FIELD_GROUP");

    const allReplies = replies;

    if (fieldGroupReplies.length > 0) {
      const childFields = await this.loadPetitionFieldChildren(
        fieldGroupReplies.map((r) => r.petition_field_id),
      );

      if (childFields.length > 0) {
        const fieldGroupChildReplies = (
          await this.loadPetitionFieldGroupChildReplies.raw(
            zip(fieldGroupReplies, childFields).flatMap(([reply, fields]) =>
              fields.map((field) => ({
                petitionFieldId: field.id,
                parentPetitionFieldReplyId: reply.id,
              })),
            ),
          )
        ).flat();

        allReplies.push(...fieldGroupChildReplies);
      }
    }

    if (allReplies.some((r) => r!.status === "APPROVED" || r!.anonymized_at !== null)) {
      return "REPLY_ALREADY_APPROVED";
    }

    return true;
  }

  async replyCanBeDeleted(replyId: number) {
    const field = await this.loadFieldForReply(replyId);
    if (!field) {
      return "REPLY_ALREADY_DELETED";
    }
    if (field.type === "FIELD_GROUP" && !field.optional) {
      const replies = await this.loadRepliesForField(field.id);
      if (replies.length === 1 && replies[0].id === replyId) {
        return "CANT_DELETE_FIELD_GROUP_REPLY";
      }
      this.loadRepliesForField.dataloader.clear(field.id);
    }
    return true;
  }

  async fieldHasParent(childrenFieldIds: number[], parentFieldId: number | null) {
    const fields = await this.loadField(childrenFieldIds);

    return fields.every(
      (f) =>
        isNonNullish(f?.parent_petition_field_id) &&
        (isNullish(parentFieldId) || f!.parent_petition_field_id === parentFieldId),
    );
  }

  readonly loadPetitionFieldGroupRelationshipsByPetitionId = this.buildLoadMultipleBy(
    "petition_field_group_relationship",
    "petition_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "asc").orderBy("id", "asc"),
  );

  readonly loadPetitionFieldGroupRelationship = this.buildLoadBy(
    "petition_field_group_relationship",
    "id",
    (q) => q.whereNull("deleted_at"),
  );

  async getPetitionFieldGroupRelationshipsByPetitionFieldId(
    petitionId: number,
    petitionFieldId: number,
  ) {
    return await this.from("petition_field_group_relationship")
      .where("petition_id", petitionId)
      .where((q) =>
        q
          .where("left_side_petition_field_id", petitionFieldId)
          .orWhere("right_side_petition_field_id", petitionFieldId),
      )
      .whereNull("deleted_at")
      .orderBy("created_at", "asc")
      .orderBy("id", "asc");
  }

  async resetPetitionFieldGroupRelationships(
    petitionId: number,
    relationships: {
      id?: number | null;
      leftSidePetitionFieldId: number;
      rightSidePetitionFieldId: number;
      profileRelationshipTypeId: number;
      direction: ProfileRelationshipTypeDirection;
    }[],
    updatedBy: string,
  ) {
    // if relationships array is empty, remove every relationship
    if (relationships.length === 0) {
      await this.from("petition_field_group_relationship")
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .update({
          deleted_at: this.now(),
          deleted_by: updatedBy,
        });

      return;
    }

    const [relationshipsWithId, relationshipsNoId] = partition(relationships, (r) =>
      isNonNullish(r.id),
    );

    // 1st, remove every relationship not present in array,
    // excluding the ones with id that will be updated in 2nd step
    await this.raw(
      /* sql */ `
      with rows_for_delete as (
        select
          left_side_petition_field_id,
          right_side_petition_field_id,
          profile_relationship_type_id,
          direction
        from petition_field_group_relationship
        where 
          deleted_at is null  
          and petition_id = ?
          ${relationshipsWithId.length > 0 ? /* sql */ `and id not in ?` : ""}
        except
        select 
          * 
        from (?) as t(left_side_petition_field_id, right_side_petition_field_id, profile_relationship_type_id, direction)
      )
      update petition_field_group_relationship pfgr
      set 
        deleted_at = now(),
        deleted_by = ?
      from rows_for_delete rfd
      where
        pfgr.left_side_petition_field_id = rfd.left_side_petition_field_id
        and pfgr.right_side_petition_field_id = rfd.right_side_petition_field_id
        and pfgr.profile_relationship_type_id = rfd.profile_relationship_type_id
        and pfgr.direction = rfd.direction
        and pfgr.deleted_at is null
        and pfgr.petition_id = ?
    `,
      [
        petitionId,
        relationshipsWithId.length > 0 ? this.sqlIn(relationshipsWithId.map((r) => r.id!)) : null,
        this.sqlValues(
          relationships.map((r) => [
            r.leftSidePetitionFieldId,
            r.rightSidePetitionFieldId,
            r.profileRelationshipTypeId,
            r.direction,
          ]),
          ["int", "int", "int", "profile_relationship_type_direction"],
        ),
        updatedBy,
        petitionId,
      ].filter(isNonNullish),
    );

    // 2nd, update relationships that contain the id
    if (relationshipsWithId.length > 0) {
      await this.raw(
        /* sql */ `
        with rows_for_update as (
          select * from (?) as t(id, left_side_petition_field_id, right_side_petition_field_id, profile_relationship_type_id, direction)
        )
        update petition_field_group_relationship pfgr
        set 
          left_side_petition_field_id = rfu.left_side_petition_field_id,
          right_side_petition_field_id = rfu.right_side_petition_field_id,
          profile_relationship_type_id = rfu.profile_relationship_type_id,
          direction = rfu.direction,
          updated_at = now(),
          updated_by = ?
        from rows_for_update rfu
        where pfgr.id = rfu.id;
      `,
        [
          this.sqlValues(
            relationshipsWithId.map((r) => [
              r.id!,
              r.leftSidePetitionFieldId,
              r.rightSidePetitionFieldId,
              r.profileRelationshipTypeId,
              r.direction,
            ]),
            ["int", "int", "int", "int", "profile_relationship_type_direction"],
          ),
          updatedBy,
        ],
      );
    }

    // 3rd, relationships with no id will be inserted, ignoring conflicts
    if (relationshipsNoId.length > 0) {
      await this.raw(
        /* sql */ `
          ? 
          on conflict (petition_id, left_side_petition_field_id, right_side_petition_field_id, profile_relationship_type_id, direction) 
          where deleted_at is null
          do nothing;
        `,
        [
          this.from("petition_field_group_relationship").insert(
            relationshipsNoId.map((r) => ({
              petition_id: petitionId,
              left_side_petition_field_id: r.leftSidePetitionFieldId,
              right_side_petition_field_id: r.rightSidePetitionFieldId,
              profile_relationship_type_id: r.profileRelationshipTypeId,
              direction: r.direction,
              created_at: this.now(),
              created_by: updatedBy,
              updated_by: updatedBy,
            })),
          ),
        ],
      );
    }
  }

  async setAutomaticNumberingOnPetitionFields(
    petitionId: number,
    showNumbering: boolean,
    updatedBy: string,
  ) {
    await this.from("petition_field")
      .where({
        petition_id: petitionId,
        type: "HEADING",
        deleted_at: null,
      })
      .update({
        options: this.knex.raw(
          /* sql */ `options || jsonb_build_object('showNumbering', ?::boolean)`,
          [showNumbering],
        ),
        updated_at: this.now(),
        updated_by: updatedBy,
      });
  }

  async attachPetitionMetadata(petitionId: number, metadata: any, updatedBy: string) {
    await this.from("petition")
      .where("id", petitionId)
      .update({
        metadata: this.knex.raw("metadata || ?", [this.json(metadata)]),
        updated_at: this.now(),
        updated_by: updatedBy,
      });
  }
  async attachPetitionFieldReplyMetadata(replyId: number, metadata: any, updatedBy: string) {
    await this.from("petition_field_reply")
      .where("id", replyId)
      .update({
        metadata: this.knex.raw("metadata || ?", [this.json(metadata)]),
        updated_at: this.now(),
        updated_by: updatedBy,
      });
  }
  async attachPetitionSignatureRequestMetadata(petitionSignatureRequestId: number, metadata: any) {
    await this.from("petition_signature_request")
      .where("id", petitionSignatureRequestId)
      .update({
        metadata: this.knex.raw("metadata || ?", [this.json(metadata)]),
        updated_at: this.now(),
      });
  }

  async getPetitionIdsFromTemplateReadyToClose(templateId: number) {
    const petitions = await this.from("petition")
      .whereNull("deleted_at")
      .whereNull("anonymized_at")
      .where("template_public", false)
      .where("from_template_id", templateId)
      .whereIn("status", ["PENDING", "COMPLETED"])
      .where((q) => {
        q.whereNull("latest_signature_status").orWhereIn("latest_signature_status", [
          "COMPLETED",
          "CANCELLED",
          "CANCELLED_BY_USER",
        ]);
      })
      .select("id");

    return petitions.map((p) => p.id);
  }

  readonly loadStandardListDefinition = this.buildLoadBy("standard_list_definition", "id");

  readonly loadLatestStandardListDefinitionByName = this.buildLoadBy(
    "standard_list_definition",
    "list_name",
    (q) => q.orderBy("list_version", "desc"),
  );

  async getAllStandardListDefinitions() {
    return await this.from("standard_list_definition");
  }

  /**
   * gets definitions for every standard list having in account version overrides defined on the petition
   */
  readonly loadResolvedStandardListDefinitionsByPetitionId = this.buildLoader<
    number,
    StandardListDefinition[]
  >(async (ids, t) => {
    const definitions = await this.raw<StandardListDefinition & { _rank: string }>(
      /* sql */ `
      select *, rank() over (partition by list_name order by list_version desc) _rank
      from standard_list_definition  
    `,
      undefined,
      t,
    );
    const petitions = await this.from("petition", t)
      .whereIn("id", ids)
      .whereNull("deleted_at")
      .select(["id", "is_template", "standard_list_definition_override"]);

    return ids.map((id) => {
      const petition = petitions.find((p) => p.id === id);
      if (!petition) {
        return [];
      }
      // on templates, always return latest version of each list
      if (petition.is_template) {
        return definitions.filter((f) => f._rank === "1");
      }

      // on petitions, check the overrides
      return Object.entries(groupBy(definitions, (d) => d.list_name))
        .map(([listName, definitionVersions]) => {
          const override = petition.standard_list_definition_override.find(
            (o) => o.list_name === listName,
          );

          if (override) {
            return definitionVersions.find((v) => v.list_version === override.list_version) ?? null;
          }

          return definitionVersions.find((v) => v._rank === "1") ?? null;
        })
        .filter(isNonNullish);
    });
  });

  async upsertStandardListDefinitions(data: CreateStandardListDefinition[], createdBy: string) {
    return await this.raw<StandardListDefinition>(
      /* sql */ `
      ? on conflict (list_name, list_version) 
        do update set
        title = EXCLUDED.title,
        values = EXCLUDED.values,
        source_name = EXCLUDED.source_name,
        source_url = EXCLUDED.source_url,
        version_url = EXCLUDED.version_url,
        version_format = EXCLUDED.version_format,
        updated_at = now(),
        updated_by = ?
      returning *;`,
      [
        this.from("standard_list_definition").insert(
          data.map((d) => ({
            ...d,
            version_format: this.json(d.version_format),
            values: this.json(d.values),
            created_by: createdBy,
          })),
        ),
        createdBy,
      ],
    );
  }

  /**
   * @param listNames can contain the name of a customList or a standardList. In case its a custom list, it will be ignored
   */
  async updateStandardListDefinitionOverride(
    petitionId: number,
    listNames: string[],
    t?: Knex.Transaction,
  ) {
    if (listNames.length === 0) {
      return;
    }
    const [petition] = await this.from("petition", t)
      .where("id", petitionId)
      .whereNull("deleted_at")
      .select(["is_template", "custom_lists", "standard_list_definition_override"]);

    if (petition.is_template) {
      return;
    }

    // if the listName is found in customLists array, consider it a customList and ignore it
    const standardListNames = listNames.filter(
      (name) => !petition.custom_lists?.find((l) => l.name === name),
    );

    if (standardListNames.length === 0) {
      // nothing to update
      return;
    }

    const data = await this.from("standard_list_definition", t)
      .whereIn("list_name", standardListNames)
      .select(["list_name", "list_version"])
      .orderBy("list_version", "asc");

    const latestStandardListByListName = indexBy(data, (d) => d.list_name);

    await this.from("petition", t)
      .where("id", petitionId)
      .whereNull("deleted_at")
      .where("is_template", false)
      .update({
        standard_list_definition_override: this.json(
          unique([
            ...petition.standard_list_definition_override.map((l) => l.list_name),
            ...standardListNames,
          ]).map((name) => {
            const usedList = petition.standard_list_definition_override.find(
              (d) => d.list_name === name,
            );
            if (usedList) {
              return usedList;
            }
            const latest = latestStandardListByListName[name];
            assert(latest, `Standard list definition ${name} not found`);
            return {
              list_name: name,
              list_version: latest.list_version,
            };
          }),
        ),
      });
  }

  async getPetitionStartedProcesses(petitionId: number) {
    const processes: ("SIGNATURE" | "APPROVAL")[] = [];
    const currentSignature = await this.loadLatestPetitionSignatureByPetitionId.raw(petitionId);
    if (
      currentSignature &&
      ["ENQUEUED", "PROCESSING", "PROCESSED"].includes(currentSignature.status)
    ) {
      processes.push("SIGNATURE");
    }

    const currentApprovalRequest = await this.from("petition_approval_request_step")
      .where("petition_id", petitionId)
      .whereNull("deprecated_at")
      .whereIn("status", ["PENDING", "SKIPPED", "APPROVED", "REJECTED"])
      .select("*");

    if (currentApprovalRequest.length > 0) {
      processes.push("APPROVAL");
    }

    return processes;
  }

  /**
   * Returns a subset of the provided petitionIds that do not exist in the organization or are deleted
   */
  async getInvalidIdsByOrg(petitionIds: number[], orgId: number) {
    if (petitionIds.length === 0) {
      return [];
    }

    const rows = await this.raw<{ id: number }>(
      /* sql */ `
      with ids as (
        select * from (?) as t(id)
      )
      select i.id from ids i
      left join petition p on p.id = i.id and p.deleted_at is null and p.org_id = ?
      where p.id is null
    `,
      [
        this.sqlValues(
          petitionIds.map((id) => [id]),
          ["int"],
        ),
        orgId,
      ],
    );

    return rows.map((r) => r.id);
  }

  async transferUserPetitionPermissions(
    userIds: number[],
    transferToUserId: number,
    includeDrafts: boolean,
    transferredBy: string,
  ) {
    return await pMapChunk(
      userIds,
      async (userIdsChunk) => {
        return await this.raw<
          {
            petition_id: number;
          } & (
            | {
                source: "transferred_petitions";
                previous_owner_id: number;
              }
            | { source: "deleted_drafts" }
          )
        >(
          /* sql */ `
          with 
          -- permissions directly assigned to userIds (not assigned to userIds via an user_group)
          directly_assigned_petition_permissions as (
            select pp.id, pp.user_id, pp.type, pp.petition_id, p.status as petition_status
              from petition_permission pp
              join petition p on pp.petition_id = p.id
              where pp.user_id in :userIds
              and pp.deleted_at is null
              and pp.user_group_id is null
              and pp.from_user_group_id is null
              and p.deleted_at is null
          ),
          -- non-owner permissions for userIds will be deleted
          non_owner_petition_permissions as (
            select * 
              from directly_assigned_petition_permissions dapp
              where dapp.type != 'OWNER'
          ),
          -- owner permissions for userIds on petition DRAFTs will be deleted or transferred to the new owner, based on the includeDrafts arg
          owner_draft_petition_permissions as (
            select * from directly_assigned_petition_permissions dapp
              where dapp.type = 'OWNER'
              and dapp.petition_status = 'DRAFT'
          ),
          -- owner permissions for userIds will be transferred to the new owner
          -- here we will delete those permissions so we can assign new OWNERs later.
          previous_owner_petition_permissions as (
            update petition_permission pp
            set
              deleted_at = now(),
              deleted_by = :transferredBy
            from directly_assigned_petition_permissions dapp
            where dapp.id = pp.id
            and dapp.type = 'OWNER'
            and (:includeDrafts or dapp.petition_status is null or dapp.petition_status != 'DRAFT')
            returning pp.*
          ),
          new_owner_petition_permissions as (
            insert into petition_permission ("petition_id", "user_id", "type", "created_by", "updated_by", "updated_at")
            select popp.petition_id, :transferToUserId, 'OWNER', :transferredBy, :transferredBy, now()
            from previous_owner_petition_permissions popp
            on conflict (petition_id, user_id) where deleted_at is null and from_user_group_id is null and user_group_id is null
            do nothing
            returning *
          ),
          -- delete non-owner permissions for userIds
          deleted_non_owner_petition_permissions as (
            update petition_permission pp
            set
              updated_at = now(),
              updated_by = :transferredBy,
              deleted_at = now(),
              deleted_by = :transferredBy
            from non_owner_petition_permissions nopp
            where pp.id = nopp.id
            and pp.deleted_at is null
          ),
          -- delete permissions on DRAFT petitions if includeDrafts=true
          deleted_owner_draft_petition_permissions as (
            update petition_permission pp
            set
              updated_at = now(),
              updated_by = :transferredBy,
              deleted_at = now(),
              deleted_by = :transferredBy
            from owner_draft_petition_permissions dodpp
            where pp.id = dodpp.id
            and not :includeDrafts
            returning pp.*
          ),
          -- delete DRAFT petitions if those permissions were deleted
          deleted_draft_petitions as (
            update petition p
            set
              deleted_at = now(),
              deleted_by = :transferredBy
            from deleted_owner_draft_petition_permissions dodpp
            where dodpp.petition_id = p.id
            returning p.*
          ),
          -- delete template default permissions for userIds
          deleted_template_default_permissions as (
            update template_default_permission tdp
            set
              deleted_at = now(),
              deleted_by = :transferredBy
            where tdp.user_id in :userIds
            and tdp.deleted_at is null
            returning tdp.*
          ),
          -- create template default permissions for the new owner based on deleted permissions from above
          new_template_default_permissions as (
            insert into template_default_permission (user_id, template_id, type, is_subscribed, created_by)
            select :transferToUserId, dtdp.template_id, dtdp.type, dtdp.is_subscribed, :transferredBy
            from deleted_template_default_permissions dtdp
            on conflict (template_id, user_id) where deleted_at is null
            do update
            -- if the new owner already has a permission, we keep the highest one
            set "type" = least(EXCLUDED.type, template_default_permission.type)
          )
          -- every transferred petition
          select popp.petition_id, popp.user_id as previous_owner_id, 'transferred_petitions' as source from previous_owner_petition_permissions popp
          union all
          -- every deleted DRAFT petition
          select ddp.id as petition_id, null as previous_owner_id, 'deleted_drafts' as source from deleted_draft_petitions ddp
        `,
          {
            userIds: this.sqlIn(userIdsChunk),
            includeDrafts,
            transferToUserId,
            transferredBy,
          },
        );
      },
      { concurrency: 1, chunkSize: 1000 },
    );
  }
}

@injectable()
export class ReadOnlyPetitionRepository extends PetitionRepository {
  constructor(
    @inject(KNEX_READ_ONLY) knex: Knex,
    @inject(LOGGER) logger: ILogger,
    @inject(PETITION_FILTER_REPOSITORY_HELPER)
    petitionFilter: PetitionFilterRepositoryHelper,
    @inject(QUEUES_SERVICE) queues: QueuesService,
    @inject(ReadOnlyFileRepository) files: ReadOnlyFileRepository,
    @inject(PETITION_VALIDATION_SERVICE) petitionValidation: PetitionValidationService,
    @inject(PETITION_FIELD_SERVICE) petitionFields: PetitionFieldService,
  ) {
    super(knex, logger, petitionFilter, queues, files, petitionValidation, petitionFields);
  }
}
