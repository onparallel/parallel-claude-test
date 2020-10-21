import Analytics from "analytics-node";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import { User } from "../db/__types";
import { toGlobalId } from "../util/globalId";
import { snakeCaseToCapitalizedText } from "../util/strings";

type AnalyticsEventType =
  | "PETITION_CREATED"
  | "PETITION_SENT"
  | "PETITION_COMPLETED_BY_RECIPIENT"
  | "USER_LOGGED_IN"
  | "REMINDER_EMAIL_SENT";

type AnalyticsEventProperties<EventType extends AnalyticsEventType> = {
  PETITION_CREATED: {
    petition_id: number;
    user_id: number;
    type: "PETITION" | "TEMPLATE";
  };
  PETITION_SENT: {
    petition_id: number;
    user_id: number;
    access_ids: number[];
  };
  PETITION_COMPLETED_BY_RECIPIENT: {
    petition_id: number;
    access_id: number;
  };
  USER_LOGGED_IN: { user_id: number; email: string; org_id: number };
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
  identifyUser(user: Pick<User, "id" | "email">): void;

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

  identifyUser(user: Pick<User, "id" | "email">) {
    this.analytics?.identify({
      userId: toGlobalId("User", user.id),
      traits: { email: user.email },
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
