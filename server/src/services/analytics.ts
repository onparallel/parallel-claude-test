import Analytics from "analytics-node";
import { inject, injectable } from "inversify";
import { isDefined } from "remeda";
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
  | "EMAIL_VERIFIED"
  | "INVITE_SENT";

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
    new_petition_id: number;
    org_id: number;
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
    new_petition_id: number;
  };
  /** User sends petition to accesses, or contact starts a petition from a public link */
  PETITION_SENT: {
    petition_id: number;
    petition_access_id: number;
    org_id: number;
    user_id: number;
    from_public_link: boolean;
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
   * - by signing up
   */
  USER_CREATED: {
    user_id: number;
    org_id: number;
    email: string;
    industry?: string;
    position?: string;
    role?: string;
    from: string;
  };
  /** a petition has been opened by any recipient */
  ACCESS_OPENED: {
    contact_id: number;
    petition_id: number;
    org_id: number;
  };
  EMAIL_VERIFIED: {
    email: string;
  };
  INVITE_SENT: {
    invitee_email: string;
    invitee_first_name: string;
    invitee_last_name: string;
    invitee_role: string;
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
  | GenericAnalyticsEvent<"EMAIL_VERIFIED">
  | GenericAnalyticsEvent<"INVITE_SENT">;

export const ANALYTICS = Symbol.for("ANALYTICS");

export interface IAnalyticsService {
  identifyUser(
    user: Pick<User, "id" | "email" | "created_at" | "last_active_at" | "details">
  ): void;

  trackEvent(events: MaybeArray<AnalyticsEvent>): void;
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

  identifyUser(user: Pick<User, "id" | "email" | "created_at" | "last_active_at" | "details">) {
    this.analytics?.identify({
      userId: toGlobalId("User", user.id),
      traits: {
        email: user.email,
        createdAt: user.created_at.toISOString(),
        lastActiveAt: user.last_active_at?.toISOString(),
        industry: user.details?.industry,
        role: user.details?.role,
        position: user.details?.position,
        source: user.details?.source,
      },
    });
  }

  trackEvent(events: MaybeArray<AnalyticsEvent | null>) {
    unMaybeArray(events)
      .filter(isDefined)
      .map((event) => {
        this.analytics?.track({
          userId: toGlobalId("User", event.user_id),
          event: titleize(event.type),
          properties: event.data,
        });
      });
  }
}
