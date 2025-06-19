import { inject, injectable } from "inversify";
import { isNonNullish, maxBy } from "remeda";
import {
  PetitionEvent,
  PetitionEventType,
  ProfileEvent,
  ProfileEventType,
  SystemEvent,
  SystemEventType,
} from "../../../db/__types";
import {
  AccessActivatedEvent,
  AccessActivatedFromPublicPetitionLinkEvent,
  AccessOpenedEvent,
  CommentPublishedEvent,
  PetitionClonedEvent,
  PetitionClosedEvent,
  PetitionCompletedEvent,
  PetitionCreatedEvent,
  PetitionDeletedEvent,
  ReminderSentEvent,
  RemindersOptOutEvent,
  ReplyCreatedEvent,
  SignatureCancelledEvent,
  SignatureCompletedEvent,
  SignatureReminderEvent,
  SignatureStartedEvent,
  TemplateUsedEvent,
} from "../../../db/events/PetitionEvent";
import {
  EmailOpenedSystemEvent,
  EmailVerifiedSystemEvent,
  InviteSentSystemEvent,
  OrganizationLimitReachedSystemEvent,
  UserCreatedEvent,
  UserLoggedInEvent,
} from "../../../db/events/SystemEvent";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { IntegrationRepository } from "../../../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../../../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { SystemRepository } from "../../../db/repositories/SystemRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { ANALYTICS, IAnalyticsService } from "../../../services/AnalyticsService";
import { toGlobalId } from "../../../util/globalId";
import { EventListener, EventType } from "../EventProcessorQueue";

export const ANALYTICS_EVENT_LISTENER = Symbol.for("ANALYTICS_EVENT_LISTENER");
@injectable()
export class AnalyticsEventListener implements EventListener<EventType> {
  constructor(
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(SystemRepository) private system: SystemRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(ANALYTICS) private analytics: IAnalyticsService,
  ) {}
  public types = [
    "PETITION_CREATED",
    "PETITION_CLONED",
    "PETITION_CLOSED",
    "PETITION_COMPLETED",
    "PETITION_DELETED",
    "REMINDER_SENT",
    "TEMPLATE_USED",
    "ACCESS_OPENED",
    "USER_LOGGED_IN",
    "USER_CREATED",
    "ACCESS_ACTIVATED",
    "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
    "EMAIL_VERIFIED",
    "INVITE_SENT",
    "REMINDERS_OPT_OUT",
    "REPLY_CREATED",
    "COMMENT_PUBLISHED",
    "EMAIL_OPENED",
    "SIGNATURE_CANCELLED",
    "SIGNATURE_STARTED",
    "SIGNATURE_COMPLETED",
    "SIGNATURE_REMINDER",
    "ORGANIZATION_LIMIT_REACHED",
  ] as EventType[];

  public async handle<T extends EventType>(
    event: T extends PetitionEventType
      ? PetitionEvent & { type: T }
      : T extends SystemEventType
        ? SystemEvent & { type: T }
        : T extends ProfileEventType
          ? ProfileEvent & { type: T }
          : never,
  ) {
    switch (event.type) {
      case "PETITION_CREATED":
        await this.trackPetitionCreatedEvent(event);
        break;
      case "PETITION_CLONED":
        await this.trackPetitionClonedEvent(event);
        break;
      case "PETITION_CLOSED":
        await this.trackPetitionClosedEvent(event);
        break;
      case "PETITION_COMPLETED":
        await this.trackPetitionCompletedEvent(event);
        break;
      case "PETITION_DELETED":
        await this.trackPetitionDeletedEvent(event);
        break;
      case "USER_LOGGED_IN":
        await this.trackUserLoggedInEvent(event);
        break;
      case "REMINDER_SENT":
        await this.trackReminderSentEvent(event);
        break;
      case "TEMPLATE_USED":
        await this.trackTemplateUsedEvent(event);
        break;
      case "USER_CREATED":
        await this.trackUserCreatedEvent(event);
        break;
      case "ACCESS_OPENED":
        await this.trackAccessOpenedEvent(event);
        break;
      case "ACCESS_ACTIVATED":
        await this.trackAccessActivatedEvent(event);
        break;
      case "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK":
        await this.trackAccessActivatedFromPublicLinkEvent(event);
        break;
      case "EMAIL_VERIFIED":
        await this.trackEmailVerifiedEvent(event);
        break;
      case "INVITE_SENT":
        await this.trackInviteSentEvent(event);
        break;
      case "REMINDERS_OPT_OUT":
        await this.trackRemindersOptOutEvent(event);
        break;
      case "REPLY_CREATED":
        await this.trackFirstReplyCreatedEvent(event);
        break;
      case "COMMENT_PUBLISHED":
        await this.trackCommentPublishedEvent(event);
        break;
      case "EMAIL_OPENED":
        await this.trackEmailOpenedEvent(event);
        break;
      case "SIGNATURE_STARTED":
        await this.trackSignatureStartedEvent(event);
        break;
      case "SIGNATURE_COMPLETED":
        await this.trackSignatureCompletedEvent(event);
        break;
      case "SIGNATURE_REMINDER":
        await this.trackSignatureReminderEvent(event);
        break;
      case "SIGNATURE_CANCELLED":
        await this.trackSignatureCancelledEvent(event);
        break;
      case "ORGANIZATION_LIMIT_REACHED":
        await this.trackOrganizationLimitReachedEvent(event);
        break;
      default:
        throw new Error(`Tracking to analytics not implemented for event ${JSON.stringify(event)}`);
    }
  }

