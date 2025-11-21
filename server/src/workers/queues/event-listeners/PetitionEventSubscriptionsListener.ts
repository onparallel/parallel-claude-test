import { inject, injectable } from "inversify";
import { isNonNullish, isNullish, unique } from "remeda";
import { PetitionEventType, PetitionEventTypeValues } from "../../../db/__types";

import { PetitionEvent } from "../../../db/events/PetitionEvent";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { SubscriptionRepository } from "../../../db/repositories/SubscriptionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import {
  EVENT_SUBSCRIPTION_SERVICE,
  IEventSubscriptionService,
} from "../../../services/EventSubscriptionService";
import { mapPetitionEvent } from "../../../util/eventMapper";
import { pFilter } from "../../../util/promises/pFilter";
import { EventListener } from "../EventProcessorQueue";

export const PETITION_EVENT_SUBSCRIPTIONS_LISTENER = Symbol.for(
  "PETITION_EVENT_SUBSCRIPTIONS_LISTENER",
);

@injectable()
export class PetitionEventSubscriptionsListener implements EventListener<PetitionEventType> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(SubscriptionRepository) private subscriptions: SubscriptionRepository,
    @inject(EVENT_SUBSCRIPTION_SERVICE)
    public readonly eventSubscription: IEventSubscriptionService,
  ) {}

  public types = PetitionEventTypeValues;

  public async handle(event: PetitionEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition || petition.deletion_scheduled_at !== null) {
      return;
    }

    const bypassUsers = await this.users.getUsersWithPermission(
      petition.org_id,
      "PETITIONS:BYPASS_PERMISSIONS",
    );

    const userIds = unique([
      ...(await this.petitions.loadEffectivePermissions(petition.id)).map((p) => p.user_id!),
      ...bypassUsers.map((u) => u.id),
    ]);

    if (userIds.length === 0) {
      return;
    }

    await this.petitions.attachPetitionEventToUsers({ petitionEventId: event.id, userIds });

    const activeSubscriptions = (
      await this.subscriptions.loadPetitionEventSubscriptionsByUserId(userIds)
    ).flat();
    const userSubscriptions = await pFilter(
      activeSubscriptions,
      async (s) => {
        if (!s.is_enabled) {
          return false;
        }
        if (s.event_types !== null && !s.event_types.includes(event.type)) {
          return false;
        }
        if (s.from_template_id !== null && s.from_template_id !== petition.from_template_id) {
          return false;
        }
        if (s.ignore_owner_events && "user_id" in event.data && s.user_id === event.data.user_id) {
          return false;
        }
        if (isNonNullish(s.from_template_field_ids) && "petition_field_id" in event.data) {
          if (event.data.petition_field_id === null) {
            // subscription is for a field event, but this event is not a field event
            // (general comments on petition)
            return false;
          }
          const field = await this.petitions.loadField(event.data.petition_field_id);
          if (isNullish(field?.from_petition_field_id)) {
            // field does not come from a template
            return false;
          }
          const templateField = await this.petitions.loadField(field.from_petition_field_id);
          if (isNullish(templateField) || !s.from_template_field_ids.includes(templateField.id)) {
            return false;
          }
        }
        return true;
      },
      { concurrency: 5 },
    );
    if (userSubscriptions.length === 0) {
      return;
    }
    await this.eventSubscription.processSubscriptions(userSubscriptions, mapPetitionEvent(event));
  }
}
