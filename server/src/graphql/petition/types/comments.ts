import { objectType, unionType } from "@nexus/schema";
import { toGlobalId } from "../../../util/globalId";

export const ContactOrUser = unionType({
  name: "ContactOrUser",
  definition(t) {
    t.members("Contact", "User");
    t.resolveType((o) => {
      if (o.__type === "Contact" || o.__type === "User") {
        return o.__type;
      }
      throw new Error("Missing __type on ContactOrUser");
    });
  },
  rootTyping: /* ts */ `
    | ({__type: "Contact"} & NexusGenRootTypes["Contact"])
    | ({__type: "User"} & NexusGenRootTypes["User"])
  `,
});

export const PetitionFieldComment = objectType({
  name: "PetitionFieldComment",
  description: "A comment on a petition field",
  definition(t) {
    t.id("id", {
      description: "The ID of the petition field comment.",
      resolve: (o) => toGlobalId("PetitionFieldComment", o.id),
    });
    t.field("author", {
      type: "ContactOrUser",
      description: "The author of the comment.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (root.contact_id !== null) {
          const contact = await ctx.contacts.loadContact(root.contact_id);
          return contact && { __type: "Contact", ...contact };
        } else if (root.user_id !== null) {
          const user = await ctx.users.loadUser(root.user_id);
          return user && { __type: "User", ...user };
        }
        throw new Error(`Both "contact_id" and "user_id" are null`);
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
  },
});
