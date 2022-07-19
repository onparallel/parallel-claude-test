import Analytics from "analytics-node";
import { inject, injectable } from "inversify";
import { isDefined } from "remeda";
import { Config, CONFIG } from "../config";
import {
  OrganizationUsageLimitName,
  PetitionSignatureCancelReason,
  PetitionStatus,
  User,
  UserData,
} from "../db/__types";
import { unMaybeArray } from "../util/arrays";
import { fullName } from "../util/fullName";
import { toGlobalId } from "../util/globalId";
import { titleize } from "../util/strings";
import { Maybe, MaybeArray } from "../util/types";

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
  | "INVITE_SENT"
  | "REMINDER_OPTED_OUT"
  | "FIRST_REPLY_CREATED"
  | "COMMENT_PUBLISHED"
  | "EMAIL_OPENED"
  | "SIGNATURE_SENT"
  | "SIGNATURE_COMPLETED"
  | "SIGNATURE_REMINDER"
  | "SIGNATURE_CANCELLED"
  | "ORGANIZATION_LIMIT_REACHED";

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
    same_domain: boolean;
    from_template_id: Maybe<number>;
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
    requires_signature: boolean;
    same_domain: boolean;
    // either a petition_access or user completed the petition
    petition_access_id?: number;
    user_id?: number;
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
  REMINDER_OPTED_OUT: {
    reason: string;
    other?: string;
    petition_id: number;
    petition_access_id: number;
    referer?: string | null;
  };
  FIRST_REPLY_CREATED: {
    petition_id: number;
    petition_access_id: number;
  };
  COMMENT_PUBLISHED: {
    petition_id: number;
    petition_field_comment_id: number;
    from: "recipient" | "user";
    to: "recipient" | "user";
  };
  EMAIL_OPENED: {
    type: "petition-message" | "petition-reminder";
    petition_message_id?: number;
    petition_reminder_id?: number;
    petition_id: number;
    user_agent: string;
  };
  SIGNATURE_SENT: {
    petition_id: number;
    petition_signature_request_id: number;
    test_mode: boolean;
  };
  SIGNATURE_COMPLETED: {
    petition_id: number;
    petition_signature_request_id: number;
    test_mode: boolean;
  };
  SIGNATURE_REMINDER: {
    petition_id: number;
    petition_signature_request_id: number;
    test_mode: boolean;
  };
  SIGNATURE_CANCELLED: {
    petition_id: number;
    petition_signature_request_id: number;
    cancel_reason: PetitionSignatureCancelReason;
    test_mode?: boolean;
  };
  ORGANIZATION_LIMIT_REACHED: {
    org_id: number;
    limit_name: OrganizationUsageLimitName;
    used: number;
    total: number;
    period_start_date: Date;
    period_end_date: Date;
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
  | GenericAnalyticsEvent<"INVITE_SENT">
  | GenericAnalyticsEvent<"REMINDER_OPTED_OUT">
  | GenericAnalyticsEvent<"FIRST_REPLY_CREATED">
  | GenericAnalyticsEvent<"COMMENT_PUBLISHED">
  | GenericAnalyticsEvent<"EMAIL_OPENED">
  | GenericAnalyticsEvent<"SIGNATURE_SENT">
  | GenericAnalyticsEvent<"SIGNATURE_COMPLETED">
  | GenericAnalyticsEvent<"SIGNATURE_REMINDER">
  | GenericAnalyticsEvent<"SIGNATURE_CANCELLED">
  | GenericAnalyticsEvent<"ORGANIZATION_LIMIT_REACHED">;

export const ANALYTICS = Symbol.for("ANALYTICS");

export interface IAnalyticsService {
  identifyUser(user: User, userData: UserData, extraTraits?: any): void;
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

  identifyUser(user: User, userData: UserData, extraTraits?: any) {
    this.analytics?.identify({
      userId: toGlobalId("User", user.id),
      traits: {
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        name: fullName(userData.first_name, userData.last_name),
        createdAt: user.created_at.toISOString(),
        lastActiveAt: user.last_active_at?.toISOString(),
        industry: userData.details?.industry,
        role: userData.details?.role,
        position: userData.details?.position,
        source: userData.details?.source,
        locale: userData.details?.preferredLocale,
        orgId: user.org_id,
        orgRole: user.organization_role,
        ...extraTraits,
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
