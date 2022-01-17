import { objectType, unionType } from "nexus";

export const UserOrPetitionAccess = unionType({
  name: "UserOrPetitionAccess",
  definition(t) {
    t.members("User", "PetitionAccess");
  },
  resolveType: (o) => {
    if (["User", "PetitionAccess"].includes(o.__type)) {
      return o.__type;
    }
    throw new Error("Missing __type on UserOrPetitionAccess");
  },
  sourceType: /* ts */ `
    | ({__type: "User"} & NexusGenRootTypes["User"])
    | ({__type: "PetitionAccess"} & NexusGenRootTypes["PetitionAccess"])
  `,
});

export const PetitionFieldComment = objectType({
  name: "PetitionFieldComment",
  description: "A comment on a petition field",
  definition(t) {
    t.globalId("id", {
      description: "The ID of the petition field comment.",
    });
    t.nullable.field("author", {
      type: "UserOrPetitionAccess",
      description: "The author of the comment.",
      resolve: async (root, _, ctx) => {
        if (root.user_id !== null) {
          const user = await ctx.users.loadUser(root.user_id);
          return user && { __type: "User", ...user };
        } else if (root.petition_access_id !== null) {
          const access = await ctx.petitions.loadAccess(root.petition_access_id);
          return access && { __type: "PetitionAccess", ...access };
        }
        throw new Error(`Both "user_id" and "petition_access_id" are null`);
      },
    });
    t.string("content", {
      description: "The content of the comment.",
    });
    t.datetime("createdAt", {
      description: "Time when the comment was created.",
      resolve: (o) => o.created_at,
    });
    t.boolean("isUnread", {
      description: "Whether the comment has been read or not.",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.loadPetitionFieldCommentIsUnreadForUser({
          userId: ctx.user!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.petition_field_id,
          petitionFieldCommentId: root.id,
        });
      },
    });
    t.boolean("isEdited", {
      description: "Whether the comment has been edited after being published.",
      resolve: async (root) => {
        return root.updated_at > root.created_at;
      },
    });
    t.boolean("isInternal", {
      description:
        "Whether the comment is internal (only visible to org users) or public (visible for users and accesses)",
      resolve: (root) => root.is_internal,
    });
    t.field("field", {
      type: "PetitionField",
      resolve: async (o, _, ctx) => (await ctx.petitions.loadField(o.petition_field_id))!,
    });
  },
});
