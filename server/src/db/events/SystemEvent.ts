import { If } from "../../util/types";
import {
  OrganizationUsageLimitName,
  SystemEvent as DbSystemEvent,
  SystemEventType,
} from "../__types";

export type SystemEventPayload<TType extends SystemEventType> = {
  USER_LOGGED_IN: {
    user_id: number;
  };
  USER_CREATED: {
    user_id: number;
    from: "sign-up" | "invitation";
  };
  EMAIL_VERIFIED: {
    user_id: number;
  };
  INVITE_SENT: {
    invited_by: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  EMAIL_OPENED: {
    type: "petition-message" | "petition-reminder";
    petition_id: number;
    petition_message_id?: number;
    petition_reminder_id?: number;
    user_agent: string;
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
type GenericSystemEvent<TType extends SystemEventType, IsCreate extends boolean = false> = Omit<
  DbSystemEvent,
  "type" | "data" | If<IsCreate, "id" | "created_at" | "processed_at" | "processed_by">
> & {
  type: TType;
  data: SystemEventPayload<TType>;
};

export type UserCreatedEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "USER_CREATED",
  IsCreate
>;
export type UserLoggedInEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "USER_LOGGED_IN",
  IsCreate
>;

export type EmailVerifiedSystemEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "EMAIL_VERIFIED",
  IsCreate
>;

export type InviteSentSystemEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "INVITE_SENT",
  IsCreate
>;
export type EmailOpenedSystemEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "EMAIL_OPENED",
  IsCreate
>;

export type OrganizationLimitReachedSystemEvent<IsCreate extends boolean = false> =
  GenericSystemEvent<"ORGANIZATION_LIMIT_REACHED", IsCreate>;

export type SystemEvent<IsCreate extends boolean = false> =
  | UserCreatedEvent<IsCreate>
  | UserLoggedInEvent<IsCreate>
  | EmailVerifiedSystemEvent<IsCreate>
  | InviteSentSystemEvent<IsCreate>
  | EmailOpenedSystemEvent<IsCreate>
  | OrganizationLimitReachedSystemEvent<IsCreate>;

export type CreateSystemEvent = SystemEvent<true>;
