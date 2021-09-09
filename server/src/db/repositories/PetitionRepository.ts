import DataLoader from "dataloader";
import { isSameMonth, isThisMonth, subMonths } from "date-fns";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { countBy, groupBy, indexBy, isDefined, maxBy, omit, sortBy, uniq, zip } from "remeda";
import { PetitionPermissionTypeRW } from "../../api/public/__types";
import { Aws, AWS_SERVICE } from "../../services/aws";
import { partition, unMaybeArray } from "../../util/arrays";
import { evaluateFieldVisibility, PetitionFieldVisibility } from "../../util/fieldVisibility";
import { fromDataLoader } from "../../util/fromDataLoader";
import { fromGlobalId } from "../../util/globalId";
import { keyBuilder } from "../../util/keyBuilder";
import { removeNotDefined } from "../../util/remedaExtensions";
import { calculateNextReminder, PetitionAccessReminderConfig } from "../../util/reminderUtils";
import { random } from "../../util/token";
import { Maybe, MaybeArray } from "../../util/types";
import {
  CreatePetitionEvent,
  GenericPetitionEvent,
  PetitionEvent,
  PetitionEventPayload,
} from "../events";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { defaultFieldOptions, validateFieldOptions } from "../helpers/fieldOptions";
import { escapeLike, isValueCompatible, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import { CommentCreatedUserNotification, CreatePetitionUserNotification } from "../notifications";
import {
  Contact,
  CreatePetition,
  CreatePetitionAccess,
  CreatePetitionContactNotification,
  CreatePetitionField,
  CreatePetitionFieldAttachment,
  CreatePetitionFieldReply,
  CreatePetitionMessage,
  CreatePetitionReminder,
  CreatePublicPetitionLink,
  Petition,
  PetitionAccess,
  PetitionContactNotification,
  PetitionEventType,
  PetitionField,
  PetitionFieldComment,
  PetitionFieldReply,
  PetitionFieldReplyStatus,
  PetitionFieldType,
  PetitionPermission,
  PetitionPermissionType,
  PetitionSignatureRequest,
  PetitionStatus,
  PublicPetitionLink,
  PublicPetitionLinkUser,
  User,
} from "../__types";

type PetitionType = "PETITION" | "TEMPLATE";
type PetitionLocale = "en" | "es";

type PetitionSharedWithFilter = {
  operator: "AND" | "OR";
  filters: {
    value: string;
    operator: "SHARED_WITH" | "NOT_SHARED_WITH" | "IS_OWNER" | "NOT_IS_OWNER";
  }[];
};

type PetitionFilter = {
  status?: PetitionStatus[] | null;
  locale?: PetitionLocale | null;
  type?: PetitionType | null;
  tagIds?: string[] | null;
  sharedWith?: PetitionSharedWithFilter | null;
};

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

@injectable()
export class PetitionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex, @inject(AWS_SERVICE) private aws: Aws) {
    super(knex);
  }

  readonly loadAnyPetitionById = this.buildLoadBy("petition", "id");

  readonly loadPetition = this.buildLoadBy("petition", "id", (q) => q.whereNull("deleted_at"));

  readonly loadField = this.buildLoadBy("petition_field", "id", (q) => q.whereNull("deleted_at"));

  readonly loadFieldReply = this.buildLoadBy("petition_field_reply", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadFieldForReply = fromDataLoader(
    new DataLoader<number, PetitionField | null>(async (ids) => {
      const fields = await this.raw<PetitionField & { _pfr_id: number }>(
        /* sql */ `
      select pf.*, pfr.id as _pfr_id from petition_field_reply pfr
      join petition_field pf on pfr.petition_field_id = pf.id
      where pfr.id in (${ids.map(() => "?").join(", ")})
        and pf.deleted_at is null
        and pfr.deleted_at is null
    `,
        [...ids]
      );
      const byPfrId = indexBy(fields, (f) => f._pfr_id);
      return ids.map((id) => (byPfrId[id] ? omit(byPfrId[id], ["_pfr_id"]) : null));
    })
  );

  async userHasAccessToPetitions(
    userId: number,
    petitionIds: number[],
    permissionTypes?: PetitionPermissionType[]
  ) {
    const [{ count }] = await this.from("petition_permission")
      .where({ user_id: userId })
      .whereIn("petition_id", petitionIds)
      .whereNull("deleted_at")
      .whereNull("user_group_id")
      .mmodify((q) => {
        if (permissionTypes) {
          q.whereIn("type", permissionTypes);
        }
      })
      .select(this.knex.raw(`count(distinct(petition_id))::int as "count"`));
    return count === new Set(petitionIds).size;
  }

  async userHasAccessToPetitionFieldComments(userId: number, petitionFieldCommentIds: number[]) {
    const comments = await this.loadPetitionFieldComment(petitionFieldCommentIds);
    return (
      comments.every((c) => !!c) &&
      (await this.userHasAccessToPetitions(
        userId,
        comments.map((c) => c!.petition_id)
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
      .select(this.count());
    return count === new Set(fieldIds).size;
  }

  async fieldAttachmentBelongsToField(fieldId: number, attachmentIds: number[]) {
    const [{ count }] = await this.from("petition_field_attachment")
      .where({
        petition_field_id: fieldId,
        deleted_at: null,
      })
      .whereIn("id", attachmentIds)
      .select(this.count());
    return count === new Set(attachmentIds).size;
  }

  async accessesBelongToPetition(petitionId: number, accessIds: number[]) {
    const [{ count }] = await this.from("petition_access")
      .where({
        petition_id: petitionId,
      })
      .whereIn("id", accessIds)
      .select(this.count());
    return count === new Set(accessIds).size;
  }

  async messagesBelongToPetition(petitionId: number, messagesIds: number[]) {
    const [{ count }] = await this.from("petition_message")
      .where({
        petition_id: petitionId,
      })
      .whereIn("id", messagesIds)
      .select(this.count());
    return count === new Set(messagesIds).size;
  }

  async commentsBelongToPetition(petitionId: number, commentIds: number[]) {
    const [{ count }] = await this.from("petition_field_comment")
      .where({
        petition_id: petitionId,
      })
      .whereIn("id", commentIds)
      .whereNull("deleted_at")
      .select(this.count());
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
          and pfr.id in (${replyIds.map(() => "?").join(", ")})
          and pfr.deleted_at is null
    `,
      [fieldId, ...replyIds]
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
          and pfr.id in (${replyIds.map(() => "?").join(", ")})
          and pf.deleted_at is null and pfr.deleted_at is null
    `,
      [petitionId, ...replyIds]
    );
    return count === new Set(replyIds).size;
  }

  async loadPetitionsForUser(
    userId: number,
    opts: {
      search?: string | null;
      sortBy?: SortBy<keyof Petition | "last_used_at" | "sent_at">[];
      filters?: PetitionFilter | null;
    } & PageOpts
  ) {
    const type = opts.filters?.type || "PETITION";
    const query = this.from("petition")
      .joinRaw(
        /* sql */ `
        join petition_permission pp on petition.id = pp.petition_id and pp.user_id = ? and pp.deleted_at is null
        left join petition_access pa on petition.id = pa.petition_id
        left join contact c on pa.contact_id = c.id and c.deleted_at is null
      `,
        [userId]
      )
      .where("is_template", type === "TEMPLATE")
      .mmodify((q) => {
        const { search, filters } = opts;
        if (filters?.locale) {
          q.where("locale", filters.locale);
        }
        if (search) {
          q.andWhereRaw(
            type === "PETITION"
              ? /* sql */ ` 
                (petition.name ilike :search escape '\\'
                or concat(c.first_name, ' ', c.last_name) ilike :search escape '\\'
                or c.email ilike :search escape '\\')
              `
              : /* sql */ ` 
                (petition.name ilike :search escape '\\'
                or petition.template_description ilike :search escape '\\')
              `,
            { search: `%${escapeLike(search, "\\")}%` }
          );
        }
        if (filters?.status && type === "PETITION") {
          q.whereIn("petition.status", filters.status);
        }

        if (filters?.tagIds) {
          q.joinRaw(/* sql */ `left join petition_tag pt on pt.petition_id = petition.id`);
          if (filters.tagIds.length) {
            q.havingRaw(
              /* sql */ `
              array_agg(distinct pt.tag_id) @>
                array[${filters.tagIds.map(() => "?").join(", ")}]::int[]
            `,
              filters.tagIds.map((id) => fromGlobalId(id, "Tag").id)
            );
          } else {
            q.havingRaw(/* sql */ `
              count(distinct pt.tag_id) = 0
            `);
          }
        }

        // search on shared with
        const sharedWith = filters?.sharedWith;
        if (sharedWith && sharedWith.filters.length > 0) {
          q.joinRaw(
            /* sql */ `join petition_permission pp2 on pp2.petition_id = petition.id and pp2.deleted_at is null`
          );

          for (const filter of sharedWith.filters) {
            q = sharedWith.operator === "AND" ? q.and : q.or;

            const { id, type } = fromGlobalId(filter.value);
            if (type !== "User" && type !== "UserGroup") {
              throw new Error(`Expected User or UserGroup, got ${type}`);
            }

            const column = type === "User" ? "user_id" : "user_group_id";
            if (filter.operator === "SHARED_WITH") {
              q.havingRaw(`?=any(array_remove(array_agg(distinct pp2.${column}),null))`, [id]);
            } else if (filter.operator === "NOT_SHARED_WITH") {
              q.havingRaw(`not(?=any(array_remove(array_agg(distinct pp2.${column}), null)))`, [
                id,
              ]);
            } else if (filter.operator === "IS_OWNER") {
              q.havingRaw(
                `sum(case pp2.type when 'OWNER' then (pp2.user_id = ?)::int else 0 end) > 0`,
                [id]
              );
            } else if (filter.operator === "NOT_IS_OWNER") {
              q.havingRaw(
                `sum(case pp2.type when 'OWNER' then (pp2.user_id = ?)::int else 0 end) = 0`,
                [id]
              );
            }
          }
        }
      })
      .groupBy("petition.id");
    const [{ count }] = await this.knex
      .with("p", query.clone().select("petition.*"))
      .from("p")
      .select(this.count());
    if (count === 0) {
      return { totalCount: count, items: [] };
    } else {
      return {
        totalCount: count,
        items: await query
          .clone()
          .mmodify((q) => {
            for (const { column, order } of opts.sortBy ?? []) {
              if (column === "last_used_at") {
                q.joinRaw(
                  /* sql */ `
                left join (
                  select p.from_template_id as template_id, max(p.created_at) as t_last_used_at
                  from petition as p where p.created_by = ? group by p.from_template_id
                ) as t on t.template_id = petition.id
                `,
                  [`User:${userId}`]
                );
                q.orderBy("last_used_at", order);
              } else if (column === "sent_at") {
                q.orderByRaw(`sent_at ${order}, created_at ${order}`);
              } else {
                q.orderBy(`petition.${column}`, order);
              }
            }
          })
          // default order by to ensure result consistency
          // applies after any previously specified order by
          .orderBy("petition.id")
          .offset(opts.offset ?? 0)
          .limit(opts.limit ?? 0)
          .select(
            "petition.*",
            this.knex.raw("min(pa.created_at) as sent_at"),
            ...(opts.sortBy?.some((s) => s.column === "last_used_at")
              ? [
                  this.knex.raw(
                    "greatest(max(t.t_last_used_at), min(pp.created_at)) as last_used_at"
                  ),
                ]
              : [])
          ),
      };
    }
  }

  readonly loadFieldsForPetition = this.buildLoadMultipleBy("petition_field", "petition_id", (q) =>
    q.whereNull("deleted_at").orderBy("position")
  );

  readonly loadFieldsForPetitionWithNullVisibility = this.buildLoadMultipleBy(
    "petition_field",
    "petition_id",
    (q) => q.where({ deleted_at: null, visibility: null }).orderBy("position")
  );

  readonly loadFieldCountForPetition = this.buildLoadCountBy("petition_field", "petition_id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadStatusForPetition = fromDataLoader(
    new DataLoader<
      number,
      {
        validated: number;
        replied: number;
        optional: number;
        total: number;
      }
    >(async (ids) => {
      const fields: (Pick<
        PetitionField,
        "id" | "petition_id" | "validated" | "optional" | "visibility" | "type" | "options"
      > & { content: string })[] = await this.knex<PetitionField>("petition_field as pf")
        .leftJoin<PetitionFieldReply>("petition_field_reply as pfr", function () {
          this.on("pf.id", "pfr.petition_field_id").andOnNull("pfr.deleted_at");
        })
        .whereIn("pf.petition_id", ids)
        .whereNull("pf.deleted_at")
        .whereNotIn("pf.type", ["HEADING"])
        .groupBy(
          "pf.id",
          "pf.petition_id",
          "pf.validated",
          "pf.optional",
          "pf.visibility",
          this.knex.raw(`"pfr"."content"::text`)
        )
        .select(
          "pf.id",
          "pf.petition_id",
          "pf.validated",
          "pf.optional",
          "pf.visibility",
          "pf.type",
          "pf.options",
          this.knex.raw(`"pfr"."content"::text as "content"`) as any
        );

      const fieldsByPetition = groupBy(fields, (f) => f.petition_id);
      return ids.map((id) => {
        const fields = groupBy(fieldsByPetition[id] ?? [], (f) => f.id);
        // group fields by replies to remove duplicated rows
        // also we need the right object structure for evaluateFieldVisibility
        const fieldsWithReplies = Object.values(fields).map((arr) => ({
          ...arr[0],
          replies: arr
            .map((a) => ({ content: JSON.parse(a.content) }))
            .filter((r) => r.content !== null),
        }));

        const visibleFields = zip(fieldsWithReplies, evaluateFieldVisibility(fieldsWithReplies))
          .filter(([, isVisible]) => isVisible)
          .map(([field]) => field);

        return {
          validated: countBy(visibleFields, (f) => f.validated),
          replied: countBy(visibleFields, (f) => f.replies.length > 0 && !f.validated),
          optional: countBy(
            visibleFields,
            (f) => f.optional && f.replies.length === 0 && !f.validated
          ),
          total: visibleFields.length,
        };
      });
    })
  );

  readonly loadAccess = this.buildLoadBy("petition_access", "id");

  readonly loadAccessByKeycode = this.buildLoadBy("petition_access", "keycode");

  readonly loadAccessesForPetition = this.buildLoadMultipleBy(
    "petition_access",
    "petition_id",
    (q) => q.orderBy("id")
  );

  async createAccesses(
    petitionId: number,
    data: Pick<
      CreatePetitionAccess,
      "contact_id" | "next_reminder_at" | "reminders_active" | "reminders_config" | "reminders_left"
    >[],
    user: User,
    fromPublicPetitionLink: boolean,
    t?: Knex.Transaction
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
              created_by: `User:${user.id}`,
              updated_by: `User:${user.id}`,
            })),
            t
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
          t
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
          t
        );

    return rows;
  }

  async createAccessFromRecipient(
    petitionId: number,
    granterId: number,
    contactId: number,
    recipient: Contact
  ) {
    const [access] = await this.insert("petition_access", {
      petition_id: petitionId,
      granter_id: granterId,
      contact_id: contactId,
      keycode: random(16),
      reminders_left: 10,
      status: "ACTIVE",
      created_by: `Contact:${recipient.id}`,
      updated_by: `Contact:${recipient.id}`,
    }).returning("*");

    return access;
  }

  readonly loadMessage = this.buildLoadBy("petition_message", "id");

  readonly loadMessageByEmailLogId = this.buildLoadBy("petition_message", "email_log_id");

  readonly loadMessagesByPetitionAccessId = this.buildLoadMultipleBy(
    "petition_message",
    "petition_access_id"
  );

  async createMessages(
    petitionId: number,
    scheduledAt: Date | null,
    data: Pick<
      CreatePetitionMessage,
      "status" | "petition_access_id" | "email_subject" | "email_body"
    >[],
    user: User,
    t?: Knex.Transaction
  ) {
    const rows =
      data.length === 0
        ? []
        : await this.insert(
            "petition_message",
            data.map((item) => ({
              ...item,
              scheduled_at: scheduledAt,
              petition_id: petitionId,
              sender_id: user.id,
              created_by: `User:${user.id}`,
            })),
            t
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
        t
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
        "*"
      ),
      this.createEvent({
        type: "MESSAGE_CANCELLED",
        petition_id: petitionId,
        data: {
          petition_message_id: messageId,
          user_id: user.id,
        },
      }),
    ]);
    return row ?? null;
  }

  async deactivateAccesses(petitionId: number, accessIds: number[], user: User) {
    const [accesses, messages] = await Promise.all([
      this.from("petition_access")
        .whereIn("id", accessIds)
        .where("status", "ACTIVE")
        .update(
          {
            reminders_active: false,
            next_reminder_at: null,
            status: "INACTIVE",
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
          },
          "*"
        ),
      this.from("petition_message")
        .whereIn("petition_access_id", accessIds)
        .where("status", "SCHEDULED")
        .update(
          {
            status: "CANCELLED",
          },
          "*"
        ),
    ]);

    await this.createEvent([
      ...accesses.map((access) => ({
        type: "ACCESS_DEACTIVATED" as const,
        petition_id: petitionId,
        data: {
          petition_access_id: access.id,
          user_id: user.id,
        },
      })),
      ...messages.map((message) => ({
        type: "MESSAGE_CANCELLED" as const,
        petition_id: petitionId,
        data: {
          petition_message_id: message.id,
          user_id: user.id,
        },
      })),
    ]);

    return accesses;
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
        "*"
      );
    await this.createEvent(
      accesses.map((access) => ({
        type: "ACCESS_ACTIVATED",
        petition_id: petitionId,
        data: {
          petition_access_id: access.id,
          user_id: user.id,
        },
      }))
    );
    return accesses;
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
      "*"
    );
    return row;
  }

  async createPetition(data: Omit<CreatePetition, "org_id" | "status">, user: User) {
    return await this.withTransaction(async (t) => {
      const [petition] = await this.insert(
        "petition",
        {
          org_id: user.org_id,
          status: data.is_template ? null : "DRAFT",
          ...data,
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
        },
        t
      );

      await Promise.all([
        this.insert(
          "petition_permission",
          {
            petition_id: petition.id,
            user_id: user.id,
            created_by: `User:${user.id}`,
            updated_by: `User:${user.id}`,
          },
          t
        ),
        this.insert(
          "petition_field",
          (["HEADING", "SHORT_TEXT"] as PetitionFieldType[]).map((type, index) => ({
            ...defaultFieldOptions(type),
            petition_id: petition.id,
            type,
            is_fixed: type === "HEADING",
            position: index,
            created_by: `User:${user.id}`,
            updated_by: `User:${user.id}`,
          })),
          t
        ),
      ]);

      return petition;
    });
  }

  async deleteUserPermissions(
    petitionIds: number[],
    userId: number,
    deletedBy: User,
    t?: Knex.Transaction
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
   * Delete petition, deactivate all accesses and cancel all scheduled messages
   */
  async deletePetitionById(petitionId: MaybeArray<number>, user: User, t?: Knex.Transaction) {
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
            "*"
          ),
        this.from("petition_message", t)
          .whereIn("petition_id", petitionIds)
          .where("status", "SCHEDULED")
          .update(
            {
              status: "CANCELLED",
            },
            "*"
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
            },
          })),
          t
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
            },
          })),
          t
        );
      }

      return await this.from("petition", t)
        .whereIn("id", petitionIds)
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .returning("*");
    }, t);
  }

  async updatePetition(
    petitionIds: MaybeArray<number>,
    data: Partial<CreatePetition>,
    updatedBy: string,
    t?: Knex.Transaction
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
        "*"
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
        Array.from(fieldIds.entries()).map(([index, id]) => [id, index])
      );
      for (const field of fields) {
        const visibility = field.visibility as Maybe<PetitionFieldVisibility>;
        if (visibility?.conditions.some((c) => positions[c.fieldId] >= positions[field.id])) {
          throw new Error("INVALID_FIELD_CONDITIONS_ORDER");
        }
      }

      await t.raw(
        /* sql */ `
      update petition_field as pf set
        position = t.position,
        deleted_at = NOW() -- temporarily delete to avoid unique index constraint
      from (
        values ${fieldIds.map(() => "(?::int, ?::int)").join(", ")}
      ) as t (id, position)
      where t.id = pf.id;
    `,
        fieldIds.flatMap((id, i) => [id, i])
      );

      await this.from("petition_field", t)
        .whereIn("id", fieldIds)
        .update({
          deleted_at: null,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        });

      const [petition] = await this.from("petition", t)
        .where("id", petitionId)
        .update(
          {
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
          },
          "*"
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
        "validated",
        "is_fixed",
      ]),
      field.position + 1,
      user
    );
  }

  async createPetitionFieldAtPosition(
    petitionId: number,
    data: Omit<CreatePetitionField, "petition_id" | "position">,
    position: number,
    user: User,
    t?: Knex.Transaction<any, any>
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
      const fieldIds = await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .where("position", ">=", position)
        .update(
          {
            deleted_at: this.now(), // temporarily delete to avoid unique index constraint
            position: this.knex.raw(`position + 1`),
          },
          "id"
        );

      const [[field], [petition]] = await Promise.all([
        this.insert(
          "petition_field",
          {
            petition_id: petitionId,
            position,
            ...data,
            created_by: `User:${user.id}`,
            updated_by: `User:${user.id}`,
          },
          t
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
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*"
          ),
      ]);

      if (fieldIds.length > 0) {
        await this.from("petition_field", t).whereIn("id", fieldIds).update({ deleted_at: null });
      }

      return { field, petition };
    }, t);
  }

  async deletePetitionField(petitionId: number, fieldId: number, user: User) {
    return await this.withTransaction(async (t) => {
      const [field] = await this.from("petition_field", t)
        .update(
          {
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          },
          ["id", "position"]
        )
        .where({
          petition_id: petitionId,
          id: fieldId,
          deleted_at: null,
          is_fixed: false,
        });

      // TODO: delete replies

      if (!field) {
        throw new Error("Invalid petition field id");
      }

      const fields = await this.from("petition_field").where({
        petition_id: petitionId,
        deleted_at: null,
      });

      const otherFieldsAreValidated = fields
        .filter((f) => f.type !== "HEADING" && f.id !== fieldId)
        .every((f) => f.validated);

      const [[petition]] = await Promise.all([
        this.from("petition", t)
          .where("id", petitionId)
          .update(
            {
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
              status: this.knex.raw(/* sql */ `
                case is_template 
                when false then 
                  (case ${otherFieldsAreValidated} 
                    when true then 
                      (case status 
                        when 'PENDING' then 'CLOSED'
                        else status
                      end) 
                    else status
                  end) 
                else
                  NULL
                end
              `) as any,
            },
            "*"
          ),
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
          .where("position", ">", field.position),
      ]);

      await this.removePetitionFieldAttachmentByFieldId(fieldId, user);

      return petition;
    });
  }

  async updatePetitionField(
    petitionId: number,
    fieldId: number,
    data: Partial<CreatePetitionField>,
    user: User,
    t?: Knex.Transaction<any, any>
  ) {
    return this.withTransaction(async (t) => {
      const [field] = await this.from("petition_field", t)
        .where({ id: fieldId, petition_id: petitionId })
        .update(
          {
            ...data,
            validated: this.knex.raw(`case type when 'HEADING' then true else false end`),
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
          },
          "*"
        );
      if (field.is_fixed && data.type !== undefined) {
        throw new Error("UPDATE_FIXED_FIELD_ERROR");
      }

      let petition: Petition;
      // update petition status if changing anything other than title and description
      if (Object.keys(omit(data, ["title", "description"])).length > 0) {
        [petition] = await this.from("petition", t)
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
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*"
          );
      } else {
        [petition] = await this.from("petition", t).where({
          id: petitionId,
        });
      }

      return { field, petition };
    }, t);
  }

  async validateFieldData(fieldId: number, data: { options: Maybe<Record<string, any>> }) {
    const field = await this.loadField(fieldId);
    if (!field) {
      throw new Error("Petition field not found");
    }
    validateFieldOptions(field?.type, data.options);
    return field;
  }

  readonly loadRepliesForField = fromDataLoader(
    new DataLoader<number, PetitionFieldReply[]>(async (ids) => {
      const rows = await this.from("petition_field_reply")
        .whereIn("petition_field_id", ids)
        .whereNull("deleted_at")
        .select("*");
      const byPetitionFieldId = groupBy(rows, (r) => r.petition_field_id);
      return ids.map((id) => {
        return sortBy(byPetitionFieldId[id as any] || [], (r) => r.created_at);
      });
    })
  );

  async validatePetitionFields(petitionId: number, fieldIds: number[], value: boolean, user: User) {
    const fields = await this.from("petition_field")
      .whereIn("id", fieldIds)
      .where("petition_id", petitionId)
      .update(
        {
          validated: value,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*"
      );

    // if every field is validated, update the petition status
    const petitionFields = await this.loadFieldsForPetition(petitionId);
    const petition = await this.loadPetition(petitionId);
    const newStatus = petitionFields.filter((f) => f.type !== "HEADING").every((f) => f.validated)
      ? "CLOSED"
      : petition!.status === "CLOSED"
      ? "PENDING"
      : petition!.status;

    await this.from("petition").where("id", petitionId).update({ status: newStatus });

    if (newStatus === "CLOSED") {
      await this.updateRemindersForPetition(petitionId, null);
    }

    return fields;
  }

  async updateRemindersForPetition(
    petitionId: number,
    nextReminderAt: Maybe<Date>,
    t?: Knex.Transaction
  ) {
    return this.withTransaction(async (t) => {
      return await this.from("petition_access", t).where("petition_id", petitionId).update(
        {
          next_reminder_at: nextReminderAt,
        },
        "*"
      );
    }, t);
  }

  async createPetitionFieldReply<TCreator extends User | Contact>(
    data: TCreator extends User
      ? Omit<CreatePetitionFieldReply, "petition_access_id"> & {
          user_id: number;
        }
      : Omit<CreatePetitionFieldReply, "user_id"> & {
          petition_access_id: number;
        },
    creator: TCreator
  ) {
    const createdBy = isDefined((data as any).petition_access_id) ? "Contact" : "User";

    const field = await this.loadField(data.petition_field_id);
    if (!field) {
      throw new Error("Petition field not found");
    }
    if (field.validated) {
      throw new Error("Petition field is already validated.");
    }
    const [[reply]] = await Promise.all([
      this.insert("petition_field_reply", {
        ...data,
        updated_by: `${createdBy}:${creator.id}`,
        created_by: `${createdBy}:${creator.id}`,
      }),
      this.from("petition")
        .update({
          status: "PENDING",
          updated_at: this.now(),
          updated_by: `${createdBy}:${creator.id}`,
        })
        .where({ id: field.petition_id, status: "COMPLETED" }),
    ]);
    await this.createEvent({
      type: "REPLY_CREATED",
      petition_id: field.petition_id,
      data: {
        ...(createdBy === "User"
          ? { user_id: reply.user_id! }
          : { petition_access_id: reply.petition_access_id! }),
        petition_field_id: reply.petition_field_id,
        petition_field_reply_id: reply.id,
      },
    });
    return reply;
  }

  async updatePetitionFieldReply(
    replyId: number,
    data: Partial<PetitionFieldReply>,
    updatedBy: string
  ) {
    const field = await this.loadFieldForReply(replyId);
    if (!field) {
      throw new Error("Petition field not found");
    }
    const [[reply]] = await Promise.all([
      this.from("petition_field_reply")
        .where("id", replyId)
        .update(
          {
            ...data,
            updated_at: this.now(),
            updated_by: updatedBy,
          },
          "*"
        ),
      this.from("petition")
        .update({ status: "PENDING" })
        .where({ id: field.petition_id, status: "COMPLETED" }),
    ]);
    return reply;
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

  async deletePetitionFieldReply(replyId: number, deletedBy: string) {
    const reply = await this.loadFieldReply(replyId);
    const field = await this.loadField(reply!.petition_field_id);
    if (!field) {
      throw new Error("Petition field not found");
    }
    if (field.validated) {
      throw new Error("Petition field is already validated.");
    }
    if (!reply) {
      throw new Error("Petition field reply not found");
    }
    await Promise.all([
      this.from("petition_field_reply")
        .update({
          deleted_at: this.now(),
          deleted_by: deletedBy,
        })
        .where("id", replyId),
      this.from("petition")
        .update({
          status: "PENDING",
          updated_at: this.now(),
          updated_by: deletedBy,
        })
        .where({ id: field.petition_id, status: "COMPLETED" }),
      this.createEvent({
        type: "REPLY_DELETED",
        petition_id: field!.petition_id,
        data: {
          petition_access_id: reply.petition_access_id!,
          petition_field_id: reply.petition_field_id,
          petition_field_reply_id: reply.id,
        },
      }),
    ]);
  }

  async updatePetitionFieldRepliesStatus(replyIds: number[], status: PetitionFieldReplyStatus) {
    return await this.from("petition_field_reply").whereIn("id", replyIds).update({ status }, "*");
  }

  async completePetition(petitionId: number, accessId: number) {
    const [petition, fields] = await Promise.all([
      this.loadPetition(petitionId),
      this.loadFieldsForPetition(petitionId),
    ]);
    if (!petition || !fields) {
      throw new Error();
    }
    if (petition.status === "CLOSED") {
      throw new Error("Can't complete a closed petition");
    }
    const fieldsIds = fields.map((f) => f.id);
    const replies = await this.loadRepliesForField(fieldsIds);
    const repliesByFieldId = Object.fromEntries(fieldsIds.map((id, index) => [id, replies[index]]));
    const fieldsWithReplies = fields.map((f) => ({
      ...f,
      replies: repliesByFieldId[f.id],
    }));

    const canComplete = zip(fieldsWithReplies, evaluateFieldVisibility(fieldsWithReplies)).every(
      ([field, isVisible]) =>
        field.type === "HEADING" ||
        field.optional ||
        field.validated ||
        field.replies.length > 0 ||
        !isVisible
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
              updated_by: `PetitionAccess:${accessId}`,
            },
            "*"
          );

        return updated;
      });
      await this.createEvent({
        type: "PETITION_COMPLETED",
        petition_id: petitionId,
        data: { petition_access_id: accessId },
      });
      return petition;
    } else {
      throw new Error("Can't transition status to COMPLETED");
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
    user: User,
    data?: Partial<CreatePetition>,
    insertUserPermissions = true,
    t?: Knex.Transaction
  ) {
    const [sourcePetition, userPermissions] = await Promise.all([
      this.loadPetition(petitionId),
      this.loadUserPermissionsByPetitionId(petitionId),
    ]);
    return await this.withTransaction(async (t) => {
      // if cloning a petition, clone the petition from_template_id
      let fromTemplateId: Maybe<number>;
      if (data?.is_template === true) {
        // if we are creating a template then from_template_id is null
        fromTemplateId = null;
      } else if (data?.is_template === false) {
        // if we are creating a petition, use the source petition id as
        // from_template_id only if it's a template. otherwise copy it.
        fromTemplateId = sourcePetition!.is_template
          ? sourcePetition!.id
          : sourcePetition!.from_template_id;
      } else {
        // when cloning petitions we clone the petition from_template_id
        // if we are cloning templates then from_template_id is null
        fromTemplateId = sourcePetition!.is_template ? null : sourcePetition!.from_template_id;
      }

      const [cloned] = await this.insert(
        "petition",
        {
          ...omit(sourcePetition!, [
            "id",
            "created_at",
            "updated_at",
            "template_public",
            "from_template_id",
            // avoid copying reminders and deadline data if creating a template or cloning from a template
            ...(data?.is_template || sourcePetition?.is_template
              ? (["reminders_active", "reminders_config", "deadline"] as const)
              : ([] as const)),
            // avoid copying template_description if creating a petition
            ...(sourcePetition?.is_template &&
            (data?.is_template === undefined || data?.is_template)
              ? ([] as const)
              : (["template_description"] as const)),
          ]),
          org_id: user.org_id,
          status: sourcePetition?.is_template ? null : "DRAFT",
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
          from_template_id: fromTemplateId,
          ...data,
        },
        t
      );

      const fields = await this.loadFieldsForPetition(petitionId);
      const [clonedFields] = await Promise.all([
        fields.length === 0
          ? []
          : this.insert(
              "petition_field",
              fields.map((field) => ({
                ...omit(field, ["id", "petition_id", "created_at", "updated_at", "validated"]),
                petition_id: cloned.id,
                created_by: `User:${user.id}`,
                updated_by: `User:${user.id}`,
              })),
              t
            ).returning("*"),
        insertUserPermissions
          ? this.insert(
              "petition_permission",
              {
                petition_id: cloned.id,
                user_id: user.id,
                type: "OWNER",
                is_subscribed: sourcePetition!.is_template
                  ? true
                  : userPermissions.find((p) => p.user_id === user.id)?.is_subscribed ?? true,
                created_by: `User:${user.id}`,
                updated_by: `User:${user.id}`,
              },
              t
            )
          : [],
      ]);
      const newIds = Object.fromEntries(
        zip(
          fields.map((f) => f.id),
          sortBy(clonedFields, (f) => f.position).map((f) => f.id)
        )
      );

      const toUpdate = clonedFields.filter((f) => f.visibility);
      if (toUpdate.length > 0) {
        await this.raw<PetitionField>(
          /* sql */ `
            update petition_field as pf set
              visibility = t.visibility
            from (
              values ${toUpdate.map(() => "(?::int, ?::jsonb)").join(", ")}
            ) as t (id, visibility)
            where t.id = pf.id
            returning *;
          `,
          toUpdate.flatMap((field) => {
            const visibility = field.visibility as PetitionFieldVisibility;
            return [
              field.id,
              JSON.stringify({
                ...visibility,
                conditions: visibility.conditions.map((condition) => ({
                  ...condition,
                  fieldId: newIds[condition.fieldId],
                })),
              }),
            ];
          }),
          t
        );
      }

      if (sourcePetition?.org_id === user.org_id) {
        // copy original tag ids to cloned petition
        if (!sourcePetition!.is_template) {
          await this.raw(
            /* sql */ `
        insert into petition_tag (petition_id, tag_id)
        select ?, tag_id from petition_tag where petition_id = ?
      `,
            [cloned.id, petitionId],
            t
          );
        }

        // copy field attachments to new fields, using the original file_upload_id
        // TODO maybe this can be done in just one query
        const attachments = await this.from("petition_field_attachment", t)
          .whereNull("deleted_at")
          .whereIn("petition_field_id", uniq(fields.map((f) => f.id)))
          .select("*");

        if (attachments.length > 0) {
          await this.insert(
            "petition_field_attachment",
            attachments.map((a) => ({
              file_upload_id: a.file_upload_id,
              petition_field_id: newIds[a.petition_field_id],
              created_by: `User:${user.id}`,
            })),
            t
          );
        }
      }

      return cloned;
    }, t);
  }

  readonly loadReminder = this.buildLoadBy("petition_reminder", "id");

  readonly loadReminderByEmailLogId = this.buildLoadBy("petition_reminder", "email_log_id");

  readonly loadReminderCountForAccess = this.buildLoadCountBy(
    "petition_reminder",
    "petition_access_id"
  );

  readonly loadRemindersByAccessId = this.buildLoadMultipleBy(
    "petition_reminder",
    "petition_access_id",
    (q) => q.orderBy("created_at", "desc")
  );

  async createReminders(data: CreatePetitionReminder[]) {
    if (data.length === 0) {
      return [];
    }
    return await this.withTransaction(async (t) => {
      await this.from("petition_access", t)
        .whereIn(
          "id",
          data.map((r) => r.petition_access_id)
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
      const reminders = await this.insert("petition_reminder", data, t).returning("*");
      return reminders;
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
      "*"
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
        "*"
      );
  }

  async loadEventsForPetition(petitionId: number, opts: PageOpts) {
    return await this.loadPageAndCount(
      this.from("petition_event")
        .where("petition_id", petitionId)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "asc" },
        ])
        .select("*"),
      opts
    );
  }

  async loadLastEventsByType<T extends PetitionEventType>(
    petitionId: number,
    eventTypes: T[]
  ): Promise<
    // Distribute union type
    (T extends any
      ? {
          type: T;
          last_used_at: Date;
          data: PetitionEventPayload<T>;
        }
      : never)[]
  > {
    const events = await this.from("petition_event")
      .where("petition_id", petitionId)
      .whereIn("type", eventTypes)
      .groupBy("type")
      .select("type", this.knex.raw("MAX(created_at) as last_used_at"), "data");
    return events as any[];
  }

  async getPetitionEventsByType<T extends PetitionEventType>(
    petitionId: number,
    eventType: T
  ): Promise<GenericPetitionEvent<T>[]> {
    const events = await this.from("petition_event")
      .where("petition_id", petitionId)
      .where("type", eventType)
      .select("*");
    return events as any;
  }

  async shouldNotifyPetitionClosed(petitionId: number) {
    const events = await this.loadLastEventsByType(petitionId, [
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
    const eventsArray = unMaybeArray(events);
    if (eventsArray.length === 0) {
      return [];
    }

    const petitionEvents = await this.insert("petition_event", eventsArray, t);

    // dont await this. we may be inside a transaction
    this.aws.enqueueEvents(petitionEvents);

    return petitionEvents;
  }

  async getLastEventForPetitionId(petitionId: number) {
    const [event] = await this.raw<PetitionEvent | null>(
      /* sql */ `
      select * from petition_event where id in (
        select max(id) from petition_event where petition_id = ? 
      )`,
      [petitionId]
    );
    return event;
  }

  async updateEvent(eventId: number, data: Partial<PetitionEvent>) {
    const [event] = await this.from("petition_event").where("id", eventId).update(data, "*");
    return event;
  }

  readonly loadPetitionFieldCommentsForField = fromDataLoader(
    new DataLoader<
      {
        loadInternalComments?: boolean;
        petitionId: number;
        petitionFieldId: number;
      },
      PetitionFieldComment[],
      string
    >(
      async (ids) => {
        const rows = await this.from("petition_field_comment")
          .where((qb) => {
            for (const { petitionId, petitionFieldId, loadInternalComments } of ids) {
              qb = qb.orWhere((qb) => {
                qb.where({
                  petition_id: petitionId,
                  petition_field_id: petitionFieldId,
                });
              });
              if (!loadInternalComments) {
                qb.andWhere("is_internal", false);
              }
            }
          })
          .whereNull("deleted_at")

          .select("*");

        const byId = groupBy(rows, keyBuilder(["petition_id", "petition_field_id"]));
        return ids
          .map(keyBuilder(["petitionId", "petitionFieldId"]))
          .map((key) => this.sortComments(byId[key] ?? []));
      },
      {
        cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId"]),
      }
    )
  );

  readonly loadPetitionFieldUnreadCommentCountForFieldAndAccess = fromDataLoader(
    new DataLoader<
      { accessId: number; petitionId: number; petitionFieldId: number },
      number,
      string
    >(
      async (ids) => {
        const rows = await this.raw<{
          petition_id: number;
          petition_field_id: number;
          petition_access_id: number;
          unread_count: number;
        }>(
          /* sql */ `
          select
            pcn.petition_id,
            (pcn.data ->> 'petition_field_id')::int as petition_field_id,
            pcn.petition_access_id,
            count(*)::int as unread_count
          from petition_contact_notification pcn
          where (
            ${ids
              .map(
                () => /* sql */ `(
                  pcn.petition_id = ?
                  and pcn.petition_access_id = ?
                  and (pcn.data ->> 'petition_field_id')::int = ?
                )`
              )
              .join(" or ")}
            )
            and pcn.is_read = false
          group by
            pcn.petition_id,
            (pcn.data ->> 'petition_field_id')::int,
            pcn.petition_access_id

        `,
          [...ids.flatMap((x) => [x.petitionId, x.accessId, x.petitionFieldId])]
        );

        const rowsById = indexBy(
          rows,
          keyBuilder(["petition_id", "petition_field_id", "petition_access_id"])
        );

        return ids.map(keyBuilder(["petitionId", "petitionFieldId", "accessId"])).map((key) => {
          return rowsById[key]?.unread_count ?? 0;
        });
      },
      {
        cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId", "accessId"]),
      }
    )
  );

  private sortComments(comments: PetitionFieldComment[]) {
    return comments.sort((a, b) => a.created_at.valueOf() - b.created_at.valueOf());
  }

  readonly loadPetitionFieldComment = this.buildLoadBy("petition_field_comment", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async loadUnprocessedCommentCreatedUserNotifications() {
    return await this.raw<CommentCreatedUserNotification>(/* sql */ `
      SELECT * from petition_user_notification 
      where processed_at is null
      and is_read = false
      and type = 'COMMENT_CREATED'
      order by created_at desc
    `);
  }

  async loadUnprocessedCommentCreatedContactNotifications() {
    return await this.raw<PetitionContactNotification>(/* sql */ `
      SELECT * from petition_contact_notification 
      where processed_at is null
      and is_read = false
      and type = 'COMMENT_CREATED'
      order by created_at desc
    `);
  }

  readonly loadPetitionUserNotifications = this.buildLoadBy("petition_user_notification", "id");

  readonly loadUnreadPetitionUserNotificationsByUserId = this.buildLoadMultipleBy(
    "petition_user_notification",
    "user_id",
    (q) => q.where({ is_read: false })
  );

  async loadPetitionUserNotificationsByUserId(
    userId: number,
    opts: {
      limit?: Maybe<number>;
      filter?: Maybe<PetitionUserNotificationFilter>;
      before?: Maybe<Date>;
    }
  ) {
    return this.from("petition_user_notification")
      .where("user_id", userId)
      .mmodify((q) => {
        if (opts.filter === "UNREAD") {
          q.where("is_read", false);
        } else if (opts.filter === "COMMENTS") {
          q.where("type", "COMMENT_CREATED");
        } else if (opts.filter === "COMPLETED") {
          q.whereIn("type", ["PETITION_COMPLETED", "SIGNATURE_COMPLETED"]);
        } else if (opts.filter === "SHARED") {
          q.where("type", "PETITION_SHARED");
        } else if (opts.filter === "OTHER") {
          q.whereIn("type", [
            "MESSAGE_EMAIL_BOUNCED",
            "REMINDER_EMAIL_BOUNCED",
            "SIGNATURE_CANCELLED",
            "REMINDERS_OPT_OUT",
            "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
          ]);
        }
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

  async updatePetitionUserNotificationsReadStatus(
    petitionUserNotificationIds: number[],
    isRead: boolean,
    userId: number
  ) {
    return await this.from("petition_user_notification")
      .whereIn("id", petitionUserNotificationIds)
      .where("user_id", userId)
      .where("is_read", !isRead) // to return only the updated notifications
      .update(
        removeNotDefined({
          is_read: isRead,
          processed_at: isRead ? this.now() : undefined,
        }),
        "*"
      );
  }

  async updatePetitionUserNotificationsReadStatusByPetitionId(
    petitionIds: number[],
    isRead: boolean,
    userId: number
  ) {
    return await this.from("petition_user_notification")
      .whereIn("petition_id", petitionIds)
      .where("user_id", userId)
      .where("is_read", !isRead)
      .whereNot("type", "COMMENT_CREATED")
      .update(
        removeNotDefined({
          is_read: isRead,
          processed_at: isRead ? this.now() : undefined,
        }),
        "*"
      );
  }

  async updatePetitionUserNotificationsReadStatusByCommentIds(
    petitionFieldCommentIds: number[],
    isRead: boolean,
    userId: number
  ) {
    const comments = (await this.loadPetitionFieldComment(
      petitionFieldCommentIds
    )) as PetitionFieldComment[];
    return await this.from("petition_user_notification")
      .where({
        user_id: userId,
        type: "COMMENT_CREATED",
      })
      .where("is_read", !isRead)
      .where((qb) => {
        for (const comment of comments) {
          qb = qb.orWhere((qb) => {
            qb.where({ petition_id: comment.petition_id })
              .whereRaw("data ->> 'petition_field_id' = ?", comment.petition_field_id)
              .whereRaw("data ->> 'petition_field_comment_id' = ?", comment.id);
          });
        }
      })
      .update(
        removeNotDefined({
          is_read: isRead,
          processed_at: isRead ? this.now() : undefined,
        }),
        "*"
      );
  }

  async updatePetitionUserNotificationsReadStatusByUserId(
    filter: PetitionUserNotificationFilter,
    isRead: boolean,
    userId: number
  ) {
    return await this.from("petition_user_notification")
      .where("user_id", userId)
      .where("is_read", !isRead)
      .mmodify((q) => {
        if (filter === "UNREAD") {
          q.where("is_read", false);
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
      })
      .update(
        removeNotDefined({
          is_read: isRead,
          processed_at: isRead ? this.now() : undefined,
        }),
        "*"
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
    t?: Knex.Transaction
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
    data: Partial<CreatePetitionContactNotification>
  ) {
    return await this.from("petition_contact_notification")
      .whereIn("id", petitionContactNotificationIds)
      .update(data, "*");
  }

  readonly loadPetitionFieldCommentIsUnreadForUser = fromDataLoader(
    new DataLoader<
      {
        userId: number;
        petitionId: number;
        petitionFieldId: number;
        petitionFieldCommentId: number;
      },
      boolean,
      string
    >(
      async (ids) => {
        const userIds = uniq(ids.map((x) => x.userId));
        const petitionIds = uniq(ids.map((x) => x.petitionId));
        const petitionFieldIds = uniq(ids.map((x) => x.petitionFieldId));
        const petitionFieldCommentId = uniq(ids.map((x) => x.petitionFieldCommentId));
        const rows = await this.knex<CommentCreatedUserNotification>("petition_user_notification")
          .where("type", "COMMENT_CREATED")
          .whereIn("user_id", userIds)
          .whereIn("petition_id", petitionIds)
          .whereRaw(
            `data ->> 'petition_field_id' in (${petitionFieldIds.map(() => "?").join(",")})`,
            petitionFieldIds
          )
          .whereRaw(
            `data ->> 'petition_field_comment_id' in (${petitionFieldCommentId
              .map(() => "?")
              .join(",")})`,
            petitionFieldCommentId
          )
          .select("*");

        const byId = indexBy(
          rows,
          keyBuilder([
            "user_id",
            "petition_id",
            (r) => r.data.petition_field_id,
            (r) => r.data.petition_field_comment_id,
          ])
        );
        return ids
          .map(keyBuilder(["userId", "petitionId", "petitionFieldId", "petitionFieldCommentId"]))
          .map((key) => !(byId[key]?.is_read ?? true));
      },
      {
        cacheKeyFn: keyBuilder([
          "userId",
          "petitionId",
          "petitionFieldId",
          "petitionFieldCommentId",
        ]),
      }
    )
  );

  readonly loadPetitionFieldCommentIsUnreadForContact = fromDataLoader(
    new DataLoader<
      {
        petitionAccessId: number;
        petitionId: number;
        petitionFieldId: number;
        petitionFieldCommentId: number;
      },
      boolean,
      string
    >(
      async (ids) => {
        const petitionAccessIds = uniq(ids.map((x) => x.petitionAccessId));
        const petitionIds = uniq(ids.map((x) => x.petitionId));
        const petitionFieldIds = uniq(ids.map((x) => x.petitionFieldId));
        const petitionFieldCommentId = uniq(ids.map((x) => x.petitionFieldCommentId));
        const rows = await this.from("petition_contact_notification")
          .where("type", "COMMENT_CREATED")
          .whereIn("petition_access_id", petitionAccessIds)
          .whereIn("petition_id", petitionIds)
          .whereRaw(
            `data ->> 'petition_field_id' in (${petitionFieldIds.map(() => "?").join(",")})`,
            petitionFieldIds
          )
          .whereRaw(
            `data ->> 'petition_field_comment_id' in (${petitionFieldCommentId
              .map(() => "?")
              .join(",")})`,
            petitionFieldCommentId
          )
          .select("*");

        const byId = indexBy(
          rows,
          keyBuilder([
            "petition_access_id",
            "petition_id",
            (r) => r.data.petition_field_id,
            (r) => r.data.petition_field_comment_id,
          ])
        );
        return ids
          .map(
            keyBuilder([
              "petitionAccessId",
              "petitionId",
              "petitionFieldId",
              "petitionFieldCommentId",
            ])
          )
          .map((key) => !(byId[key]?.is_read ?? true));
      },
      {
        cacheKeyFn: keyBuilder([
          "petitionAccessId",
          "petitionId",
          "petitionFieldId",
          "petitionFieldCommentId",
        ]),
      }
    )
  );

  async createPetitionFieldCommentFromUser(
    data: {
      petitionId: number;
      petitionFieldId: number;
      content: string;
      isInternal: boolean;
    },
    user: User
  ) {
    return await this.withTransaction(async (t) => {
      const [comment] = await this.insert(
        "petition_field_comment",
        {
          petition_id: data.petitionId,
          petition_field_id: data.petitionFieldId,
          content: data.content,
          user_id: user.id,
          is_internal: data.isInternal,
          created_by: `User:${user.id}`,
        },
        t
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
        t
      );

      return comment;
    });
  }

  async createPetitionFieldCommentFromAccess(
    data: {
      petitionId: number;
      petitionFieldId: number;
      content: string;
    },
    access: PetitionAccess
  ) {
    return await this.withTransaction(async (t) => {
      const [comment] = await this.insert(
        "petition_field_comment",
        {
          petition_id: data.petitionId,
          petition_field_id: data.petitionFieldId,
          content: data.content,
          petition_access_id: access.id,
          created_by: `PetitionAccess:${access.id}`,
        },
        t
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
        t
      );

      return comment;
    });
  }

  async deletePetitionFieldCommentFromUser(
    petitionId: number,
    petitionFieldId: number,
    petitionFieldCommentId: number,
    user: User
  ) {
    await Promise.all([
      this.deletePetitionFieldComment(petitionFieldCommentId, `User:${user.id}`),
      this.createEvent({
        type: "COMMENT_DELETED",
        petition_id: petitionId,
        data: {
          petition_field_id: petitionFieldId,
          petition_field_comment_id: petitionFieldCommentId,
          user_id: user.id,
        },
      }),
    ]);
  }

  async deletePetitionFieldCommentFromAccess(
    petitionId: number,
    petitionFieldId: number,
    petitionFieldCommentId: number,
    access: PetitionAccess
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
        "*"
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
  }

  async updatePetitionFieldCommentFromUser(
    petitionFieldCommentId: number,
    content: string,
    user: User
  ) {
    const [comment] = await this.from("petition_field_comment")
      .where("id", petitionFieldCommentId)
      .update(
        {
          content,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*"
      );
    return comment;
  }

  async updatePetitionFieldCommentFromContact(
    petitionFieldCommentId: number,
    content: string,
    contact: Contact
  ) {
    const [comment] = await this.from("petition_field_comment")
      .where("id", petitionFieldCommentId)
      .whereNull("deleted_at")
      .update(
        {
          content,
          updated_at: this.now(),
          updated_by: `Contact:${contact.id}`,
        },
        "*"
      );
    return comment;
  }

  /** @deprecated delete when removing `Mutation.updatePetitionFieldCommentsReadStatus` */
  async updatePetitionFieldCommentsReadStatusForUser(
    petitionFieldCommentIds: number[],
    isRead: boolean,
    user: User
  ) {
    const comments = (await this.loadPetitionFieldComment(
      petitionFieldCommentIds
    )) as PetitionFieldComment[];
    await this.from("petition_user_notification")
      .where({
        user_id: user.id,
        type: "COMMENT_CREATED",
      })
      .where((qb) => {
        for (const comment of comments) {
          qb = qb.orWhere((qb) => {
            qb.where({ petition_id: comment.petition_id })
              .whereRaw("data ->> 'petition_field_id' = ?", comment.petition_field_id)
              .whereRaw("data ->> 'petition_field_comment_id' = ?", comment.id);
          });
        }
      })
      .update({ is_read: isRead });

    return comments;
  }

  async markPetitionFieldCommentsAsReadForAccess(
    petitionFieldCommentIds: number[],
    accessId: number
  ) {
    const comments = (await this.loadPetitionFieldComment(
      petitionFieldCommentIds
    )) as PetitionFieldComment[];
    await this.from("petition_contact_notification")
      .where({
        petition_access_id: accessId,
        type: "COMMENT_CREATED",
      })
      .where((qb) => {
        for (const comment of comments) {
          qb = qb.orWhere((qb) => {
            qb.where({ petition_id: comment.petition_id })
              .whereRaw("data ->> 'petition_field_id' = ?", comment.petition_field_id)
              .whereRaw("data ->> 'petition_field_comment_id' = ?", comment.id);
          });
        }
      })
      .update({ is_read: true });
    return comments;
  }

  async accessesBelongToValidContacts(accessIds: number[]) {
    const {
      rows: [{ count }],
    } = await this.knex.raw(
      /* sql */ `
      select count(distinct c.id)::int as count
        from petition_access as pa
          join contact as c on c.id = pa.contact_id
        where
          pa.id in (${accessIds.map(() => "?").join(", ")})
          and c.deleted_at is null
    `,
      [...accessIds]
    );
    return count === new Set(accessIds).size;
  }

  async changePetitionFieldType(
    petitionId: number,
    fieldId: number,
    type: PetitionFieldType,
    user: User
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
          validated: false,
          ...defaultFieldOptions(type, field),
        },
        user,
        t
      );
    });
  }

  readonly loadPetitionPermission = this.buildLoadBy("petition_permission", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadEffectivePermissions = fromDataLoader(
    new DataLoader<number, EffectivePetitionPermission[]>(async (petitionIds) => {
      const rows = await this.raw<EffectivePetitionPermission>(
        /* sql */ `
        select petition_id, user_id, min("type") as type, bool_or(is_subscribed) is_subscribed 
        from petition_permission 
          where deleted_at is null 
          and user_group_id is null
          and petition_id in (${petitionIds.map(() => "?").join(", ")})
          group by user_id, petition_id
      `,
        petitionIds
      );

      const byPetitionId = groupBy(rows, (r) => r.petition_id);
      return petitionIds.map((id) => byPetitionId[id]);
    })
  );

  readonly loadUserPermissionsByPetitionId = this.buildLoadMultipleBy(
    "petition_permission",
    "petition_id",
    (q) => q.whereNull("deleted_at").whereNull("user_group_id").orderByRaw("type asc, created_at")
  );

  readonly loadPetitionPermissionsByUserId = this.buildLoadMultipleBy(
    "petition_permission",
    "user_id",
    (q) => q.whereNull("deleted_at").orderByRaw("type asc, created_at")
  );

  readonly loadUserAndUserGroupPermissionsByPetitionId = this.buildLoadMultipleBy(
    "petition_permission",
    "petition_id",
    (q) =>
      q
        .whereNull("deleted_at")
        .whereNull("from_user_group_id")
        .orderByRaw("type asc, user_group_id nulls first, created_at")
  );

  readonly loadDirectlyAssignedUserPetitionPermissionsByUserId = this.buildLoadMultipleBy(
    "petition_permission",
    "user_id",
    (q) =>
      q
        .whereNull("deleted_at")
        .whereNull("user_group_id")
        .whereNull("from_user_group_id")
        .orderByRaw("type asc, created_at")
  );

  readonly loadPetitionOwner = fromDataLoader(
    new DataLoader<number, User | null>(async (ids) => {
      const rows = await this.from("petition_permission")
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
        rowsByPetitionId[id] ? (omit(rowsByPetitionId[id], ["petition_id"]) as User) : null
      );
    })
  );

  /**
   * clones every permission on `fromPetitionId` into `toPetitionIds`
   */
  async clonePetitionPermissions(
    fromPetitionId: number,
    toPetitionIds: number[],
    t?: Knex.Transaction
  ) {
    await this.raw(
      /* sql */ `
        with
          u as (select user_id, type, is_subscribed, user_group_id, from_user_group_id from petition_permission where petition_id = ? and deleted_at is null),
          p as (select * from (values ${toPetitionIds
            .map(() => "(?::int)")
            .join(",")}) as t (petition_id))
        insert into petition_permission(petition_id, user_id, type, is_subscribed, user_group_id, from_user_group_id)
        select p.petition_id, u.user_id, u.type, u.is_subscribed, u.user_group_id, u.from_user_group_id from u cross join p
        `,
      [fromPetitionId, ...toPetitionIds],
      t
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
    creator: User,
    t?: Knex.Transaction
  ) {
    const [newUsers, newUserGroups] = partition(data, (d) => d.type === "User");
    return await this.withTransaction(async (t) => {
      const [
        directlyAssignedNewUserPermissions,
        userGroupNewPermissions,
        groupAssignedNewUserPermissions,
      ] = await Promise.all([
        newUsers.length > 0
          ? this.raw<PetitionPermission>(
              /* sql */ `
                ? on conflict do nothing returning *;
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
                      created_by: `User:${creator.id}`,
                      updated_by: `User:${creator.id}`,
                    }))
                  )
                ),
              ],
              t
            )
          : [],
        newUserGroups.length > 0
          ? this.raw<PetitionPermission>(
              /* sql */ `
                ? on conflict do nothing returning *;
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
                      created_by: `User:${creator.id}`,
                      updated_by: `User:${creator.id}`,
                    }))
                  )
                ),
              ],
              t
            )
          : [],
        // user permissions through a user group
        newUserGroups.length > 0
          ? this.raw<PetitionPermission>(
              /* sql */ `
              with gm as (
                select ugm.user_id, ugm.user_group_id, ugm_info.is_subscribed, ugm_info.permission_type
                from user_group_member ugm
                -- each user group may have different is_subscribed and permission_type values assigned
                join (select user_group_id, is_subscribed, permission_type from (values ${newUserGroups
                  .map(() => `(?::int, ?::bool, ?::petition_permission_type)`)
                  .join(
                    ","
                  )}) as t(user_group_id, is_subscribed, permission_type)) as ugm_info on ugm_info.user_group_id = ugm.user_group_id
                where ugm.deleted_at is null and ugm.user_group_id in (${newUserGroups
                  .map(() => `(?::int)`)
                  .join(", ")})),
              p as (
                select petition_id from (
                  values ${petitionIds.map(() => "(?::int)").join(", ")}
                ) as t(petition_id))
              insert into petition_permission(petition_id, user_id, from_user_group_id, is_subscribed, type, created_by)
              select p.petition_id, gm.user_id, gm.user_group_id, gm.is_subscribed, gm.permission_type, ? 
              from gm cross join p
              on conflict do nothing returning *;
            `,
              [
                ...newUserGroups.map((ug) => [ug.id, ug.isSubscribed, ug.permissionType]).flat(),
                ...newUserGroups.map((ug) => ug.id),
                ...petitionIds,
                `User:${creator.id}`,
              ],
              t
            )
          : [],
      ]);

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      const petitions = await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");

      return {
        petitions,
        newPermissions: [
          ...directlyAssignedNewUserPermissions,
          ...userGroupNewPermissions,
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
    user: User
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
                .whereNull("user_group_id")
            )
            .orWhere((q) => q.whereIn("user_group_id", userGroupIds).whereNotNull("user_group_id"))
            .orWhere((q) =>
              q.whereIn("from_user_group_id", userGroupIds).whereNotNull("from_user_group_id")
            )
        )
        .update(
          {
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
            type: newPermissionType,
          },
          "*"
        );

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      const [directlyAssigned, groupAssigned] = partition(
        updatedPermissions.filter((p) => p.from_user_group_id === null),
        (p) => p.user_group_id === null
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
        t
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
    t?: Knex.Transaction
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
                    .whereNull("user_group_id")
                )
                .orWhere((q) =>
                  q.whereIn("user_group_id", userGroupIds).whereNotNull("user_group_id")
                )
                .orWhere((q) =>
                  q.whereIn("from_user_group_id", userGroupIds).whereNotNull("from_user_group_id")
                )
            );
          }
        })
        .update(
          {
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          },
          "*"
        );

      for (const petitionId of petitionIds) {
        this.loadUserPermissionsByPetitionId.dataloader.clear(petitionId);
      }

      const [directlyAssigned, groupAssigned] = partition(
        removedPermissions.filter((p) => p.from_user_group_id === null),
        (p) => p.user_group_id === null
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
        t
      );
      return removedPermissions;
    }, t);
  }

  private async removePetitionPermissionsById(
    petitionUserPermissionIds: number[],
    user: User,
    t?: Knex.Transaction
  ) {
    return this.withTransaction(async (t) => {
      const removedPermissions = await this.from("petition_permission", t)
        .whereIn("id", petitionUserPermissionIds)
        .update(
          {
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          },
          "*"
        );

      const [directlyAssigned, groupAssigned] = partition(
        removedPermissions.filter((p) => p.from_user_group_id === null),
        (p) => p.user_group_id === null
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
        t
      );

      return removedPermissions;
    }, t);
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
    t?: Knex.Transaction
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
            }))
          ),
          "OWNER",
          `User:${updatedBy.id}`,
          this.now(),
        ]
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
        t
      );

      if (!keepOriginalPermissions) {
        await this.removePetitionPermissionsById(
          previousOwnerPermissions.map((p) => p.id),
          updatedBy,
          t
        );
      }

      return await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");
    }, t);
  }

  async arePublicTemplates(templateIds: MaybeArray<number>): Promise<boolean> {
    const [{ count }] = await this.from("petition")
      .whereIn("id", unMaybeArray(templateIds))
      .where({
        deleted_at: null,
        template_public: true,
        is_template: true,
      })
      .select(this.count());

    return count === uniq(unMaybeArray(templateIds)).length;
  }

  async loadPublicTemplates(
    opts: {
      search?: string | null;
      locale?: PetitionLocale | null;
      sortBy?: "last_used_at" | "used_count";
      categories?: string[] | null;
    } & PageOpts,
    userId?: number
  ) {
    return await this.loadPageAndCount(
      this.from("petition")
        .where({
          template_public: true,
          deleted_at: null,
          is_template: true,
        })
        .mmodify((q) => {
          const { search, locale, sortBy, categories } = opts;
          if (locale) {
            q.where("locale", locale);
          }
          if (search) {
            const escapedSearch = `%${escapeLike(search, "\\")}%`;
            q.andWhere((q2) => {
              q2.whereIlike("name", escapedSearch, "\\").or.whereIlike(
                "template_description",
                escapedSearch,
                "\\"
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
          if (userId !== undefined) {
            q.leftJoin(
              this.knex.raw(
                /* sql */ `(
              SELECT
                p.from_template_id AS template_id,
                count(*) AS used_count,
                max(p.created_at) AS last_used_at 
              FROM petition AS p
                WHERE created_by = ?
                GROUP BY p.from_template_id
            ) as lj`,
                [`User:${userId}`]
              ),
              "lj.template_id",
              "petition.id"
            );
            if (sortBy === "used_count") {
              q.orderByRaw(/* sql */ `lj.used_count DESC NULLS LAST`);
            } else if (sortBy === undefined || sortBy === "last_used_at") {
              q.orderByRaw(/* sql */ `lj.last_used_at DESC NULLS LAST`);
            }
          }
        })
        .select<Petition[]>("petition.*"),
      opts
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
        [slug, templateId]
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
    "external_id"
  );

  readonly loadPetitionSignatureById = this.buildLoadBy("petition_signature_request", "id");

  readonly loadPetitionSignaturesByPetitionId = this.buildLoadMultipleBy(
    "petition_signature_request",
    "petition_id",
    (q) => q.orderBy("created_at", "desc")
  );

  readonly loadLatestPetitionSignatureByPetitionId = fromDataLoader(
    new DataLoader<number, PetitionSignatureRequest | null>(async (keys) => {
      const { rows } = await this.knex.raw<{
        rows: (PetitionSignatureRequest & { _rank: number })[];
      }>(
        /* sql */ `
        with cte as (
          select *, rank() over (partition by petition_id order by created_at desc) _rank
          from petition_signature_request
          where petition_id in (${keys.map(() => "?").join(", ")})
        ) select * from cte where _rank = 1
      `,
        [...keys]
      );
      const byPetitionId = indexBy(rows, (r) => r.petition_id);
      return keys.map((key) => (byPetitionId[key] ? omit(byPetitionId[key], ["_rank"]) : null));
    })
  );

  async createPetitionSignature(
    petitionId: number,
    config: {
      provider: string;
      contactIds: number[];
      timezone: string;
      title: string;
      message?: string;
    }
  ) {
    const [row] = await this.insert("petition_signature_request", {
      petition_id: petitionId,
      signature_config: config,
    }).returning("*");

    return row;
  }

  async updatePetitionSignature(
    petitionSignatureId: number,
    data: Partial<PetitionSignatureRequest>
  ) {
    const [row] = await this.from("petition_signature_request")
      .where("id", petitionSignatureId)
      .update({
        ...data,
        updated_at: this.now(),
      })
      .returning("*");

    return row;
  }

  async updatePetitionSignatureByExternalId(
    prefixedExternalId: string,
    data: Partial<Omit<PetitionSignatureRequest, "event_logs">>
  ) {
    const [row] = await this.from("petition_signature_request")
      .where("external_id", prefixedExternalId)
      .update({
        ...data,
        updated_at: this.now(),
      })
      .returning("*");

    return row;
  }

  async appendPetitionSignatureEventLogs(prefixedExternalId: string, logs: any[]) {
    return await this.knex.raw(
      /* sql */ `
        UPDATE petition_signature_request
        SET event_logs = event_logs || ${logs.map(() => "?::jsonb").join(" || ")}
        WHERE external_id = ?
      `,
      [...logs, prefixedExternalId]
    );
  }

  async userHasAccessToPetitionSignatureRequests(
    userId: number,
    ids: number[],
    petitionPermissionTypes?: PetitionPermissionType[]
  ) {
    const [{ count }] = await this.from("petition_signature_request")
      .join(
        "petition_permission",
        "petition_signature_request.petition_id",
        "petition_permission.petition_id"
      )
      .whereIn("petition_signature_request.id", ids)
      .where("petition_permission.user_id", userId)
      .whereNull("petition_permission.deleted_at")
      .whereNull("petition_permission.deleted_at")
      .mmodify((q) => {
        if (petitionPermissionTypes) {
          q.whereIn("petition_permission.type", petitionPermissionTypes);
        }
      })
      .select(this.count());

    return count === new Set(ids).size;
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
    const [permission] = await this.from("petition_permission")
      .join("user", "user.id", "petition_permission.user_id")
      .where({
        "petition_permission.user_id": userId,
        "petition_permission.petition_id": petitionId,
      })
      .whereNull("petition_permission.deleted_at")
      .whereNull("user.deleted_at")
      .select<PetitionPermission[]>("petition_permission.*");

    return permission.is_subscribed;
  }

  async updatePetitionPermissionSubscription(
    petitionId: number,
    isSubscribed: boolean,
    user: User
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
        "*"
      );

    return row;
  }

  readonly loadFieldAttachment = this.buildLoadBy("petition_field_attachment", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadFieldAttachmentsByFieldId = this.buildLoadMultipleBy(
    "petition_field_attachment",
    "petition_field_id",
    (q) => q.whereNull("deleted_at")
  );

  async createPetitionFieldAttachment(data: CreatePetitionFieldAttachment, user: User) {
    const [row] = await this.insert("petition_field_attachment", {
      ...data,
      created_by: `User:${user.id}`,
    });
    return row;
  }

  async removePetitionFieldAttachment(attachmentId: number, user: User) {
    await this.withTransaction(async (t) => {
      const [row] = await this.from("petition_field_attachment", t)
        .where("id", attachmentId)
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .returning("*");

      await this.safeDeleteFileUploadAttachments([row.file_upload_id], user, t);
    });
  }

  /** delete attached files only if they are not referenced in any other field attachment */
  private async safeDeleteFileUploadAttachments(
    fileUploadIds: number[],
    user: User,
    t?: Knex.Transaction
  ) {
    if (fileUploadIds.length > 0) {
      await this.raw(
        /* sql */ `
        update file_upload set deleted_at = ?, deleted_by = ?
        where id in (${fileUploadIds.map(() => "?").join(", ")})
        and deleted_at is null
        and not exists (
          select id from petition_field_attachment 
          where deleted_at is null 
          and file_upload_id in (${fileUploadIds.map(() => "?").join(", ")})
          )`,
        [this.now(), `User:${user.id}`, ...fileUploadIds, ...fileUploadIds],
        t
      );
    }
  }

  private async removePetitionFieldAttachmentByFieldId(
    petitionFieldId: number,
    user: User,
    t?: Knex.Transaction
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

    await this.safeDeleteFileUploadAttachments(
      deletedAttachments.map((a) => a.file_upload_id),
      user,
      t
    );
  }

  readonly loadPublicPetitionLink = this.buildLoadBy("public_petition_link", "id");

  readonly loadPublicPetitionLinkBySlug = this.buildLoadBy("public_petition_link", "slug", (q) =>
    q.where("is_active", true)
  );

  readonly loadPublicPetitionLinksByTemplateId = this.buildLoadMultipleBy(
    "public_petition_link",
    "template_id",
    (q) => q.orderBy("created_at", "asc")
  );

  readonly loadPublicPetitionLinkUserByPublicPetitionLinkId = this.buildLoadMultipleBy(
    "public_petition_link_user",
    "public_petition_link_id",
    (q) =>
      q
        .whereNull("deleted_at")
        .whereNull("from_user_group_id")
        .orderByRaw("type asc, user_group_id nulls first, created_at")
  );

  async createPublicPetitionLink(
    data: CreatePublicPetitionLink,
    createdBy: string,
    t?: Knex.Transaction
  ) {
    const [row] = await this.insert(
      "public_petition_link",
      {
        ...data,
        created_by: createdBy,
      },
      t
    ).select("*");

    return row;
  }

  async updatePublicPetitionLink(
    publicPetitionLinkId: number,
    data: Partial<PublicPetitionLink>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const [row] = await this.from("public_petition_link", t)
      .where("id", publicPetitionLinkId)
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*"
      );

    return row;
  }

  async createPublicPetitionLinkUser(
    publicPetitionLinkId: number,
    data: {
      type: "User" | "UserGroup";
      id: number;
      permissionType: PetitionPermissionType;
      isSubscribed: boolean;
    }[],
    createdBy: string,
    t?: Knex.Transaction
  ) {
    const [users, userGroups] = partition(data, (d) => d.type === "User");
    await Promise.all([
      users.length > 0
        ? this.raw<PublicPetitionLinkUser>(
            /* sql */ `
                ? on conflict do nothing returning *;
        `,
            [
              // directly-assigned user permissions
              this.from("public_petition_link_user").insert(
                users.map((user) => ({
                  public_petition_link_id: publicPetitionLinkId,
                  user_id: user.id,
                  is_subscribed: user.isSubscribed,
                  type: user.permissionType,
                  created_by: createdBy,
                }))
              ),
            ],
            t
          )
        : [],
      userGroups.length > 0
        ? this.raw<PublicPetitionLinkUser>(
            /* sql */ `
              ? on conflict do nothing returning *;
            `,
            [
              // group permissions
              this.from("public_petition_link_user").insert(
                userGroups.map((userGroup) => ({
                  public_petition_link_id: publicPetitionLinkId,
                  user_group_id: userGroup.id,
                  is_subscribed: userGroup.isSubscribed,
                  type: userGroup.permissionType,
                  created_by: createdBy,
                }))
              ),
            ],
            t
          )
        : [],
      userGroups.length > 0
        ? this.raw<PublicPetitionLinkUser>(
            /* sql */ `
            with gm as (
              select ugm.user_id, ugm.user_group_id, ugm_info.is_subscribed, ugm_info.permission_type
              from user_group_member ugm
              join (select user_group_id, is_subscribed, permission_type from (values ${userGroups
                .map(() => `(?::int, ?::bool, ?::petition_permission_type)`)
                .join(
                  ","
                )}) as t(user_group_id, is_subscribed, permission_type)) as ugm_info on ugm_info.user_group_id = ugm.user_group_id
                where ugm.deleted_at is null and ugm.user_group_id in (${userGroups
                  .map(() => `(?::int)`)
                  .join(", ")})
            )
            insert into public_petition_link_user(public_petition_link_id, user_id, from_user_group_id, is_subscribed, type, created_by)
            select ?, gm.user_id, gm.user_group_id, gm.is_subscribed, gm.permission_type, ?
            from gm 
            on conflict do nothing returning *;
          `,
            [
              ...userGroups.map((ug) => [ug.id, ug.isSubscribed, ug.permissionType]).flat(),
              ...userGroups.map((ug) => ug.id),
              publicPetitionLinkId,
              createdBy,
            ],
            t
          )
        : [],
    ]);
  }

  async replacePublicPetitionLinkPermissions(
    publicPetitionLinkId: number,
    newOwner: Maybe<{ userId: number; isSubscribed: boolean }>,
    otherPermissions: Maybe<
      {
        id: number;
        type: "User" | "UserGroup";
        permissionType: PetitionPermissionTypeRW;
        isSubscribed: boolean;
      }[]
    >,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    await this.withTransaction(async (t) => {
      if (newOwner) {
        await this.from("public_petition_link_user", t)
          .where({
            public_petition_link_id: publicPetitionLinkId,
            type: "OWNER",
          })
          .update({
            deleted_at: this.now(),
            deleted_by: updatedBy,
            updated_at: this.now(),
            updated_by: updatedBy,
          });
      }
      if (otherPermissions) {
        await this.from("public_petition_link_user", t)
          .where("public_petition_link_id", publicPetitionLinkId)
          .whereNot("type", "OWNER")
          .update({
            deleted_at: this.now(),
            deleted_by: updatedBy,
            updated_at: this.now(),
            updated_by: updatedBy,
          });
      }

      const newPermissions: any[] = [
        newOwner
          ? {
              id: newOwner.userId,
              type: "User",
              isSubscribed: newOwner.isSubscribed,
              permissionType: "OWNER",
            }
          : null,
        ...(otherPermissions ?? []),
      ].filter(isDefined);

      if (newPermissions.length > 0) {
        await this.createPublicPetitionLinkUser(publicPetitionLinkId, newPermissions, updatedBy, t);
      }
    }, t);
  }

  async getPublicPetitionLinkUsersByPublicPetitionLinkId(
    publicPetitionLinkId: number
  ): Promise<(User | null)[]> {
    return await this.from("public_petition_link_user")
      .where("public_petition_link_id", publicPetitionLinkId)
      .whereNull("public_petition_link_user.deleted_at")
      .leftJoin("user", "public_petition_link_user.user_id", "user.id")
      .whereNull("user.deleted_at")
      .select("user.*")
      .orderBy("public_petition_link_user.type", "asc"); // OWNER of the public link will be first on the list
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

  async clonePublicPetitionLinkUsersIntoPetitionPermission(
    publicPetitionLinkId: number,
    petitionId: number,
    t?: Knex.Transaction
  ) {
    await this.raw(
      /* sql */ `
      insert into petition_permission(petition_id, user_id, type, is_subscribed, user_group_id, from_user_group_id)
        (
          select ?, pplu.user_id, pplu.type, pplu.is_subscribed, pplu.user_group_id, pplu.from_user_group_id 
          from public_petition_link_user pplu where pplu.public_petition_link_id = ? and deleted_at is null
        )
    `,
      [petitionId, publicPetitionLinkId],
      t
    );
  }

  async getLatestPetitionAccessFromPublicPetitionLink(
    publicPetitionLinkId: number,
    contactEmail: string
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
      [userId]
    );

    return {
      petitions_sent: petitions.length,
      petitions_sent_this_month: countBy(petitions, (p) => isThisMonth(p.sent_at)),
      petitions_sent_last_month: countBy(petitions, (p) =>
        isSameMonth(p.sent_at, subMonths(new Date(), 1))
      ),
      petitions_pending: petitions.filter((s) => s.status === "PENDING").length,
    };
  }
}
