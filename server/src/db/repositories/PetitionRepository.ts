import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import {
  countBy,
  groupBy,
  indexBy,
  maxBy,
  omit,
  sortBy,
  uniq,
  zip,
} from "remeda";
import { Aws, AWS_SERVICE } from "../../services/aws";
import { partition, unMaybeArray } from "../../util/arrays";
import {
  evaluateFieldVisibility,
  PetitionFieldVisibility,
} from "../../util/fieldVisibility";
import { fromDataLoader } from "../../util/fromDataLoader";
import { fromGlobalId } from "../../util/globalId";
import { keyBuilder } from "../../util/keyBuilder";
import { isDefined } from "../../util/remedaExtensions";
import {
  calculateNextReminder,
  PetitionAccessReminderConfig,
} from "../../util/reminderUtils";
import { random } from "../../util/token";
import { Maybe, MaybeArray } from "../../util/types";
import { PetitionEvent, PetitionEventPayload } from "../events";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import {
  defaultFieldOptions,
  validateFieldOptions,
} from "../helpers/fieldOptions";
import { escapeLike, isValueCompatible, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  Contact,
  CreatePetition,
  CreatePetitionAccess,
  CreatePetitionContactNotification,
  CreatePetitionField,
  CreatePetitionFieldReply,
  CreatePetitionMessage,
  CreatePetitionReminder,
  CreatePetitionUserNotification,
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
  PetitionUserNotification,
  User,
} from "../__types";

type PetitionType = "PETITION" | "TEMPLATE";
type PetitionLocale = "en" | "es";

type PetitionFilter = {
  status?: PetitionStatus | null;
  locale?: PetitionLocale | null;
  type?: PetitionType | null;
  tagIds?: string[] | null;
};

type EffectivePetitionPermission = Pick<
  PetitionPermission,
  "petition_id" | "user_id" | "type" | "is_subscribed"