  private async loadPetitionOwner(petitionId: number) {
    const user = await this.petitions.loadPetitionOwner(petitionId);
    if (!user) {
      throw new Error(`Owner user not found for Petition:${petitionId}`);
    }
    return user;
  }

  private async loadPetitionAccess(petitionAccessId: number) {
    const access = await this.petitions.loadAccess(petitionAccessId);
    if (!access) {
      throw new Error(`Access not found with id ${petitionAccessId}`);
    }
    return access;
  }

  private async loadContactByAccessId(petitionAccessId: number) {
    const contact = await this.contacts.loadContactByAccessId(petitionAccessId);
    if (!contact) {
      throw new Error(`Contact not found for PetitionAccess with id ${petitionAccessId}`);
    }
    return contact;
  }

  private async loadUser(userId: number) {
    const user = await this.users.loadUser(userId);
    if (!user) {
      throw new Error(`User:${userId} not found`);
    }
    return user;
  }

  private async loadUserDataByUserId(userId: number) {
    const userData = await this.users.loadUserDataByUserId(userId);
    if (!userData) {
      throw new Error(`UserData for User:${userId} not found`);
    }
    return userData;
  }

  private async getUserStats(userId: number) {
    const [loginEvents, stats] = await Promise.all([
      this.system.getUserLoggedInEvents(userId),
      this.petitions.getPetitionStatsForUser(userId),
    ]);
    return {
      logins: loginEvents.length,
      latest_login_at: maxBy(loginEvents, (e) => e.created_at.getTime())?.created_at ?? null,
      ...stats,
    };
  }

  private async trackPetitionCreatedEvent(event: PetitionCreatedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;
    this.analytics.trackEvent({
      type: "PETITION_CREATED",
      user_id: event.data.user_id,
      data: {
        petition_id: event.petition_id,
        org_id: toGlobalId("Organization", petition.org_id),
        company_id: toGlobalId("Organization", petition.org_id),
        type: petition.is_template ? "TEMPLATE" : "PETITION",
        user_id: event.data.user_id,
      },
    });
  }

  private async trackPetitionClonedEvent(event: PetitionClonedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    this.analytics.trackEvent({
      type: "PETITION_CLONED",
      user_id: event.data.user_id,
      data: {
        petition_id: event.petition_id,
        new_petition_id: event.data.new_petition_id,
        type: event.data.type,
        user_id: event.data.user_id,
        org_id: toGlobalId("Organization", event.data.org_id),
        company_id: toGlobalId("Organization", event.data.org_id),
      },
    });
  }

  private async trackPetitionClosedEvent(event: PetitionClosedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    this.analytics.trackEvent({
      type: "PETITION_CLOSED",
      user_id: event.data.user_id,
      data: {
        user_id: event.data.user_id,
        org_id: toGlobalId("Organization", petition.org_id),
        company_id: toGlobalId("Organization", petition.org_id),
        petition_id: event.petition_id,
      },
    });
  }

  private async trackAccessActivatedEvent(event: AccessActivatedEvent) {
    const [petition, access] = await Promise.all([
      this.petitions.loadPetition(event.petition_id),
      this.petitions.loadAccess(event.data.petition_access_id),
    ]);

    if (!petition || !access || !access.contact_id) return; // skip tracking of contactless accesses

    const [user, contact] = await Promise.all([
      this.loadPetitionOwner(event.petition_id),
      this.loadContactByAccessId(event.data.petition_access_id),
    ]);

    const userData = (await this.users.loadUserData(user.user_data_id))!;

    this.analytics.trackEvent({
      type: "PETITION_SENT",
      user_id: event.data.user_id,
      data: {
        petition_access_id: event.data.petition_access_id,
        user_id: event.data.user_id,
        org_id: toGlobalId("Organization", petition.org_id),
        company_id: toGlobalId("Organization", petition.org_id),
        petition_id: event.petition_id,
        from_public_link: false,
        same_domain: userData.email.split("@")[1] === contact.email.split("@")[1],
        from_template_id: petition.from_template_id,
      },
    });
  }

