import { inject, injectable } from "inversify";
import { Knex } from "knex";
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
    (q) => q.whereNull("deleted_at")
  );

  async createSubscription(data: CreatePetitionEventSubscription, createdBy: string) {
    const [row] = await this.insert("petition_event_subscription", {
      ...data,
      created_by: createdBy,
    });

    return row;
  }

  async updateSubscription(
    id: number,
    data: Partial<PetitionEventSubscription>,
    updatedBy: string
  ) {
    const [row] = await this.from("petition_event_subscription")
      .where({ id, deleted_at: null })
      .update(
        {
          ...data,
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*"
      );

    return row;
  }
}
