import { core, enumType, interfaceType, nonNull, objectType } from "nexus";
import { userOrPetitionAccessResolver } from "../helpers/userOrPetitionAccessResolver";

export const PetitionUserNotificationFilter = enumType({
  name: "PetitionUserNotificationFilter",
  description: "The types of notifications available for filtering",
  members: ["ALL", "UNREAD", "COMMENTS", "COMPLETED", "SHARED", "OTHER"],
});

export const PetitionUserNotification = interfaceType({
  name: "PetitionUserNotification",
  sourceType: "db.PetitionUserNotification",
  definition(t) {
    t.globalId("id");
    t.field("petition", {
      type: "PetitionBase",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetition(root.petition_id))!;
      },
    });
    t.boolean("isRead", {
      resolve: (o) => o.is_read,
    });
    t.datetime("createdAt", {
      resolve: (o) => o.created_at,
    });
  },
  resolveType: (o) => {
    switch (o.type) {
      case "COMMENT_CREATED":
        return "CommentCreatedUserNotification";
      case "MESSAGE_EMAIL_BOUNCED":
        return "MessageEmailBouncedUserNotification";
      case "REMINDER_EMAIL_BOUNCED":
        return "ReminderEmailBouncedUserNotification";
      case "PETITION_COMPLETED":
        return "PetitionCompletedUserNotification";
      case "PETITION_SHARED":
        return "PetitionSharedUserNotification";
      case "SIGNATURE_CANCELLED":
        return "SignatureCancelledUserNotification";
      case "SIGNATURE_COMPLETED":
        return "SignatureCompletedUserNotification";
      case "REMINDERS_OPT_OUT":
        return "RemindersOptOutNotification";
      case "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK":
        return "AccessActivatedFromPublicPetitionLinkUserNotification";
    }
  },
});

function createPetitionUserNotification<TypeName extends string>(
  name: TypeName,
  definition: (t: core.ObjectDefinitionBlock<TypeName>) => void
) {
  return objectType({
    name,
    definition(t) {
      t.implements("PetitionUserNotification");
      definition(t);
    },
    sourceType: `notifications.${name}`,
  });
}

export const CommentCreatedUserNotification = createPetitionUserNotification(
  "CommentCreatedUserNotification",
  (t) => {
    t.field("comment", {
      type: "PetitionFieldComment",
      resolve: async (o, _, ctx) =>
        (await ctx.petitions.loadPetitionFieldComment(o.data.petition_field_comment_id))!,
    });
    t.field("field", {
      type: "PetitionField",
      resolve: async (o, _, ctx) => (await ctx.petitions.loadField(o.data.petition_field_id))!,
    });
  }
);

export const PetitionCompletedUserNotification = createPetitionUserNotification(
  "PetitionCompletedUserNotification",
  (t) => {
    t.nullable.field("completedBy", {
      type: "UserOrPetitionAccess",
      resolve: userOrPetitionAccessResolver,
    });
  }
);

export const SignatureCompletedUserNotification = createPetitionUserNotification(
  "SignatureCompletedUserNotification",
  () => {}
);

export const SignatureCancelledUserNotification = createPetitionUserNotification(
  "SignatureCancelledUserNotification",
  (t) => {
    t.nullable.field("errorCode", {
      type: "String",
      resolve: ({ data }) => {
        return data.cancel_reason === "REQUEST_ERROR" ? data.cancel_data?.error_code ?? null : null;
      },
    });
    t.nullable.json("extraErrorData", {
      resolve: ({ data }) => {
        return data.cancel_reason === "REQUEST_ERROR" ? data.cancel_data?.extra ?? null : null;
      },
    });
  }
);

export const PetitionSharedUserNotification = createPetitionUserNotification(
  "PetitionSharedUserNotification",
  (t) => {
    t.field("owner", {
      type: "User",
      resolve: async (root, _, ctx) => (await ctx.users.loadUser(root.data.owner_id))!,
    });
    t.field("permissionType", {
      type: "PetitionPermissionTypeRW",
      resolve: (root) => root.data.permission_type,
    });
    t.field("sharedWith", {
      type: nonNull("UserOrUserGroup"),
      resolve: async (root, _, ctx) => {
        return root.data.user_id
          ? {
              __type: "User",
              ...(await ctx.users.loadUser(root.data.user_id))!,
            }
          : {
              __type: "UserGroup",
              ...(await ctx.userGroups.loadUserGroup(root.data.user_group_id!))!,
            };
      },
    });
  }
);

export const MessageEmailBouncedUserNotification = createPetitionUserNotification(
  "MessageEmailBouncedUserNotification",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);

export const ReminderEmailBouncedUserNotification = createPetitionUserNotification(
  "ReminderEmailBouncedUserNotification",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);

export const RemindersOptOutNotification = createPetitionUserNotification(
  "RemindersOptOutNotification",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.string("reason", {
      resolve: (o) => o.data.reason,
    });
    t.nullable.string("other", {
      resolve: (o) => o.data.other ?? null,
    });
  }
);

export const AccessActivatedFromPublicPetitionLinkUserNotification = createPetitionUserNotification(
  "AccessActivatedFromPublicPetitionLinkUserNotification",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);
