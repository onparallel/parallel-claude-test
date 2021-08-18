import { core, interfaceType, objectType } from "@nexus/schema";
import { isDefined } from "remeda";
import { ApiContext } from "../../../context";
import { PetitionAccess, User } from "../../../db/__types";

async function userOrPetitionAccessResolver(
  root: { data: { user_id?: number; petition_access_id?: number } },
  _: {},
  ctx: ApiContext
): Promise<(User & { __type: "User" }) | (PetitionAccess & { __type: "PetitionAccess" }) | null> {
  if (isDefined(root.data.user_id)) {
    const user = await ctx.users.loadUser(root.data.user_id);
    return user && { __type: "User", ...user };
  } else if (isDefined(root.data.petition_access_id)) {
    const access = await ctx.petitions.loadAccess(root.data.petition_access_id);
    return access && { __type: "PetitionAccess", ...access };
  }
  throw new Error(`Both "user_id" and "petition_access_id" are null`);
}

export const PetitionEvent = interfaceType({
  name: "PetitionEvent",
  definition(t) {
    t.globalId("id");
    t.datetime("createdAt", {
      resolve: (o) => o.created_at,
    });
  },
  resolveType: (p) => {
    switch (p.type) {
      case "PETITION_CREATED":
        return "PetitionCreatedEvent";
      case "PETITION_COMPLETED":
        return "PetitionCompletedEvent";
      case "ACCESS_ACTIVATED":
        return "AccessActivatedEvent";
      case "ACCESS_DEACTIVATED":
        return "AccessDeactivatedEvent";
      case "ACCESS_OPENED":
        return "AccessOpenedEvent";
      case "ACCESS_DELEGATED":
        return "AccessDelegatedEvent";
      case "MESSAGE_SCHEDULED":
        return "MessageScheduledEvent";
      case "MESSAGE_CANCELLED":
        return "MessageCancelledEvent";
      case "MESSAGE_SENT":
        return "MessageSentEvent";
      case "REMINDER_SENT":
        return "ReminderSentEvent";
      case "REPLY_CREATED":
        return "ReplyCreatedEvent";
      case "REPLY_UPDATED":
        return "ReplyUpdatedEvent";
      case "REPLY_DELETED":
        return "ReplyDeletedEvent";
      case "COMMENT_PUBLISHED":
        return "CommentPublishedEvent";
      case "COMMENT_DELETED":
        return "CommentDeletedEvent";
      case "USER_PERMISSION_ADDED":
        return "UserPermissionAddedEvent";
      case "USER_PERMISSION_REMOVED":
        return "UserPermissionRemovedEvent";
      case "USER_PERMISSION_EDITED":
        return "UserPermissionEditedEvent";
      case "GROUP_PERMISSION_ADDED":
        return "GroupPermissionAddedEvent";
      case "GROUP_PERMISSION_EDITED":
        return "GroupPermissionEditedEvent";
      case "GROUP_PERMISSION_REMOVED":
        return "GroupPermissionRemovedEvent";
      case "OWNERSHIP_TRANSFERRED":
        return "OwnershipTransferredEvent";
      case "PETITION_CLOSED":
        return "PetitionClosedEvent";
      case "PETITION_CLOSED_NOTIFIED":
        return "PetitionClosedNotifiedEvent";
      case "PETITION_REOPENED":
        return "PetitionReopenedEvent";
      case "SIGNATURE_STARTED":
        return "SignatureStartedEvent";
      case "SIGNATURE_COMPLETED":
        return "SignatureCompletedEvent";
      case "SIGNATURE_CANCELLED":
        return "SignatureCancelledEvent";
      case "PETITION_CLONED":
        return "PetitionClonedEvent";
      case "PETITION_DELETED":
        return "PetitionDeletedEvent";
      case "TEMPLATE_USED":
        return "TemplateUsedEvent";
      case "REMINDERS_OPT_OUT":
        return "RemindersOptOutEvent";
    }
  },
  rootTyping: "events.PetitionEvent",
});

function createPetitionEvent<TypeName extends string>(
  name: TypeName,
  definition: (t: core.ObjectDefinitionBlock<TypeName>) => void
) {
  return objectType({
    name,
    definition(t) {
      t.implements("PetitionEvent");
      definition(t);
    },
    rootTyping: `events.${name}`,
  });
}

export const PetitionCreatedEvent = createPetitionEvent("PetitionCreatedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});

export const PetitionCompletedEvent = createPetitionEvent("PetitionCompletedEvent", (t) => {
  t.field("access", {
    type: "PetitionAccess",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
    },
  });
});

export const AccessActivatedEvent = createPetitionEvent("AccessActivatedEvent", (t) => {
  t.field("access", {
    type: "PetitionAccess",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
    },
  });
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});

