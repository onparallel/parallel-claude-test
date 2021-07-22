import {
  core,
  enumType,
  interfaceType,
  nonNull,
  objectType,
  unionType,
} from "@nexus/schema";

export const UserOrContact = unionType({
  name: "UserOrContact",
  definition(t) {
    t.members("User", "Contact");
  },
  resolveType: (o) => {
    if (["User", "Contact"].includes(o.__type)) {
      return o.__type;
    }
    throw new Error("Missing __type on UserOrContact");
  },
  rootTyping: /* ts */ `
    | ({__type: "User"} & NexusGenRootTypes["User"])
    | ({__type: "Contact"} & NexusGenRootTypes["Contact"])
  `,
});

export const PetitionUserNotificationFilter = enumType({
  name: "PetitionUserNotificationFilter",
  description: "The types of notifications available for filtering",
  members: ["ALL", "UNREAD", "COMMENTS", "COMPLETED", "SHARED", "OTHER"],
});

export const PetitionUserNotification = interfaceType({
  name: "PetitionUserNotification",
  rootTyping: "db.PetitionUserNotification",
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
      case "PETITION_COMPLETED":
        return "PetitionCompletedUserNotification";
      case "PETITION_SHARED":
        return "PetitionSharedUserNotification";
      case "SIGNATURE_CANCELLED":
        return "SignatureCancelledUserNotification";
      case "SIGNATURE_COMPLETED":
        return "SignatureCompletedUserNotification";
      case "CONTACT_UNSUBSCRIBE":
        return "ContactUnsubscribeNotification";
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
    rootTyping: `notifications.${name}`,
  });
}

export const CommentCreatedUserNotification = createPetitionUserNotification(
  "CommentCreatedUserNotification",
  (t) => {
    t.field("comment", {
      type: "PetitionFieldComment",
      resolve: async (o, _, ctx) =>
        (await ctx.petitions.loadPetitionFieldComment(
          o.data.petition_field_comment_id
        ))!,
    });
    t.field("field", {
      type: "PetitionField",
      resolve: async (o, _, ctx) =>
        (await ctx.petitions.loadField(o.data.petition_field_id))!,
    });
  }
);

export const PetitionCompletedUserNotification = createPetitionUserNotification(
  "PetitionCompletedUserNotification",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);

export const SignatureCompletedUserNotification =
  createPetitionUserNotification(
    "SignatureCompletedUserNotification",
    () => {}
  );

export const SignatureCancelledUserNotification =
  createPetitionUserNotification(
    "SignatureCancelledUserNotification",
    () => {}
  );

export const PetitionSharedUserNotification = createPetitionUserNotification(
  "PetitionSharedUserNotification",
  (t) => {
    t.field("owner", {
      type: "User",
      resolve: async (root, _, ctx) =>
        (await ctx.users.loadUser(root.data.owner_id))!,
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
              ...(await ctx.userGroups.loadUserGroup(
                root.data.user_group_id!
              ))!,
            };
      },
    });
  }
);

export const MessageEmailBouncedUserNotification =
  createPetitionUserNotification("MessageEmailBouncedUserNotification", (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  });

export const ContactUnsubscribeNotification = createPetitionUserNotification(
  "ContactUnsubscribeNotification",
  (t) => {
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
    t.field("otherReason", {
      type: "String",
      resolve: async (root, _, ctx) => {
        return root.data.otherReason;
      },
    });
  }
);
