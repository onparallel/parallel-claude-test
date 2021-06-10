import Analytics from "analytics-node";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import { PetitionStatus, User } from "../db/__types";
import { unMaybeArray } from "../util/arrays";
import { toGlobalId } from "../util/globalId";
import { titleize } from "../util/strings";
import { MaybeArray } from "../util/types";

export type AnalyticsEventType =
  | "PETITION_CREATED"
  | "PETITION_CLONED"
  | "PETITION_CLOSED"
  | "PETITION_SENT"
  | "PETITION_COMPLETED"
  | "PETITION_DELETED"
  | "USER_LOGGED_IN"
  | "REMINDER_EMAIL_SENT"
  | "TEMPLATE_USED"
  | "USER_CREATED"
  | "ACCESS_OPENED"
  | "ACCESS_OPENED_FIRST";

export type AnalyticsEventPayload<TType extends AnalyticsEventType> = {
  /** User creates a petition/template from scratch */
  PETITION_CREATED: {
    petition_id: number;
    org_id: number;
    user_id: number;
    type: "PETITION" | "TEMPLATE";
  };
  /** User clones a petition/template */
  PETITION_CLONED: {
    petition_id: number;
    org_id: number;
    from_petition_id: number;
    user_id: number;
    type: "PETITION" | "TEMPLATE";
  };
  /** User deletes a petition */
  PETITION_DELETED: {
    petition_id: number;
    org_id: number;
    user_id: number;
    status: PetitionStatus;
  };
  /** User uses a template to create a petition */
  TEMPLATE_USED: {
    user_id: number;
    org_id: number;
    template_id: number;
  };
  /** User sends petition to accesses */
  PETITION_SENT: {
    petition_id: number;
    org_id: number;
    user_id: number;
    petition_access_ids: number[];
  };
  /** User closes the petition */
  PETITION_CLOSED: {
    petition_id: number;
    org_id: number;
    user_id: number;
  };
  /**
   * A petition made by the user has been completed by the recipient
   */
  PETITION_COMPLETED: {
    petition_id: number;
    org_id: number;
    petition_access_id: number;
    requires_signature: boolean;
    same_domain: boolean;
  };
  /** User logs in */
  USER_LOGGED_IN: { user_id: number; email: string; org_id: number };
  /** a petition reminder is sent */
  REMINDER_EMAIL_SENT: {
    user_id: number;
    petition_id: number;
    org_id: number;
    petition_access_id: number;
    sent_count: number;
    type: "AUTOMATIC" | "MANUAL";
  };
  /** a user is created:
   * - by support methods
   * - by organization admin
   * - by logging the first time with SSO
   */
  USER_CREATED: {
    user_id: number;
    org_id: number;
  };
  /** a petition has been opened by any recipient */
  ACCESS_OPENED: {
    contact_id: number;
    petition_id: number;
    org_id: number;
  };
  /** a petition has been opened the first time by any of the recipients */
  ACCESS_OPENED_FIRST: {
    contact_id: number;
    petition_id: number;
    org_id: number;
  };
}[TType];

export type GenericAnalyticsEvent<TType extends AnalyticsEventType> = {
  type: TType;
  data: AnalyticsEventPayload<TType>;
  user_id: number;
};

export type AnalyticsEvent =
  | GenericAnalyticsEvent<"PETITION_CREATED">
  | GenericAnalyticsEvent<"PETITION_CREATED">
  | GenericAnalyticsEvent<"PETITION_CLONED">
  | GenericAnalyticsEvent<"PETITION_CLOSED">
  | GenericAnalyticsEvent<"PETITION_SENT">
  | GenericAnalyticsEvent<"PETITION_COMPLETED">
  | GenericAnalyticsEvent<"PETITION_DELETED">
  | GenericAnalyticsEvent<"USER_LOGGED_IN">
  | GenericAnalyticsEvent<"REMINDER_EMAIL_SENT">
  | GenericAnalyticsEvent<"TEMPLATE_USED">
  | GenericAnalyticsEvent<"USER_CREATED">
  | GenericAnalyticsEvent<"ACCESS_OPENED">
  | GenericAnalyticsEvent<"ACCESS_OPENED_FIRST">;

export const ANALYTICS = Symbol.for("ANALYTICS");

export interface IAnalyticsService {
  identifyUser(
    user: Pick<User, "id" | "email" | "created_at" | "last_active_at">
  ): void;

  trackEvent<EventType extends AnalyticsEventType>(event: {
    type: EventType;
    data: AnalyticsEventPayload<EventType>;
    user_id: number;
  }): void;
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

  identifyUser(
    user: Pick<User, "id" | "email" | "created_at" | "last_active_at">
  ) {
    this.analytics?.identify({
      userId: toGlobalId("User", user.id),
      traits: {
        email: user.email,
        createdAt: user.created_at.toISOString(),
        lastActiveAt: user.last_active_at?.toISOString(),
      },
    });
  }

  trackEvent<EventType extends AnalyticsEventType>(event: {
    type: EventType;
    data: MaybeArray<AnalyticsEventPayload<EventType>>;
    user_id: number;
  }) {
    unMaybeArray(event.data).map((properties) => {
      this.analytics?.track({
        userId: toGlobalId("User", event.user_id),
        event: titleize(event.type),
        properties,
      });
    });
  }
}
