import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, omit } from "remeda";
import { MaybeArray, unMaybeArray } from "../../util/types";
import {
  CreateEventSubscription,
  CreateEventSubscriptionSignatureKey,
  EventSubscription,
} from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class SubscriptionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadEventSubscription = this.buildLoadBy("event_subscription", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadEventSubscriptionsByUserId = this.buildLoadMultipleBy(
    "event_subscription",
    "user_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "desc"),
  );

  readonly loadPetitionEventSubscriptionsByUserId = this.buildLoadMultipleBy(
    "event_subscription",
    "user_id",
    (q) => q.whereNull("deleted_at").where("type", "PETITION").orderBy("created_at", "desc"),
  );

  readonly loadProfileEventSubscriptionsByOrgId = this.buildLoader<number, EventSubscription[]>(
    async (orgIds, t) => {
      const data = await this.raw<EventSubscription & { org_id: number }>(
        /* sql */ `
        select es.*, u.org_id 
        from event_subscription es join "user" u on es.user_id = u.id
        where es.deleted_at is null
        and es.type = 'PROFILE'
        and u.deleted_at is null
        and u.org_id in ?
      `,
        [this.sqlIn(orgIds)],
        t,
      );

      const byOrgId = groupBy(data, (d) => d.org_id);
      return orgIds.map((orgId) => byOrgId[orgId].map(omit(["org_id"])) ?? []);
    },
  );

  readonly loadEventSubscriptionSignatureKey = this.buildLoadBy(
    "event_subscription_signature_key",
    "id",
    (q) => q.whereNull("deleted_at"),
  );

  readonly loadEventSubscriptionSignatureKeysBySubscriptionId = this.buildLoadMultipleBy(
    "event_subscription_signature_key",
    "event_subscription_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "asc"),
  );

  async createEventSubscription(data: CreateEventSubscription, createdBy: string) {
    const [row] = await this.insert("event_subscription", {
      ...data,
      event_types: data.event_types && JSON.stringify(data.event_types),
      created_by: createdBy,
    });

    return row;
  }

  async updateEventSubscription(
    id: number,
    data: Partial<Omit<CreateEventSubscription, "type">>,
    updatedBy: string,
  ) {
    const [row] = await this.from("event_subscription")
      .where({ id, deleted_at: null })
      .update(
        {
          ...data,
          ...(data.event_types !== undefined
            ? { event_types: data.event_types && JSON.stringify(data.event_types) }
            : {}),
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*",
      );

    return row;
  }

  async appendErrorLog(id: number, errorLog: any, updatedBy: string) {
    await this.from("event_subscription")
      .where({ id: id, deleted_at: null })
      .update({
        is_failing: true,
        error_log: this.knex.raw(
          /* sql */ `jsonb_path_query_array(? || "error_log", '$[0 to 99]')`,
          this.json({ ...errorLog, timestamp: Date.now() }),
        ),
        updated_at: this.now(),
        updated_by: updatedBy,
      });
  }

  async deleteEventSubscriptions(ids: MaybeArray<number>, deletedBy: string) {
    await this.from("event_subscription")
      .whereIn("id", unMaybeArray(ids))
      .whereNull("deleted_at")
      .update({
        deleted_by: deletedBy,
        deleted_at: this.now(),
      });
  }

  async createEventSubscriptionSignatureKey(
    data: CreateEventSubscriptionSignatureKey,
    createdBy: string,
  ) {
    const [signatureKey] = await this.insert("event_subscription_signature_key", {
      ...data,
      created_at: this.now(),
      created_by: createdBy,
    });

    return signatureKey;
  }

  async deleteEventSubscriptionSignatureKeys(ids: MaybeArray<number>, deletedBy: string) {
    const _ids = unMaybeArray(ids);
    if (_ids.length === 0) {
      return;
    }
    await this.from("event_subscription_signature_key")
      .whereIn("id", _ids)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }

  async deleteEventSubscriptionSignatureKeysBySubscriptionIds(
    ids: MaybeArray<number>,
    deletedBy: string,
  ) {
    const _ids = unMaybeArray(ids);
    if (_ids.length === 0) {
      return;
    }
    await this.from("event_subscription_signature_key")
      .whereIn("event_subscription_id", _ids)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }
}