>;
@injectable()
export class PetitionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex, @inject(AWS_SERVICE) private aws: Aws) {
    super(knex);
  }

  readonly loadPetition = this.buildLoadById("petition", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadField = this.buildLoadById("petition_field", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadFieldWithNullVisibility = this.buildLoadById(
    "petition_field",
    "id",
    (q) => q.where({ deleted_at: null, visibility: null })
  );

  readonly loadFieldReply = this.buildLoadById(
    "petition_field_reply",
    "id",
    (q) => q.whereNull("deleted_at")
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
      return ids.map((id) =>
        byPfrId[id] ? omit(byPfrId[id], ["_pfr_id"]) : null
      );
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
      sortBy?: SortBy<keyof Petition | "last_used_at">[];
      filters?: PetitionFilter | null;
    } & PageOpts
  ) {
    const petitionType = opts.filters?.type || "PETITION";
    const hasOrderByLastUsed =
      petitionType === "TEMPLATE" &&
      opts.sortBy?.some((o) => o.column === "last_used_at");
    return await this.loadPageAndCount(
      this.from("petition")
        .leftJoin(
          { pp: "petition_permission" },
          "petition.id",
          "pp.petition_id"
        )
        .where({
          "pp.user_id": userId,
          is_template: petitionType === "TEMPLATE",
          "pp.deleted_at": null,
        })
        .mmodify((q) => {
          const { search, filters } = opts;
          if (filters?.locale) {
            q.where("locale", filters.locale);
          }
          if (search) {
            if (petitionType === "PETITION") {
              q.joinRaw(/* sql */ `
                left join petition_access pa on petition.id = pa.petition_id and pa.status = 'ACTIVE'
                left join contact c on pa.contact_id = c.id and c.deleted_at is null
              `);
            }
            q.andWhere((q2) => {
              q2.whereIlike("name", `%${escapeLike(search, "\\")}%`, "\\");
              if (petitionType === "PETITION") {
                q2.or
                  .whereIlike(
                    this.knex.raw(`concat(c.first_name, ' ', c.last_name)`),
                    `%${escapeLike(search, "\\")}%`,
                    "\\"
                  )
                  .or.whereIlike(
                    "c.email",
                    `%${escapeLike(search, "\\")}%`,
                    "\\"
                  );
              } else {
                q2.or.whereIlike(
                  "template_description",
                  `%${escapeLike(search, "\\")}%`,
                  "\\"
                );
              }
            });
          }
          if (filters?.status && petitionType === "PETITION") {
            q.where("petition.status", filters.status);
          }

          if (filters?.tagIds) {
            if (filters.tagIds.length > 0) {
              filters.tagIds.forEach((tagId, i) => {
                q.joinRaw(
                  `join petition_tag pt${i} on (pt${i}.petition_id = petition.id and pt${i}.tag_id = ?)`,
                  [fromGlobalId(tagId, "Tag").id]
                );
              });
            } else {
              // exclude petitions with tags
              q.whereRaw(
                /* sql */ `
                petition.id not in (
                  select distinct pt.petition_id
                    from petition_permission pp
                    join petition_tag pt on pt.petition_id = pp.petition_id
                    where pp.user_id = ? and pp.deleted_at is null
                )`,
                [userId]
              );
            }
          }

          if (hasOrderByLastUsed) {
            q.leftJoin(
              this.knex.raw(
                /* sql */ `(
                  select
                    p.from_template_id as template_id,
                    max(p.created_at) as last_used_at
                  from petition as p
                    where created_by = ?
                    group by p.from_template_id
                ) as lj
                `,
                [`User:${userId}`]
              ),
              "lj.template_id",
              "petition.id"
            ).orderByRaw(
              opts
                .sortBy!.map((s) => {
                  const table = s.column === "last_used_at" ? "lj" : "petition";
                  return `${table}.${s.column} ${s.order} NULLS LAST`;
                })
                .join(", ")
            );
          } else if (opts.sortBy?.length) {
            // last_used_at is only for templates
            q.orderBy(opts.sortBy.filter((o) => o.column !== "last_used_at"));
          }
        })
        // default order by to ensure result consistency
        // applies after any previously specified order by
        .orderBy("petition.id")
        .distinct(
          "petition.*",
          // when using distinct pg requires any order by clause to be included on the select
          ...(hasOrderByLastUsed ? ["lj.last_used_at"] : [])
        ),
      opts
    );
  }

  readonly loadFieldsForPetition = this.buildLoadMultipleBy(
    "petition_field",
    "petition_id",
    (q) => q.whereNull("deleted_at").orderBy("position")
  );

  readonly loadFieldsForPetitionWithNullVisibility = this.buildLoadMultipleBy(
    "petition_field",
    "petition_id",
    (q) => q.where({ deleted_at: null, visibility: null }).orderBy("position")
  );

  readonly loadFieldCountForPetition = this.buildLoadCountBy(
    "petition_field",
    "petition_id",
    (q) => q.whereNull("deleted_at")
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
        "id" | "petition_id" | "validated" | "optional" | "visibility"
      > & { content: string })[] = await this.knex<PetitionField>(
        "petition_field as pf"
      )
        .leftJoin<PetitionFieldReply>(
          "petition_field_reply as pfr",
          function () {
            this.on("pf.id", "pfr.petition_field_id").andOnNull(
              "pfr.deleted_at"
            );
          }
        )
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

        const visibleFields = zip(
          fieldsWithReplies,
          evaluateFieldVisibility(fieldsWithReplies)
        )
          .filter(([, isVisible]) => isVisible)
          .map(([field]) => field);

        return {
          validated: countBy(visibleFields, (f) => f.validated),
          replied: countBy(
            visibleFields,
            (f) => f.replies.length > 0 && !f.validated
          ),
          optional: countBy(
            visibleFields,
            (f) => f.optional && f.replies.length === 0 && !f.validated
          ),
          total: visibleFields.length,
        };
      });
    })
  );

  readonly loadAccess = this.buildLoadById("petition_access", "id");

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
      | "contact_id"
      | "next_reminder_at"
      | "reminders_active"
      | "reminders_config"
      | "reminders_left"
    >[],
    user: User
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
            }))
          );
    if (rows.length > 0) {
      await this.createEvent(
        rows.map((access) => ({
          type: "ACCESS_ACTIVATED",
          petitionId,
          data: {
            petition_access_id: access.id,
            user_id: user.id,
          },
        }))
      );
    }
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

  readonly loadMessage = this.buildLoadById("petition_message", "id");

  readonly loadMessageByEmailLogId = this.buildLoadBy(
    "petition_message",
    "email_log_id"
  );

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
    user: User
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
            }))
          );
    if (rows.length > 0) {
      await this.createEvent(
        rows.map((message) => ({
          type: scheduledAt ? "MESSAGE_SCHEDULED" : "MESSAGE_SENT",
          petitionId,
          data: {
            petition_message_id: message.id,
          },
        }))
      );
    }

    return rows;
  }

  async cancelScheduledMessage(
    petitionId: number,
    messageId: number,
    user: User
  ) {
    const [row] = await this.from("petition_message")
      .where({ id: messageId, status: "SCHEDULED" })
      .update(
        {
          status: "CANCELLED",
        },
        "*"
      );
    await this.createEvent({
      type: "MESSAGE_CANCELLED",
      petitionId,
      data: {
        petition_message_id: messageId,
        user_id: user.id,
      },
    });
    return row ?? null;
  }

  async deactivateAccesses(
    petitionId: number,
    accessIds: number[],
    user: User
  ) {
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
    await this.createEvent(
      accesses.map((access) => ({
        type: "ACCESS_DEACTIVATED",
        petitionId,
        data: {
          petition_access_id: access.id,
          user_id: user.id,
        },
      }))
    );
    if (messages.length > 0) {
      await this.createEvent(
        messages.map((message) => ({
          type: "MESSAGE_CANCELLED",
          petitionId,
          data: {
            petition_message_id: message.id,
            user_id: user.id,
          },
        }))
      );
    }
    return accesses;
  }

  async reactivateAccesses(
    petitionId: number,
    accessIds: number[],
    user: User
  ) {
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
        petitionId,
        data: {
          petition_access_id: access.id,
          user_id: user.id,
        },
      }))
    );
    return accesses;
  }

  async updatePetitionAccessNextReminder(
    accessId: number,
    nextReminderAt: Date | null
  ) {
    const [row] = await this.from("petition_access")
      .where("id", accessId)
      .update({ next_reminder_at: nextReminderAt }, "*");
    return row;
  }

  async processPetitionMessage(messageId: number, emailLogId: number) {
    const [row] = await this.from("petition_message")
      .where("id", messageId)
      .update(
        {
          status: "PROCESSED",
          email_log_id: emailLogId,
        },
        "*"
      );
    return row;
  }

  async createPetition(
    data: Omit<CreatePetition, "org_id" | "status">,
    user: User
  ) {
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
          (["HEADING", "SHORT_TEXT"] as PetitionFieldType[]).map(
            (type, index) => ({
              ...defaultFieldOptions(type),
              petition_id: petition.id,
              type,
              is_fixed: type === "HEADING",
              position: index,
              created_by: `User:${user.id}`,
              updated_by: `User:${user.id}`,
            })
          ),
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

  async deleteAllPermissions(
    petitionIds: number[],
    user: User,
    t?: Knex.Transaction
  ) {
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
  async deletePetitionById(
    petitionId: MaybeArray<number>,
    user: User,
    t?: Knex.Transaction
  ) {
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
      for (const [, _accesses] of Object.entries(
        groupBy(accesses, (a) => a.petition_id)
      )) {
        await this.createEvent(
          _accesses.map((access) => ({
            type: "ACCESS_DEACTIVATED",
            petitionId: _accesses[0].petition_id,
            data: {
              petition_access_id: access.id,
              user_id: user.id,
            },
          })),
          t
        );
      }
      for (const [, _messages] of Object.entries(
        groupBy(messages, (m) => m.petition_id)
      )) {
        await this.createEvent(
          _messages.map((message) => ({
            type: "MESSAGE_CANCELLED",
            petitionId: _messages[0].petition_id,
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
    petitionId: number,
    data: Partial<CreatePetition>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const [row] = await this.from("petition", t)
      .where("id", petitionId)
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

  async updateFieldPositions(
    petitionId: number,
    fieldIds: number[],
    user: User
  ) {
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
      if (
        fixedPositions.some(
          ([field, index]) => fieldIds.indexOf(field.id) !== index
        )
      ) {
        throw new Error("INVALID_PETITION_FIELD_IDS");
      }

      // check visibility conditions fields refer to previous fields
      const positions = Object.fromEntries(
        Array.from(fieldIds.entries()).map(([index, id]) => [id, index])
      );
      for (const field of fields) {
        const visibility = field.visibility as Maybe<PetitionFieldVisibility>;
        if (
          visibility?.conditions.some(
            (c) => positions[c.fieldId] >= positions[field.id]
          )
        ) {
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
        await this.from("petition_field", t)
          .whereIn("id", fieldIds)
          .update({ deleted_at: null });
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
            validated: this.knex.raw(
              `case type when 'HEADING' then true else false end`
            ),
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

  async validateFieldData(
    fieldId: number,
    data: { options: Maybe<Record<string, any>> }
  ) {
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

  async validatePetitionFields(
    petitionId: number,
    fieldIds: number[],
    value: boolean,
    user: User
  ) {
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
    const newStatus = petitionFields
      .filter((f) => f.type !== "HEADING")
      .every((f) => f.validated)
      ? "CLOSED"
      : petition!.status === "CLOSED"
      ? "PENDING"
      : petition!.status;

    await this.from("petition")
      .where("id", petitionId)
      .update({ status: newStatus });

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
      return await this.from("petition_access", t)
        .where("petition_id", petitionId)
        .update(
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
    const createdBy = isDefined((data as any).petition_access_id)
      ? "Contact"
      : "User";

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
      petitionId: field.petition_id,
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
        petitionId: field!.petition_id,
        data: {
          petition_access_id: reply.petition_access_id!,
          petition_field_id: reply.petition_field_id,
          petition_field_reply_id: reply.id,
        },
      }),
    ]);
  }

  async updatePetitionFieldRepliesStatus(
    replyIds: number[],
    status: PetitionFieldReplyStatus
  ) {
    return await this.from("petition_field_reply")
      .whereIn("id", replyIds)
      .update({ status }, "*");
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
    const repliesByFieldId = Object.fromEntries(
      fieldsIds.map((id, index) => [id, replies[index]])
    );
    const fieldsWithReplies = fields.map((f) => ({
      ...f,
      replies: repliesByFieldId[f.id],
    }));

    const canComplete = zip(
      fieldsWithReplies,
      evaluateFieldVisibility(fieldsWithReplies)
    ).every(
      ([field, isVisible]) =>
        field.type === "HEADING" ||
        field.optional ||
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
        petitionId,
        type: "PETITION_COMPLETED",
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
      .update({ status: "PROCESSING" }, "id");
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
    data?: Partial<CreatePetition>
  ) {
    const petition = await this.loadPetition(petitionId);

    return await this.withTransaction(async (t) => {
      const fromTemplateId =
        isDefined(data?.is_template) &&
        data?.is_template === false &&
        petition?.is_template
          ? petitionId
          : null;

      const [cloned] = await this.insert(
        "petition",
        {
          ...omit(petition!, [
            "id",
            "created_at",
            "updated_at",
            "template_public",
            "from_template_id",
            "signature_config",
            ...(data?.is_template
              ? (["reminders_active", "reminders_config"] as const)
              : (["template_description"] as const)),
          ]),
          org_id: user.org_id,
          status: petition?.is_template ? null : "DRAFT",
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
                ...omit(field, [
                  "id",
                  "petition_id",
                  "created_at",
                  "updated_at",
                  "validated",
                ]),
                petition_id: cloned.id,
                created_by: `User:${user.id}`,
                updated_by: `User:${user.id}`,
              })),
              t
            ).returning("*"),
        this.insert(
          "petition_permission",
          {
            petition_id: cloned.id,
            user_id: user.id,
            created_by: `User:${user.id}`,
            updated_by: `User:${user.id}`,
          },
          t
        ),
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

      // copy original tag ids to cloned petition
      await this.raw(
        /* sql */ `
        insert into petition_tag (petition_id, tag_id)
        select ?, tag_id from petition_tag where petition_id = ?
      `,
        [cloned.id, petitionId],
        t
      );

      return cloned;
    });
  }

  readonly loadReminder = this.buildLoadBy("petition_reminder", "id");

  readonly loadReminderCountForAccess = this.buildLoadCountBy(
    "petition_reminder",
    "petition_access_id"
  );

  async createReminders(petitionId: number, data: CreatePetitionReminder[]) {
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
      const reminders = await this.insert(
        "petition_reminder",
        data,
        t
      ).returning("*");
      await this.createEvent(
        reminders.map((reminder) => ({
          type: "REMINDER_SENT",
          petitionId,
          data: {
            petition_reminder_id: reminder.id,
          },
        })),
        t
      );
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

  async stopAccessReminders(accessIds: number[]) {
    return await this.from("petition_access")
      .whereIn("id", accessIds)
      .update({ reminders_active: false, next_reminder_at: null }, "*");
  }

  async startAccessReminders(
    accessIds: number[],
    reminderConfig: PetitionAccessReminderConfig
  ) {
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
          { column: "created_at", order: "asc" },
          { column: "id", order: "asc" },
        ])
        .select("*"),
      opts
    );
  }

  async loadLastEventsByType(
    petitionId: number,
    eventTypes: MaybeArray<PetitionEventType>
  ): Promise<{ type: PetitionEventType; last_used_at: Date }[]> {
    const types = unMaybeArray(eventTypes);
    return await this.from("petition_event")
      .where("petition_id", petitionId)
      .whereIn("type", types)
      .groupBy("type")
      .select("type", this.knex.raw("MAX(created_at) as last_used_at"));
  }

  async shouldNotifyPetitionClosed(petitionId: number) {
    const events = await this.loadLastEventsByType(petitionId, [
      "PETITION_CLOSED_NOTIFIED",
      "REPLY_CREATED",
    ]);

    const lastEvent = maxBy(events, (e) => e.last_used_at.valueOf());
    if (lastEvent && lastEvent.type === "PETITION_CLOSED_NOTIFIED") {
      return false;
    }

    return true;
  }

  async createEvent<TType extends PetitionEventType>(
    events: MaybeArray<{
      petitionId: number;
      type: TType;
      data: PetitionEventPayload<TType>;
    }>,
    t?: Knex.Transaction<any, any>
  ): Promise<PetitionEvent[]> {
    if (Array.isArray(events) && events.length === 0) {
      return [];
    }

    const petitionEvents = await this.insert(
      "petition_event",
      unMaybeArray(events).map(({ petitionId, type, data }) => ({
        petition_id: petitionId,
        type,
        data,
      })),
      t
    );

    // dont await this. we may be inside a transaction
    this.aws.enqueueMessages(
      "event-processor",
      petitionEvents.map((event) => ({
        id: `event-processor-${event.id}`,
        groupId: `event-processor-${event.id}`,
        body: { event },
      }))
    );

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
    const [event] = await this.from("petition_event")
      .where("id", eventId)
      .update(data, "*");
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
            for (const {
              petitionId,
              petitionFieldId,
              loadInternalComments,
            } of ids) {
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

        const byId = groupBy(
          rows,
          keyBuilder(["petition_id", "petition_field_id"])
        );
        return ids
          .map(keyBuilder(["petitionId", "petitionFieldId"]))
          .map((key) => this.sortComments(byId[key] ?? []));
      },
      {
        cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId"]),
      }
    )
  );

  readonly loadPetitionFieldUnreadCommentCountForFieldAndAccess =
    fromDataLoader(
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
            [
              ...ids.flatMap((x) => [
                x.petitionId,
                x.accessId,
                x.petitionFieldId,
              ]),
            ]
          );

          const rowsById = indexBy(
            rows,
            keyBuilder([
              "petition_id",
              "petition_field_id",
              "petition_access_id",
            ])
          );

          return ids
            .map(keyBuilder(["petitionId", "petitionFieldId", "accessId"]))
            .map((key) => {
              return rowsById[key]?.unread_count ?? 0;
            });
        },
        {
          cacheKeyFn: keyBuilder(["petitionId", "petitionFieldId", "accessId"]),
        }
      )
    );

  private sortComments(comments: PetitionFieldComment[]) {
    return comments.sort(
      (a, b) => a.created_at.valueOf() - b.created_at.valueOf()
    );
  }

  readonly loadPetitionFieldComment = this.buildLoadById(
    "petition_field_comment",
    "id",
    (q) => q.whereNull("deleted_at")
  );

  async loadUnprocessedCommentCreatedUserNotifications() {
    return await this.raw<PetitionUserNotification>(/* sql */ `
      SELECT * from petition_user_notification 
      where email_notification_sent_at is null
      and is_read = false
      and type = 'COMMENT_CREATED'
      order by created_at desc
    `);
  }

  async loadUnprocessedCommentCreatedContactNotifications() {
    return await this.raw<PetitionContactNotification>(/* sql */ `
      SELECT * from petition_contact_notification 
      where email_notification_sent_at is null
      and is_read = false
      and type = 'COMMENT_CREATED'
      order by created_at desc
    `);
  }

  async updatePetitionUserNotifications(
    petitionUserNotificationIds: number[],
    data: Partial<CreatePetitionUserNotification>
  ) {
    return await this.from("petition_user_notification")
      .whereIn("id", petitionUserNotificationIds)
      .update(data, "*");
  }

  async updatePetitionContactNotifications(
    petitionContactNotificationIds: number[],
    data: Partial<CreatePetitionContactNotification>
  ) {
    return await this.from("petition_contact_notification")
      .whereIn("id", petitionContactNotificationIds)
      .update(data, "*");
  }

  readonly getPetitionFieldCommentIsUnreadForUser = fromDataLoader(
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
        const rows = await this.from("petition_user_notification")
          .where((qb) => {
            for (const {
              userId,
              petitionId,
              petitionFieldId,
              petitionFieldCommentId,
            } of ids) {
              qb = qb.orWhere(
                (qb2: Knex.QueryBuilder<PetitionUserNotification>) => {
                  qb2
                    .where({
                      user_id: userId,
                      petition_id: petitionId,
                    })
                    .whereRaw(
                      "data ->> 'petition_field_id' = ?",
                      petitionFieldId
                    )
                    .whereRaw(
                      "data ->> 'petition_field_comment_id' = ?",
                      petitionFieldCommentId
                    );
                }
              );
            }
          })
          .where("type", "COMMENT_CREATED")
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
          .map(
            keyBuilder([
              "userId",
              "petitionId",
              "petitionFieldId",
              "petitionFieldCommentId",
            ])
          )
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

  readonly getPetitionFieldCommentIsUnreadForContact = fromDataLoader(
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
        const rows = await this.from("petition_contact_notification")
          .where((qb) => {
            for (const {
              petitionAccessId,
              petitionId,
              petitionFieldId,
              petitionFieldCommentId,
            } of ids) {
              qb = qb.orWhere(
                (qb2: Knex.QueryBuilder<PetitionContactNotification>) => {
                  qb2
                    .where({
                      petition_access_id: petitionAccessId,
                      petition_id: petitionId,
                    })
                    .whereRaw(
                      "data ->> 'petition_field_id' = ?",
                      petitionFieldId
                    )
                    .whereRaw(
                      "data ->> 'petition_field_comment_id' = ?",
                      petitionFieldCommentId
                    );
                }
              );
            }
          })
          .where("type", "COMMENT_CREATED")
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
      petitionFieldReplyId: number | null;
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
          petition_field_reply_id: data.petitionFieldReplyId,
          content: data.content,
          user_id: user.id,
          is_internal: data.isInternal,
          created_by: `User:${user.id}`,
        },
        t
      );

      // Create contact and user notifications
      const [accesses, users] = await Promise.all([
        data.isInternal ? [] : this.loadAccessesForPetition(data.petitionId),
        this.loadUsersOnPetition(data.petitionId),
      ]);

      //every active access
      const accessIds = accesses
        .filter((a) => a.status === "ACTIVE")
        .map((a) => a.id);
      // every user with permissions on the petition, except the one sending the notification
      const userIds = users.filter((u) => u.id !== user.id).map((u) => u.id);

      const contactNotifications = accessIds.map(
        (id) =>
          ({
            type: "COMMENT_CREATED",
            petition_id: comment.petition_id,
            petition_access_id: id,
            data: {
              petition_field_id: comment.petition_field_id,
              petition_field_comment_id: comment.id,
            },
          } as CreatePetitionContactNotification)
      );

      const userNotifications = userIds.map(
        (id) =>
          ({
            type: "COMMENT_CREATED",
            petition_id: comment.petition_id,
            user_id: id,
            data: {
              petition_field_id: comment.petition_field_id,
              petition_field_comment_id: comment.id,
            },
          } as CreatePetitionUserNotification)
      );

      await Promise.all([
        contactNotifications.length > 0
          ? this.insert(
              "petition_contact_notification",
              contactNotifications,
              t
            )
          : [],
        userNotifications.length > 0
          ? this.insert("petition_user_notification", userNotifications, t)
          : [],
      ]);

      await this.createEvent(
        {
          type: "COMMENT_PUBLISHED",
          petitionId: data.petitionId,
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
      petitionFieldReplyId: number | null;
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
          petition_field_reply_id: data.petitionFieldReplyId,
          content: data.content,
          petition_access_id: access.id,
          created_by: `PetitionAccess:${access.id}`,
        },
        t
      );

      // Create notifications and events
      const [users, accesses] = await Promise.all([
        this.loadUsersOnPetition(data.petitionId),
        this.loadAccessesForPetition(data.petitionId),
      ]);

      // every user with permission on the petition
      const userIds = users.map((u) => u.id);
      // all active accesses, except the one sending the notification
      const accessIds = accesses
        .filter((a) => a.id !== access.id && a.status === "ACTIVE")
        .map((a) => a.id);

      const userNotifications = userIds.map(
        (userId) =>
          ({
            type: "COMMENT_CREATED",
            petition_id: comment.petition_id,
            user_id: userId,
            data: {
              petition_field_id: comment.petition_field_id,
              petition_field_comment_id: comment.id,
            },
          } as CreatePetitionUserNotification)
      );

      const contactNotifications = accessIds.map(
        (id) =>
          ({
            type: "COMMENT_CREATED",
            petition_id: comment.petition_id,
            petition_access_id: id,
            data: {
              petition_field_id: comment.petition_field_id,
              petition_field_comment_id: comment.id,
            },
          } as CreatePetitionContactNotification)
      );

      await Promise.all([
        userNotifications.length > 0
          ? this.insert("petition_user_notification", userNotifications, t)
          : [],
        contactNotifications.length > 0
          ? this.insert(
              "petition_contact_notification",
              contactNotifications,
              t
            )
          : [],
      ]);

      await this.createEvent(
        {
          type: "COMMENT_PUBLISHED",
          petitionId: data.petitionId,
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
      this.deletePetitionFieldComment(
        petitionFieldCommentId,
        `User:${user.id}`
      ),
      this.createEvent({
        type: "COMMENT_DELETED",
        petitionId,
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
      this.deletePetitionFieldComment(
        petitionFieldCommentId,
        `PetitionAccess:${access.id}`
      ),
      this.createEvent({
        type: "COMMENT_DELETED",
        petitionId,
        data: {
          petition_field_id: petitionFieldId,
          petition_field_comment_id: petitionFieldCommentId,
          petition_access_id: access.id,
        },
      }),
    ]);
  }

  private async deletePetitionFieldComment(
    petitionFieldCommentId: number,
    deletedBy: string
  ) {
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

  async markPetitionFieldCommentsAsReadForUser(
    petitionFieldCommentIds: number[],
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
              .whereRaw(
                "data ->> 'petition_field_id' = ?",
                comment.petition_field_id
              )
              .whereRaw("data ->> 'petition_field_comment_id' = ?", comment.id);
          });
        }
      })
      .update({ is_read: true });
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
              .whereRaw(
                "data ->> 'petition_field_id' = ?",
                comment.petition_field_id
              )
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

  readonly loadPetitionPermission = this.buildLoadById(
    "petition_permission",
    "id",
    (q) => q.whereNull("deleted_at")
  );

  readonly loadEffectivePermissions = fromDataLoader(
    new DataLoader<number, EffectivePetitionPermission[]>(
      async (petitionIds) => {
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
      }
    )
  );

  readonly loadUserPermissionsByPetitionId = this.buildLoadMultipleBy(
    "petition_permission",
    "petition_id",
    (q) =>
      q
        .whereNull("deleted_at")
        .whereNull("user_group_id")
        .orderByRaw("type asc, created_at")
  );

  readonly loadPetitionPermissionsByUserId = this.buildLoadMultipleBy(
    "petition_permission",
    "user_id",
    (q) => q.whereNull("deleted_at").orderByRaw("type asc, created_at")
  );

  readonly loadUserAndUserGroupPermissionsByPetitionId =
    this.buildLoadMultipleBy("petition_permission", "petition_id", (q) =>
      q
        .whereNull("deleted_at")
        .whereNull("from_user_group_id")
        .orderByRaw("type asc, user_group_id nulls first, created_at")
    );

  readonly loadDirectlyAssignedUserPetitionPermissionsByUserId =
    this.buildLoadMultipleBy("petition_permission", "user_id", (q) =>
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
        rowsByPetitionId[id]
          ? (omit(rowsByPetitionId[id], ["petition_id"]) as User)
          : null
      );
    })
  );

  /**
   * grab the permissions of the other users on `fromPetitionIds` and set them into `toPetitionIds` with WRITE access
   */
  async clonePetitionPermissions(
    fromPetitionId: number,
    toPetitionIds: number[],
    user: User,
    t?: Knex.Transaction
  ) {
    await this.raw(
      /* sql */ `
        with
          u as (select user_id, user_group_id, from_user_group_id from petition_permission where petition_id = ? and user_id != ? and deleted_at is null),
          p as (select * from (values ${toPetitionIds
            .map(() => "(?::int)")
            .join(",")}) as t (petition_id))
        insert into petition_permission(petition_id, user_id, user_group_id, from_user_group_id, type)
        select p.petition_id, u.user_id, u.user_group_id, u.from_user_group_id, 'WRITE' from u cross join p
        `,
      [fromPetitionId, user.id, ...toPetitionIds],
      t
    );
  }

  async addPetitionPermissions(
    petitionIds: number[],
    userIds: number[],
    userGroupIds: number[],
    permissionType: PetitionPermissionType,
    subscribe: boolean,
    user: User,
    t?: Knex.Transaction
  ) {
    return this.withTransaction(async (t) => {
      const [
        directlyAssignedNewUserPermissions,
        userGroupNewPermissions,
        groupAssignedNewUserPermissions,
      ] = await Promise.all([
        userIds.length > 0
          ? this.raw<PetitionPermission>(
              /* sql */ `
                ? on conflict do nothing returning *;
              `,
              [
                this.from("petition_permission").insert(
                  petitionIds.flatMap((petitionId) =>
                    userIds.map((userId) => ({
                      petition_id: petitionId,
                      user_id: userId,
                      is_subscribed: subscribe,
                      type: permissionType,
                      created_by: `User:${user.id}`,
                      updated_by: `User:${user.id}`,
                    }))
                  )
                ),
              ],
              t
            )
          : [],
        userGroupIds.length > 0
          ? this.raw<PetitionPermission>(
              /* sql */ `
                ? on conflict do nothing returning *;
              `,
              [
                this.from("petition_permission").insert(
                  petitionIds.flatMap((petitionId) =>
                    userGroupIds.map((userGroupId) => ({
                      petition_id: petitionId,
                      user_group_id: userGroupId,
                      is_subscribed: subscribe,
                      type: permissionType,
                      created_by: `User:${user.id}`,
                      updated_by: `User:${user.id}`,
                    }))
                  )
                ),
              ],
              t
            )
          : [],
        userGroupIds.length > 0
          ? this.raw<PetitionPermission>(
              /* sql */ `
              with gm as (
                select user_id, user_group_id
                from user_group_member 
                where deleted_at is null and user_group_id in (${userGroupIds
                  .map(() => `(?::int)`)
                  .join(", ")})),
              p as (
                select petition_id from (
                  values ${petitionIds.map(() => "(?::int)").join(", ")}
                ) as t(petition_id))
              insert into petition_permission(petition_id, user_id, from_user_group_id, is_subscribed, type, created_by)
              select p.petition_id, gm.user_id, gm.user_group_id, ?, ?, ? from gm cross join p
              on conflict do nothing returning *;
            `,
              [
                ...userGroupIds,
                ...petitionIds,
                subscribe,
                permissionType,
                `User:${user.id}`,
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
            .orWhere((q) =>
              q
                .whereIn("user_group_id", userGroupIds)
                .whereNotNull("user_group_id")
            )
            .orWhere((q) =>
              q
                .whereIn("from_user_group_id", userGroupIds)
                .whereNotNull("from_user_group_id")
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

      await Promise.all([
        directlyAssigned.length > 0
          ? this.createEvent(
              directlyAssigned.map((p) => ({
                petitionId: p.petition_id,
                type: "USER_PERMISSION_EDITED",
                data: {
                  user_id: user.id,
                  permission_type: p.type,
                  permission_user_id: p.user_id!,
                },
              })),
              t
            )
          : undefined,
        groupAssigned.length > 0
          ? this.createEvent(
              groupAssigned.map((p) => ({
                petitionId: p.petition_id,
                type: "GROUP_PERMISSION_EDITED",
                data: {
                  user_id: user.id,
                  permission_type: p.type,
                  user_group_id: p.user_group_id!,
                },
              }))
            )
          : undefined,
      ]);

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
        .where((q) => q.whereNot("user_id", user.id).orWhereNull("user_id"))
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
                  q
                    .whereIn("user_group_id", userGroupIds)
                    .whereNotNull("user_group_id")
                )
                .orWhere((q) =>
                  q
                    .whereIn("from_user_group_id", userGroupIds)
                    .whereNotNull("from_user_group_id")
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

      await Promise.all([
        directlyAssigned.length > 0
          ? this.createEvent(
              directlyAssigned.map((p) => ({
                petitionId: p.petition_id,
                type: "USER_PERMISSION_REMOVED",
                data: {
                  user_id: user.id,
                  permission_user_id: p.user_id!,
                },
              })),
              t
            )
          : undefined,
        groupAssigned.length > 0
          ? this.createEvent(
              groupAssigned.map((p) => ({
                petitionId: p.petition_id,
                type: "GROUP_PERMISSION_REMOVED",
                data: {
                  user_id: user.id,
                  user_group_id: p.user_group_id!,
                },
              }))
            )
          : undefined,
      ]);

      return await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");
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

      await Promise.all([
        directlyAssigned.length > 0
          ? this.createEvent(
              directlyAssigned.map((p) => ({
                petitionId: p.petition_id,
                type: "USER_PERMISSION_REMOVED",
                data: {
                  user_id: user.id,
                  permission_user_id: p.user_id!,
                },
              })),
              t
            )
          : undefined,
        groupAssigned.length > 0
          ? this.createEvent(
              groupAssigned.map((p) => ({
                petitionId: p.petition_id,
                type: "GROUP_PERMISSION_REMOVED",
                data: {
                  user_id: user.id,
                  user_group_id: p.user_group_id!,
                },
              }))
            )
          : undefined,
      ]);

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
          petitionId: p.petition_id,
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
    } & PageOpts,
    userId: number
  ) {
    return await this.loadPageAndCount(
      this.from("petition")
        .leftJoin(
          this.knex.raw(
            /* sql */ `(
              SELECT
                p.from_template_id AS template_id,
                MAX(p.created_at) AS last_used_at 
              FROM petition AS p
                WHERE created_by = ?
                GROUP BY p.from_template_id
            ) as lj`,
            [`User:${userId}`]
          ),
          "lj.template_id",
          "petition.id"
        )
        .where({
          template_public: true,
          deleted_at: null,
          is_template: true,
        })
        .mmodify((q) => {
          const { search, locale } = opts;
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
        })
        .orderByRaw(/* sql */ `lj.last_used_at DESC NULLS LAST`)
        .select<Petition[]>("petition.*"),
      opts
    );
  }

  readonly loadPetitionSignatureByExternalId = this.buildLoadBy(
    "petition_signature_request",
    "external_id"
  );

  readonly loadPetitionSignatureById = this.buildLoadBy(
    "petition_signature_request",
    "id"
  );

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
      return keys.map((key) =>
        byPetitionId[key] ? omit(byPetitionId[key], ["_rank"]) : null
      );
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

  async appendPetitionSignatureEventLogs(
    prefixedExternalId: string,
    logs: any[]
  ) {
    return await this.knex.raw(
      /* sql */ `
        UPDATE petition_signature_request
        SET event_logs = event_logs || ${logs
          .map(() => "?::jsonb")
          .join(" || ")}
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
      .select<User[]>("user.*");
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
}
