import { core, interfaceType, objectType } from "@nexus/schema";

export const PetitionEvent = interfaceType({
  name: "PetitionEvent",
  definition(t) {
    t.globalId("id");
    t.datetime("createdAt", {
      resolve: (o) => o.created_at,
    });
    t.resolveType((p) => {
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
      }
    });
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

export const PetitionCreatedEvent = createPetitionEvent(
  "PetitionCreatedEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  }
);

export const PetitionCompletedEvent = createPetitionEvent(
  "PetitionCompletedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);

export const AccessActivatedEvent = createPetitionEvent(
  "AccessActivatedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  }
);

export const AccessDeactivatedEvent = createPetitionEvent(
  "AccessDeactivatedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  }
);

export const AccessOpenedEvent = createPetitionEvent(
  "AccessOpenedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);

export const MessageScheduledEvent = createPetitionEvent(
  "MessageScheduledEvent",
  (t) => {
    t.field("message", {
      type: "PetitionMessage",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadMessage(
          root.data.petition_message_id
        ))!;
      },
    });
  }
);

export const MessagesCancelledEvent = createPetitionEvent(
  "MessageCancelledEvent",
  (t) => {
    t.field("message", {
      type: "PetitionMessage",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadMessage(
          root.data.petition_message_id
        ))!;
      },
    });
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  }
);

export const MessageSentEvent = createPetitionEvent("MessageSentEvent", (t) => {
  t.field("message", {
    type: "PetitionMessage",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadMessage(root.data.petition_message_id))!;
    },
  });
});

export const ReminderSentEvent = createPetitionEvent(
  "ReminderSentEvent",
  (t) => {
    t.field("reminder", {
      type: "PetitionReminder",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadReminder(
          root.data.petition_reminder_id
        ))!;
      },
    });
  }
);

export const ReplyCreatedEvent = createPetitionEvent(
  "ReplyCreatedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.field("field", {
      type: "PetitionField",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadField(root.data.petition_field_id);
      },
    });
    t.field("reply", {
      type: "PetitionFieldReply",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldReply(
          root.data.petition_field_reply_id
        );
      },
    });
  }
);

export const ReplyDeletedEvent = createPetitionEvent(
  "ReplyDeletedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.field("field", {
      type: "PetitionField",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadField(root.data.petition_field_id);
      },
    });
  }
);

export const CommentPublishedEvent = createPetitionEvent(
  "CommentPublishedEvent",
  (t) => {
    t.field("field", {
      type: "PetitionField",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadField(root.data.petition_field_id);
      },
    });
    t.field("comment", {
      type: "PetitionFieldComment",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldComment(
          root.data.petition_field_comment_id
        );
      },
    });
  }
);

export const CommentDeletedEvent = createPetitionEvent(
  "CommentDeletedEvent",
  (t) => {
    t.field("field", {
      type: "PetitionField",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadField(root.data.petition_field_id);
      },
    });
    t.field("deletedBy", {
      type: "UserOrPetitionAccess",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (root.data.user_id !== undefined) {
          const user = await ctx.users.loadUser(root.data.user_id);
          return user && { __type: "User", ...user };
        } else if (root.data.petition_access_id !== undefined) {
          const access = await ctx.petitions.loadAccess(
            root.data.petition_access_id
          );
          return access && { __type: "PetitionAccess", ...access };
        }
        throw new Error(`Both "user_id" and "petition_access_id" are null`);
      },
    });
  }
);

export const UserPermissionAddedEvent = createPetitionEvent(
  "UserPermissionAddedEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
    t.field("permissionType", {
      type: "PetitionUserPermissionType",
      resolve: async (root, _, ctx) => {
        return root.data.permission_type;
      },
    });
    t.field("permissionUser", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.permission_user_id);
      },
    });
  }
);

export const UserPermissionRemovedEvent = createPetitionEvent(
  "UserPermissionRemovedEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
    t.field("permissionUser", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.permission_user_id);
      },
    });
  }
);

export const UserPermissionEditedEvent = createPetitionEvent(
  "UserPermissionEditedEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
    t.field("permissionType", {
      type: "PetitionUserPermissionType",
      resolve: async (root, _, ctx) => {
        return root.data.permission_type;
      },
    });
    t.field("permissionUser", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.permission_user_id);
      },
    });
  }
);

export const OwnershipTransferredEvent = createPetitionEvent(
  "OwnershipTransferredEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
    t.field("owner", {
      type: "User",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.owner_id);
      },
    });
  }
);

/**
 * Triggered when the user marks the petition as closed.
 */
export const PetitionClosedEvent = createPetitionEvent(
  "PetitionClosedEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async ({ data }, _, ctx) => {
        return await ctx.users.loadUser(data.user_id);
      },
    });
  }
);

/**
 * Triggered when the user notifies the petition contacts that the petition is closed.
 */
export const PetitionClosedNotifiedEvent = createPetitionEvent(
  "PetitionClosedNotifiedEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
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
export const PetitionReopenedEvent = createPetitionEvent(
  "PetitionReopenedEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async ({ data }, _, ctx) => {
        return await ctx.users.loadUser(data.user_id);
      },
    });
  }
);

/**
 * Triggered when a signature request on the petition is started.
 */
export const SignatureStartedEvent = createPetitionEvent(
  "SignatureStartedEvent",
  (t) => {}
);

/**
 * Triggered when a signature request on the petition is completed.
 */
export const SignatureCompletedEvent = createPetitionEvent(
  "SignatureCompletedEvent",
  (t) => {
    t.jsonObject("file", {
      resolve: async ({ data }, _, ctx) => {
        return await ctx.files.loadFileUpload(data.file_upload_id);
      },
    });
  }
);

/**
 * Triggered when a signature request on the petition is cancelled.
 */
export const SignatureCancelledEvent = createPetitionEvent(
  "SignatureCancelledEvent",
  (t) => {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async ({ data }, _, ctx) => {
        const cancellerId = data.cancel_data?.canceller_id;
        if (data.cancel_reason === "CANCELLED_BY_USER" && cancellerId) {
          return await ctx.users.loadUser(cancellerId);
        }
        return null;
      },
    });
    t.field("contact", {
      type: "Contact",
      nullable: true,
      resolve: async ({ data }, _, ctx) => {
        const cancellerId = data.cancel_data?.canceller_id;
        if (data.cancel_reason === "DECLINED_BY_SIGNER" && cancellerId) {
          return await ctx.contacts.loadContact(cancellerId);
        }
        return null;
      },
    });
    t.field("cancellerReason", {
      type: "String",
      nullable: true,
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
  }
);
