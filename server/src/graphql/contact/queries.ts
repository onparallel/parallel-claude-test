import { queryField } from "@nexus/schema";
import { authenticate, chain } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToContacts } from "./authorizers";

export const contactQueries = queryField((t) => {
  t.paginationField("contacts", {
    type: "Contact",
    description: "The contacts of the user",
    authorize: authenticate(),
    searchable: true,
    additionalArgs: {
      exclude: globalIdArg("Contact", {
        list: [true],
        required: false,
      }),
    },
    sortableBy: ["firstName", "lastName", "fullName", "email", "createdAt"],
    resolve: async (_, { offset, limit, search, sortBy, exclude }, ctx) => {
      return await ctx.contacts.loadContactsForUser(ctx.user!, {
        search,
        excludeIds: exclude,
        offset,
        limit,
        sortBy: (sortBy || ["firstName_ASC"]).flatMap((value): any => {
          const [field, _order] = value.split("_");
          const order = _order.toLowerCase() as "asc" | "desc";
          switch (field) {
            case "firstName":
            case "fullName":
              return [
                { column: "first_name", order },
                { column: "last_name", order },
              ];
            case "lastName":
              return [
                { column: "last_name", order },
                { column: "first_name", order },
              ];
            case "email":
              return [{ column: "email", order }];
            case "createdAt":
              return [{ column: "created_at", order }];
            default:
              throw new Error(
                `Unhandled sorting field ${field} for Query.contacts`
              );
          }
        }),
      });
    },
  });

  t.field("contact", {
    type: "Contact",
    args: {
      id: globalIdArg({ required: true }),
    },
    authorize: chain(authenticate(), userHasAccessToContacts("id")),
    nullable: true,
    resolve: async (root, args, ctx) => {
      return await ctx.contacts.loadContact(args.id);
    },
  });
});
