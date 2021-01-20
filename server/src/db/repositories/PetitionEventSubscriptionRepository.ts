import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { PetitionEventSubscription, User } from "../__types";

@injectable()
export class PetitionEventSubscriptionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  /**
   * A user will have access to the subscriptions only if he is the
   * owner of the petitions linked to those subscriptions
   */
  async userHasAccessToSubscriptions(
    userId: number,
    subscriptionIds: number[]
  ) {
    const [{ count }] = await this.raw(
      /* sql */ `
      select count(*)::int as count from petition_event_subscription pes
      left join petition_user pu on pes.petition_id = pu.petition_id
      where 
        pu.permission_type = 'OWNER'
        and pu.user_id = ?
        and pes.id in (${subscriptionIds.map(() => "?").join(",")})
        and pu.deleted_at is null
        and pes.deleted_at is null
    `,
      [userId, ...subscriptionIds]
    );

    return count === new Set(subscriptionIds).size;
  }

  readonly loadSubscription = this.buildLoadById(
    "petition_event_subscription",
    "id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "desc")
  );

  readonly loadSubscriptionsByPetitionId = this.buildLoadMultipleBy(
    "petition_event_subscription",
    "petition_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "desc")
  );

  async createSubscription(petitionId: number, endpoint: string, user: User) {
    const [row] = await this.insert("petition_event_subscription", {
      petition_id: petitionId,
      endpoint,
      created_by: `User:${user.id}`,
    });

    return row;
  }

  async updateSubscription(
    subscriptionId: number,
    data: Partial<PetitionEventSubscription>,
    user: User
  ) {
    const [row] = await this.from("petition_event_subscription")
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

    return row;
  }

  async deleteSubscription(subscriptionId: number, user: User) {
    return await this.from("petition_event_subscription")
      .where("id", subscriptionId)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      });
  }
}
