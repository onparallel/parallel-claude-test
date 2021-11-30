import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreatePetitionEventSubscription, PetitionEventSubscription } from "../__types";

@injectable()
export class SubscriptionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadSubscription = this.buildLoadBy("petition_event_subscription", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadSubscriptionsByUserId = this.buildLoadMultipleBy(
    "petition_event_subscription",
    "user_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "desc")
  );

  async createSubscription(
    { event_types: eventTypes, ...data }: CreatePetitionEventSubscription,
    createdBy: string
  ) {
    const [row] = await this.insert("petition_event_subscription", {
      ...data,
      event_types: eventTypes && JSON.stringify(eventTypes),
      created_by: createdBy,
    });

    return row;
  }

  async updateSubscription(
    id: number,
    { event_types: eventTypes, ...data }: Partial<PetitionEventSubscription>,
    updatedBy: string
  ) {
    const [row] = await this.from("petition_event_subscription")
      .where({ id, deleted_at: null })
      .update(
        {
          ...data,
          ...(eventTypes !== undefined
            ? { event_types: eventTypes && JSON.stringify(eventTypes) }
            : {}),
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*"
      );

    return row;
  }

  async deleteSubscriptions(ids: MaybeArray<number>, deletedBy: string) {
    await this.from("petition_event_subscription")
      .whereIn("id", unMaybeArray(ids))
      .whereNull("deleted_at")
      .update({
        deleted_by: deletedBy,
        deleted_at: this.now(),
      });
  }
}
