import {
  core,
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
        return "CommentCreatedNotification";
      case "MESSAGE_EMAIL_BOUNCED":
        return "MessageEmailBouncedNotification";
      case "PETITION_COMPLETED":
        return "PetitionCompletedNotification";
      case "PETITION_SHARED":
        return "PetitionSharedNotification";
      case "SIGNATURE_CANCELLED":
        return "SignatureCancelledNotification";
      case "SIGNATURE_COMPLETED":
        return "SignatureCompletedNotification";
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

export const CommentCreatedNotification = createPetitionUserNotification(
  "CommentCreatedNotification",
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
            `Expected user_id or petition_access_id to be set in PetitionFieldComment:${comment.id}`
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

export const PetitionCompletedNotification = createPetitionUserNotification(
  "PetitionCompletedNotification",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);

export const SignatureCompletedNotification = createPetitionUserNotification(
  "SignatureCompletedNotification",
  (t) => {
    t.field("contact", {
      type: "Contact",
      resolve: async (root, _, ctx) => {
        return (await ctx.contacts.loadContact(root.data.contact_id))!;
      },
    });
  }
);

export const SignatureCancelledNotification = createPetitionUserNotification(
  "SignatureCancelledNotification",
  (t) => {
    t.field("author", {
      type: "UserOrContact",
      resolve: async (root, _, ctx) => {
        if (root.data.user_id) {
          const user = await ctx.users.loadUser(root.data.user_id!);
          return { __type: "User", ...user! };
        } else if (root.data.contact_id) {
          const contact = await ctx.contacts.loadContact(root.data.contact_id!);
          return { __type: "Contact", ...contact! };
        }
        throw new Error(`Both "data.user_id" and "data.contact_id" are null`);
      },
    });
  }
);

export const PetitionSharedNotification = createPetitionUserNotification(
  "PetitionSharedNotification",
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
        const users = await ctx.users.loadUser(root.data.user_ids as number[]);
        const groups = await ctx.userGroups.loadUserGroup(
          root.data.user_group_ids as number[]
        );

        return [
          ...users
            .filter(isDefined)
            .map((u) => ({ __type: "User", ...u } as const)),
          ...groups
            .filter(isDefined)
            .map((c) => ({ __type: "UserGroup", ...c } as const)),
        ];
      },
    });
  }
);

export const MessageEmailBouncedNotification = createPetitionUserNotification(
  "MessageEmailBouncedNotification",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);
