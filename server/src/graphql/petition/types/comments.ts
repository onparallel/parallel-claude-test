import { objectType, unionType } from "@nexus/schema";

export const UserOrPetitionAccess = unionType({
  name: "UserOrPetitionAccess",
  definition(t) {
    t.members("User", "PetitionAccess");
    t.resolveType((o) => {
      if (["User", "PetitionAccess"].includes(o.__type)) {
        return o.__type;
      }
      throw new Error("Missing __type on UserOrPetitionAccess");
    });
  },
  rootTyping: /* ts */ `
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
    t.field("author", {
      type: "UserOrPetitionAccess",
      description: "The author of the comment.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (root.user_id !== null) {
          const user = await ctx.users.loadUser(root.user_id);
          return user && { __type: "User", ...user };
        } else if (root.petition_access_id !== null) {
          const access = await ctx.petitions.loadAccess(
            root.petition_access_id
          );
          return access && { __type: "PetitionAccess", ...access };
        }
        throw new Error(`Both "user_id" and "petition_access_id" are null`);
      },
    });
    t.string("content", {
      description: "The content of the comment.",
    });
    t.field("reply", {
      description: "The reply the comment is refering to.",
      type: "PetitionFieldReply",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return root.petition_field_reply_id !== null
          ? await ctx.petitions.loadFieldReply(root.petition_field_reply_id)
          : null;
      },
    });
    t.datetime("publishedAt", {
      description: "Time when the comment was published.",
      nullable: true,
      resolve: (o) => o.published_at,
    });
    t.boolean("isUnread", {
      description: "Whether the comment has been read or not.",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.getPetitionFieldCommentIsUnreadForUser({
          userId: ctx.user!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.petition_field_id,
          petitionFieldCommentId: root.id,
        });
      },
    });
    t.boolean("isEdited", {
      description: "Whether the comment has been edited after being published.",
      resolve: async (root, _, ctx) => {
        return root.published_at ? root.updated_at > root.published_at : false;
      },
    });
  },
});
