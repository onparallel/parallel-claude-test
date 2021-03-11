import DataLoader from "dataloader";
import { addMinutes } from "date-fns";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, indexBy, mapValues, pipe, toPairs } from "remeda";
import { unMaybeArray } from "../../util/arrays";
import { fromDataLoader } from "../../util/fromDataLoader";
import { keyBuilder } from "../../util/keyBuilder";
import { hash, random } from "../../util/token";
import { Maybe, MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
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

  readonly loadContact = this.buildLoadById("contact", "id", (q) =>
    q.whereNull("deleted_at")
  );

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
              qb.orWhere((qb) =>
                qb.where("org_id", parseInt(orgId)).whereIn("email", emails)
              );
            }
          });
        const results = indexBy(rows, keyBuilder(["org_id", "email"]));
        return keys
          .map(keyBuilder(["orgId", "email"]))
          .map((key) => results[key] ?? null);
      },
      {
        cacheKeyFn: keyBuilder(["orgId", "email"]),
      }
    )
  );

  async loadOrCreate(
    {
      email,
      orgId,
      firstName,
      lastName,
    }: {
      email: string;
      orgId: number;
      firstName: string;
      lastName: string;
    },
    doneBy: Contact
  ) {
    let contact = await this.loadContactByEmail({ email, orgId });
    if (!contact) {
      contact = await this.createContact(
        {
          email,
          first_name: firstName,
          last_name: lastName,
        },
        doneBy,
        `Contact:${doneBy.id}`
      );
    }

    return contact;
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
              q2.whereIlike(
                this.knex.raw(`concat("first_name", ' ', "last_name")`) as any,
                `%${escapeLike(search, "\\")}%`,
                "\\"
              ).or.whereIlike("email", `%${escapeLike(search, "\\")}%`, "\\");
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

  async loadAccessesForContact(
    contactId: number,
    userId: number,
    opts: PageOpts
  ) {
    return await this.loadPageAndCount(
      this.knex<PetitionAccess>("petition_access as pa")
        .join("petition_user as pu", "pu.petition_id", "pa.petition_id")
        .join("petition as p", "p.id", "pa.petition_id")
        .where("pa.contact_id", contactId)
        .where("pu.user_id", userId)
        .whereNull("pu.deleted_at")
        .whereNull("p.deleted_at")
        .orderBy("pa.created_at", "desc")
        .select<any, PetitionAccess[]>("pa.*"),
      opts
    );
  }

  async createContact(
    data: Omit<CreateContact, "org_id">,
    userOrContact: User | Contact,
    createdBy: string
  ) {
    const [row] = await this.insert("contact", {
      ...data,
      org_id: userOrContact.org_id,
      created_by: createdBy,
      updated_by: createdBy,
    });
    return row;
  }

  async updateContact(
    contactId: number,
    data: Partial<CreateContact>,
    user: User
  ) {
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
    return await this.withTransaction(async (t) => {
      await this.from("contact", t)
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .whereIn("id", unMaybeArray(contactId));

      await this.from("petition_access", t)
        .update({
          status: "INACTIVE",
          reminders_active: false,
          next_reminder_at: null,
        })
        .whereIn("contact_id", unMaybeArray(contactId));
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
    const [contactAuthentication] = await this.insert(
      "contact_authentication",
      {
        contact_id: contactId,
        cookie_value_hash: await hash(cookieValue, contactId.toString()),
      }
    );
    return { cookieValue, contactAuthentication };
  }

  async createContactAuthenticationRequest(
    data: Pick<
      CreateContactAuthenticationRequest,
      "petition_access_id" | "ip" | "user_agent"
    >
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
      .update(
        { remaining_attempts: this.knex.raw(`"remaining_attempts" - 1`) },
        "*"
      );
    if (row) {
      if (row.code === code) {
        return { success: true };
      } else {
        return { success: false, remainingAttempts: row.remaining_attempts };
      }
    }
    throw new Error("INVALID_TOKEN");
  }

  readonly loadContactAuthenticationRequest = this.buildLoadById(
    "contact_authentication_request",
    "id"
  );

  async processContactAuthenticationRequest(
    requestId: number,
    emailLogId: number
  ) {
    const [row] = await this.from("contact_authentication_request")
      .where("id", requestId)
      .update({ email_log_id: emailLogId }, "*");
    return row;
  }
}
