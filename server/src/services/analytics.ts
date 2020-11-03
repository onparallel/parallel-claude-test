import Analytics from "analytics-node";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import { User } from "../db/__types";
import { toGlobalId } from "../util/globalId";
import { snakeCaseToCapitalizedText } from "../util/strings";

type AnalyticsEventType =
  | "PETITION_CREATED"
  | "PETITION_CLONED"
  | "PETITION_CLOSED"
  | "PETITION_SENT"
  | "PETITION_COMPLETED_BY_RECIPIENT"
  | "PETITION_COMPLETED"
  | "USER_LOGGED_IN"
  | "REMINDER_EMAIL_SENT"
  | "TEMPLATE_USED";

type AnalyticsEventProperties<EventType extends AnalyticsEventType> = {
  /** User creates a petition/template from scratch */
  PETITION_CREATED: {
    petition_id: number;
    user_id: number;
    type: "PETITION" | "TEMPLATE";
  };
  /** User clones a petition/template */
  PETITION_CLONED: {
    petition_id: number;
    from_petition_id: number;
    user_id: number;
    type: "PETITION" | "TEMPLATE";
  };
  /** User uses a template to create a petition */
  TEMPLATE_USED: {
    user_id: number;
    template_id: number;
  };
  /** User sends petition to accesses */
  PETITION_SENT: {
    petition_id: number;
    user_id: number;
    access_ids: number[];
  };
  /** User closes the petition */
  PETITION_CLOSED: {
    petition_id: number;
    user_id: number;
  };
  /** recipient completes the petition */
  PETITION_COMPLETED_BY_RECIPIENT: {
    user_id: number;
    petition_id: number;
    access_id: number;
  };
  /**
   * A petition made by the user has been completed by the recipient
   * similar to PETITION_COMPLETED_BY_RECIPIENT, but tracks the id of the User instead of the Contact
   */
  PETITION_COMPLETED: {
    petition_id: number;
    access_id: number;
  };
  /** User logs in */
  USER_LOGGED_IN: { user_id: number; email: string; org_id: number };
  /** a petition reminder is sent */
  REMINDER_EMAIL_SENT: {
    user_id: number;
    petition_id: number;
    access_id: number;
    sent_count: number;
    type: "AUTOMATIC" | "MANUAL";
  };
}[EventType];

export const ANALYTICS = Symbol.for("ANALYTICS");

export interface IAnalyticsService {
  identifyUser(user: User): void;

  trackEvent<EventType extends AnalyticsEventType>(
    eventName: EventType,
    properties: AnalyticsEventProperties<EventType>,
    userGID: string
  ): void;
}

@injectable()
export class AnalyticsService implements IAnalyticsService {
  readonly analytics?: Analytics;

  constructor(@inject(CONFIG) config: Config) {
    if (config.analytics.writeKey) {
      this.analytics = new Analytics(config.analytics.writeKey, {
        enable: process.env.NODE_ENV === "production",
      });
    }
  }

  identifyUser(user: User) {
    this.analytics?.identify({
      userId: toGlobalId("User", user.id),
      traits: {
        email: user.email,
        createdAt: user.created_at.toISOString(),
        lastActiveAt: user.last_active_at?.toISOString(),
      },
    });
  }

  trackEvent<EventType extends AnalyticsEventType>(
    eventName: EventType,
    properties: AnalyticsEventProperties<EventType>,
    userGID: string
  ) {
    this.analytics?.track({
      userId: userGID,
      event: snakeCaseToCapitalizedText(eventName),
      properties,
    });
  }
}
