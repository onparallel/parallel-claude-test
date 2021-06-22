import {
  core,
  enumType,
  interfaceType,
  list,
  nonNull,
  objectType,
  unionType,
} from "@nexus/schema";
import { isDefined } from "../../util/remedaExtensions";

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
  members: ["UNREAD", "COMMENTS", "COMPLETED", "SHARED", "OTHER"],
});

export const PetitionUserNotification = interfaceType({
  name: "PetitionUserNotification",
  rootTyping: "db.PetitionUserNotification",
  definition(t) {
    t.globalId("id");
    t.field("petition", {
      type: "Petition",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetition(root.petition_id))!;
      },
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
    t.field("author", {
      type: "UserOrPetitionAccess",
      resolve: async (root, _, ctx) => {
        const comment = (await ctx.petitions.loadPetitionFieldComment(
          root.data.petition_field_comment_id
        ))!;
        if (comment.user_id) {
          return {
            __type: "User",
            ...(await ctx.users.loadUser(comment.user_id))!,
          };
        } else if (comment.petition_access_id) {
          return {
            __type: "PetitionAccess",
            ...(await ctx.petitions.loadAccess(comment.petition_access_id))!,
          };
        } else {
          throw new Error(
            `Expected user_id or petition_access_id to be set in PetitionFieldComment:${root.data.petition_field_comment_id}`
          );
        }
      },
    });
    t.boolean("isInternal", {
      resolve: async (root, _, ctx) => {
        const comment = (await ctx.petitions.loadPetitionFieldComment(
          root.data.petition_field_comment_id
        ))!;
        return comment.is_internal;
      },
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
      type: nonNull(list("UserOrUserGroup")),
      resolve: async (root, _, ctx) => {
        const user = root.data.user_id
          ? await ctx.users.loadUser(root.data.user_id)
          : null;
        const group = root.data.user_group_id
          ? await ctx.userGroups.loadUserGroup(root.data.user_group_id)
          : null;

        return [
          user ? ({ __type: "User", ...user } as const) : null,
          group ? ({ __type: "UserGroup", ...group } as const) : null,
        ].filter(isDefined);
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