  private async trackAccessActivatedFromPublicLinkEvent(
    event: AccessActivatedFromPublicPetitionLinkEvent,
  ) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const [user, contact] = await Promise.all([
      this.loadPetitionOwner(event.petition_id),
      this.loadContactByAccessId(event.data.petition_access_id),
    ]);

    const userData = (await this.users.loadUserData(user.user_data_id))!;

    this.analytics.trackEvent({
      type: "PETITION_SENT",
      user_id: user.id,
      data: {
        petition_access_id: event.data.petition_access_id,
        user_id: user.id,
        org_id: toGlobalId("Organization", petition.org_id),
        company_id: toGlobalId("Organization", petition.org_id),
        petition_id: event.petition_id,
        from_public_link: true,
        same_domain: userData.email.split("@")[1] === contact.email.split("@")[1],
        from_template_id: petition.from_template_id,
      },
    });
  }

  private async trackPetitionCompletedEvent(event: PetitionCompletedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const [completedBy, owner] = await Promise.all([
      event.data.petition_access_id
        ? this.loadContactByAccessId(event.data.petition_access_id!)
        : this.loadUser(event.data.user_id!),
      this.loadPetitionOwner(event.petition_id),
    ]);

    const completedByEmail =
      "user_data_id" in completedBy
        ? (await this.loadUserDataByUserId(completedBy.id)).email
        : completedBy.email;

    const ownerData = (await this.users.loadUserData(owner.user_data_id))!;

    this.analytics.trackEvent({
      type: "PETITION_COMPLETED",
      user_id: owner.id,
      data: {
        ...(isNonNullish(event.data.petition_access_id)
          ? { petition_access_id: event.data.petition_access_id }
          : { user_id: event.data.user_id! }),
        org_id: toGlobalId("Organization", owner.org_id),
        company_id: toGlobalId("Organization", owner.org_id),
        petition_id: event.petition_id,
        requires_signature: !!petition.signature_config?.isEnabled,
        same_domain: ownerData.email.split("@")[1] === completedByEmail.split("@")[1],
      },
    });
  }

  private async trackPetitionDeletedEvent(event: PetitionDeletedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    this.analytics.trackEvent({
      type: "PETITION_DELETED",
      user_id: event.data.user_id,
      data: {
        status: event.data.status,
        user_id: event.data.user_id,
        petition_id: event.petition_id,
        org_id: toGlobalId("Organization", petition.org_id),
        company_id: toGlobalId("Organization", petition.org_id),
      },
    });
  }

  private async trackUserLoggedInEvent(event: UserLoggedInEvent) {
    const [user, userData, stats, permissions] = await Promise.all([
      this.loadUser(event.data.user_id),
      this.loadUserDataByUserId(event.data.user_id),
      this.getUserStats(event.data.user_id),
      this.users.loadUserPermissions(event.data.user_id),
    ]);

    const organization = await this.organizations.loadOrg(user.org_id);
    if (!organization) {
      throw new Error(`Organization:${user.org_id} not found`);
    }
    await this.analytics.identifyUser(user, userData, organization, { ...stats, permissions });
    this.analytics.trackEvent({
      type: "USER_LOGGED_IN",
      user_id: event.data.user_id,
      data: {
        user_id: user.id,
        email: userData.email,
        org_id: toGlobalId("Organization", user.org_id),
        company_id: toGlobalId("Organization", user.org_id),
      },
    });
  }

  private async trackReminderSentEvent(event: ReminderSentEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const reminder = await this.petitions.loadReminder(event.data.petition_reminder_id);
    if (!reminder) {
      throw new Error(`Reminder not found with id ${event.data.petition_reminder_id}`);
    }
    const access = await this.loadPetitionAccess(reminder.petition_access_id);

    this.analytics.trackEvent({
      type: "REMINDER_EMAIL_SENT",
      user_id: access.granter_id,
      data: {
        petition_id: access.petition_id,
        org_id: toGlobalId("Organization", petition.org_id),
        company_id: toGlobalId("Organization", petition.org_id),
        user_id: access.granter_id,
        petition_access_id: access.id,
        sent_count: 10 - access.reminders_left,
        type: reminder.type,
      },
    });
  }

  private async trackTemplateUsedEvent(event: TemplateUsedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    this.analytics.trackEvent({
      type: "TEMPLATE_USED",
      user_id: event.data.user_id,
      data: {
        template_id: event.petition_id,
        new_petition_id: event.data.new_petition_id,
        user_id: event.data.user_id,
        org_id: toGlobalId("Organization", event.data.org_id),
        company_id: toGlobalId("Organization", event.data.org_id),
      },
    });
  }

  private async trackUserCreatedEvent(event: UserCreatedEvent) {
    const [user, userData] = await Promise.all([
      this.loadUser(event.data.user_id),
      this.loadUserDataByUserId(event.data.user_id),
    ]);

    const organization = await this.organizations.loadOrg(user.org_id);
    if (!organization) {
      throw new Error(`Organization:${user.org_id} not found`);
    }
    await this.analytics.identifyUser(user, userData, organization);
    this.analytics.trackEvent({
      type: "USER_CREATED",
      user_id: event.data.user_id,
      data: {
        user_id: event.data.user_id,
        org_id: toGlobalId("Organization", user.org_id),
        company_id: toGlobalId("Organization", user.org_id),
        email: userData.email,
        industry: userData.details?.industry ?? null,
        position: userData.details?.position ?? null,
        role: userData.details?.role ?? null,
        from: event.data.from,
      },
    });
  }

  private async trackAccessOpenedEvent(event: AccessOpenedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const access = await this.loadPetitionAccess(event.data.petition_access_id);

    this.analytics.trackEvent({
      type: "ACCESS_OPENED",
      user_id: access.granter_id,
      data: {
        contact_id: access.contact_id!,
        org_id: toGlobalId("Organization", petition.org_id),
        company_id: toGlobalId("Organization", petition.org_id),
        petition_id: event.petition_id,
      },
    });
  }

  private async trackEmailVerifiedEvent(event: EmailVerifiedSystemEvent) {
    const userData = await this.loadUserDataByUserId(event.data.user_id);
    this.analytics.trackEvent({
      type: "EMAIL_VERIFIED",
      user_id: event.data.user_id,
      data: {
        email: userData.email,
      },
    });
  }

  private async trackRemindersOptOutEvent(event: RemindersOptOutEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const access = await this.loadPetitionAccess(event.data.petition_access_id);
    this.analytics.trackEvent({
      type: "REMINDER_OPTED_OUT",
      user_id: access.granter_id,
      data: {
        petition_id: access.petition_id,
        petition_access_id: access.id,
        reason: event.data.reason,
        other: event.data.other,
        referer: event.data.referer,
      },
    });
  }

  private async trackInviteSentEvent(event: InviteSentSystemEvent) {
    this.analytics.trackEvent({
      type: "INVITE_SENT",
      user_id: event.data.invited_by,
      data: {
        invitee_email: event.data.email,
        invitee_first_name: event.data.first_name,
        invitee_last_name: event.data.last_name,
      },
    });
  }

  private async trackFirstReplyCreatedEvent(event: ReplyCreatedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const [replyCreatedEvents, petitionOwner] = await Promise.all([
      this.petitions.getPetitionEventsByType(event.petition_id, ["REPLY_CREATED"]),
      this.loadPetitionOwner(event.petition_id),
    ]);

    /* make sure it's the first reply of a recipient (users can submit replies too) */
    const recipientEvents = replyCreatedEvents.filter((e) =>
      isNonNullish(e.data.petition_access_id),
    );
    if (recipientEvents.length === 1) {
      this.analytics.trackEvent({
        type: "FIRST_REPLY_CREATED",
        user_id: petitionOwner.id,
        data: {
          petition_access_id: event.data.petition_access_id!,
          petition_id: event.petition_id,
        },
      });
    }
  }

  private async trackCommentPublishedEvent(event: CommentPublishedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const [user, comment] = await Promise.all([
      this.loadPetitionOwner(event.petition_id),
      this.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id),
    ]);

    if (!comment) {
      return;
    }

    const from = isNonNullish(comment.petition_access_id) ? "recipient" : "user";
    this.analytics.trackEvent({
      type: "COMMENT_PUBLISHED",
      user_id: user.id,
      data: {
        petition_id: event.petition_id,
        petition_field_comment_id: event.data.petition_field_comment_id,
        from,
        to: from === "recipient" ? "user" : comment.is_internal ? "user" : "recipient",
      },
    });
  }

  private async trackEmailOpenedEvent(event: EmailOpenedSystemEvent) {
    const petition = await this.petitions.loadPetition(event.data.petition_id);
    if (!petition) return;

    const user = await this.loadPetitionOwner(event.data.petition_id);
    this.analytics.trackEvent({
      type: "EMAIL_OPENED",
      user_id: user.id,
      data: event.data,
    });
  }

  private async trackSignatureStartedEvent(event: SignatureStartedEvent) {
    const [petition, petitionSignatureRequest] = await Promise.all([
      this.petitions.loadPetition(event.petition_id),
      this.petitions.loadPetitionSignatureById(event.data.petition_signature_request_id),
    ]);
    if (!petition || !petitionSignatureRequest) return;

    const user = await this.loadPetitionOwner(event.petition_id);
    const orgIntegration = await this.integrations.loadIntegration(
      petitionSignatureRequest.signature_config.orgIntegrationId,
    );

    this.analytics.trackEvent({
      type: "SIGNATURE_SENT",
      user_id: user.id,
      data: {
        petition_id: petition.id,
        petition_signature_request_id: petitionSignatureRequest.id,
        test_mode: orgIntegration?.settings["ENVIRONMENT"] === "sandbox",
      },
    });
  }

  private async trackSignatureCompletedEvent(event: SignatureCompletedEvent) {
    const [petition, petitionSignatureRequest] = await Promise.all([
      this.petitions.loadPetition(event.petition_id),
      this.petitions.loadPetitionSignatureById(event.data.petition_signature_request_id),
    ]);
    if (!petition || !petitionSignatureRequest) return;

    const user = await this.loadPetitionOwner(event.petition_id);
    const orgIntegration = await this.integrations.loadIntegration(
      petitionSignatureRequest.signature_config.orgIntegrationId,
    );

    this.analytics.trackEvent({
      type: "SIGNATURE_COMPLETED",
      user_id: user.id,
      data: {
        petition_id: petition.id,
        petition_signature_request_id: petitionSignatureRequest.id,
        test_mode: orgIntegration?.settings["ENVIRONMENT"] === "sandbox",
      },
    });
  }

  private async trackSignatureReminderEvent(event: SignatureReminderEvent) {
    const [petition, petitionSignatureRequest] = await Promise.all([
      this.petitions.loadPetition(event.petition_id),
      this.petitions.loadPetitionSignatureById(event.data.petition_signature_request_id),
    ]);
    if (!petition || !petitionSignatureRequest) return;

    const orgIntegration = await this.integrations.loadIntegration(
      petitionSignatureRequest.signature_config.orgIntegrationId,
    );

    this.analytics.trackEvent({
      type: "SIGNATURE_REMINDER",
      user_id: event.data.user_id,
      data: {
        petition_id: petition.id,
        petition_signature_request_id: petitionSignatureRequest.id,
        test_mode: orgIntegration?.settings["ENVIRONMENT"] === "sandbox",
      },
    });
  }

  private async trackSignatureCancelledEvent(event: SignatureCancelledEvent) {
    const [petition, petitionSignatureRequest] = await Promise.all([
      this.petitions.loadPetition(event.petition_id),
      this.petitions.loadPetitionSignatureById(event.data.petition_signature_request_id),
    ]);
    if (!petition) return;

    const user = await this.loadPetitionOwner(petition.id);

    const orgIntegration = petitionSignatureRequest
      ? await this.integrations.loadIntegration(
          petitionSignatureRequest.signature_config.orgIntegrationId,
        )
      : null;

    this.analytics.trackEvent({
      type: "SIGNATURE_CANCELLED",
      user_id: user.id,
      data: {
        petition_id: petition.id,
        petition_signature_request_id: petitionSignatureRequest!.id,
        cancel_reason: event.data.cancel_reason,
        test_mode: orgIntegration?.settings["ENVIRONMENT"] === "sandbox",
      },
    });
  }

  private async trackOrganizationLimitReachedEvent(event: OrganizationLimitReachedSystemEvent) {
    const owner = await this.organizations.loadOrgOwner(event.data.org_id);
    if (owner) {
      this.analytics.trackEvent({
        type: "ORGANIZATION_LIMIT_REACHED",
        user_id: owner.id,
        data: {
          org_id: toGlobalId("Organization", event.data.org_id),
          company_id: toGlobalId("Organization", event.data.org_id),
          limit_name: event.data.limit_name,
          period_start_date: event.data.period_start_date,
          period_end_date: event.data.period_end_date,
          total: event.data.total,
          used: event.data.used,
        },
      });
    }
  }
}
