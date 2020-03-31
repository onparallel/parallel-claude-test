import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import Knex from "knex";
import { groupBy, indexBy, sortBy, times, omit } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { count } from "../../util/remedaExtensions";
import { MaybeArray, Maybe } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  CreatePetition,
  PetitionSendout,
  PetitionField,
  PetitionFieldReply,
  PetitionStatus,
  User,
  CreatePetitionField,
  PetitionFieldType,
  Petition,
  Contact,
  CreatePetitionFieldReply,
} from "../__types";
import {
  validateFieldOptions,
  defaultFieldOptions,
} from "../helpers/fieldOptions";
import { props } from "../../util/promises";

@injectable()
export class PetitionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadPetition = this.buildLoadOneById("petition", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadField = this.buildLoadOneById("petition_field", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadFieldReply = this.buildLoadOneById(
    "petition_field_reply",
    "id",
    (q) => q.whereNull("deleted_at")
  );

  async userHasAccessToPetitions(userId: number, petitionIds: number[]) {
    const [{ count }] = await this.from("petition")
      .where({
        owner_id: userId,
        is_template: false,
        deleted_at: null,
      })
      .whereIn("id", petitionIds)
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

  async replyBelongsToSendout(replyId: number, keycode: string) {
    const {
      rows: [{ count }],
    } = await this.knex.raw(
      /* sql */ `
      select count(*)::int as count
        from petition_sendout as ps
          join petition as p on p.id = ps.petition_id
          join petition_field as pf on pf.petition_id = p.id
          join petition_field_reply as pfr on pfr.petition_field_id = pf.id
        where
          ps.keycode = ? and pfr.id = ?
          and ps.deleted_at is null and p.deleted_at is null and pf.deleted_at is null and pfr.deleted_at is null
        limit 1
    `,
      [keycode, replyId]
    );
    return count === 1;
  }

  async replyBelongsToPetition(replyId: number, petitionId: number) {
    const {
      rows: [{ count }],
    } = await this.knex.raw(
      /* sql */ `
      select count(*)::int as count
        from petition as p
          join petition_field as pf on pf.petition_id = p.id
          join petition_field_reply as pfr on pfr.petition_field_id = pf.id
        where
          p.id = ? and pfr.id = ?
          and p.deleted_at is null and pf.deleted_at is null and pfr.deleted_at is null
        limit 1
    `,
      [petitionId, replyId]
    );
    return count === 1;
  }

  async fieldBelongsToSendout(fieldId: number, keycode: string) {
    const {
      rows: [{ count }],
    } = await this.knex.raw(
      /* sql */ `
      select count(*)::int as count
        from petition_sendout as ps
          join petition as p on p.id = ps.petition_id
          join petition_field as pf on pf.petition_id = p.id
        where
          ps.keycode = ? and pf.id = ?
          and ps.deleted_at is null and p.deleted_at is null and pf.deleted_at is null
        limit 1
    `,
      [keycode, fieldId]
    );
    return count === 1;
  }

  async loadPetitionsForUser(
    userId: number,
    opts: {
      search?: string | null;
      status?: PetitionStatus | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("petition")
        .where({
          owner_id: userId,
          is_template: false,
          deleted_at: null,
        })
        .mmodify((q) => {
          const { search, status } = opts;
          if (search) {
            q.whereIlike("name", `%${escapeLike(search, "\\")}%`, "\\");
          }
          if (status) {
            q.where("status", status);
          }
          q.orderBy("id");
        })
        .select("*"),
      opts
    );
  }

  readonly loadFieldsForPetition = fromDataLoader(
    new DataLoader<number, PetitionField[]>(async (ids) => {
      const rows = await this.from("petition_field")
        .whereIn("petition_id", ids as number[])
        .whereNull("deleted_at")
        .select("*");
      const byPetitionId = groupBy(rows, (r) => r.petition_id);
      return ids.map((id) => {
        return sortBy(byPetitionId[<any>id] || [], (p) => p.position);
      });
    })
  );

  readonly loadFieldCountForPetition = fromDataLoader(
    new DataLoader<number, number>(async (ids) => {
      const rows = await this.from("petition_field")
        .whereIn("petition_id", ids as number[])
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
        .whereIn("pf.petition_id", ids as number[])
        .whereNull("pf.deleted_at")
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

  readonly loadSendoutById = this.buildLoadOneById("petition_sendout", "id");

  readonly loadSendoutByKeycode = this.buildLoadOneBy(
    "petition_sendout",
    "keycode",
    (q) => q.whereNull("deleted_at")
  );

  readonly loadSendoutsForPetition = fromDataLoader(
    new DataLoader<number, PetitionSendout[]>(async (ids) => {
      const rows = await this.from("petition_sendout")
        .whereIn("petition_id", ids as number[])
        .whereNull("deleted_at")
        .select("*");
      const byPetitionId = groupBy(rows, (r) => r.petition_id);
      return ids.map((id) => byPetitionId[<any>id] || []);
    })
  );

  async createPetition(
    { name, locale }: { name: string; locale: string },
    user: User
  ) {
    const [row] = await this.insert("petition", {
      org_id: user.org_id,
      owner_id: user.id,
      locale,
      name,
      status: "DRAFT",
      created_by: `User:${user.id}`,
      updated_by: `User:${user.id}`,
    });
    return row;
  }

  async deletePetitionById(petitionId: MaybeArray<number>, user: User) {
    return await this.from("petition")
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      })
      .whereIn("id", Array.isArray(petitionId) ? petitionId : [petitionId]);
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
    return await this.knex.transaction(async (t) => {
      const _ids = await this.from("petition_field", t)
        .where("petition_id", petitionId)
        .whereNull("deleted_at")
        .select("id");
      const ids = new Set(_ids.map((f) => f.id));

      if (ids.size !== fieldIds.length || fieldIds.some((id) => !ids.has(id))) {
        throw new Error("Invalid petition field ids");
      }

      await t.raw(
        /* sql */ `
        update "petition_field" as "pf" set
          "position" = "t"."position",
          "deleted_at" = NOW() -- temporarily delete to avoid unique index constraint
        from (
          values ${fieldIds.map(() => "(?::int, ?::int)").join(", ")}
        ) as "t" ("id", "position")
        where "t"."id" = "pf"."id";
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

  async createPetitionField(
    petitionId: number,
    type: PetitionFieldType,
    user: User
  ) {
    return await this.knex.transaction(async (t) => {
      const [{ max }] = await this.from("petition_field")
        .where({
          petition_id: petitionId,
          deleted_at: null,
        })
        .max("position");

      const [[field], [petition]] = await Promise.all([
        this.insert("petition_field", [
          {
            petition_id: petitionId,
            type,
            ...defaultFieldOptions(type),
            position: max === null ? 0 : max + 1,
            created_by: `User:${user.id}`,
            updated_by: `User:${user.id}`,
          },
        ]),
        this.from("petition", t)
          .where("id", petitionId)
          .update(
            {
              status: this.knex.raw(
                /* sql */ `case status when 'COMPLETED' then 'PENDING' else status end`
              ) as any,
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*"
          ),
      ]);
      return { field, petition };
    });
  }

  async deletePetitionField(petitionId: number, fieldId: number, user: User) {
    return await this.knex.transaction(async (t) => {
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
        });

      // TODO: delete replies

      if (!field) {
        throw new Error("Invalid petition field id");
      }

      const [[petition]] = await Promise.all([
        this.from("petition", t)
          .where("id", petitionId)
          .update(
            {
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
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
    user: User
  ) {
    return this.knex.transaction(async (t) => {
      const [[field], [petition]] = await Promise.all([
        this.from("petition_field", t)
          .where({
            id: fieldId,
            petition_id: petitionId,
          })
          .update(
            {
              ...data,
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*"
          ),
        this.from("petition", t)
          .where({
            id: petitionId,
          })
          .update(
            {
              status: this.knex.raw(
                /* sql */ `case status when 'COMPLETED' then 'PENDING' else status end`
              ) as any,
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*"
          ),
      ]);
      return { field, petition };
    });
  }

  async validateFieldData(fieldId: number, data: { options: Maybe<Object> }) {
    const field = await this.loadField(fieldId);
    if (!field) {
      throw new Error("Petition field not found");
    }
    validateFieldOptions(field?.type, data.options);
  }

  readonly loadRepliesForField = fromDataLoader(
    new DataLoader<number, PetitionFieldReply[]>(async (ids) => {
      const rows = await this.from("petition_field_reply")
        .whereIn("petition_field_id", ids as number[])
        .whereNull("deleted_at")
        .select("*");
      const byPetitionId = groupBy(rows, (r) => r.petition_field_id);
      return ids.map((id) => {
        return sortBy(byPetitionId[<any>id] || [], (r) => r.created_at);
      });
    })
  );

  async validatePetitionFields(
    petitionId: number,
    fieldIds: number[],
    value: boolean,
    user: User
  ) {
    return await this.knex.transaction(async (t) => {
      const [fields, [petition]] = await Promise.all([
        this.from("petition_field", t)
          .whereIn("id", fieldIds)
          .where("petition_id", petitionId)
          .update(
            {
              validated: value,
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*"
          ),

        this.from("petition", t)
          .where("id", petitionId)
          .update(
            {
              updated_at: this.now(),
              updated_by: `User:${user.id}`,
            },
            "*"
          ),
      ]);
      return { fields, petition };
    });
  }

  async createPetitionFieldReply(
    data: CreatePetitionFieldReply,
    contact: Contact
  ) {
    const field = await this.loadField(data.petition_field_id);

    const [[reply]] = await Promise.all([
      this.insert("petition_field_reply", {
        ...data,
        updated_by: `Contact${contact.id}`,
        created_by: `Contact${contact.id}`,
      }),
      this.from("petition")
        .update({
          status: "PENDING",
          updated_at: this.now(),
          updated_by: `Contact:${contact.id}`,
        })
        .where({ id: field?.petition_id, status: "COMPLETED" }),
    ]);
    return reply;
  }

  async deletePetitionFieldReply(replyId: number, contact: Contact) {
    const reply = await this.loadFieldReply(replyId);
    const field = await this.loadField(reply!.petition_field_id);
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
        .where({ id: field?.petition_id, status: "COMPLETED" }),
    ]);
  }

  async completePetition(petitionId: number, contact: Contact) {
    const [petition, fields] = await Promise.all([
      this.loadPetition(petitionId),
      this.loadFieldsForPetition(petitionId),
    ]);
    if (!petition || !fields) {
      throw new Error();
    }
    const fieldsIds = fields.map((f) => f.id);
    const replies = await this.loadRepliesForField(fieldsIds);
    const repliesByFieldId = Object.fromEntries(
      fieldsIds.map((id, index) => [id, replies[index]])
    );
    const canComplete = fields.every(
      (f) => f.optional || repliesByFieldId[f.id].length > 0
    );
    if (canComplete) {
      const [updated] = await this.from("petition")
        .where("id", petitionId)
        .update(
          {
            status: "COMPLETED",
            updated_at: this.now(),
            updated_by: `Contact:${contact.id}`,
          },
          "*"
        );
      return updated;
    } else {
      throw new Error("Can't transition status to COMPLETED");
    }
  }
}