export const AccessDeactivatedEvent = createPetitionEvent("AccessDeactivatedEvent", (t) => {
  t.field("access", {
    type: "PetitionAccess",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
    },
  });
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});

export const AccessOpenedEvent = createPetitionEvent("AccessOpenedEvent", (t) => {
  t.field("access", {
    type: "PetitionAccess",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
    },
  });
});

export const AccessDelegatedEvent = createPetitionEvent("AccessDelegatedEvent", (t) => {
  t.field("newAccess", {
    type: "PetitionAccess",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadAccess(root.data.new_petition_access_id))!;
    },
  });
  t.field("originalAccess", {
    type: "PetitionAccess",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
    },
  });
});

export const MessageScheduledEvent = createPetitionEvent("MessageScheduledEvent", (t) => {
  t.field("message", {
    type: "PetitionMessage",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadMessage(root.data.petition_message_id))!;
    },
  });
});

export const MessagesCancelledEvent = createPetitionEvent("MessageCancelledEvent", (t) => {
  t.field("message", {
    type: "PetitionMessage",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadMessage(root.data.petition_message_id))!;
    },
  });
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});

export const MessageSentEvent = createPetitionEvent("MessageSentEvent", (t) => {
  t.field("message", {
    type: "PetitionMessage",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadMessage(root.data.petition_message_id))!;
    },
  });
});

export const ReminderSentEvent = createPetitionEvent("ReminderSentEvent", (t) => {
  t.field("reminder", {
    type: "PetitionReminder",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadReminder(root.data.petition_reminder_id))!;
    },
  });
});

export const ReplyCreatedEvent = createPetitionEvent("ReplyCreatedEvent", (t) => {
  t.nullable.field("createdBy", {
    type: "UserOrPetitionAccess",
    resolve: userOrPetitionAccessResolver,
  });
  t.nullable.field("field", {
    type: "PetitionField",
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.loadField(root.data.petition_field_id);
    },
  });
  t.nullable.field("reply", {
    type: "PetitionFieldReply",
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.loadFieldReply(root.data.petition_field_reply_id);
    },
  });
});

export const ReplyUpdatedEvent = createPetitionEvent("ReplyUpdatedEvent", (t) => {
  t.nullable.field("updatedBy", {
    type: "UserOrPetitionAccess",
    resolve: userOrPetitionAccessResolver,
  });
  t.nullable.field("field", {
    type: "PetitionField",
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.loadField(root.data.petition_field_id);
    },
  });
  t.nullable.field("reply", {
    type: "PetitionFieldReply",
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.loadFieldReply(root.data.petition_field_reply_id);
    },
  });
});

export const ReplyDeletedEvent = createPetitionEvent("ReplyDeletedEvent", (t) => {
  t.nullable.field("deletedBy", {
    type: "UserOrPetitionAccess",
    resolve: userOrPetitionAccessResolver,
  });
  t.nullable.field("field", {
    type: "PetitionField",
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.loadField(root.data.petition_field_id);
    },
  });
});

export const CommentPublishedEvent = createPetitionEvent("CommentPublishedEvent", (t) => {
  t.nullable.field("field", {
    type: "PetitionField",
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.loadField(root.data.petition_field_id);
    },
  });
  t.nullable.field("comment", {
    type: "PetitionFieldComment",
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.loadPetitionFieldComment(root.data.petition_field_comment_id);
    },
  });
});

export const CommentDeletedEvent = createPetitionEvent("CommentDeletedEvent", (t) => {
  t.nullable.field("field", {
    type: "PetitionField",
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.loadField(root.data.petition_field_id);
    },
  });
  t.nullable.field("deletedBy", {
    type: "UserOrPetitionAccess",
    resolve: userOrPetitionAccessResolver,
  });
});

export const UserPermissionAddedEvent = createPetitionEvent("UserPermissionAddedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
  t.field("permissionType", {
    type: "PetitionPermissionType",
    resolve: (root) => root.data.permission_type,
  });
  t.nullable.field("permissionUser", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.permission_user_id);
    },
  });
});

export const UserPermissionRemovedEvent = createPetitionEvent("UserPermissionRemovedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
  t.nullable.field("permissionUser", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.permission_user_id);
    },
  });
});

export const UserPermissionEditedEvent = createPetitionEvent("UserPermissionEditedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
  t.field("permissionType", {
    type: "PetitionPermissionType",
    resolve: (root) => root.data.permission_type,
  });
  t.nullable.field("permissionUser", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.permission_user_id);
    },
  });
});

export const GroupPermissionAddedEvent = createPetitionEvent("GroupPermissionAddedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
  t.field("permissionType", {
    type: "PetitionPermissionType",
    resolve: (root) => root.data.permission_type,
  });
  t.field("permissionGroup", {
    type: "UserGroup",
    resolve: async (root, _, ctx) => {
      return (await ctx.userGroups.loadUserGroup(root.data.user_group_id))!;
    },
  });
});

