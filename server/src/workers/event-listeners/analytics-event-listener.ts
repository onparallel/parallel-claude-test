import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import {
  AccessActivatedEvent,
  AccessActivatedFromPublicPetitionLinkEvent,
  AccessOpenedEvent,
  CommentPublishedEvent,
  EmailOpenedSystemEvent,
  EmailVerifiedSystemEvent,
  InviteSentSystemEvent,
  OrganizationLimitReachedSystemEvent,
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
  UserCreatedEvent,
  UserLoggedInEvent,
} from "../../db/events";
import { EventListener } from "../event-processor";

async function loadPetitionOwner(petitionId: number, ctx: WorkerContext) {
  const user = await ctx.petitions.loadPetitionOwner(petitionId);
  if (!user) {
    throw new Error(`Owner user not found for Petition:${petitionId}`);
  }
  return user;
}

async function loadPetitionAccess(petitionAccessId: number, ctx: WorkerContext) {
  const access = await ctx.petitions.loadAccess(petitionAccessId);
  if (!access) {
    throw new Error(`Access not found with id ${petitionAccessId}`);
  }
  return access;
}

async function loadContactByAccessId(petitionAccessId: number, ctx: WorkerContext) {
  const contact = await ctx.contacts.loadContactByAccessId(petitionAccessId);
  if (!contact) {
    throw new Error(`Contact not found for PetitionAccess with id ${petitionAccessId}`);
  }
  return contact;
}

async function loadUser(userId: number, ctx: WorkerContext) {
  const user = await ctx.users.loadUser(userId);
  if (!user) {
    throw new Error(`User:${userId} not found`);
  }
  return user;
}

async function loadUserDataByUserId(userId: number, ctx: WorkerContext) {
  const userData = await ctx.users.loadUserDataByUserId(userId);
  if (!userData) {
    throw new Error(`UserData for User:${userId} not found`);
  }
  return userData;
}

async function loadUserStats(userId: number, ctx: WorkerContext) {
  const [logins, stats] = await Promise.all([
    ctx.system.loadUserLoggedInEventsCount(userId),
    ctx.petitions.loadPetitionStatsForUser(userId),
  ]);
  return {
    logins,
    ...stats,
  };
}

async function loadPetitionFieldComment(petitionFieldCommentId: number, ctx: WorkerContext) {
  const comment = await ctx.petitions.loadPetitionFieldComment(petitionFieldCommentId);
  if (!comment) {
    throw new Error(`PetitionFieldComment:${petitionFieldCommentId} not found`);
  }
  return comment;
}

async function trackPetitionCreatedEvent(event: PetitionCreatedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;
  await ctx.analytics.trackEvent({
    type: "PETITION_CREATED",
    user_id: event.data.user_id,
    data: {
      petition_id: event.petition_id,
      org_id: petition.org_id,
      type: petition.is_template ? "TEMPLATE" : "PETITION",
      user_id: event.data.user_id,
    },
  });
}

async function trackPetitionClonedEvent(event: PetitionClonedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  await ctx.analytics.trackEvent({
    type: "PETITION_CLONED",
    user_id: event.data.user_id,
    data: {
      petition_id: event.petition_id,
      ...event.data,
    },
  });
}

async function trackPetitionClosedEvent(event: PetitionClosedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  await ctx.analytics.trackEvent({
    type: "PETITION_CLOSED",
    user_id: event.data.user_id,
    data: {
      user_id: event.data.user_id,
      org_id: petition.org_id,
      petition_id: event.petition_id,
    },
  });
}

async function trackAccessActivatedEvent(event: AccessActivatedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const [user, contact] = await Promise.all([
    loadPetitionOwner(event.petition_id, ctx),
    loadContactByAccessId(event.data.petition_access_id, ctx),
  ]);

  const userData = (await ctx.users.loadUserData(user.user_data_id))!;

  await ctx.analytics.trackEvent({
    type: "PETITION_SENT",
    user_id: event.data.user_id,
    data: {
      petition_access_id: event.data.petition_access_id,
      user_id: event.data.user_id,
      org_id: petition.org_id,
      petition_id: event.petition_id,
      from_public_link: false,
      same_domain: userData.email.split("@")[1] === contact.email.split("@")[1],
      from_template_id: petition.from_template_id,
    },
  });
}

