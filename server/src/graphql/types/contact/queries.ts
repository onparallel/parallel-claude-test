import { idArg, queryField } from "@nexus/schema";
import { fromGlobalId, fromGlobalIds } from "../../../util/globalId";
import { authenticate, authorizeAnd } from "../../helpers/authorize";
import { userHasAccessToContact } from "./authorizers";

export const contactQueries = queryField((t) => {
  t.paginationField("contacts", {
    type: "Contact",
    description: "The contacts of the user",
    authorize: authenticate(),
    searchable: true,
    additionalArgs: {
      exclude: idArg({
        list: [true],
        required: false,
      }),
    },
    resolve: async (_, { offset, limit, search, exclude }, ctx) => {
      const { ids: excludeIds } = fromGlobalIds(exclude ?? [], "Contact");
      return await ctx.contacts.loadContactsForUser(ctx.user!.id, {
        search,
        excludeIds,
        offset,
        limit,
      });
    },
  });

  t.field("contact", {
    type: "Contact",
    args: {
      id: idArg({ required: true }),
    },
    authorize: authorizeAnd(authenticate(), userHasAccessToContact("id")),
    nullable: true,
    resolve: async (root, args, ctx) => {
      const { id } = fromGlobalId(args.id, "Contact");
      return await ctx.contacts.loadContact(id);
    },
  });
});
