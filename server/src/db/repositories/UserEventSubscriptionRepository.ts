import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import {
  CreateUserEventSubscription,
  PetitionEventType,
  User,
} from "../__types";

@injectable()
export class UserEventSubscriptionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  async userHasAccessToSubscriptions(ids: number[], userId: number) {
    const [{ count }] = await this.from("user_event_subscription")
      .whereIn("id", ids)
      .where({
        user_id: userId,
        deleted_at: null,
      })
      .select(this.count());

    return count === new Set(ids).size;
  }

  async loadSubscriptions(petitionId: number, eventType: PetitionEventType) {
    return await this.from("user_event_subscription")
      .where({
        petition_id: petitionId,
        petition_event: eventType,
        deleted_at: null,
      })
      .returning("*");
  }

  readonly loadSubscription = this.buildLoadById(
    "user_event_subscription",
    "id",
    (q) => q.whereNull("deleted_at")
  );

  readonly loadSubscriptionsByUserId = this.buildLoadBy(
    "user_event_subscription",
    "user_id",
    (q) => q.whereNull("deleted_at")
  );

  async createSubscription(
    petitionId: number,
    event: PetitionEventType,
    endpoint: string,
    user: User
  ) {
    return await this.insert("user_event_subscription", {
      petition_id: petitionId,
      petition_event: event,
      user_id: user.id,
      endpoint,
      created_by: `User:${user.id}`,
    }).returning("*");
  }

  async updateSubscription(
    subscriptionId: number,
    data: CreateUserEventSubscription,
    user: User
  ) {
    return await this.from("user_event_subscription")
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