export const GroupPermissionRemovedEvent = createPetitionEvent(
  "GroupPermissionRemovedEvent",
  (t) => {
    t.nullable.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
    t.field("permissionGroup", {
      type: "UserGroup",
      resolve: async (root, _, ctx) => {
        return (await ctx.userGroups.loadUserGroup(root.data.user_group_id))!;
      },
    });
  }
);

export const GroupPermissionEditedEvent = createPetitionEvent("GroupPermissionEditedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
  t.field("permissionType", {
    type: "PetitionPermissionType",
    resolve: (root) => root.data.permission_type,
  });
  t.field("permissionGroup", {
    type: "UserGroup",
    resolve: async (root, _, ctx) => {
      return (await ctx.userGroups.loadUserGroup(root.data.user_group_id))!;
    },
  });
});

export const OwnershipTransferredEvent = createPetitionEvent("OwnershipTransferredEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
  t.nullable.field("owner", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.owner_id);
    },
  });
  t.nullable.field("previousOwner", {
    type: "User",
    resolve: async ({ data }, _, ctx) => {
      return data.previous_owner_id ? await ctx.users.loadUser(data.previous_owner_id) : null;
    },
  });
});

/**
 * Triggered when the user marks the petition as closed.
 */
export const PetitionClosedEvent = createPetitionEvent("PetitionClosedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async ({ data }, _, ctx) => {
      return await ctx.users.loadUser(data.user_id);
    },
  });
});

/**
 * Triggered when the user notifies the petition contacts that the petition is closed.
 */
export const PetitionClosedNotifiedEvent = createPetitionEvent(
  "PetitionClosedNotifiedEvent",
  (t) => {
    t.nullable.field("user", {
      type: "User",
      resolve: async ({ data }, _, ctx) => {
        return await ctx.users.loadUser(data.user_id);
      },
    });
    t.field("access", {
      type: "PetitionAccess",
      resolve: async ({ data }, _, ctx) => {
        return (await ctx.petitions.loadAccess(data.petition_access_id))!;
      },
    });
  }
);

/**
 * Triggered when the user reopens a petition.
 */
export const PetitionReopenedEvent = createPetitionEvent("PetitionReopenedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async ({ data }, _, ctx) => {
      return await ctx.users.loadUser(data.user_id);
    },
  });
});

/**
 * Triggered when a signature request on the petition is started.
 */
export const SignatureStartedEvent = createPetitionEvent("SignatureStartedEvent", (t) => {});

/**
 * Triggered when a signature request on the petition is completed.
 */
export const SignatureCompletedEvent = createPetitionEvent("SignatureCompletedEvent", (t) => {});

/**
 * Triggered when a signature request on the petition is cancelled.
 */
export const SignatureCancelledEvent = createPetitionEvent("SignatureCancelledEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async ({ data }, _, ctx) => {
      const cancellerId = data.cancel_data?.canceller_id;
      if (data.cancel_reason === "CANCELLED_BY_USER" && cancellerId) {
        return await ctx.users.loadUser(cancellerId);
      }
      return null;
    },
  });
  t.nullable.field("contact", {
    type: "Contact",
    resolve: async ({ data }, _, ctx) => {
      const cancellerId = data.cancel_data?.canceller_id;
      if (data.cancel_reason === "DECLINED_BY_SIGNER" && cancellerId) {
        return await ctx.contacts.loadContact(cancellerId);
      }
      return null;
    },
  });
  t.nullable.field("cancellerReason", {
    type: "String",
    resolve: ({ data }) => {
      return data.cancel_data?.canceller_reason ?? null;
    },
  });
  t.field("cancelType", {
    type: "PetitionSignatureCancelReason",
    resolve: ({ data }) => {
      return data.cancel_reason;
    },
  });
});

export const PetitionClonedEvent = createPetitionEvent("PetitionClonedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async ({ data }, _, ctx) => {
      return await ctx.users.loadUser(data.user_id);
    },
  });
});
export const PetitionDeletedEvent = createPetitionEvent("PetitionDeletedEvent", (t) => {});
export const TemplateUsedEvent = createPetitionEvent("TemplateUsedEvent", (t) => {});

export const RemindersOptOutEvent = createPetitionEvent("RemindersOptOutEvent", (t) => {
  t.field("access", {
    type: "PetitionAccess",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
    },
  });
  t.field("reason", {
    type: "String",
    resolve: async (root, _, ctx) => {
      return root.data.reason;
    },
  });
  t.field("other", {
    type: "String",
    resolve: async (root, _, ctx) => {
      return root.data.other;
    },
  });
});