async function trackAccessActivatedFromPublicLinkEvent(
  event: AccessActivatedFromPublicPetitionLinkEvent,
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const [user, contact] = await Promise.all([
    loadPetitionOwner(event.petition_id, ctx),
    loadContactByAccessId(event.data.petition_access_id, ctx),
  ]);

  const userData = (await ctx.users.loadUserData(user.user_data_id))!;

  await ctx.analytics.trackEvent({
    type: "PETITION_SENT",
    user_id: user.id,
    data: {
      petition_access_id: event.data.petition_access_id,
      user_id: user.id,
      org_id: petition.org_id,
      petition_id: event.petition_id,
      from_public_link: true,
      same_domain: userData.email.split("@")[1] === contact.email.split("@")[1],
      from_template_id: petition.from_template_id,
    },
  });
}

async function trackPetitionCompletedEvent(event: PetitionCompletedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const [completedBy, owner] = await Promise.all([
    event.data.petition_access_id
      ? loadContactByAccessId(event.data.petition_access_id!, ctx)
      : loadUser(event.data.user_id!, ctx),
    loadPetitionOwner(event.petition_id, ctx),
  ]);

  const completedByEmail =
    "user_data_id" in completedBy
      ? (await loadUserDataByUserId(completedBy.user_data_id, ctx)).email
      : completedBy.email;

  const ownerData = (await ctx.users.loadUserData(owner.user_data_id))!;

  await ctx.analytics.trackEvent({
    type: "PETITION_COMPLETED",
    user_id: owner.id,
    data: {
      ...(isDefined(event.data.petition_access_id)
        ? { petition_access_id: event.data.petition_access_id }
        : { user_id: event.data.user_id! }),
      org_id: owner.org_id,
      petition_id: event.petition_id,
      requires_signature: isDefined(petition.signature_config),
      same_domain: ownerData.email.split("@")[1] === completedByEmail.split("@")[1],
    },
  });
}

async function trackPetitionDeletedEvent(event: PetitionDeletedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  await ctx.analytics.trackEvent({
    type: "PETITION_DELETED",
    user_id: event.data.user_id,
    data: {
      status: event.data.status,
      user_id: event.data.user_id,
      petition_id: event.petition_id,
      org_id: petition.org_id,
    },
  });
}

async function trackUserLoggedInEvent(event: UserLoggedInEvent, ctx: WorkerContext) {
  const [user, userData, stats] = await Promise.all([
    loadUser(event.data.user_id, ctx),
    loadUserDataByUserId(event.data.user_id, ctx),
    loadUserStats(event.data.user_id, ctx),
  ]);
  await ctx.analytics.identifyUser(user, userData, stats);
  await ctx.analytics.trackEvent({
    type: "USER_LOGGED_IN",
    user_id: event.data.user_id,
    data: {
      user_id: user.id,
      email: userData.email,
      org_id: user.org_id,
    },
  });
}

async function trackReminderSentEvent(event: ReminderSentEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const reminder = await ctx.petitions.loadReminder(event.data.petition_reminder_id);
  if (!reminder) {
    throw new Error(`Reminder not found with id ${event.data.petition_reminder_id}`);
  }
  const access = await loadPetitionAccess(reminder.petition_access_id, ctx);

  await ctx.analytics.trackEvent({
    type: "REMINDER_EMAIL_SENT",
    user_id: access.granter_id,
    data: {
      petition_id: access.petition_id,
      org_id: petition.org_id,
      user_id: access.granter_id,
      petition_access_id: access.id,
      sent_count: 10 - access.reminders_left + 1,
      type: reminder.type,
    },
  });
}

async function trackTemplateUsedEvent(event: TemplateUsedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  await ctx.analytics.trackEvent({
    type: "TEMPLATE_USED",
    user_id: event.data.user_id,
    data: {
      template_id: event.petition_id,
      ...event.data,
    },
  });
}

async function trackUserCreatedEvent(event: UserCreatedEvent, ctx: WorkerContext) {
  const [user, userData] = await Promise.all([
    loadUser(event.data.user_id, ctx),
    loadUserDataByUserId(event.data.user_id, ctx),
  ]);
  await ctx.analytics.identifyUser(user, userData);
  await ctx.analytics.trackEvent({
    type: "USER_CREATED",
    user_id: event.data.user_id,
    data: {
      user_id: event.data.user_id,
      org_id: user.org_id,
      email: userData.email,
      industry: userData.details?.industry ?? null,
      position: userData.details?.position ?? null,
      role: userData.details?.role ?? null,
      from: event.data.from,
    },
  });
}

async function trackAccessOpenedEvent(event: AccessOpenedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const access = await loadPetitionAccess(event.data.petition_access_id, ctx);

  await ctx.analytics.trackEvent({
    type: "ACCESS_OPENED",
    user_id: access.granter_id,
    data: {
      contact_id: access.contact_id,
      org_id: petition.org_id,
      petition_id: event.petition_id,
    },
  });
}

