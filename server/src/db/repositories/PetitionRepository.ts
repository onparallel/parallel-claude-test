import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import Knex, { QueryBuilder, Transaction } from "knex";
import { groupBy, indexBy, omit, sortBy, uniq } from "remeda";
import { PetitionEventPayload } from "../../graphql/backing/events";
import { fromDataLoader } from "../../util/fromDataLoader";
import { keyBuilder } from "../../util/keyBuilder";
import { count, isDefined } from "../../util/remedaExtensions";
import { random } from "../../util/token";
import { Maybe, MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import {
  defaultFieldOptions,
  validateFieldOptions,
} from "../helpers/fieldOptions";
import { escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  Contact,
  CreatePetition,
  CreatePetitionAccess,
  CreatePetitionField,
  CreatePetitionFieldReply,
  CreatePetitionMessage,
  CreatePetitionReminder,
  Petition,
  PetitionAccess,
  PetitionEventType,
  PetitionField,
  PetitionFieldComment,
  PetitionFieldReply,
  PetitionFieldReplyStatus,
  PetitionFieldType,
  PetitionStatus,
  User,
  PetitionUserNotification,
  PetitionContactNotification,
  PetitionUser,
  PetitionUserPermissionType,
  CreatePetitionUser,
} from "../__types";
import {
  PetitionAccessReminderConfig,
  calculateNextReminder,
} from "../../util/reminderUtils";
import { findMax, unMaybeArray } from "../../util/arrays";

type PetitionType = "PETITION" | "TEMPLATE";
@injectable()
export class PetitionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadPetition = this.buildLoadById("petition", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadField = this.buildLoadById("petition_field", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadFieldReply = this.buildLoadById(
    "petition_field_reply",
    "id",
    (q) => q.whereNull("deleted_at")
  );

  async userHasAccessToPetitions(
    userId: number,
    petitionIds: number[],
    permissionTypes?: PetitionUserPermissionType[]
  ) {
    const [{ count }] = await this.from("petition_user")
      .where({ user_id: userId })
      .whereIn("petition_id", petitionIds)
      .whereNull("deleted_at")
      .mmodify((q) => {
        if (permissionTypes) {
          q.whereIn("permission_type", permissionTypes);
        }
      })
      .select(this.count());
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

  async accesessBelongToPetition(petitionId: number, accessIds: number[]) {
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
          pfr.petition_field_id = ? and pfr.id in (${replyIds
            .map((_) => "?")
            .join(", ")})
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
          pf.petition_id = ? and pfr.id in (${replyIds
            .map((_) => "?")
            .join(", ")})
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
      sortBy?: {
        column: keyof Petition | "last_used_at";
        order?: "asc" | "desc";
      }[];
      status?: PetitionStatus | null;
      type?: PetitionType;
      locale?: "en" | "es" | null;
    } & PageOpts
  ) {
    const petitionType = opts.type || "PETITION";
    return await this.loadPageAndCount(
      this.from("petition")
        .leftJoin("petition_user", "petition.id", "petition_user.petition_id")
        .where({
          "petition_user.user_id": userId,
          is_template: petitionType === "TEMPLATE",
          "petition_user.deleted_at": null,
        })
        .mmodify((q) => {
          const { search, status, locale } = opts;
          if (locale) {
            q.where("locale", locale);
          }
          if (search) {
            q.andWhere((q2) => {
              q2.whereIlike("name", `%${escapeLike(search, "\\")}%`, "\\");
              if (petitionType === "TEMPLATE") {
                q2.or.whereIlike(
                  "template_description",
                  `%${escapeLike(search, "\\")}%`,
                  "\\"
                );
              }
            });
          }
          if (status && petitionType === "PETITION") {
            q.where("status", status);
          }

          const hasOrderByLastUsed = opts.sortBy?.some(
            (o) => o.column === "last_used_at"
          );
          if (hasOrderByLastUsed && petitionType === "TEMPLATE") {
            q.leftJoin(
              this.knex.raw(
                /* sql */ `(
                  SELECT
                    p.from_template_id AS template_id,
                    MAX(p.created_at) AS last_used_at
                  FROM petition AS p
                    WHERE created_by = ?
                    GROUP BY p.from_template_id
                ) AS lj
                `,
                [`User:${userId}`]
              ),
              "lj.template_id",
              "petition.id"
            ).orderByRaw(
              opts
                .sortBy!.map(
                  ({ column, order }) => `${column} ${order} NULLS LAST`
                )
                .join(", ")
            );
          } else if (opts.sortBy?.length) {
            q.orderBy(opts.sortBy);
          }
        })
        // default order by to ensure result consistency
        // applies after any previously specified order by
        .orderBy("petition.id")
        .select("petition.*"),
      opts
    );
  }

  readonly loadFieldsForPetition = fromDataLoader(
    new DataLoader<number, PetitionField[]>(async (ids) => {
      const rows = await this.from("petition_field")
        .whereIn("petition_id", ids)
        .whereNull("deleted_at")
        .select("*");
      const byPetitionId = groupBy(rows, (r) => r.petition_id);
      return ids.map((id) => {
        return sortBy(byPetitionId[id as any] || [], (p) => p.position);
      });
    })
  );

  readonly loadFieldCountForPetition = fromDataLoader(
    new DataLoader<number, number>(async (ids) => {
      const rows = await this.from("petition_field")
        .whereIn("petition_id", ids)
        .whereNull("deleted_at")
        .groupBy("petition_id")
        .select("petition_id", this.count());
      const byPetitionId = indexBy(rows, (r) => r.petition_id);
      return ids.map((id) => byPetitionId[id]?.count ?? 0);
    })
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
        "id" | "petition_id" | "validated" | "optional"
      > & { replies: number })[] = await this.knex<PetitionField>(
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
        .groupBy("pf.id", "pf.petition_id", "pf.validated", "pf.optional")
        .select(
          "pf.id",
          "pf.petition_id",
          "pf.validated",
          "pf.optional",
          this.knex.raw(`count("pfr"."id")::int as "replies"`) as any
        );

      const fieldsById = groupBy(fields, (f) => f.petition_id);
      return ids.map((id) => {
        const fields = fieldsById[id] ?? [];
        return {
          validated: count(fields, (f) => f.validated),
          replied: count(fields, (f) => f.replies > 0 && !f.validated),
          optional: count(
            fields,
            (f) => f.optional && f.replies === 0 && !f.validated
          ),
          total: fields.length,
        };
      });
    })
  );

  readonly loadAccess = this.buildLoadById("petition_access", "id");

  readonly loadAccessByKeycode = this.buildLoadBy("petition_access", "keycode");

  readonly loadAccessesForPetition = fromDataLoader(
    new DataLoader<number, PetitionAccess[]>(async (ids) => {
      const rows = await this.from("petition_access")
        .whereIn("petition_id", ids)
        .select("*")
        .orderBy("id", "asc");
      const byPetitionId = groupBy(rows, (r) => r.petition_id);
      return ids.map((id) => byPetitionId[id as any] || []);
    })
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
    const rows = await this.insert(
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
    await this.createEvent_old(
      petitionId,
      "ACCESS_ACTIVATED",
      rows.map((a) => ({
        petition_access_id: a.id,
        user_id: user.id,
      }))
    );
    return rows;
  }

  readonly loadMessage = this.buildLoadById("petition_message", "id");

  async createMessages(
    petitionId: number,
    scheduledAt: Date | null,
    data: Pick<
      CreatePetitionMessage,
      "status" | "petition_access_id" | "email_subject" | "email_body"
    >[],
    user: User
  ) {
    const rows = await this.insert(
      "petition_message",
      data.map((item) => ({
        ...item,
        scheduled_at: scheduledAt,
        petition_id: petitionId,
        sender_id: user.id,
        created_by: `User:${user.id}`,
      }))
    );

    await this.createEvent_old(
      petitionId,
      scheduledAt ? "MESSAGE_SCHEDULED" : "MESSAGE_SENT",
      rows.map((m) => ({
        petition_access_id: m.petition_access_id,
        petition_message_id: m.id,
      }))
    );

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
    await this.createEvent_old(petitionId, "MESSAGE_CANCELLED", {
      petition_message_id: messageId,
      user_id: user.id,
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
    await this.createEvent_old(
      petitionId,
      "ACCESS_DEACTIVATED",
      accesses.map((access) => ({
        petition_access_id: access.id,
        user_id: user.id,
      }))
    );
    if (messages.length > 0) {
      await this.createEvent_old(
        petitionId,
        "MESSAGE_CANCELLED",
        messages.map((message) => ({
          petition_message_id: message.id,
          user_id: user.id,
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
    await this.createEvent_old(
      petitionId,
      "ACCESS_ACTIVATED",
      accesses.map((access) => ({
        petition_access_id: access.id,
        user_id: user.id,
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
      const [row] = await this.insert(
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

      await this.insert(
        "petition_user",
        {
          petition_id: row.id,
          user_id: user.id,
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
        },
        t
      );

      await this.createPetitionFieldAtPosition(
        row.id,
        {
          type: "HEADING",
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
          is_fixed: true,
          ...defaultFieldOptions("HEADING"),
        },
        0,
        user,
        t
      );

      await this.createPetitionFieldAtPosition(
        row.id,
        {
          type: "TEXT",
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
          ...defaultFieldOptions("TEXT"),
        },
        1,
        user,
        t
      );

      const { petition } = await this.createPetitionFieldAtPosition(
        row.id,
        {
          type: "FILE_UPLOAD",
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
          ...defaultFieldOptions("FILE_UPLOAD"),
        },
        2,
        user,
        t
      );

      await this.createEvent_old(
        row.id,
        "PETITION_CREATED",
        {
          user_id: user.id,
        },
        t
      );
      return petition;
    });
  }

  async deleteUserPermissions(
    petitionIds: number[],
    user: User,
    t?: Transaction
  ) {
    return await this.withTransaction(async (t) => {
      const removedPermissions = await this.from("petition_user", t)
        .whereIn("petition_id", petitionIds)
        .where({
          deleted_at: null,
          user_id: user.id,
        })
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .returning("*");

      return removedPermissions
        .filter((p) => p.permission_type === "OWNER")
        .map((p) => p.petition_id);
    }, t);
  }

  async deleteAllPermissions(
    petitionIds: number[],
    user: User,
    t?: Transaction
  ) {
    return await this.withTransaction(async (t) => {
      return await this.from("petition_user", t)
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
    t?: Transaction
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
        await this.createEvent_old(
          _accesses[0].petition_id,
          "ACCESS_DEACTIVATED",
          _accesses.map((access) => ({
            petition_access_id: access.id,
            user_id: user.id,
          })),
          t
        );
      }
      for (const [, _messages] of Object.entries(
        groupBy(messages, (m) => m.petition_id)
      )) {
        await this.createEvent_old(
          _messages[0].petition_id,
          "MESSAGE_CANCELLED",
          _messages.map((message) => ({
            petition_message_id: message.id,
            user_id: user.id,
          })),
          t
        );
      }

      return await this.from("petition", t)
        .whereIn("id", petitionIds)
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        });
    }, t);
  }

  async updatePetition(
    petitionId: number,
    data: Partial<CreatePetition>,
    user: User
  ) {
    const [row] = await this.from("petition")
      .where("id", petitionId)
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
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
      const _ids = await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .select("id", "is_fixed", "position")
        .orderBy("position", "asc");

      const ids = _ids.map((f) => f.id);
      const fixedPositions = _ids.reduce<number[]>(
        (positions, _id, index) =>
          _id.is_fixed ? positions.concat(index) : positions,
        []
      );

      if (
        ids.length !== fieldIds.length ||
        fieldIds.some((id) => !ids.includes(id)) ||
        fixedPositions.some((position) => ids[position] !== fieldIds[position]) // trying to reorder a fixed field
      ) {
        throw new Error("INVALID_PETITION_FIELD_IDS");
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
    transaction?: Transaction<any, any>
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
    }, transaction);
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
              status: otherFieldsAreValidated ? "CLOSED" : "PENDING",
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
    transaction?: Transaction<any, any>
  ) {
    return this.withTransaction(async (t) => {
      const [field] = await this.from("petition_field", t)
        .where({
          id: fieldId,
          petition_id: petitionId,
        })
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
        )
        .then(([updatedField]) => {
          if (updatedField.is_fixed && data.type !== undefined) {
            throw new Error("UPDATE_FIXED_FIELD_ERROR");
          }
          return [updatedField];
        });

      let petition: Petition;
      // update petition status if switching a field from optional to required
      if (field.type !== "HEADING" && data.optional === false) {
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
    }, transaction);
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

    return fields;
  }

  async createPetitionFieldReply(
    data: CreatePetitionFieldReply,
    contact: Contact
  ) {
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
        updated_by: `Contact:${contact.id}`,
        created_by: `Contact:${contact.id}`,
      }),
      this.from("petition")
        .update({
          status: "PENDING",
          updated_at: this.now(),
          updated_by: `Contact:${contact.id}`,
        })
        .where({ id: field?.petition_id, status: "COMPLETED" }),
    ]);
    await this.createEvent_old(field.petition_id, "REPLY_CREATED", {
      petition_access_id: reply.petition_access_id,
      petition_field_id: reply.petition_field_id,
      petition_field_reply_id: reply.id,
    });
    return reply;
  }

  async deletePetitionFieldReply(replyId: number, contact: Contact) {
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
          deleted_by: `Contact:${contact.id}`,
        })
        .where("id", replyId),
      this.from("petition")
        .update({
          status: "PENDING",
          updated_at: this.now(),
          updated_by: `Contact:${contact.id}`,
        })
        .where({ id: field.petition_id, status: "COMPLETED" }),
      this.createEvent_old(field!.petition_id, "REPLY_DELETED", {
        petition_access_id: reply.petition_access_id,
        petition_field_id: reply.petition_field_id,
        petition_field_reply_id: reply.id,
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
    const canComplete = fields
      .filter((f) => f.type !== "HEADING")
      .every((f) => f.optional || repliesByFieldId[f.id].length > 0);
    if (canComplete) {
      const petition = await this.withTransaction(async (t) => {
        await this.from("petition_access", t)
          .where("petition_id", petitionId)
          .update(
            {
              next_reminder_at: null,
            },
            "*"
          );
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
      await this.createEvent_old(petitionId, "PETITION_COMPLETED", {
        petition_access_id: accessId,
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
      await this.createEvent_old(
        cloned.id,
        "PETITION_CREATED",
        {
          user_id: user.id,
        },
        t
      );

      const fields = await this.loadFieldsForPetition(petitionId);
      await this.insert(
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
      );

      await this.insert(
        "petition_user",
        {
          petition_id: cloned.id,
          user_id: user.id,
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
        },
        t
      );
      return cloned;
    });
  }

  readonly loadReminder = this.buildLoadBy("petition_reminder", "id");

  readonly loadReminderCountForAccess = fromDataLoader(
    new DataLoader<number, number>(async (ids) => {
      const rows = await this.from("petition_reminder")
        .whereIn("petition_access_id", ids)
        .groupBy("petition_access_id")
        .select("petition_access_id", this.count());
      const byPetitioinAccessId = indexBy(rows, (r) => r.petition_access_id);
      return ids.map((id) => byPetitioinAccessId[id]?.count ?? 0);
    })
  );

  async createReminders(petitionId: number, data: CreatePetitionReminder[]) {
    const reminders = await this.withTransaction(async (t) => {
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
      return await this.insert("petition_reminder", data, t).returning("*");
    });
    await this.createEvent_old(
      petitionId,
      "REMINDER_SENT",
      reminders.map((reminder) => ({
        petition_reminder_id: reminder.id,
      }))
    );
    return reminders;
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

  private async loadLastEventsByType(
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

    const lastEvent = findMax(events, (e) => e.last_used_at);
    if (lastEvent && lastEvent.type === "PETITION_CLOSED_NOTIFIED") {
      return false;
    }

    return true;
  }

  /**
   * @deprecated Use `createEvent`
   */
  async createEvent_old<TType extends PetitionEventType>(
    petitionId: number,
    type: TType,
    payload: MaybeArray<PetitionEventPayload<TType>>,
    t?: Transaction<any, any>
  ) {
    return await this.insert(
      "petition_event",
      (Array.isArray(payload) ? payload : [payload]).map((data) => ({
        petition_id: petitionId,
        type,
        data,
      })),
      t
    );
  }

  async createEvent<TType extends PetitionEventType>(
    events: MaybeArray<{
      petitionId: number;
      type: TType;
      data: PetitionEventPayload<TType>;
    }>,
    t?: Transaction<any, any>
  ) {
    return await this.insert(
      "petition_event",
      unMaybeArray(events).map(({ petitionId, type, data }) => ({
        petition_id: petitionId,
        type,
        data,
      })),
      t
    );
  }

  readonly loadPetitionFieldCommentsForFieldAndUser = fromDataLoader(
    new DataLoader<
      { userId: number; petitionId: number; petitionFieldId: number },
      PetitionFieldComment[],
      string
    >(
      async (ids) => {
        const rows = await this.from("petition_field_comment")
          .where((qb) => {
            for (const { userId, petitionId, petitionFieldId } of ids) {
              qb = qb.orWhere((qb: QueryBuilder<PetitionFieldComment>) => {
                qb.where({
                  petition_id: petitionId,
                  petition_field_id: petitionFieldId,
                }).andWhere((qb: QueryBuilder<PetitionFieldComment>) => {
                  qb.whereNotNull("published_at").orWhere({ user_id: userId });
                });
              });
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
        cacheKeyFn: keyBuilder(["userId", "petitionId", "petitionFieldId"]),
      }
    )
  );

  readonly loadPetitionFieldCommentsForFieldAndAccess = fromDataLoader(
    new DataLoader<
      { accessId: number; petitionId: number; petitionFieldId: number },
      PetitionFieldComment[],
      string
    >(
      async (ids) => {
        const rows = await this.from("petition_field_comment")
          .where((qb) => {
            for (const { accessId, petitionId, petitionFieldId } of ids) {
              qb = qb.orWhere((qb: QueryBuilder<PetitionFieldComment>) => {
                qb.where({
                  petition_id: petitionId,
                  petition_field_id: petitionFieldId,
                }).andWhere((qb: QueryBuilder<PetitionFieldComment>) => {
                  qb.whereNotNull("published_at").orWhere({
                    petition_access_id: accessId,
                  });
                });
              });
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
        cacheKeyFn: keyBuilder(["accessId", "petitionId", "petitionFieldId"]),
      }
    )
  );

  private sortComments(comments: PetitionFieldComment[]) {
    return comments.slice(0).sort((a, b) => {
      if (a.published_at && !b.published_at) {
        return -1;
      } else if (!a.published_at && b.published_at) {
        return +1;
      } else if (
        a.published_at &&
        b.published_at &&
        a.published_at.valueOf() !== b.published_at.valueOf()
      ) {
        return a.published_at.valueOf() - b.published_at.valueOf();
      } else {
        return a.created_at.valueOf() - b.created_at.valueOf();
      }
    });
  }

  readonly loadPetitionFieldComment = this.buildLoadById(
    "petition_field_comment",
    "id",
    (q) => q.whereNull("deleted_at")
  );

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
          .where((qb: QueryBuilder<PetitionUserNotification>) => {
            for (const {
              userId,
              petitionId,
              petitionFieldId,
              petitionFieldCommentId,
            } of ids) {
              qb = qb.orWhere((qb2: QueryBuilder<PetitionUserNotification>) => {
                qb2
                  .where({
                    user_id: userId,
                    petition_id: petitionId,
                  })
                  .whereRaw("data ->> 'petition_field_id' = ?", petitionFieldId)
                  .whereRaw(
                    "data ->> 'petition_field_comment_id' = ?",
                    petitionFieldCommentId
                  );
              });
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
          .where((qb: QueryBuilder<PetitionContactNotification>) => {
            for (const {
              petitionAccessId,
              petitionId,
              petitionFieldId,
              petitionFieldCommentId,
            } of ids) {
              qb = qb.orWhere(
                (qb2: QueryBuilder<PetitionContactNotification>) => {
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
    },
    user: User
  ) {
    const [comment] = await this.insert("petition_field_comment", {
      petition_id: data.petitionId,
      petition_field_id: data.petitionFieldId,
      petition_field_reply_id: data.petitionFieldReplyId,
      content: data.content,
      user_id: user.id,
      created_by: `User:${user.id}`,
    });
    return comment;
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
    const [comment] = await this.insert("petition_field_comment", {
      petition_id: data.petitionId,
      petition_field_id: data.petitionFieldId,
      petition_field_reply_id: data.petitionFieldReplyId,
      content: data.content,
      petition_access_id: access.id,
      created_by: `PetitionAccess:${access.id}`,
    });
    return comment;
  }

  async deletePetitionFieldCommentFromUser(
    petitionId: number,
    petitionFieldId: number,
    petitionFieldCommentId: number,
    user: User
  ) {
    const comment = await this.loadPetitionFieldComment(petitionFieldCommentId);
    await Promise.all([
      this.deletePetitionFieldComment(
        petitionFieldCommentId,
        `User:${user.id}`
      ),
      comment?.published_at
        ? this.createEvent_old(petitionId, "COMMENT_DELETED", {
            petition_field_id: petitionFieldId,
            petition_field_comment_id: petitionFieldCommentId,
            user_id: user.id,
          })
        : null,
    ]);
  }

  async deletePetitionFieldCommentFromAccess(
    petitionId: number,
    petitionFieldId: number,
    petitionFieldCommentId: number,
    access: PetitionAccess
  ) {
    const comment = await this.loadPetitionFieldComment(petitionFieldCommentId);
    await Promise.all([
      this.deletePetitionFieldComment(
        petitionFieldCommentId,
        `PetitionAccess:${access.id}`
      ),
      comment?.published_at
        ? this.createEvent_old(petitionId, "COMMENT_DELETED", {
            petition_field_id: petitionFieldId,
            petition_field_comment_id: petitionFieldCommentId,
            petition_access_id: access.id,
          })
        : null,
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
    if (comment.published_at) {
      await Promise.all([
        this.from("petition_user_notification")
          .where({ petition_id: comment.petition_id, type: "COMMENT_CREATED" })
          .whereRaw(
            "data ->> 'petition_field_id' = ?",
            comment.petition_field_id
          )
          .whereRaw("data ->> 'petition_field_comment_id' = ?", comment.id)
          .delete(),

        this.from("petition_contact_notification")
          .where({ petition_id: comment.petition_id, type: "COMMENT_CREATED" })
          .whereRaw(
            "data ->> 'petition_field_id' = ?",
            comment.petition_field_id
          )
          .whereRaw("data ->> 'petition_field_comment_id' = ?", comment.id)
          .delete(),
      ]);
    }
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

  async publishPetitionFieldCommentsForUser(petitionId: number, user: User) {
    const comments = await this.from("petition_field_comment")
      .where({
        petition_id: petitionId,
        user_id: user.id,
      })
      .whereNull("published_at")
      .whereNull("deleted_at")
      .update(
        {
          published_at: this.now(),
        },
        "*"
      );

    // Create contact notifications
    const accesses = await this.loadAccessesForPetition(petitionId);
    await this.insert(
      "petition_contact_notification",
      accesses
        .filter((access) => access.status === "ACTIVE")
        .flatMap((access) =>
          comments.map((comment) => ({
            type: "COMMENT_CREATED",
            petition_id: comment.petition_id,
            petition_access_id: access.id,
            data: {
              petition_field_id: comment.petition_field_id,
              petition_field_comment_id: comment.id,
            },
          }))
        )
    );

    await this.createEvent_old(
      petitionId,
      "COMMENT_PUBLISHED",
      comments.map((comment) => ({
        petition_field_id: comment.petition_field_id,
        petition_field_comment_id: comment.id,
      }))
    );
    return { comments, accesses };
  }

  async publishPetitionFieldCommentsForAccess(
    petitionId: number,
    access: PetitionAccess
  ) {
    return await this.withTransaction(async (t) => {
      const comments = await this.from("petition_field_comment", t)
        .where({
          petition_id: petitionId,
          petition_access_id: access.id,
        })
        .whereNull("published_at")
        .whereNull("deleted_at")
        .update(
          {
            published_at: this.now(),
          },
          "*"
        );

      // Create user notifications and events
      const users = await this.from("petition_user", t)
        .where({
          petition_id: petitionId,
          deleted_at: null,
          is_subscribed: true,
        })
        .select<[{ id: number }]>("user_id as id");

      await this.insert(
        "petition_user_notification",
        users.flatMap(({ id }) =>
          comments.map((comment) => ({
            type: "COMMENT_CREATED",
            petition_id: comment.petition_id,
            user_id: id,
            data: {
              petition_field_id: comment.petition_field_id,
              petition_field_comment_id: comment.id,
            },
          }))
        ),
        t
      );

      await this.createEvent_old(
        petitionId,
        "COMMENT_PUBLISHED",
        comments.map((comment) => ({
          petition_field_id: comment.petition_field_id,
          petition_field_comment_id: comment.id,
        })),
        t
      );
      return { comments, users };
    });
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
      .where((qb: QueryBuilder<PetitionUserNotification>) => {
        for (const comment of comments) {
          qb = qb.orWhere((qb: QueryBuilder<PetitionUserNotification>) => {
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
      .where((qb: QueryBuilder<PetitionContactNotification>) => {
        for (const comment of comments) {
          qb = qb.orWhere((qb: QueryBuilder<PetitionContactNotification>) => {
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
          pa.id in (${accessIds.map((_) => "?").join(", ")})
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
      await this.from("petition_field_reply", t)
        .where({
          petition_field_id: fieldId,
        })
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        });

      return await this.updatePetitionField(
        petitionId,
        fieldId,
        {
          type,
          validated: false,
          ...defaultFieldOptions(type),
        },
        user,
        t
      );
    });
  }

  readonly loadPetitionUser = this.buildLoadById("petition_user", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadUserPermissions = fromDataLoader(
    new DataLoader<number, PetitionUser[]>(async (ids) => {
      const rows = await this.from("petition_user")
        .whereIn("petition_id", ids)
        .whereNull("deleted_at")
        .select("*");
      const byPetitionId = groupBy(rows, (r) => r.petition_id);
      const order = ["OWNER", "WRITE", "READ"];
      return ids.map((id) =>
        byPetitionId[id].sort((a, b) =>
          a.permission_type === b.permission_type
            ? a.created_at.valueOf() - b.created_at.valueOf()
            : order.indexOf(a.permission_type) -
              order.indexOf(b.permission_type)
        )
      );
    })
  );

  readonly loadPetitionOwners = fromDataLoader(
    new DataLoader<number, User | null>(async (ids) => {
      const rows = await this.from("petition_user")
        .leftJoin("user", "petition_user.user_id", "user.id")
        .whereIn("petition_id", ids)
        .where("permission_type", "OWNER")
        .whereNull("petition_user.deleted_at")
        .whereNull("user.deleted_at")
        .select("petition_user.petition_id", "user.*");
      const rowsByPetitionId = indexBy(rows, (r) => r.petition_id);
      return ids.map((id) =>
        rowsByPetitionId[id]
          ? (omit(rowsByPetitionId[id], ["petition_id"]) as User)
          : null
      );
    })
  );

  async addPetitionUserPermissions(
    petitionIds: number[],
    userIds: number[],
    permissionType: PetitionUserPermissionType,
    user: User
  ) {
    const batch: CreatePetitionUser[] = petitionIds.flatMap((petitionId) =>
      userIds.map((userId) => ({
        petition_id: petitionId,
        user_id: userId,
        permission_type: permissionType,
        created_by: `User:${user.id}`,
        updated_by: `User:${user.id}`,
      }))
    );

    return this.withTransaction(async (t) => {
      /* 
        try to insert into petition_user.
        if the relation <petition_id,user_id> already exists, do nothing on that.
      */
      const { rows: newPermissions } = await t.raw<{ rows: PetitionUser[] }>(
        /* sql */ `
      ? ON CONFLICT DO NOTHING
        RETURNING *;`,
        [this.from("petition_user").insert(batch)]
      );

      await this.createEvent(
        newPermissions.map((p) => ({
          petitionId: p.petition_id,
          type: "USER_PERMISSION_ADDED",
          data: {
            user_id: user.id,
            permission_type: p.permission_type,
            permission_user_id: p.user_id,
          },
        })),
        t
      );

      for (const petitionId of petitionIds) {
        this.loadUserPermissions.dataloader.clear(petitionId);
      }

      const petitions = await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");

      return { petitions, newPermissions };
    });
  }

  async editPetitionUserPermissions(
    petitionIds: number[],
    userIds: number[],
    newPermission: PetitionUserPermissionType,
    user: User
  ) {
    return this.withTransaction(async (t) => {
      const updatedPermissions = await this.from("petition_user", t)
        .whereIn("petition_id", petitionIds)
        .whereIn("user_id", userIds)
        .whereNull("deleted_at")
        .update(
          {
            updated_at: this.now(),
            updated_by: `User:${user.id}`,
            permission_type: newPermission,
          },
          "*"
        );

      for (const petitionId of petitionIds) {
        this.loadUserPermissions.dataloader.clear(petitionId);
      }

      await this.createEvent(
        updatedPermissions.map((p) => ({
          petitionId: p.petition_id,
          type: "USER_PERMISSION_EDITED",
          data: {
            user_id: user.id,
            permission_type: p.permission_type,
            permission_user_id: p.user_id,
          },
        })),
        t
      );

      return await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");
    });
  }

  async removePetitionUserPermissions(
    petitionIds: number[],
    userIds: number[],
    user: User
  ) {
    return this.withTransaction(async (t) => {
      const removedPermissions = await this.from("petition_user", t)
        .whereIn("petition_id", petitionIds)
        .whereIn("user_id", userIds)
        .whereNull("deleted_at")
        .update(
          {
            deleted_at: this.now(),
            deleted_by: `User:${user.id}`,
          },
          "*"
        );

      for (const petitionId of petitionIds) {
        this.loadUserPermissions.dataloader.clear(petitionId);
      }

      await this.createEvent(
        removedPermissions.map((p) => ({
          petitionId: p.petition_id,
          type: "USER_PERMISSION_REMOVED",
          data: {
            user_id: user.id,
            permission_user_id: p.user_id,
          },
        })),
        t
      );

      return await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");
    });
  }

  async transferOwnership(petitionIds: number[], userId: number, user: User) {
    return this.withTransaction(async (t) => {
      // removes user ownership to avoid constraint failure
      await this.from("petition_user", t)
        .whereIn("petition_id", petitionIds)
        .where({
          user_id: user.id,
          deleted_at: null,
          permission_type: "OWNER",
        })
        .update({
          permission_type: "WRITE",
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        });

      for (const petitionId of petitionIds) {
        this.loadUserPermissions.dataloader.clear(petitionId);
      }

      const insertBatch: CreatePetitionUser[] = petitionIds.map((pid) => ({
        created_by: `User:${user.id}`,
        permission_type: "OWNER",
        user_id: userId,
        petition_id: pid,
      }));

      const { rows: newPermissions } = await t.raw<{ rows: PetitionUser[] }>(
        /* sql */ `
        ? ON CONFLICT (user_id, petition_id) WHERE deleted_at IS NULL
          DO UPDATE SET
          permission_type = ?,
          updated_by = ?,
          updated_at = ?,
          deleted_by = null,
          deleted_at = null
        RETURNING *;`,
        [
          this.from("petition_user").insert(insertBatch),
          "OWNER",
          `User:${user.id}`,
          this.now(),
        ]
      );

      await this.createEvent(
        newPermissions.map((p) => ({
          petitionId: p.petition_id,
          type: "OWNERSHIP_TRANSFERRED",
          data: {
            user_id: user.id,
            owner_id: p.user_id,
          },
        })),
        t
      );

      return await this.from("petition", t)
        .whereNull("deleted_at")
        .whereIn("id", petitionIds)
        .returning("*");
    });
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
      locale?: "en" | "es" | null;
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
}
