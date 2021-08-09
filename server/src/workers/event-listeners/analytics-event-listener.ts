import { WorkerContext } from "../../context";
import {
  AccessActivatedEvent,
  AccessOpenedEvent,
  PetitionClonedEvent,
  PetitionClosedEvent,
  PetitionCompletedEvent,
  PetitionCreatedEvent,
  PetitionDeletedEvent,
  ReminderSentEvent,
  TemplateUsedEvent,
  UserCreatedEvent,
  UserLoggedInEvent,
} from "../../db/events";
import { EventListener } from "../event-processor";

async function loadPetition(petitionId: number, ctx: WorkerContext) {
  // when receiving different events, the petition could be already deleted in the database
  // example: creating and immediately after deleting a petition.
  // the PETITION_CREATED event will reference to a deleted petition.
  // because of this, we need to also search for deleted petitions.
  const petition = await ctx.petitions.loadAnyPetitionById(petitionId);
  if (!petition) {
    throw new Error(`Petition not found with id ${petitionId}`);
  }
  return petition;
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
    throw new Error(`User not found with id ${userId}`);
  }
  return user;
}

async function trackPetitionCreatedEvent(event: PetitionCreatedEvent, ctx: WorkerContext) {
  const petition = await loadPetition(event.petition_id, ctx);
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
  const petition = await loadPetition(event.petition_id, ctx);
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
  const petition = await loadPetition(event.petition_id, ctx);
  await ctx.analytics.trackEvent({
    type: "PETITION_SENT",
    user_id: event.data.user_id,
    data: {
      petition_access_id: event.data.petition_access_id,
      user_id: event.data.user_id,
      org_id: petition.org_id,
      petition_id: event.petition_id,
    },
  });
}

async function trackPetitionCompletedEvent(event: PetitionCompletedEvent, ctx: WorkerContext) {
  const [access, contact, petition] = await Promise.all([
    loadPetitionAccess(event.data.petition_access_id, ctx),
    loadContactByAccessId(event.data.petition_access_id, ctx),
    loadPetition(event.petition_id, ctx),
  ]);

  const user = await loadUser(access.granter_id, ctx);
  await ctx.analytics.trackEvent({
    type: "PETITION_COMPLETED",
    user_id: user.id,
    data: {
      petition_access_id: event.data.petition_access_id,
      org_id: user.org_id,
      petition_id: event.petition_id,
      requires_signature: !!petition.signature_config,
      same_domain: user.email.split("@")[1] === contact.email.split("@")[1],
    },
  });
}

async function trackPetitionDeletedEvent(event: PetitionDeletedEvent, ctx: WorkerContext) {
  const petition = await loadPetition(event.petition_id, ctx);
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
  const user = await loadUser(event.data.user_id, ctx);
  await ctx.analytics.identifyUser(user);
  await ctx.analytics.trackEvent({
    type: "USER_LOGGED_IN",
    user_id: event.data.user_id,
    data: {
      user_id: user.id,
      email: user.email,
      org_id: user.org_id,
    },
  });
}

async function trackReminderSentEvent(event: ReminderSentEvent, ctx: WorkerContext) {
  const reminder = await ctx.petitions.loadReminder(event.data.petition_reminder_id);
  if (!reminder) {
    throw new Error(`Reminder not found with id ${event.data.petition_reminder_id}`);
  }

  const [access, petition] = await Promise.all([
    loadPetitionAccess(reminder.petition_access_id, ctx),
    loadPetition(event.petition_id, ctx),
  ]);
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
  const user = await loadUser(event.data.user_id, ctx);
  await ctx.analytics.trackEvent({
    type: "USER_CREATED",
    user_id: event.data.user_id,
    data: {
      user_id: event.data.user_id,
      org_id: user.org_id,
    },
  });
}

async function trackAccessOpenedEvent(event: AccessOpenedEvent, ctx: WorkerContext) {
  const [access, petition] = await Promise.all([
    loadPetitionAccess(event.data.petition_access_id, ctx),
    loadPetition(event.petition_id, ctx),
  ]);

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
    default:
      throw new Error(`Tracking to analytics not implemented for event ${JSON.stringify(event)}`);
      break;
  }
};