async function trackEmailVerifiedEvent(event: EmailVerifiedSystemEvent, ctx: WorkerContext) {
  const userData = await loadUserDataByUserId(event.data.user_id, ctx);
  await ctx.analytics.trackEvent({
    type: "EMAIL_VERIFIED",
    user_id: event.data.user_id,
    data: {
      email: userData.email,
    },
  });
}

async function trackRemindersOptOutEvent(event: RemindersOptOutEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const access = await loadPetitionAccess(event.data.petition_access_id, ctx);
  await ctx.analytics.trackEvent({
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

async function trackInviteSentEvent(event: InviteSentSystemEvent, ctx: WorkerContext) {
  await ctx.analytics.trackEvent({
    type: "INVITE_SENT",
    user_id: event.data.invited_by,
    data: {
      invitee_email: event.data.email,
      invitee_first_name: event.data.first_name,
      invitee_last_name: event.data.last_name,
      invitee_role: event.data.role,
    },
  });
}

async function trackFirstReplyCreatedEvent(event: ReplyCreatedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const [replyCreatedEvents, petitionOwner] = await Promise.all([
    ctx.petitions.getPetitionEventsByType(event.petition_id, ["REPLY_CREATED"]),
    loadPetitionOwner(event.petition_id, ctx),
  ]);

  /* make sure it's the first reply of a recipient (users can submit replies too) */
  const recipientEvents = replyCreatedEvents.filter((e) => isDefined(e.data.petition_access_id));
  if (recipientEvents.length === 1) {
    await ctx.analytics.trackEvent({
      type: "FIRST_REPLY_CREATED",
      user_id: petitionOwner.id,
      data: {
        petition_access_id: event.data.petition_access_id!,
        petition_id: event.petition_id,
      },
    });
  }
}

async function trackCommentPublishedEvent(event: CommentPublishedEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const [user, comment] = await Promise.all([
    loadPetitionOwner(event.petition_id, ctx),
    loadPetitionFieldComment(event.data.petition_field_comment_id, ctx),
  ]);

  const from = isDefined(comment.petition_access_id) ? "recipient" : "user";
  await ctx.analytics.trackEvent({
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

async function trackEmailOpenedEvent(event: EmailOpenedSystemEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.data.petition_id);
  if (!petition) return;

  const user = await loadPetitionOwner(event.data.petition_id, ctx);
  await ctx.analytics.trackEvent({
    type: "EMAIL_OPENED",
    user_id: user.id,
    data: event.data,
  });
}

async function trackSignatureStartedEvent(event: SignatureStartedEvent, ctx: WorkerContext) {
  const [petition, petitionSignatureRequest] = await Promise.all([
    ctx.petitions.loadPetition(event.petition_id),
    ctx.petitions.loadPetitionSignatureById(event.data.petition_signature_request_id),
  ]);
  if (!petition || !petitionSignatureRequest) return;

  const user = await loadPetitionOwner(event.petition_id, ctx);
  const orgIntegration = await ctx.integrations.loadIntegration(
    petitionSignatureRequest.signature_config.orgIntegrationId
  );

  await ctx.analytics.trackEvent({
    type: "SIGNATURE_SENT",
    user_id: user.id,
    data: {
      petition_id: petition.id,
      petition_signature_request_id: petitionSignatureRequest.id,
      test_mode: orgIntegration?.settings["ENVIRONMENT"] === "sandbox",
    },
  });
}

async function trackSignatureCompletedEvent(event: SignatureCompletedEvent, ctx: WorkerContext) {
  const [petition, petitionSignatureRequest] = await Promise.all([
    ctx.petitions.loadPetition(event.petition_id),
    ctx.petitions.loadPetitionSignatureById(event.data.petition_signature_request_id),
  ]);
  if (!petition || !petitionSignatureRequest) return;

  const user = await loadPetitionOwner(event.petition_id, ctx);
  const orgIntegration = await ctx.integrations.loadIntegration(
    petitionSignatureRequest.signature_config.orgIntegrationId
  );

  await ctx.analytics.trackEvent({
    type: "SIGNATURE_COMPLETED",
    user_id: user.id,
    data: {
      petition_id: petition.id,
      petition_signature_request_id: petitionSignatureRequest.id,
      test_mode: orgIntegration?.settings["ENVIRONMENT"] === "sandbox",
    },
  });
}

async function trackSignatureReminderEvent(event: SignatureReminderEvent, ctx: WorkerContext) {
  const [petition, petitionSignatureRequest] = await Promise.all([
    ctx.petitions.loadPetition(event.petition_id),
    ctx.petitions.loadPetitionSignatureById(event.data.petition_signature_request_id),
  ]);
  if (!petition || !petitionSignatureRequest) return;

  const orgIntegration = await ctx.integrations.loadIntegration(
    petitionSignatureRequest.signature_config.orgIntegrationId
  );

  await ctx.analytics.trackEvent({
    type: "SIGNATURE_REMINDER",
    user_id: event.data.user_id,
    data: {
      petition_id: petition.id,
      petition_signature_request_id: petitionSignatureRequest.id,
      test_mode: orgIntegration?.settings["ENVIRONMENT"] === "sandbox",
    },
  });
}

async function trackSignatureCancelledEvent(event: SignatureCancelledEvent, ctx: WorkerContext) {
  const [petition, petitionSignatureRequest] = await Promise.all([
    ctx.petitions.loadPetition(event.petition_id),
    isDefined(event.data.petition_signature_request_id)
      ? ctx.petitions.loadPetitionSignatureById(event.data.petition_signature_request_id)
      : null,
  ]);
  if (!petition) return;

  const user = await loadPetitionOwner(petition.id, ctx);

  const orgIntegration = petitionSignatureRequest
    ? await ctx.integrations.loadIntegration(
        petitionSignatureRequest.signature_config.orgIntegrationId
      )
    : null;

  await ctx.analytics.trackEvent({
    type: "SIGNATURE_CANCELLED",
    user_id: user.id,
    data: {
      petition_id: petition.id,
      petition_signature_request_id: petitionSignatureRequest?.id,
      cancel_reason: event.data.cancel_reason,
      test_mode: orgIntegration?.settings["ENVIRONMENT"] === "sandbox",
    },
  });
}

async function trackOrganizationLimitReachedEvent(
  event: OrganizationLimitReachedSystemEvent,
  ctx: WorkerContext
) {
  const owner = await ctx.organizations.loadOrgOwner(event.data.org_id);
  if (owner) {
    await ctx.analytics.trackEvent({
      type: "ORGANIZATION_LIMIT_REACHED",
      user_id: owner.id,
      data: event.data,
    });
  }
}

export const analyticsEventListener: EventListener = async (event, ctx) => {
  switch (event.type) {
    case "PETITION_CREATED":
      await trackPetitionCreatedEvent(event, ctx);
      break;
    case "PETITION_CLONED":
      await trackPetitionClonedEvent(event, ctx);
      break;
    case "PETITION_CLOSED":
      await trackPetitionClosedEvent(event, ctx);
      break;
    case "PETITION_COMPLETED":
      await trackPetitionCompletedEvent(event, ctx);
      break;
    case "PETITION_DELETED":
      await trackPetitionDeletedEvent(event, ctx);
      break;
    case "USER_LOGGED_IN":
      await trackUserLoggedInEvent(event, ctx);
      break;
    case "REMINDER_SENT":
      await trackReminderSentEvent(event, ctx);
      break;
    case "TEMPLATE_USED":
      await trackTemplateUsedEvent(event, ctx);
      break;
    case "USER_CREATED":
      await trackUserCreatedEvent(event, ctx);
      break;
    case "ACCESS_OPENED":
      await trackAccessOpenedEvent(event, ctx);
      break;
    case "ACCESS_ACTIVATED":
      await trackAccessActivatedEvent(event, ctx);
      break;
    case "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK":
      await trackAccessActivatedFromPublicLinkEvent(event, ctx);
      break;
    case "EMAIL_VERIFIED":
      await trackEmailVerifiedEvent(event, ctx);
      break;
    case "INVITE_SENT":
      await trackInviteSentEvent(event, ctx);
      break;
    case "REMINDERS_OPT_OUT":
      await trackRemindersOptOutEvent(event, ctx);
      break;
    case "REPLY_CREATED":
      await trackFirstReplyCreatedEvent(event, ctx);
      break;
    case "COMMENT_PUBLISHED":
      await trackCommentPublishedEvent(event, ctx);
      break;
    case "EMAIL_OPENED":
      await trackEmailOpenedEvent(event, ctx);
      break;
    case "SIGNATURE_STARTED":
      await trackSignatureStartedEvent(event, ctx);
      break;
    case "SIGNATURE_COMPLETED":
      await trackSignatureCompletedEvent(event, ctx);
      break;
    case "SIGNATURE_REMINDER":
      await trackSignatureReminderEvent(event, ctx);
      break;
    case "SIGNATURE_CANCELLED":
      await trackSignatureCancelledEvent(event, ctx);
      break;
    case "ORGANIZATION_LIMIT_REACHED":
      await trackOrganizationLimitReachedEvent(event, ctx);
      break;
    default:
      throw new Error(`Tracking to analytics not implemented for event ${JSON.stringify(event)}`);
      break;
  }
};
