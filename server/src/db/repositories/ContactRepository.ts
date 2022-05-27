import DataLoader from "dataloader";
import { addMinutes } from "date-fns";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, indexBy, mapValues, omit, pipe, toPairs } from "remeda";
import { unMaybeArray } from "../../util/arrays";
import { fromDataLoader } from "../../util/fromDataLoader";
import { keyBuilder } from "../../util/keyBuilder";
import { hash, random } from "../../util/token";
import { Maybe, MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX, KNEX_READONLY } from "../knex";
import {
  Contact,
  CreateContact,
  CreateContactAuthenticationRequest,
  PetitionAccess,
  User,
} from "../__types";

@injectable()
export class ContactRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadContact = this.buildLoadBy("contact", "id", (q) => q.whereNull("deleted_at"));

  readonly loadContactByEmail = fromDataLoader(
    new DataLoader<{ orgId: number; email: string }, Contact | null, string>(
      async (keys) => {
        const byOrgId = pipe(
          keys,
          groupBy((k) => k.orgId),
          mapValues((keys) => keys.map((k) => k.email)),
          toPairs
        );
        const rows = await this.from("contact")
          .whereNull("deleted_at")
          .where((qb) => {
            for (const [orgId, emails] of byOrgId) {
              qb.orWhere((qb) => qb.where("org_id", parseInt(orgId)).whereIn("email", emails));
            }
          });
        const results = indexBy(rows, keyBuilder(["org_id", "email"]));
        return keys.map(keyBuilder(["orgId", "email"])).map((key) => results[key] ?? null);
      },
      {
        cacheKeyFn: keyBuilder(["orgId", "email"]),
      }
    )
  );

  readonly loadContactByAccessId = fromDataLoader(
    new DataLoader<number, Contact | null>(async (ids) => {
      const contacts = await this.raw<Contact & { access_id: number }>(
        /* sql */ `
        select c.*, pa.id as access_id from contact c
        left join petition_access pa on pa.contact_id = c.id
        where pa.id in ? 
      `,
        [this.sqlIn(ids)]
      );

      const byAccessId = indexBy(contacts, (r) => r.access_id);
      return ids.map((id) => (byAccessId[id] ? omit(byAccessId[id], ["access_id"]) : null));
    })
  );

  async loadOrCreate(
    contacts: MaybeArray<Pick<CreateContact, "first_name" | "last_name" | "email" | "org_id">>,
    createdBy: string,
    t?: Knex.Transaction
  ) {
    const contactsArr = unMaybeArray(contacts);
    if (contactsArr.length === 0) {
      return [];
    }
    return await this.raw<Contact>(
      /* sql */ `
      ? 
      ON CONFLICT (org_id, email) WHERE deleted_at is NULL
      DO UPDATE SET
        -- need to do an update for the RETURNING to return the row
        email=EXCLUDED.email
      RETURNING *;`,
      [
        this.from("contact").insert(
          contactsArr.map((contact) => ({
            ...contact,
            email: contact.email.toLowerCase().trim(),
            created_by: createdBy,
            updated_by: createdBy,
          }))
        ),
      ],
      t
    );
  }

  async createOrUpdate(
    contacts: MaybeArray<Pick<CreateContact, "first_name" | "last_name" | "email" | "org_id">>,
    updatedBy: string
  ) {
    const contactsArr = unMaybeArray(contacts);
    if (contactsArr.length === 0) {
      return [];
    }
    return await this.raw<Contact>(
      /* sql */ `
      ? 
      ON CONFLICT (org_id, email) WHERE deleted_at is NULL
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING *;`,
      [
        this.from("contact").insert(
          contactsArr.map((contact) => ({
            ...contact,
            email: contact.email.toLowerCase().trim(),
            created_by: updatedBy,
            updated_by: updatedBy,
          }))
        ),
      ]
    );
  }

  async userHasAccessToContacts(user: User, contactIds: number[]) {
    const [{ count }] = await this.from("contact")
      .where({
        org_id: user.org_id,
        deleted_at: null,
      })
      .whereIn("id", contactIds)
      .select(this.count());
    return count === new Set(contactIds).size;
  }

  async loadContactsForUser(
    user: User,
    opts: {
      search?: string | null;
      sortBy?: SortBy<keyof Contact>[];
      excludeIds?: number[] | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("contact")
        .where({
          org_id: user.org_id,
          deleted_at: null,
        })
        .mmodify((q) => {
          const { search, excludeIds } = opts;
          if (search) {
            q.andWhere((q2) => {
              q2.whereEscapedILike(
                this.knex.raw(`concat("first_name", ' ', "last_name")`),
                `%${escapeLike(search, "\\")}%`,
                "\\"
              ).or.whereEscapedILike("email", `%${escapeLike(search, "\\")}%`, "\\");
            });
          }
          if (excludeIds) {
            q.whereNotIn("id", excludeIds);
          }
          if (opts.sortBy?.length) {
            q.orderBy(opts.sortBy);
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  async loadAccessesForContact(contactId: number, userId: number, opts: PageOpts) {
    return await this.loadPageAndCount(
      this.knex
        .with("pas", (q) => {
          q.from({ pa: "petition_access" })
            .join({ pp: "petition_permission" }, "pp.petition_id", "pa.petition_id")
            .join({ p: "petition" }, "p.id", "pa.petition_id")
            .where("pa.contact_id", contactId)
            .where("pp.user_id", userId)
            .whereNull("pp.deleted_at")
            .whereNull("p.deleted_at")
            .distinctOn("pa.id")
            .select("pa.*");
        })
        .from("pas")
        .orderBy("pas.created_at", "desc")
        .select<any, PetitionAccess[]>("pas.*"),
      opts
    );
  }

  async createContact({ email, ...data }: CreateContact, createdBy: string) {
    const [row] = await this.insert("contact", {
      email: email.toLowerCase().trim(),
      ...data,
      created_by: createdBy,
      updated_by: createdBy,
    });
    return row;
  }

  async updateContact(contactId: number, data: Partial<CreateContact>, user: User) {
    const [row] = await this.from("contact")
      .where("id", contactId)
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

  async deleteContactById(contactId: MaybeArray<number>, user: User) {
    const ids = unMaybeArray(contactId);
    if (ids.length === 0) {
      return;
    }

    await this.withTransaction(async (t) => {
      await this.from("contact", t)
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .whereIn("id", ids);

      const accesses = await this.from("petition_access", t)
        .whereIn("contact_id", ids)
        .where({ status: "ACTIVE" })
        .update(
          {
            status: "INACTIVE",
            reminders_active: false,
            next_reminder_at: null,
          },
          "*"
        );
      if (accesses.length > 0) {
        await this.from("petition_message", t)
          .whereIn(
            "petition_access_id",
            accesses.map((a) => a.id)
          )
          .where({ status: "SCHEDULED" })
          .update({
            status: "CANCELLED",
          });
      }
    });
  }

  async hasContactAuthentication(contactId: number) {
    const rows = await this.from("contact_authentication")
      .where("contact_id", contactId)
      .limit(1)
      .select("id");
    return rows.length > 0;
  }

  async verifyContact(contactId: number, cookieValue: string) {
    const rows = await this.from("contact_authentication")
      .where({
        contact_id: contactId,
        cookie_value_hash: await hash(cookieValue, contactId.toString()),
      })
      .select("id");
    return rows.length > 0 ? rows[0].id : null;
  }

  async addContactAuthenticationLogAccessEntry(
    contactAuthenticationId: number,
    access: { ip: Maybe<string>; userAgent: Maybe<string> }
  ) {
    await this.from("contact_authentication")
      .where({
        id: contactAuthenticationId,
      })
      .update({
        access_log: this.knex.raw(
          /* sql */ `jsonb_path_query_array(?::jsonb || "access_log", '$[0 to 99]')`,
          JSON.stringify({ ...access, timestamp: Date.now() })
        ),
      });
  }

  async createContactAuthentication(contactId: number) {
    const cookieValue = random(48);
    const [contactAuthentication] = await this.insert("contact_authentication", {
      contact_id: contactId,
      cookie_value_hash: await hash(cookieValue, contactId.toString()),
    });
    return { cookieValue, contactAuthentication };
  }

  async createContactAuthenticationRequest(
    data: Pick<CreateContactAuthenticationRequest, "petition_access_id" | "ip" | "user_agent">
  ) {
    const token = random(48);
    const [request] = await this.insert("contact_authentication_request", {
      ...data,
      code: Math.floor(Math.random() * 1e6)
        .toString()
        .padStart(6, "0"),
      token_hash: await hash(token, ""),
      remaining_attempts: 3,
      expires_at: addMinutes(Date.now(), 30),
    });
    return { request, token };
  }

  async verifyContactAuthenticationRequest(
    accessId: number,
    token: string,
    code: string
  ): Promise<{ success: boolean; remainingAttempts?: number }> {
    const [row] = await this.from("contact_authentication_request")
      .where({
        petition_access_id: accessId,
        token_hash: await hash(token, ""),
      })
      .where("remaining_attempts", ">", 0)
      .where("expires_at", ">", this.now())
      .update({ remaining_attempts: this.knex.raw(`"remaining_attempts" - 1`) }, "*");
    if (row) {
      if (row.code === code) {
        return { success: true };
      } else {
        return { success: false, remainingAttempts: row.remaining_attempts };
      }
    }
    throw new Error("INVALID_TOKEN");
  }

  readonly loadContactAuthenticationRequest = this.buildLoadBy(
    "contact_authentication_request",
    "id"
  );

  async processContactAuthenticationRequest(requestId: number, emailLogId: number) {
    const [row] = await this.from("contact_authentication_request")
      .where("id", requestId)
      .update({ email_log_id: emailLogId }, "*");
    return row;
  }

  async anonymizeDeletedContacts(daysAfterDeletion: number) {
    await this.from("contact")
      .whereNotNull("deleted_at")
      .whereNull("anonymized_at")
      .whereRaw(/* sql */ `"deleted_at" < NOW() - make_interval(days => ?)`, [daysAfterDeletion])
      .update({
        anonymized_at: this.now(),
        email: "",
        first_name: "",
        last_name: "",
      });
  }
}

@injectable()
export class ReadonlyContactRepository extends ContactRepository {
  constructor(@inject(KNEX_READONLY) knex: Knex) {
    super(knex);
  }
}
