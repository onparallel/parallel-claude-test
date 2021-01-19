import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreatePetitionEventSubscription, User } from "../__types";

@injectable()
export class PetitionEventSubscriptionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadSubscriptionsByPetitionId = this.buildLoadMultipleBy(
    "petition_event_subscription",
    "petition_id",
    (q) => q.whereNull("deleted_at")
  );

  async createSubscription(petitionId: number, endpoint: string, user: User) {
    return await this.insert("petition_event_subscription", {
      petition_id: petitionId,
      endpoint,
      created_by: `User:${user.id}`,
    }).returning("*");
  }

  async updateSubscription(
    subscriptionId: number,
    data: CreatePetitionEventSubscription,
    user: User
  ) {
    return await this.from("petition_event_subscription")
      .where("id", subscriptionId)
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*"
      );
  }
}
