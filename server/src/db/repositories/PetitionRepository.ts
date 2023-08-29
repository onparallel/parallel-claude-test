import { differenceInSeconds, isSameMonth, isThisMonth, subMonths } from "date-fns";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import pMap from "p-map";
import {
  countBy,
  findLast,
  groupBy,
  indexBy,
  isDefined,
  mapValues,
  maxBy,
  omit,
  partition,
  pipe,
  sort,
  sortBy,
  uniq,
  zip,
} from "remeda";
import { RESULT } from "../../graphql";
import { ILogger, LOGGER } from "../../services/Logger";
import { QUEUES_SERVICE, QueuesService } from "../../services/QueuesService";
import { average, unMaybeArray } from "../../util/arrays";
import { completedFieldReplies } from "../../util/completedFieldReplies";
import { fieldReplyContent } from "../../util/fieldReplyContent";
import { PetitionFieldVisibility, evaluateFieldVisibility } from "../../util/fieldVisibility";
import { fromGlobalId, isGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { isValueCompatible } from "../../util/isValueCompatible";
import { keyBuilder } from "../../util/keyBuilder";
import { LazyPromise } from "../../util/promises/LazyPromise";
import { pMapChunk } from "../../util/promises/pMapChunk";
import { removeNotDefined } from "../../util/remedaExtensions";
import { PetitionAccessReminderConfig, calculateNextReminder } from "../../util/reminderUtils";
import { safeJsonParse } from "../../util/safeJsonParse";
import { collectMentionsFromSlate } from "../../util/slate/mentions";
import {
  replacePlaceholdersInSlate,
  replacePlaceholdersInText,
} from "../../util/slate/placeholders";
import { SlateNode } from "../../util/slate/render";
import { random } from "../../util/token";
import { Maybe, MaybeArray, Replace, UnwrapArray } from "../../util/types";
import { validateReplyContent } from "../../util/validateReplyContent";
import { TemplateStatsReportInput } from "../../workers/tasks/TemplateStatsReportRunner";
import {
  Contact,
  ContactLocale,
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
  OrgIntegration,
  Petition,
  PetitionAccess,
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
  PetitionSignatureCancelReason,
  PetitionSignatureRequest,
  PetitionStatus,
  PetitionUserNotificationType,
  PublicPetitionLink,
  TemplateDefaultPermission,
  User,
} from "../__types";
import {
  CreatePetitionEvent,
  GenericPetitionEvent,
  PetitionEvent,
  ReplyCreatedEvent,
  ReplyDeletedEvent,
  ReplyStatusChangedEvent,
  ReplyUpdatedEvent,
} from "../events/PetitionEvent";
import {
  BaseRepository,
  PageOpts,
  Pagination,
  TableCreateTypes,
  TableTypes,
} from "../helpers/BaseRepository";
import { defaultFieldProperties, validateFieldOptions } from "../helpers/fieldOptions";
import { SortBy, escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  CommentCreatedUserNotification,
  CreatePetitionUserNotification,
  GenericPetitionUserNotification,
  PetitionUserNotification,
} from "../notifications";
import { FileRepository } from "./FileRepository";
import { OrganizationRepository } from "./OrganizationRepository";

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

interface PetitionFilter {
  path?: string | null;
  status?: PetitionStatus[] | null;
  locale?: ContactLocale | null;
  signature?: PetitionSignatureStatusFilter[] | null;
  type?: PetitionType | null;
  tags?: PetitionTagFilter | null;
  profileIds?: number[] | null;
  sharedWith?: PetitionSharedWithFilter | null;
  fromTemplateId?: number[] | null;
  permissionTypes?: PetitionPermissionType[] | null;
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
  email: string;
  isPreset?: boolean; // preset signers can only be edited on compose
}

export interface PetitionSignatureConfig {
  orgIntegrationId: number;
  signersInfo: PetitionSignatureConfigSigner[];
  timezone: string;
  title: string | null;
  review?: boolean;
  allowAdditionalSigners?: boolean;
  message?: string;
  additionalSignersInfo?: PetitionSignatureConfigSigner[];
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
  }[CancelReason];

@injectable()
export class PetitionRepository extends BaseRepository {
  private readonly REPLY_EVENTS_DELAY_SECONDS = 60;
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(QUEUES_SERVICE) private queues: QueuesService,
    @inject(LOGGER) private logger: ILogger,
    @inject(FileRepository) private files: FileRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
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
      .mmodify((q) => {
        if (startDate && endDate) {
          q.andWhereBetween("created_at", [startDate, endDate]);
        }
      })
      .select("*");
  }

  async userHasAccessToPetitions(
    userId: number,
    petitionIds: number[],
    permissionTypes?: PetitionPermissionType[],
  ) {
    const permissions = await this.userHasAccessToPetitionsRaw(
      userId,
      petitionIds,
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

  getPaginatedPetitionsForUser(
    orgId: number,
    userId: number,
    opts: {
      search?: string | null;
      searchByNameOnly?: boolean;
      excludeAnonymized?: boolean;
      sortBy?: SortBy<"name" | "lastUsedAt" | "sentAt" | "createdAt">[];
      filters?: PetitionFilter | null;
    } & PageOpts,
  ): Pagination<
    | Petition
    | {
        name: string;
        petition_count: number;
        min_permission: PetitionPermissionType;
        is_folder: true;
        path: string;
      }
  > {
    const type = opts.filters?.type || "PETITION";
    const { search, filters } = opts;

    const builders: Knex.QueryCallbackWithArgs[] = [
      (q) =>
        q
          .joinRaw(
            /* sql */ `join petition_permission pp on p.id = pp.petition_id and pp.user_id = ? and pp.deleted_at is null`,
            [userId],
          )
          .joinRaw(/* sql */ `left join petition_message pm on p.id = pm.petition_id`)
          .where("p.org_id", orgId)
          .whereNull("p.deleted_at")
          .where("p.is_template", type === "TEMPLATE"),
    ];
    if (search) {
      builders.push((q) => {
        if (opts.searchByNameOnly) {
          q.whereRaw(/* sql */ `p.name ilike :search escape '\\'`, {
            search: `%${escapeLike(search, "\\")}%`,
          });
        } else if (type === "PETITION") {
          q.joinRaw(/* sql */ `left join petition_access pa on p.id = pa.petition_id `)
            .joinRaw(
              /* sql */ `left join contact c on pa.contact_id = c.id and c.deleted_at is null`,
            )
            .whereRaw(
              /* sql */ ` 
              (
                p.name ilike :search escape '\\'
                or (p.path != '/' and exists (
                  select from unnest(regexp_split_to_array(trim(both '/' from p.path), '/')) part where part ilike :search escape '\\'
                ))
                or (
                  c.deleted_at is null and (
                    concat(c.first_name, ' ', c.last_name) ilike :search escape '\\'
                    or c.email ilike :search escape '\\'
                  )
                )
              )
            `,
              { search: `%${escapeLike(search, "\\")}%` },
            );
        } else {
          q.whereRaw(
            /* sql */ `
            (
              p.name ilike :search escape '\\'
              or (p.path != '/' and exists (
                select from unnest(regexp_split_to_array(trim(both '/' from p.path), '/')) part where part ilike :search escape '\\'
              ))
              or p.template_description ilike :search escape '\\'
            )`,
            { search: `%${escapeLike(search, "\\")}%` },
          );
        }
      });
    }
    if (filters?.locale) {
      builders.push((q) => q.where("recipient_locale", filters.locale));
    }
    if (filters?.status && type === "PETITION") {
      builders.push((q) => q.whereRaw("p.status in ?", [this.sqlIn(filters.status!)]));
    }

    if (filters?.tags) {
      const { filters: tagsFilters, operator } = filters.tags;

      builders.push((q) => {
        q.joinRaw(/* sql */ `left join petition_tag pt on pt.petition_id = p.id`).modify((q) => {
          for (const filter of tagsFilters) {
            q = operator === "AND" ? q.and : q.or;

            switch (filter.operator) {
              case "CONTAINS":
              case "DOES_NOT_CONTAIN":
                q = filter.operator.startsWith("DOES_NOT_") ? q.not : q;
                q.havingRaw(/* sql */ `array_agg(distinct pt.tag_id) @> ?`, [
                  this.sqlArray(filter.value, "int"),
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

    if (filters?.sharedWith && filters.sharedWith.filters.length > 0) {
      const { filters: sharedWithFilters, operator } = filters.sharedWith;
      builders.push((q) => {
        q.joinRaw(
          /* sql */ `join petition_permission pp2 on pp2.petition_id = p.id and pp2.deleted_at is null`,
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

    if (filters?.profileIds && filters.profileIds.length > 0) {
      builders.push((q) => {
        q.joinRaw(/* sql */ `join petition_profile pp3 on pp3.petition_id = p.id`);
        q.whereIn("pp3.profile_id", filters.profileIds!);
      });
    }

    if (filters?.signature && filters.signature.length > 0) {
      builders.push((q) =>
        q.where((q) => {
          if (filters.signature!.includes("NO_SIGNATURE")) {
            // no signature configured nor any previous signature request
            q.or.whereRaw(/* sql */ `
              p.signature_config is null
              and p.latest_signature_status is null
            `);
          }
          if (filters.signature!.includes("NOT_STARTED")) {
            // signature is configured, awaiting to complete the petition
            q.or.whereRaw(/* sql */ `
              p.signature_config is not null
              and p.latest_signature_status is null
              and p.status in ('DRAFT', 'PENDING')
            `);
          }
          if (filters.signature!.includes("PENDING_START")) {
            // petition is completed, need to manually start the signature
            // also show as pending start when user manually cancels the previous request
            // and signature is still configured
            q.or.whereRaw(/* sql */ `
              p.signature_config is not null 
              and p.status in ('COMPLETED', 'CLOSED')
              and (
                p.latest_signature_status is null
                or p.latest_signature_status = 'COMPLETED'
                or p.latest_signature_status = 'CANCELLED_BY_USER'
              )
            `);
          }
          if (filters.signature!.includes("PROCESSING")) {
            // signature is ongoing
            q.or.whereRaw(/* sql */ `
              p.latest_signature_status is not null
              and p.latest_signature_status not in ('COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED')
            `);
          }
          if (filters.signature!.includes("COMPLETED")) {
            // signature completed, everyone signed
            q.or.whereRaw(/* sql */ `
              p.signature_config is null
              and p.latest_signature_status is not null
              and p.latest_signature_status = 'COMPLETED'
            `);
          }
          if (filters.signature!.includes("CANCELLED")) {
            // cancelled by a reason external to user (request error, signer declined, etc)
            // or cancelled by user and no signature configured
            q.or.whereRaw(/* sql */ `
              p.latest_signature_status is not null
              and (
                p.latest_signature_status = 'CANCELLED'
                or ( 
                  p.latest_signature_status = 'CANCELLED_BY_USER'
                  and p.signature_config is null
                )
              )
            `);
          }
        }),
      );
    }

    if (filters?.fromTemplateId && filters.fromTemplateId.length > 0) {
      builders.push((q) => q.whereIn("p.from_template_id", filters.fromTemplateId!));
    }

    if (filters?.permissionTypes && filters.permissionTypes.length > 0) {
      builders.push((q) => q.whereIn("pp.type", filters.permissionTypes!));
    }

    if (opts.excludeAnonymized) {
      builders.push((q) => {
        q.whereNull("p.anonymized_at");
      });
    }

    const countPromise = LazyPromise.from(async () => {
      const [[{ count: petitionCount }], [{ count: folderCount }]] = await Promise.all([
        this.knex
          .with(
            "ps",
            this.knex
              .fromRaw("petition as p")
              .modify(function (q) {
                builders.forEach((b) => b.call(this, q));
                if (filters?.path) {
                  q.where("p.path", filters.path);
                }
              })
              .groupBy("p.id")
              .select(this.knex.raw(/* sql */ `distinct p.id`)),
          )
          .from("ps")
          .select<[{ count: number }]>(this.count()),
        filters?.path
          ? this.knex
              .with(
                "ps",
                this.knex
                  .fromRaw("petition as p")
                  .modify(function (q) {
                    builders.forEach((b) => b.call(this, q));
                  })
                  .whereRaw(/* sql */ `starts_with(p.path, ?) and p.path != ?`, [
                    filters.path,
                    filters.path,
                  ])
                  .groupBy("p.id")
                  .select(
                    this.knex.raw(/* sql */ `distinct get_folder_after_prefix(p.path, ?)`, [
                      filters.path,
                    ]),
                  ),
              )
              .from("ps")
              .select<[{ count: number }]>(this.count())
          : [{ count: 0 }],
      ]);
      return { petitionCount, folderCount, totalCount: petitionCount + folderCount };
    });

    return {
      totalCount: LazyPromise.from(async () => {
        const { totalCount } = await countPromise;
        return totalCount;
      }),
      items: LazyPromise.from(async () => {
        const { folderCount, totalCount } = await countPromise;
        if (totalCount === 0) {
          return [];
        }
        const applyOrder: Knex.QueryCallback = (q) => {
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
            }
          }
          // default ordering to avoid ambiguity
          q.orderBy("id");
        };

        const petitionsQuery = this.knex
          .fromRaw("petition as p")
          .groupBy("p.id")
          .modify(function (q) {
            builders.forEach((b) => b.call(this, q));
            if (filters?.path) {
              q.where("p.path", filters.path);
            }
            if (opts.sortBy?.some((s) => s.field === "lastUsedAt") && type === "TEMPLATE") {
              q.joinRaw(
                /* sql */ `
                left join (
                  select p.from_template_id as template_id, max(p.created_at) as t_last_used_at
                  from petition as p where p.created_by = ? group by p.from_template_id
                ) as t on t.template_id = p.id
              `,
                [`User:${userId}`],
              );
            }
          })
          .select(
            "p.*",
            this.knex.raw(/* sql */ `false as is_folder`),
            this.knex.raw(/* sql */ `null::int as petition_count`),
            this.knex.raw(/* sql */ `null::petition_permission_type as min_permission`),
            this.knex.raw(/* sql */ `p.name as _name`),
            this.knex.raw(/* sql */ `min(coalesce(pm.scheduled_at, pm.created_at)) as sent_at`),
            opts.sortBy?.some((s) => s.field === "lastUsedAt") && type === "TEMPLATE"
              ? this.knex.raw(
                  /* sql */ `greatest(max(t.t_last_used_at), min(pp.created_at)) as last_used_at`,
                )
              : this.knex.raw(/* sql */ `null as last_used_at`),
          );

        const items: (Petition & {
          is_folder: true;
          petition_count: number | null;
          min_permission: PetitionPermissionType | null;
          _name: string;
          sent_at: string | null;
          last_used_at: string | null;
        })[] =
          folderCount === 0
            ? await petitionsQuery
                .clone()
                .modify(applyOrder)
                .offset(opts.offset ?? 0)
                .limit(opts.limit ?? 0)
            : await this.knex
                .with(
                  "ps",
                  this.knex
                    .fromRaw("petition as p")
                    .whereRaw(/* sql */ `starts_with(p.path, ?) and p.path != ?`, [
                      filters!.path!,
                      filters!.path!,
                    ])
                    .modify(function (q) {
                      builders.forEach((b) => b.call(this, q));
                    })
                    .select(
                      "p.id",
                      "p.path",
                      this.knex.raw(/* sql */ `min(pp.type) as effective_permission`),
                    )
                    .groupBy("p.id"),
                )
                .with(
                  "fs",
                  this.knex
                    .from("ps")
                    .select(
                      this.knex.raw(/* sql */ `get_folder_after_prefix(ps.path, ?) as _name`, [
                        filters!.path!,
                      ]),
                      this.count("petition_count"),
                      this.knex.raw(/* sql */ `max(ps.effective_permission) as min_permission`),
                    )
                    .groupBy("_name"),
                )
                .with("p", petitionsQuery)
                .from("p")
                .select("p.*")
                .unionAll([
                  this.knex
                    .from("fs")
                    // join with any petition so both parts of the union have the same columns.
                    // The value from those columns will be discarded afterwards
                    .joinRaw(/* sql */ `join (select * from petition limit 1) paux on 1 = 1`)
                    .select(
                      "paux.*",
                      this.knex.raw(/* sql */ `true as is_folder`),
                      "fs.petition_count",
                      "fs.min_permission",
                      "fs._name",
                      this.knex.raw(/* sql */ `null as sent_at`),
                      this.knex.raw(/* sql */ `null as last_used_at`),
                    ),
                ])
                .modify(applyOrder)
                .offset(opts.offset ?? 0)
                .limit(opts.limit ?? 0);
        return items.map((i) =>
          i.is_folder
            ? {
                name: i._name,
                petition_count: i.petition_count!,
                min_permission: i.min_permission!,
                is_folder: true as const,
                path: `${filters!.path}${i._name}/`,
              }
            : omit(i, ["_name", "petition_count", "is_folder", "min_permission"]),
        );
      }),
    };
  }

  readonly loadFieldsForPetition = this.buildLoadMultipleBy("petition_field", "petition_id", (q) =>
    q.whereNull("deleted_at").orderBy("position"),
  );

  readonly loadFieldsForPetitionWithNullVisibility = this.buildLoadMultipleBy(
    "petition_field",
    "petition_id",
    (q) => q.where({ deleted_at: null, visibility: null }).orderBy("position"),
  );

  readonly loadFieldCountForPetition = this.buildLoadCountBy("petition_field", "petition_id", (q) =>
    q.whereNull("deleted_at"),
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
    const fieldsWithRepliesByPetitionId = await this.getPetitionFieldsWithReplies(
      petitionIds as number[],
    );

    return fieldsWithRepliesByPetitionId.map((fieldsWithReplies) => {
      const visibleFields = zip(fieldsWithReplies, evaluateFieldVisibility(fieldsWithReplies))
        .filter(([field, isVisible]) => isVisible && !field.is_internal)
        .map(([field]) => field);

      const visibleInternalFields = zip(
        fieldsWithReplies,
        evaluateFieldVisibility(fieldsWithReplies),
      )
        .filter(([field, isVisible]) => isVisible && field.is_internal)
        .map(([field]) => field);

      const validatedExternal = countBy(
        visibleFields,
        (f) => f.replies.length > 0 && f.replies.every((r) => r.status === "APPROVED"),
      );

      const validatedInternal = countBy(
        visibleInternalFields,
        (f) => f.replies.length > 0 && f.replies.every((r) => r.status === "APPROVED"),
      );

      return {
        external: {
          approved: validatedExternal,
          replied: countBy(
            visibleFields,
            (f) =>
              completedFieldReplies(f).length > 0 &&
              f.replies.some((r) => r.status === "PENDING" || r.status === "REJECTED"),
          ),
          optional: countBy(
            visibleFields,
            (f) => f.optional && completedFieldReplies(f).length === 0,
          ),
          total: visibleFields.length,
        },
        internal: {
          validated: validatedInternal,
          approved: validatedInternal,
          replied: countBy(
            visibleInternalFields,
            (f) =>
              completedFieldReplies(f).length > 0 &&
              f.replies.some((r) => r.status === "PENDING" || r.status === "REJECTED"),
          ),
          optional: countBy(
            visibleInternalFields,
            (f) => f.optional && completedFieldReplies(f).length === 0,
          ),
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
    const fieldsWithRepliesByPetitionId = await this.getPetitionFieldsWithReplies(
      petitionIds as number[],
    );

    return fieldsWithRepliesByPetitionId.map((fieldsWithReplies) => {
      const visibleFields = zip(fieldsWithReplies, evaluateFieldVisibility(fieldsWithReplies))
        .filter(([field, isVisible]) => isVisible && !field.is_internal)
        .map(([field]) => field);

      return {
        replied: countBy(visibleFields, (f) => completedFieldReplies(f).length > 0),
        optional: countBy(
          visibleFields,
          (f) => f.optional && completedFieldReplies(f).length === 0,
        ),
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

  async createAccess(
    petitionId: number,
    granterId: number,
    contactId: number | null,
    user: User,
    t?: Knex.Transaction,
  ) {
    const [access] = await this.insert(
      "petition_access",
      {
        petition_id: petitionId,
        granter_id: granterId,
        contact_id: contactId,
        keycode: random(16),
        reminders_left: 10,
        status: "ACTIVE",
        created_by: `User:${user.id}`,
        updated_by: `User:${user.id}`,
      },
      t,
    ).returning("*");

    return access;
  }

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
          reason: (isDefined(userId) ? "CANCELLED_BY_USER" : "EMAIL_BOUNCED") as any,
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
          reason: isDefined(userId) ? "DEACTIVATED_BY_USER" : "EMAIL_BOUNCED",
        },
      })),
      t,
    );
  }

  async anonymizeAccesses(
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
    accessId: number,
    contactId: number,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    return await this.from("petition_access", t)
      .where("id", accessId)
      .where("status", "ACTIVE")
      .whereNull("contact_id")
      .update(
        {
          contact_id: contactId,
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

  async createPetition(
    data: Omit<TableCreateTypes["petition"], "org_id" | "document_organization_theme_id">,
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
          status: data.is_template ? null : data.status ?? "DRAFT",
          ...omit(data, ["status"]),
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
            ...defaultFieldProperties(type),
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
    deletedBy: User,
    t?: Knex.Transaction,
  ) {
    return await this.from("petition_permission", t)
      .whereIn("petition_id", petitionIds)
      .where({
        deleted_at: null,
        user_id: userId,
      })
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${deletedBy.id}`,
      })
      .returning("*");
  }

  async deleteAllPermissions(petitionIds: number[], user: User, t?: Knex.Transaction) {
    return await this.withTransaction(async (t) => {
      return await this.from("petition_permission", t)
        .whereIn("petition_id", petitionIds)
        .where({
          deleted_at: null,
        })
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .returning("*");
    }, t);
  }

  /**
   * Delete parallel, deactivate all accesses and cancel all scheduled messages
   */
  async deletePetition(petitionId: MaybeArray<number>, user: User, t?: Knex.Transaction) {
    const petitionIds = unMaybeArray(petitionId);
    return await this.withTransaction(async (t) => {
      const [accesses, messages] = await Promise.all([
        this.from("petition_access", t)
          .whereIn("petition_id", petitionIds)
          .where("status", "ACTIVE")
          .update(
            {
              status: "INACTIVE",
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*",
          ),
        this.from("petition_message", t)
          .whereIn("petition_id", petitionIds)
          .where("status", "SCHEDULED")
          .update(
            {
              status: "CANCELLED",
            },
            "*",
          ),
      ]);
      for (const [, _accesses] of Object.entries(groupBy(accesses, (a) => a.petition_id))) {
        await this.createEvent(
          _accesses.map((access) => ({
            type: "ACCESS_DEACTIVATED",
            petition_id: _accesses[0].petition_id,
            data: {
              petition_access_id: access.id,
              user_id: user.id,
              reason: "DEACTIVATED_BY_USER",
            },
          })),
          t,
        );
      }
      for (const [, _messages] of Object.entries(groupBy(messages, (m) => m.petition_id))) {
        await this.createEvent(
          _messages.map((message) => ({
            type: "MESSAGE_CANCELLED",
            petition_id: _messages[0].petition_id,
            data: {
              petition_message_id: message.id,
              user_id: user.id,
              reason: "CANCELLED_BY_USER",
            },
          })),
          t,
        );
      }

      const [petitions] = await Promise.all([
        this.from("petition", t)
          .whereIn("id", petitionIds)
          .update({
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          })
          .returning("*"),
        this.deletePetitionAttachmentByPetitionId(petitionIds, user, t),
        this.from("petition_profile", t).whereIn("petition_id", petitionIds).delete(),
      ]);

      return petitions;
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
          updated_by: updatedBy,
        },
        "*",
      );
  }

  async closePetition(petitionId: number, updatedBy: string, t?: Knex.Transaction) {
    return await this.from("petition", t).where("id", petitionId).update(
      {
        status: "CLOSED",
        closed_at: this.now(),
        updated_at: this.now(),
        updated_by: updatedBy,
      },
      "*",
    );
  }

  async updateFieldPositions(petitionId: number, fieldIds: number[], user: User) {
    return await this.withTransaction(async (t) => {
      const fields = await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .select("id", "is_fixed", "position", "visibility")
        .orderBy("position", "asc");

      // check only valid fieldIds and not repeated
      const _fieldIds = uniq(fieldIds);
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

      // check visibility conditions fields refer to previous fields
      const positions = Object.fromEntries(
        Array.from(fieldIds.entries()).map(([index, id]) => [id, index]),
      );
      for (const field of fields) {
        const visibility = field.visibility as Maybe<PetitionFieldVisibility>;
        if (visibility?.conditions.some((c) => positions[c.fieldId] >= positions[field.id])) {
          throw new Error("INVALID_FIELD_CONDITIONS_ORDER");
        }
      }

      await this.raw(
        /* sql */ `
      update petition_field as pf set
        position = t.position,
        updated_at = NOW(),
        updated_by = ?
      from (?) as t (id, position)
      where t.id = pf.id and pf.position != t.position;
    `,
        [
          `User:${user.id}`,
          this.sqlValues(
            fieldIds.map((id, i) => [id, i]),
            ["int", "int"],
          ),
        ],
        t,
      );

      const [petition] = await this.from("petition", t)
        .where("id", petitionId)
        .update(
          {
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
          },
          "*",
        );
      return petition;
    });
  }

  async clonePetitionField(petitionId: number, fieldId: number, user: User) {
    const [field] = await this.from("petition_field")
      .where({ id: fieldId, petition_id: petitionId })
      .whereNull("deleted_at");
    if (!field) {
      throw new Error("invalid fieldId: " + fieldId);
    }
    return await this.createPetitionFieldAtPosition(
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
      field.position! + 1,
      user,
    );
  }

  async createPetitionFieldAtPosition(
    petitionId: number,
    data: Omit<CreatePetitionField, "petition_id" | "position">,
    position: number,
    user: User,
    t?: Knex.Transaction<any, any>,
  ) {
    return await this.withTransaction(async (t) => {
      const [{ max }] = await this.from("petition_field", t)
        .where({
          petition_id: petitionId,
          deleted_at: null,
        })
        .max("position");
      if (max === null) {
        position = 0;
      } else {
        position = position === -1 ? max + 1 : Math.min(max + 1, position);
      }

      await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .where("position", ">=", position)
        .update(
          {
            position: this.knex.raw(`position + 1`),
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
          },
          "id",
        );

      const [[field]] = await Promise.all([
        this.insert(
          "petition_field",
          {
            petition_id: petitionId,
            position,
            ...data,
            created_by: `User:${user.id}`,
            updated_by: `User:${user.id}`,
          },
          t,
        ),
        this.from("petition", t)
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
              updated_by: `User:${user.id}`,
            },
            "*",
          ),
      ]);

      return field;
    }, t);
  }

  async deletePetitionFieldReplies(fieldIds: number[], user: User, t?: Knex.Transaction) {
    await this.from("petition_field_reply", t)
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      })
      .whereIn("petition_field_id", fieldIds)
      .whereNull("deleted_at");
  }

  async deletePetitionField(petitionId: number, fieldId: number, user: User) {
    return await this.withTransaction(async (t) => {
      const [field] = await this.raw<PetitionField & { old_position: number }>(
        /* sql */ `
        update petition_field f
          set position = null,
          deleted_at = NOW(),
          deleted_by = ?
        from petition_field f2 
          where f.id = f2.id 
          and f.petition_id = ?
          and f.deleted_at is null
          and f.is_fixed = false
          and f.id = ?
        returning f.*, f2.position as old_position;
      `,
        [`User:${user.id}`, petitionId, fieldId],
        t,
      );

      if (!field) {
        throw new Error("Invalid petition field id");
      }

      await Promise.all([
        this.from("petition_field_reply", t)
          .update({
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          })
          .where({
            petition_field_id: fieldId,
            deleted_at: null,
          }),
        this.from("petition_field_comment", t)
          .update({
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          })
          .where({
            petition_field_id: fieldId,
            deleted_at: null,
          }),
      ]);

      const [[petition]] = await Promise.all([
        this.from("petition", t).where("id", petitionId).select("*"),
        this.from("petition_field", t)
          .update({
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
            position: this.knex.raw(`"position" - 1`) as any,
          })
          .where({
            petition_id: petitionId,
            deleted_at: null,
          })
          .where("position", ">", field.old_position),
        // safe-delete attachments on this field (same attachment can be linked to another field)
        this.deletePetitionFieldAttachmentByFieldId(fieldId, user, t),
        // delete user notifications related to this petition field
        this.from("petition_user_notification", t)
          .where({ petition_id: petitionId, type: "COMMENT_CREATED" })
          .whereRaw("data ->> 'petition_field_id' = ?", fieldId)
          .delete(),
        // delete contact notifications related to this petition field
        this.from("petition_contact_notification", t)
          .where({ petition_id: petitionId, type: "COMMENT_CREATED" })
          .whereRaw("data ->> 'petition_field_id' = ?", fieldId)
          .delete(),
      ]);
      return petition;
    });
  }

  async updatePetitionField(
    petitionId: number,
    fieldId: number,
    data: Partial<CreatePetitionField>,
    user: User,
    t?: Knex.Transaction<any, any>,
  ) {
    return this.withTransaction(async (t) => {
      const [field] = await this.from("petition_field", t)
        .where({ id: fieldId, petition_id: petitionId })
        .update(
          {
            ...data,
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
          },
          "*",
        );
      if (field.is_fixed && data.type !== undefined) {
        throw new Error("UPDATE_FIXED_FIELD_ERROR");
      }

      // update petition status if changing anything other than title and description
      if (Object.keys(omit(data, ["title", "description"])).length > 0) {
        await this.from("petition", t)
          .where({
            id: petitionId,
          })
          .update(
            {
              status: this.knex.raw(/* sql */ `
                case is_template 
                when false then 
                  (case status 
                    when 'COMPLETED' then 'PENDING'
                    when 'CLOSED' then 'PENDING'
                    else status
                  end) 
                else
                  NULL
                end
              `) as any,
              closed_at: null,
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*",
          );
      }

      return field;
    }, t);
  }

  async validateFieldData(fieldId: number, data: { options: Maybe<Record<string, any>> }) {
    const field = await this.loadField(fieldId);
    if (!field) {
      throw new Error("Petition field not found");
    }
    validateFieldOptions(field.type, { ...field.options, ...data.options });
    return field;
  }

  readonly loadRepliesForField = this.buildLoadMultipleBy(
    "petition_field_reply",
    "petition_field_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at").orderBy("id"),
  );

  async updateRemindersForPetition(
    petitionId: number,
    nextReminderAt: Maybe<Date>,
    t?: Knex.Transaction,
  ) {
    return this.withTransaction(async (t) => {
      return await this.from("petition_access", t).where("petition_id", petitionId).update(
        {
          next_reminder_at: nextReminderAt,
        },
        "*",
      );
    }, t);
  }

  async createPetitionFieldReply(
    petitionId: number,
    data: MaybeArray<CreatePetitionFieldReply>,
    createdBy: string,
  ) {
    const dataArray = unMaybeArray(data);

    const fieldIds = uniq(dataArray.map((d) => d.petition_field_id));
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

    if (fields.some((f) => isDefined(f) && !f.is_internal)) {
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

    await pMap(
      replies,
      async (reply) => {
        await this.createEventWithDelay(
          {
            type: "REPLY_CREATED",
            petition_id: petitionId,
            data: {
              ...(createdBy.startsWith("User")
                ? { user_id: reply.user_id! }
                : { petition_access_id: reply.petition_access_id! }),
              petition_field_id: reply.petition_field_id,
              petition_field_reply_id: reply.id,
            },
          },
          this.REPLY_EVENTS_DELAY_SECONDS,
        );
      },
      { concurrency: 1 },
    );
    return replies;
  }

  async updatePetitionFieldRepliesContent(
    petitionId: number,
    data: { id: number; content?: any }[],
    updater: User | PetitionAccess,
    t?: Knex.Transaction,
  ) {
    const replyIds = uniq(data.map((d) => d.id));

    const [fields, oldReplies] = await Promise.all([
      this.loadFieldForReply(replyIds),
      this.loadFieldReply(replyIds),
    ]);

    const isContact = "keycode" in updater;
    const updatedBy = isContact ? `Contact:${updater.contact_id}` : `User:${updater.id}`;

    const replies = await this.raw<PetitionFieldReply>(
      /* sql */ `
      with input_data as (
        select * from (?) as t(reply_id, content)
      )
      update petition_field_reply pfr
      set
        content = id.content,
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
          data.map((d) => [d.id, d.content]),
          ["int", "jsonb"],
        ),
        updatedBy,
        isContact ? null : updater.id,
        isContact ? updater.id : null,
      ],
      t,
    );

    if (fields.some((f) => !f!.is_internal)) {
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

    const petitionAccessIdOrUserId = isContact
      ? { petition_access_id: updater.id }
      : { user_id: updater.id };

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

  async updatePetitionMetadata(petitionId: number, metadata: any) {
    const [petition] = await this.from("petition")
      .where("id", petitionId)
      .update({ metadata }, "*");

    return petition;
  }

  async updatePetitionFieldReplyMetadata(replyId: number, metadata: any) {
    const field = await this.loadFieldForReply(replyId);
    if (!field) {
      throw new Error("Petition field not found");
    }
    const [reply] = await this.from("petition_field_reply")
      .where("id", replyId)
      .update({ metadata }, "*");
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

    if (isFileTypeField(reply.type)) {
      await this.files.deleteFileUpload(reply.content["file_upload_id"], deletedBy);
    }

    if (!field.is_internal) {
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

    await Promise.all([
      this.from("petition_field_reply")
        .update({
          deleted_at: this.now(),
          deleted_by: deletedBy,
        })
        .where("id", replyId),
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

    return field;
  }

  public async reopenPetition(petitionId: number, updatedBy: string, t?: Knex.Transaction) {
    await this.from("petition", t)
      .where({ id: petitionId, deleted_at: null })
      .whereIn("status", ["COMPLETED", "CLOSED"])
      .update({
        status: "PENDING",
        closed_at: null,
        updated_at: this.now(),
        updated_by: updatedBy,
      });

    // clear cache to make sure petition status is updated in next graphql calls
    this.loadPetition.dataloader.clear(petitionId);
  }

  async updatePendingPetitionFieldRepliesStatusByPetitionId(
    petitionId: number,
    status: PetitionFieldReplyStatus,
    updater: User,
  ) {
    const fields = await this.loadFieldsForPetition(petitionId);
    // only update reply status on fields that have require_approval set to true
    const fieldIds = fields.filter((f) => f.require_approval).map((f) => f.id);

    if (fieldIds.length === 0) {
      return [];
    }

    const replies = await this.from("petition_field_reply")
      .whereIn("petition_field_id", fieldIds)
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
    const [fields, fieldReplies] = await Promise.all([
      this.from("petition_field")
        .whereIn("petition_id", petitionIds)
        .whereNull("deleted_at")
        .whereNot("type", "HEADING"),
      this.raw<PetitionFieldReply & { upload_complete: boolean | null }>(
        /* sql */ `
          select pfr.*, fu.upload_complete
          from petition_field_reply as pfr
          join petition_field as pf on pf.id = pfr.petition_field_id 
          left join file_upload fu
            on pfr.type in ('FILE_UPLOAD', 'ES_TAX_DOCUMENTS', 'DOW_JONES_KYC')
            and (pfr.content->>'file_upload_id')::int = fu.id
          where pfr.deleted_at is null and pf.petition_id in ? and pf.deleted_at is null
        `,
        [this.sqlIn(petitionIds)],
      ),
    ]);

    const fieldsByPetition = groupBy(fields, (f) => f.petition_id);

    return petitionIds.map((id) => {
      return (fieldsByPetition[id] ?? [])
        .map((field) => ({
          ...field,
          replies: fieldReplies
            .filter((r) => r.petition_field_id === field.id && r.content !== null)
            .filter((r) => (isFileTypeField(field.type) ? r.upload_complete : true))
            .map((reply) => {
              return {
                content: isFileTypeField(field.type)
                  ? {
                      ...reply.content,
                      uploadComplete: true,
                    }
                  : reply.content,
                status: reply.status,
                anonymized_at: reply.anonymized_at,
              };
            })
            .filter((r) => r.content !== null),
        }))
        .sort((a, b) => a.position! - b.position!);
    });
  }

  async completePetition(
    petitionId: number,
    userOrAccess: User | PetitionAccess,
    extraData: Partial<Petition> = {},
    t?: Knex.Transaction,
  ) {
    const isAccess = "keycode" in userOrAccess;
    const updatedBy = `${isAccess ? "PetitionAccess" : "User"}:${userOrAccess.id}`;

    const [fieldsWithReplies] = await this.getPetitionFieldsWithReplies([petitionId]);

    const canComplete = zip(fieldsWithReplies, evaluateFieldVisibility(fieldsWithReplies)).every(
      ([field, isVisible]) =>
        (isAccess ? field.is_internal : false) ||
        field.type === "HEADING" ||
        field.optional ||
        field.replies.length > 0 ||
        !isVisible,
    );

    if (canComplete) {
      const petition = await this.withTransaction(async (t) => {
        await this.updateRemindersForPetition(petitionId, null, t);
        const [updated] = await this.from("petition", t)
          .where("id", petitionId)
          .update(
            {
              status: "COMPLETED",
              updated_at: this.now(),
              updated_by: updatedBy,
              ...extraData,
            },
            "*",
          );
        return updated;
      }, t);
      return petition;
    } else {
      throw new Error("CANT_COMPLETE_PETITION_ERROR");
    }
  }

  async processScheduledMessages() {
    return await this.from("petition_message")
      .where("status", "SCHEDULED")
      .whereNotNull("scheduled_at")
      .where("scheduled_at", "<=", this.knex.raw("CURRENT_TIMESTAMP"))
      .update({ status: "PROCESSING" }, "*");
  }

  async getRemindableAccesses() {
    return await this.from("petition_access")
      .where("status", "ACTIVE")
      .where("reminders_active", true)
      .whereNotNull("next_reminder_at")
      .where("next_reminder_at", "<=", this.knex.raw("CURRENT_TIMESTAMP"))
      .where("reminders_left", ">", 0);
  }

  async clonePetition(
    petitionId: number,
    owner: User,
    // never expose document_organization_theme_id as this must be fetched from the owner's organization
    data: Partial<Omit<TableTypes["petition"], "document_organization_theme_id">> = {},
    options?: { insertPermissions?: boolean; cloneReplies?: boolean },
    createdBy = `User:${owner.id}`,
    t?: Knex.Transaction,
  ) {
    const [sourcePetition, userPermissions] = await Promise.all([
      this.loadPetition(petitionId),
      this.loadUserPermissionsByPetitionId(petitionId),
    ]);

    if (!isDefined(sourcePetition)) {
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

      const fields = await this.loadFieldsForPetition(petitionId);
      const clonedFields =
        fields.length === 0
          ? []
          : await this.insert(
              "petition_field",
              fields.map((field) => {
                let fromPetitionFieldId: Maybe<number>;
                if (data.is_template ?? sourcePetition.is_template) {
                  fromPetitionFieldId = null;
                } else {
                  fromPetitionFieldId = sourcePetition.is_template
                    ? field.id
                    : field.from_petition_field_id;
                }
                return {
                  ...omit(field, ["id", "petition_id", "created_at", "updated_at"]),
                  petition_id: cloned.id,
                  from_petition_field_id: fromPetitionFieldId,
                  created_by: createdBy,
                  updated_by: createdBy,
                };
              }),
              t,
            ).returning("*");

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
              : userPermissions.find((p) => p.user_id === owner.id)?.is_subscribed ?? true,
            created_by: createdBy,
            updated_by: createdBy,
          },
          t,
        );
      }

      if (sourcePetition.org_id === owner.org_id) {
        // clone tags if source petition is from same org
        await this.raw(
          /* sql */ `
            insert into petition_tag (petition_id, tag_id, created_by)
            select ?, tag_id, ? from petition_tag where petition_id = ?
          `,
          [cloned.id, createdBy, petitionId],
          t,
        );
      }

      if (
        sourcePetition.org_id === owner.org_id &&
        sourcePetition.is_template &&
        (data.is_template === undefined || data.is_template === true)
      ) {
        // clone default permissions if source petition is from same org
        // and we are creating a template from another template
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
      const newFieldIds = Object.fromEntries(
        zip(
          fields.map((f) => f.id),
          sortBy(clonedFields, (f) => f.position!).map((f) => f.id),
        ),
      );

      // on RTE texts, replace globalId placeholders with the field ids of the cloned petition
      const rteUpdateData: Partial<Petition> = {};
      if (isDefined(cloned.email_subject)) {
        rteUpdateData.email_subject = replacePlaceholdersInText(
          cloned.email_subject,
          (placeholder) => {
            if (isGlobalId(placeholder, "PetitionField")) {
              return toGlobalId("PetitionField", newFieldIds[fromGlobalId(placeholder).id]);
            }
            return placeholder;
          },
        );
      }

      for (const key of ["email_body", "closing_email_body", "completing_message_body"] as const) {
        if (isDefined(cloned[key])) {
          rteUpdateData[key] = JSON.stringify(
            replacePlaceholdersInSlate(safeJsonParse(cloned[key]) as SlateNode[], (placeholder) => {
              if (isGlobalId(placeholder, "PetitionField")) {
                return toGlobalId("PetitionField", newFieldIds[fromGlobalId(placeholder).id]);
              }
              return placeholder;
            }),
          );
        }
      }

      if (Object.keys(rteUpdateData).length > 0) {
        [cloned] = await this.updatePetition(cloned.id, rteUpdateData, createdBy, t);
      }

      if (options?.cloneReplies) {
        // insert petition replies into cloned fields
        const newReplyIds = await this.clonePetitionReplies(newFieldIds, t);
        // clone some petition events into new petition
        await this.clonePetitionReplyEvents(petitionId, cloned.id, newFieldIds, newReplyIds, t);
      }

      const toUpdate = clonedFields.filter((f) => f.visibility);
      if (toUpdate.length > 0) {
        // update visibility conditions on cloned fields
        await this.raw<PetitionField>(
          /* sql */ `
          update petition_field as pf set
            visibility = t.visibility
          from (?) as t (id, visibility)
          where t.id = pf.id
          returning *;
        `,
          [
            this.sqlValues(
              toUpdate.map((field) => {
                const visibility = field.visibility as PetitionFieldVisibility;
                return [
                  field.id,
                  JSON.stringify({
                    ...visibility,
                    conditions: visibility.conditions.map((condition) => ({
                      ...condition,
                      fieldId: newFieldIds[condition.fieldId],
                    })),
                  }),
                ];
              }),
              ["int", "jsonb"],
            ),
          ],
          t,
        );
      }

      if (fields.length > 0) {
        // copy field attachments to new fields, making a copy of the file_upload
        await this.cloneFieldAttachments(fields, newFieldIds, t);
      }

      await this.clonePetitionAttachments(petitionId, cloned.id, createdBy, t);

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
        isDefined(fieldsMap[e.data.petition_field_id]) &&
        isDefined(repliesMap[e.data.petition_field_reply_id]),
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
        })) as any[],
      );
    }
  }

  private async cloneFieldAttachments(
    fields: PetitionField[],
    newIds: Record<string, number>,
    t?: Knex.Transaction,
  ) {
    const attachmentsByFieldId = (
      await this.loadFieldAttachmentsByFieldId(fields.map((f) => f.id))
    ).flat();

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

  async createReminders(data: CreatePetitionReminder[]) {
    if (data.length === 0) {
      return [];
    }
    return await this.withTransaction(async (t) => {
      await this.from("petition_access", t)
        .whereIn(
          "id",
          data.map((r) => r.petition_access_id),
        )
        .update({
          reminders_left: this.knex.raw(`"reminders_left" - 1`),
          // if only one reminder left, deactivate automatic reminders
          next_reminder_at: this.knex.raw(/* sql */ `
            case when "reminders_left" <= 1 then null else "next_reminder_at" end
          `),
          reminders_active: this.knex.raw(/* sql */ `
            case when "reminders_left" <= 1 then false else "reminders_active" end
          `),
        });
      return await this.insert("petition_reminder", data, t).returning("*");
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
    return await this.from("petition_access")
      .whereIn("id", accessIds)
      .update(
        {
          reminders_active: true,
          reminders_config: reminderConfig,
          next_reminder_at: calculateNextReminder(new Date(), reminderConfig),
        },
        "*",
      );
  }

  async loadPetitionEvent(eventId: number) {
    const [event] = await this.from("petition_event").where("id", eventId).select("*");
    return event;
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

  async getLastEventsByType<T extends PetitionEventType>(
    petitionId: number,
    eventTypes: T[],
  ): Promise<
    // Distribute union type
    (T extends any ? { type: T; last_used_at: Date } : never)[]
  > {
    const events = await this.from("petition_event")
      .where("petition_id", petitionId)
      .whereIn("type", eventTypes)
      .groupBy("type")
      .select("type", this.knex.raw("MAX(created_at) as last_used_at"));
    return events as any[];
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
        ${isDefined(options.before) ? /* sql */ `and upel.petition_event_id < ?` : ""}
        ${isDefined(options.eventTypes) ? /* sql */ `and pe.type in ?` : ""}
      order by pe.id desc
      limit ${options.limit};
    `,
      [
        userId,
        ...(isDefined(options.before) ? [options.before] : []),
        ...(isDefined(options.eventTypes) ? [this.sqlIn(options.eventTypes)] : []),
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
    const events = await this.getLastEventsByType(petitionId, [
      "PETITION_CLOSED_NOTIFIED",
      "REPLY_CREATED",
    ]);

    const lastEvent = maxBy(events, (e) => e.last_used_at.valueOf());
    if (lastEvent?.type === "PETITION_CLOSED_NOTIFIED") {
      return false;
    }

    return true;
  }

  async createEvent(events: MaybeArray<CreatePetitionEvent>, t?: Knex.Transaction) {
    if (Array.isArray(events) && events.length === 0) {
      return [];
    }

    const petitionEvents = await this.insert("petition_event", events, t);
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

    const petitionEvents = await this.insert("petition_event", eventsArray, t);
    await this.queues.enqueueEvents(petitionEvents, "petition_event", notifyAfter, t);

    return petitionEvents;
  }

  async getLatestEventForPetitionId(petitionId: number) {
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
    replies: Pick<PetitionFieldReply, "id" | "petition_field_id">[],
    updater: Pick<ReplyUpdatedEvent["data"], "petition_access_id" | "user_id">,
    t?: Knex.Transaction,
  ) {
    const latestEvent = await this.getLatestEventForPetitionId(petitionId);
    if (
      latestEvent &&
      (latestEvent.type === "REPLY_CREATED" || latestEvent.type === "REPLY_UPDATED") &&
      replies.find((r) => r.id === latestEvent.data.petition_field_reply_id) &&
      ((isDefined(updater.user_id) && latestEvent.data.user_id === updater.user_id) ||
        (isDefined(updater.petition_access_id) &&
          latestEvent.data.petition_access_id === updater.petition_access_id)) &&
      differenceInSeconds(new Date(), latestEvent.created_at) < this.REPLY_EVENTS_DELAY_SECONDS
    ) {
      await this.updateEvent(
        latestEvent.id,
        { created_at: new Date() },
        this.REPLY_EVENTS_DELAY_SECONDS,
        t,
      );
    } else {
      await this.createEventWithDelay(
        replies.map((r) => ({
          type: "REPLY_UPDATED",
          petition_id: petitionId,
          data: {
            petition_field_id: r.petition_field_id,
            petition_field_reply_id: r.id,
            ...updater,
          },
        })),
        this.REPLY_EVENTS_DELAY_SECONDS,
        t,
      );
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
        .whereIn("petition_id", uniq(keys.map((x) => x.petitionId)))
        .whereIn("petition_field_id", uniq(keys.map((x) => x.petitionFieldId)))
        .whereNull("deleted_at")
        .select<PetitionFieldComment[]>("petition_field_comment.*");

      const byId = groupBy(rows, (r) => r.petition_field_id);
      return keys.map((id) => {
        const comments = this.sortComments(byId[id.petitionFieldId] ?? []);
        return id.loadInternalComments ? comments : comments.filter((c) => c.is_internal === false);
      });
    },
    { cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId", "loadInternalComments"]) },
  );

  readonly loadPetitionFieldUnreadCommentCountForFieldAndAccess = this.buildLoader<
    { accessId: number; petitionId: number; petitionFieldId: number },
    number,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_contact_notification", t)
        .whereIn("petition_id", uniq(keys.map((x) => x.petitionId)))
        .whereIn("petition_access_id", uniq(keys.map((x) => x.accessId)))
        .whereIn(
          this.knex.raw("(data ->> 'petition_field_id')::int") as any,
          uniq(keys.map((x) => x.petitionFieldId)),
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

  loadContactHasUnreadCommentsInPetition = this.buildLoader<
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
          this.sqlIn(uniq(keys.map((k) => k.contactId))),
          this.sqlIn(uniq(keys.map((k) => k.petitionId))),
        ],
        t,
      );
      const byKey = indexBy(rows, keyBuilder(["contact_id", "petition_id"]));
      return keys.map(keyBuilder(["contactId", "petitionId"])).map((k) => isDefined(byKey[k]));
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
        .whereIn("petition_id", uniq(keys.map((x) => x.petitionId)))
        .whereIn("user_id", uniq(keys.map((x) => x.userId)))
        .whereIn(
          this.knex.raw("(data ->> 'petition_field_id')::int") as any,
          uniq(keys.map((x) => x.petitionFieldId)),
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

  async loadUnprocessedUserNotificationsOfType<Type extends PetitionUserNotificationType>(
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

  async loadUnprocessedContactNotificationsOfType(type: PetitionContactNotificationType) {
    return await this.from("petition_contact_notification")
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

  async markOldPetitionUserNotificationsAsRead(months: number) {
    await this.from("petition_user_notification")
      .whereNull("read_at")
      .whereRaw(/* sql */ `created_at < NOW() - make_interval(months => ?)`, [months])
      .update({
        read_at: this.now(),
        processed_at: this.now(),
      });
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
              ...removeNotDefined({
                processed_at: isRead ? this.now() : undefined,
              }),
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
              ...removeNotDefined({
                processed_at: isRead ? this.now() : undefined,
              }),
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
        const comments = (await this.loadPetitionFieldComment(idsChunk)) as PetitionFieldComment[];
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
          .whereIn("petition_id", uniq(comments.map((c) => c.petition_id)))
          .whereIn(
            this.knex.raw("data ->> 'petition_field_id'") as any,
            uniq(comments.map((c) => c.petition_field_id)),
          )
          .whereIn(
            this.knex.raw("data ->> 'petition_field_comment_id'") as any,
            uniq(comments.map((c) => c.id)),
          )
          .mmodify(this.filterPetitionUserNotificationQueryBuilder(filter))
          .update(
            {
              read_at: isRead ? this.now() : null,
              ...removeNotDefined({
                processed_at: isRead ? this.now() : undefined,
              }),
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
          ...removeNotDefined({
            processed_at: isRead ? this.now() : undefined,
          }),
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
      petitionFieldId: number;
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
        .whereIn("user_id", uniq(keys.map((x) => x.userId)))
        .whereIn("petition_id", uniq(keys.map((x) => x.petitionId)))
        .whereIn(
          this.knex.raw("data ->> 'petition_field_id'") as any,
          uniq(keys.map((x) => x.petitionFieldId)),
        )
        .whereIn(
          this.knex.raw("data ->> 'petition_field_comment_id'") as any,
          uniq(keys.map((x) => x.petitionFieldCommentId)),
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
      petitionFieldId: number;
      petitionFieldCommentId: number;
    },
    boolean,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("petition_contact_notification", t)
        .where("type", "COMMENT_CREATED")
        .whereIn("petition_access_id", uniq(keys.map((x) => x.petitionAccessId)))
        .whereIn("petition_id", uniq(keys.map((x) => x.petitionId)))
        .whereIn(
          this.knex.raw("data ->> 'petition_field_id'") as any,
          uniq(keys.map((x) => x.petitionFieldId)),
        )
        .whereIn(
          this.knex.raw("data ->> 'petition_field_comment_id'") as any,
          uniq(keys.map((x) => x.petitionFieldCommentId)),
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
      petitionFieldId: number;
      contentJson: any;
      isInternal: boolean;
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
      petitionFieldId: number;
      contentJson: string;
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
    petitionFieldId: number,
    petitionFieldCommentId: number,
    user: User,
  ) {
    const comment = await this.deletePetitionFieldComment(
      petitionFieldCommentId,
      `User:${user.id}`,
    );
    await this.createEvent({
      type: "COMMENT_DELETED",
      petition_id: petitionId,
      data: {
        petition_field_id: petitionFieldId,
        petition_field_comment_id: petitionFieldCommentId,
        user_id: user.id,
        is_internal: comment.is_internal,
      },
    });
  }

  async deletePetitionFieldCommentFromAccess(
    petitionId: number,
    petitionFieldId: number,
    petitionFieldCommentId: number,
    access: PetitionAccess,
  ) {
    await Promise.all([
      this.deletePetitionFieldComment(petitionFieldCommentId, `PetitionAccess:${access.id}`),
      this.createEvent({
        type: "COMMENT_DELETED",
        petition_id: petitionId,
        data: {
          petition_field_id: petitionFieldId,
          petition_field_comment_id: petitionFieldCommentId,
          petition_access_id: access.id,
        },
      }),
    ]);
  }

  private async deletePetitionFieldComment(petitionFieldCommentId: number, deletedBy: string) {
    const [comment] = await this.from("petition_field_comment")
      .where("id", petitionFieldCommentId)
      .update(
        {
          deleted_at: this.now(),
          deleted_by: deletedBy,
        },
        "*",
      );

    await Promise.all([
      this.from("petition_user_notification")
        .where({ petition_id: comment.petition_id, type: "COMMENT_CREATED" })
        .whereRaw("data ->> 'petition_field_id' = ?", comment.petition_field_id)
        .whereRaw("data ->> 'petition_field_comment_id' = ?", comment.id)
        .delete(),

      this.from("petition_contact_notification")
        .where({ petition_id: comment.petition_id, type: "COMMENT_CREATED" })
        .whereRaw("data ->> 'petition_field_id' = ?", comment.petition_field_id)
        .whereRaw("data ->> 'petition_field_comment_id' = ?", comment.id)
        .delete(),
    ]);

    return comment;
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
    const comments = (await this.loadPetitionFieldComment(
      petitionFieldCommentIds,
    )) as PetitionFieldComment[];
    await this.from("petition_contact_notification")
      .where("petition_access_id", accessId)
      .where("type", "COMMENT_CREATED")
      .whereIn("petition_id", uniq(comments.map((c) => c.petition_id)))
      .whereIn(
        this.knex.raw("data ->> 'petition_field_id'") as any,
        uniq(comments.map((c) => c.petition_field_id)),
      )
      .whereIn(
        this.knex.raw("data ->> 'petition_field_comment_id'") as any,
        uniq(comments.map((c) => c.id)),
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
      const [field] = (await this.from("petition_field", t).where({
        id: fieldId,
      })) as PetitionField[];

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

      return await this.updatePetitionField(
        petitionId,
        fieldId,
        {
          type,
          ...defaultFieldProperties(type, field),
        },
        user,
        t,
      );
    });
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
        .orderByRaw("type asc, user_group_id nulls first, created_at"),
  );

  readonly loadDirectlyAssignedUserPetitionPermissionsByUserId = this.buildLoadMultipleBy(
    "petition_permission",
    "user_id",
    (q) =>
      q
        .whereNull("deleted_at")
        .whereNull("user_group_id")
        .whereNull("from_user_group_id")
        .orderByRaw("type asc, created_at"),
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
          ? await this.raw<PetitionPermission>(
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
                this.from("petition_permission").insert(
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
                ),
                permissionType,
                createdBy,
                this.now(),
                permissionType,
              ],
              t,
            )
          : [];

      const newGroupPermissions =
        newUserGroups.length > 0
          ? await this.raw<PetitionPermission>(
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
                this.from("petition_permission").insert(
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
                ),
                permissionType,
                createdBy,
                this.now(),
                permissionType,
              ],
              t,
            )
          : [];

      // user permissions through a user group
      const groupAssignedNewUserPermissions =
        newUserGroups.length > 0
          ? await this.raw<PetitionPermission>(
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
                select petition_id from (?) as t(petition_id))
              insert into petition_permission(petition_id, user_id, from_user_group_id, is_subscribed, type, created_by, updated_by)
              select p.petition_id, gm.user_id, gm.user_group_id, gm.is_subscribed, gm.permission_type, ?, ? 
              from gm cross join p
              on conflict do nothing returning *;
            `,
              [
                this.sqlValues(
                  newUserGroups.map((ug) => [ug.id, ug.isSubscribed, ug.permissionType]),
                  ["int", "bool", "petition_permission_type"],
                ),
                this.sqlIn(
                  newUserGroups.map((ug) => ug.id),
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
            )
          : [];

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      if (createEvents && creator === "User") {
        await this.createEvent(
          [
            ...newUserPermissions.map((p) => ({
              petition_id: p.petition_id,
              type: "USER_PERMISSION_ADDED" as const,
              data: {
                user_id: creatorId,
                permission_type: p.type,
                permission_user_id: p.user_id!,
              },
            })),
            ...newGroupPermissions.map((p) => ({
              petition_id: p.petition_id,
              type: "GROUP_PERMISSION_ADDED" as const,
              data: {
                user_id: creatorId,
                permission_type: p.type,
                user_group_id: p.user_group_id!,
              },
            })),
          ],
          t,
        );
      }

      const petitions = await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");

      return {
        petitions,
        newPermissions: [
          ...newUserPermissions,
          ...newGroupPermissions,
          ...groupAssignedNewUserPermissions,
        ],
      };
    }, t);
  }

  async editPetitionPermissions(
    petitionIds: number[],
    userIds: number[],
    userGroupIds: number[],
    newPermissionType: PetitionPermissionType,
    user: User,
  ) {
    return this.withTransaction(async (t) => {
      const updatedPermissions = await this.from("petition_permission", t)
        .whereIn("petition_id", petitionIds)
        .whereNull("deleted_at")
        .andWhere((q) =>
          q
            .orWhere((q) =>
              q
                .whereIn("user_id", userIds)
                .whereNull("from_user_group_id")
                .whereNull("user_group_id"),
            )
            .orWhere((q) => q.whereIn("user_group_id", userGroupIds).whereNotNull("user_group_id"))
            .orWhere((q) =>
              q.whereIn("from_user_group_id", userGroupIds).whereNotNull("from_user_group_id"),
            ),
        )
        .update(
          {
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
            type: newPermissionType,
          },
          "*",
        );

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      const [directlyAssigned, groupAssigned] = partition(
        updatedPermissions.filter((p) => p.from_user_group_id === null),
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

      return await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");
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
    return this.withTransaction(async (t) => {
      const removedPermissions = await this.from("petition_permission", t)
        .whereIn("petition_id", petitionIds)
        .whereNull("deleted_at")
        .whereNot((q) => q.where("user_id", user.id).andWhere("type", "OWNER"))
        .mmodify((q) => {
          if (!removeAll) {
            q.andWhere((q) =>
              q
                .orWhere((q) =>
                  q
                    .whereIn("user_id", userIds)
                    .whereNull("from_user_group_id")
                    .whereNull("user_group_id"),
                )
                .orWhere((q) =>
                  q.whereIn("user_group_id", userGroupIds).whereNotNull("user_group_id"),
                )
                .orWhere((q) =>
                  q.whereIn("from_user_group_id", userGroupIds).whereNotNull("from_user_group_id"),
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
        );

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

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

  private async removePetitionPermissionsById(
    petitionUserPermissionIds: number[],
    user: User,
    t?: Knex.Transaction,
  ) {
    return this.withTransaction(async (t) => {
      const removedPermissions = await this.from("petition_permission", t)
        .whereIn("id", petitionUserPermissionIds)
        .update(
          {
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          },
          "*",
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
  async transferPublicLinkOwnership(
    ownerId: number,
    newOwnerId: number,
    updatedBy: User,
    t?: Knex.Transaction,
  ) {
    const [deleted] = await this.from("template_default_permission", t)
      .where({ user_id: ownerId, type: "OWNER", deleted_at: null })
      .whereRaw(
        /* sql */ `
        exists(select * from public_petition_link ppl where ppl.template_id = template_default_permission.template_id)
        `,
      )
      .update({
        deleted_by: `User:${updatedBy.id}`,
        deleted_at: this.now(),
      })
      .returning("*");

    if (deleted) {
      await this.from("template_default_permission", t).insert({
        user_id: newOwnerId,
        type: "OWNER",
        is_subscribed: deleted.is_subscribed,
        template_id: deleted.template_id,
        created_at: this.now(),
        created_by: `User:${updatedBy.id}`,
      });
    }
  }

  /**
   * sets new OWNER of petitions to @param toUserId.
   * original owner gets a WRITE permission.
   */
  async transferOwnership(
    petitionIds: number[],
    toUserId: number,
    keepOriginalPermissions: boolean,
    updatedBy: User,
    t?: Knex.Transaction,
  ) {
    return await this.withTransaction(async (t) => {
      // change permission of original owner to WRITE
      const previousOwnerPermissions = await this.from("petition_permission", t)
        .whereIn("petition_id", petitionIds)
        .where({
          deleted_at: null,
          type: "OWNER",
        })
        .update({
          type: "WRITE",
          updated_at: this.now(),
          updated_by: `User:${updatedBy.id}`,
        })
        .returning("*");

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      // UPSERT for new petition owner. Try to insert a new OWNER permission.
      // If conflict, the new owner already has READ or WRITE access to the petition,
      // so we have to update the conflicting row to have OWNER permission
      await t.raw<{ rows: PetitionPermission[] }>(
        /* sql */ `
        ? on conflict (petition_id, user_id) 
        where deleted_at is null and from_user_group_id is null and user_group_id is null
          do update set
          type = ?,
          updated_by = ?,
          updated_at = ?,
          deleted_by = null,
          deleted_at = null
        returning *;`,
        [
          this.from("petition_permission").insert(
            petitionIds.map((petitionId) => ({
              created_by: `User:${updatedBy.id}`,
              updated_by: `User:${updatedBy.id}`,
              updated_at: this.now(),
              type: "OWNER",
              user_id: toUserId,
              petition_id: petitionId,
            })),
          ),
          "OWNER",
          `User:${updatedBy.id}`,
          this.now(),
        ],
      );

      await this.createEvent(
        previousOwnerPermissions.map((p) => ({
          petition_id: p.petition_id,
          type: "OWNERSHIP_TRANSFERRED",
          data: {
            user_id: updatedBy.id,
            previous_owner_id: p.user_id!,
            owner_id: toUserId,
          },
        })),
        t,
      );

      if (!keepOriginalPermissions) {
        await this.removePetitionPermissionsById(
          previousOwnerPermissions.map((p) => p.id),
          updatedBy,
          t,
        );
      }

      return await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");
    }, t);
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

  async removeTemplateDefaultPermissionsForUser(
    userId: number,
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    await this.from("template_default_permission", t)
      .where("user_id", userId)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
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
            const escapedSearch = `%${escapeLike(search, "\\")}%`;
            q.andWhere((q2) => {
              q2.whereEscapedILike("name", escapedSearch, "\\").or.whereEscapedILike(
                "template_description",
                escapedSearch,
                "\\",
              );
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
    const rows = await this.from("petition_signature_request", t)
      .whereIn("id", ids)
      .update({
        ...data,
        updated_at: this.now(),
        processed_at: data.status === "PROCESSED" ? this.now() : undefined,
      })
      .returning("*");

    if (isDefined(data.status)) {
      await this.from("petition", t)
        .whereIn("id", uniq(rows.map((r) => r.petition_id)))
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

    if (isDefined(data.status)) {
      await this.from("petition")
        .where("id", row.petition_id)
        .update({
          latest_signature_status:
            data.cancel_reason === "CANCELLED_BY_USER" ? "CANCELLED_BY_USER" : data.status,
        });
    }

    return row;
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

  async loadUsersOnPetition(petitionId: number) {
    return await this.from("user")
      .join("petition_permission", "user.id", "petition_permission.user_id")
      .where("petition_permission.petition_id", petitionId)
      .whereNull("petition_permission.deleted_at")
      .whereNull("user.deleted_at")
      .distinct<User[]>("user.*");
  }

  async isUserSubscribedToPetition(userId: number, petitionId: number) {
    return await this.exists(
      /* sql */ `
        select pp.*
          from petition_permission pp
          join "user" u on u.id = pp.user_id
        where pp.user_id = ? and pp.petition_id = ? and pp.is_subscribed and pp.deleted_at is null and u.deleted_at is null
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
    petitionFieldId: number,
    user: User,
    t?: Knex.Transaction,
  ) {
    const deletedAttachments = await this.from("petition_field_attachment", t)
      .where({
        deleted_at: null,
        petition_field_id: petitionFieldId,
      })
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

  private async deletePetitionAttachmentByPetitionId(
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

    const userIds = uniq(
      [
        ...templateDefaultOwners.map((tdp) => tdp.user_id),
        ...templateOwners.map((t) => t.user_id),
      ].filter(isDefined),
    );

    const users = await this.from("user", t)
      .whereIn("id", userIds)
      .whereNull("deleted_at")
      .select("*");

    return templateIds.map((templateId) => {
      const isDefault = isDefined(defaultOwnerByTemplateId[templateId]?.user_id);
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

  async loadPetitionStatsForUser(userId: number) {
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
      petitions_sent_this_month: countBy(petitions, (p) => isThisMonth(p.sent_at)),
      petitions_sent_last_month: countBy(petitions, (p) =>
        isSameMonth(p.sent_at, subMonths(new Date(), 1)),
      ),
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
      this.from("petition_field").where("petition_id", petitionId).select("id"),
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

    const comments = await pMapChunk(
      fieldIds,
      async (fieldIdsChunk) =>
        await this.from("petition_field_comment")
          .where("petition_id", petitionId)
          .whereIn("petition_field_id", fieldIdsChunk)
          .whereNull("anonymized_at")
          .select("id"),
      { concurrency: 1, chunkSize: 200 },
    );

    await this.withTransaction(async (t) => {
      await this.updatePetition(
        petitionId,
        { signature_config: null, anonymized_at: this.now() },
        "AnonymizerWorker",
        t,
      );

      const [messages, reminders] = await Promise.all([
        this.anonymizePetitionMessages(petitionId, t),
        this.anonymizePetitionReminders(
          accesses.map((a) => a.id),
          t,
        ),
        this.anonymizePetitionFieldReplies(replies, t),
        this.anonymizePetitionFieldComments(
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
          ...messages.filter((m) => isDefined(m.email_log_id)).map((m) => m.email_log_id!),
          ...reminders.filter((m) => isDefined(m.email_log_id)).map((m) => m.email_log_id!),
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
          isDefined(r.content.file_upload_id) &&
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
            content: this.knex.raw(/* sql */ `
          case "type"
            when 'FILE_UPLOAD' then
              content || jsonb_build_object('file_upload_id', null)
            when 'DOW_JONES_KYC' then
              content || jsonb_build_object('file_upload_id', null, 'entity', null)
            when 'ES_TAX_DOCUMENTS' then
              content || jsonb_build_object('file_upload_id', null, 'json_contents', null)
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

  async anonymizePetitionFieldComments(ids: MaybeArray<number>, t?: Knex.Transaction) {
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
      ...signatures.filter((s) => isDefined(s.file_upload_id)).map((s) => s.file_upload_id!),
      ...signatures
        .filter((s) => isDefined(s.file_upload_audit_trail_id))
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

    const fromTemplateIds = uniq(orgPetitions.map((p) => p.from_template_id).filter(isDefined));

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
        return zip(chunk, await this.getPetitionTimes(chunk.map((p) => p.id))).map(
          ([petition, stats]) => ({ ...petition, ...stats }),
        );
      },
      { chunkSize: 200, concurrency: 5 },
    );

    const templatesWithPetitionsWithStats = Object.values(
      groupBy(petitionsWithStats, (p) => p.from_template_id ?? 0),
    ).map((group) => {
      const template = isDefined(group[0].from_template_id)
        ? templates.find((t) => t.id === group[0].from_template_id) ?? null
        : null;
      return [template, group] as const;
    });

    function groupStats(petitions: UnwrapArray<typeof petitionsWithStats>[]) {
      return {
        status: {
          all: petitions.length,
          pending: countBy(petitions, (p) => p.status === "PENDING"),
          completed: countBy(petitions, (p) => p.status === "COMPLETED"),
          closed: countBy(petitions, (p) => p.status === "CLOSED"),
          signed: countBy(petitions, (p) => p.latest_signature_status === "COMPLETED"),
        },
        times: {
          pending_to_complete: average(
            petitions.map((p) => p.pending_to_complete).filter(isDefined),
          ),
          complete_to_close: average(petitions.map((p) => p.complete_to_close).filter(isDefined)),
          signature_completed: average(
            petitions.map((p) => p.signature_completed).filter(isDefined),
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
              .filter(([t]) => !isDefined(t))
              .flatMap(([, petitions]) => petitions),
          ),
        },
      ].filter((r) => r.status.all > 0),
      [(t) => t.status.all, "desc"],
    );
  }

  private async getPetitionTimes(petitionIds: number[]) {
    const events = await this.from("petition_event")
      .whereIn("petition_id", petitionIds)
      .whereIn("type", [
        "ACCESS_ACTIVATED",
        "REPLY_CREATED",
        "PETITION_COMPLETED",
        "PETITION_CLOSED",
        "SIGNATURE_STARTED",
        "SIGNATURE_COMPLETED",
      ])
      .orderBy("created_at", "ASC")
      .select("*");

    const eventsByPetitionId = groupBy(events, (e) => e.petition_id);

    return petitionIds.map((petitionId) => {
      const events = eventsByPetitionId[petitionId] ?? [];
      // first ACCESS_ACTIVATED or REPLY_CREATED event marks the first time the petition moved to PENDING status
      const pendingAt = events
        .find((e) => e.type === "ACCESS_ACTIVATED" || e.type === "REPLY_CREATED")
        ?.created_at.getTime();
      const completedAt = findLast(
        events,
        (e) => e.type === "PETITION_COMPLETED",
      )?.created_at.getTime();
      const closedAt = findLast(events, (e) => e.type === "PETITION_CLOSED")?.created_at.getTime();
      const signatureStartedAt = findLast(
        events,
        (e) => e.type === "SIGNATURE_STARTED",
      )?.created_at.getTime();
      const signatureCompletedAt = findLast(
        events,
        (e) => e.type === "SIGNATURE_COMPLETED",
      )?.created_at.getTime();

      return {
        pending_to_complete:
          isDefined(completedAt) && isDefined(pendingAt) && completedAt > pendingAt
            ? (completedAt - pendingAt) / 1000
            : null,
        complete_to_close:
          isDefined(closedAt) && isDefined(completedAt) && closedAt > completedAt
            ? (closedAt - completedAt) / 1000
            : null,
        signature_completed:
          isDefined(signatureStartedAt) &&
          isDefined(signatureCompletedAt) &&
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
          updated_by = ?
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
      } else if (isDefined(sharePetition)) {
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
   * retrieves an unprocessed petition or system event for the event-processor.
   *
   * created_at Date of the event must match with param createdAt.
   * This will ensure to only pick the most up-to-date event for processing, as some events can be updated in DB before the event-processor processes them
   */
  async pickEventToProcess<TName extends "petition_event" | "system_event">(
    id: number,
    tableName: TName,
    createdAt: Date,
  ): Promise<TableTypes[TName] | undefined> {
    const [event] = await this.from(tableName)
      .update("processed_at", this.now())
      .whereRaw(
        /* sql */ `id = ? and processed_at is null and date_trunc('milliseconds', created_at) = ?::timestamptz`,
        [id, createdAt],
      )
      .returning("*");

    return event as unknown as TableTypes[TName] | undefined;
  }

  async markEventAsProcessed(id: number, processedBy: string) {
    await this.from("petition_event").where("id", id).update({
      processed_at: this.now(),
      processed_by: processedBy,
    });
  }

  /**
   * creates the required accesses and messages to send a petition to a single contact group
   */
  async createAccessesAndMessages(
    petition: Pick<Petition, "id" | "name" | "reminders_config">,
    contactIds: number[],
    args: {
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
          reminders_left: remindersConfig?.limit ?? 10,
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
        args.scheduledAt ?? null,
        accesses.map((access) => ({
          petition_access_id: access.id,
          status: args.scheduledAt ? "SCHEDULED" : "PROCESSING",
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
    } catch (error: any) {
      this.logger.error(error.message, { stack: error.stack });
      return { result: RESULT.FAILURE, error };
    }
  }

  /** prefills a given petition with replies defined in prefill argument,
   * where each key inside the object is a field alias and the value is the reply content.
   * based on the field type the value could be an array for creating multiple replies.
   * If no field is found for a given key/alias, that entry is ignored.
   * If the reply is invalid given the field options, it will be ignored.
   */
  async prefillPetition(petitionId: number, prefill: Record<string, any>, owner: User) {
    const fields = await this.loadFieldsForPetition(petitionId, { refresh: true });
    const replies = await this.parsePrefillReplies(prefill, fields);

    if (replies.length > 0) {
      await this.createPetitionFieldReply(
        petitionId,
        replies.map((reply) => ({
          user_id: owner.id,
          petition_field_id: reply.fieldId,
          content: fieldReplyContent(reply.fieldType, reply.content),
          type: reply.fieldType,
        })),
        `User:${owner.id}`,
      );
    }

    return (await this.loadPetition(petitionId))!;
  }

  private async parsePrefillReplies(prefill: Record<string, any>, fields: PetitionField[]) {
    const entries = Object.entries(prefill);
    const result: {
      fieldId: number;
      fieldType: PetitionFieldType;
      content: any;
    }[] = [];

    for (let i = 0; i < entries.length; i++) {
      const [alias, value] = entries[i];
      const field = fields.find((f) => f.alias === alias);
      if (!field || isFileTypeField(field.type) || field.type === "HEADING") {
        continue;
      }

      const fieldReplies = unMaybeArray(value);
      const singleReplies = [];

      if (field.type === "CHECKBOX") {
        // for CHECKBOX fields, a single reply can contain more than 1 option, so each reply is a string[]
        if (fieldReplies.every((r) => typeof r === "string")) {
          singleReplies.push({ value: uniq(fieldReplies) });
        } else if (fieldReplies.every((r) => Array.isArray(r))) {
          singleReplies.push(...fieldReplies.map((r) => ({ value: uniq(r) })));
        }
      } else if (field.type === "DYNAMIC_SELECT") {
        // for DYNAMIC_SELECT field, a single reply is like ["Cataluña", "Barcelona"]. each element on the array is a selection of that level.
        // here we need to add the label for sending it to the backend with correct format. e.g.: [["Comunidad Autónoma", "Cataluña"], ["Provincia", "Barcelona"]]
        if (fieldReplies.every((r) => typeof r === "string")) {
          singleReplies.push({
            value: fieldReplies.map((value, i) => [field.options.labels[i], value]),
          });
        } else if (fieldReplies.every((r) => Array.isArray(r))) {
          singleReplies.push(
            ...fieldReplies.map((reply: string[]) => ({
              value: reply.map((value, i) => [field.options.labels[i], value]),
            })),
          );
        }
      } else if (field.type === "DATE_TIME") {
        singleReplies.push(...fieldReplies); // DATE_TIME replies already are objects with { datetime, timezone } format
      } else {
        singleReplies.push(...fieldReplies.map((value) => ({ value })));
      }

      for (const content of singleReplies) {
        try {
          validateReplyContent(field, content);
          result.push({ fieldId: field.id, fieldType: field.type, content });
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

  async userhasAccessToPetitionFieldReply(petitionFieldReplyId: number, userId: number) {
    const [reply, field] = await Promise.all([
      this.loadFieldReply(petitionFieldReplyId),
      this.loadFieldForReply(petitionFieldReplyId),
    ]);

    if (!reply || !field) {
      return false;
    }

    return await this.userHasAccessToPetitions(userId, [field.petition_id]);
  }
}
