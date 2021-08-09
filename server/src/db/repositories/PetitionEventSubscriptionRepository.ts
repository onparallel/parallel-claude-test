import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { User } from "../__types";

@injectable()
export class PetitionEventSubscriptionRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  /**
   * A user will have access to the subscriptions only if he is the
   * owner of the petitions linked to those subscriptions
   */
  async userHasAccessToSubscriptions(userId: number, subscriptionIds: number[]) {
    const [{ count }] = await this.raw(
      /* sql */ `
      select count(*)::int as count from petition_event_subscription pes
      left join petition_permission pp on pes.petition_id = pp.petition_id
      where 
        pp.type = 'OWNER'
        and pp.user_id = ?
        and pes.id in (${subscriptionIds.map(() => "?").join(",")})
        and pp.deleted_at is null
        and pes.deleted_at is null
    `,
      [userId, ...subscriptionIds]
    );

    return count === new Set(subscriptionIds).size;
  }

  readonly loadSubscription = this.buildLoadBy("petition_event_subscription", "id", (q) =>
    q.whereNull("deleted_at").orderBy("created_at", "desc")
  );

  readonly loadSubscriptionsByPetitionId = this.buildLoadMultipleBy(
    "petition_event_subscription",
    "petition_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "desc")
  );

  async createSubscription(petitionId: number, endpoint: string, user: User) {
    const [row] = await this.insert("petition_event_subscription", {
      petition_id: petitionId,
      user_id: user.id,
      endpoint,
      created_by: `User:${user.id}`,
    });

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
