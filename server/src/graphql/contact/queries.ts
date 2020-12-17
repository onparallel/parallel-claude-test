import { list, nonNull, queryField } from "@nexus/schema";
import { SortBy } from "../../db/helpers/utils";
import { Contact } from "../../db/__types";
import { authenticate, chain } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { userHasAccessToContacts } from "./authorizers";

export const contactQueries = queryField((t) => {
  t.paginationField("contacts", {
    type: "Contact",
    description: "The contacts of the user",
    authorize: authenticate(),
    searchable: true,
    additionalArgs: {
      exclude: list(nonNull(globalIdArg("Contact"))),
    },
    sortableBy: ["firstName", "lastName", "fullName", "email", "createdAt"],
    resolve: async (_, { offset, limit, search, sortBy, exclude }, ctx) => {
      return await ctx.contacts.loadContactsForUser(ctx.user!, {
        search,
        excludeIds: exclude,
        offset,
        limit,
        sortBy: (sortBy || ["firstName_ASC"]).flatMap<SortBy<keyof Contact>>(
          (value) => {
            const [field, order] = parseSortBy(value);
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
          }
        ),
      });
    },
  });

  t.nullable.field("contact", {
    type: "Contact",
    args: {
      id: nonNull(globalIdArg()),
    },
    authorize: chain(authenticate(), userHasAccessToContacts("id")),
    resolve: async (root, args, ctx) => {
      return await ctx.contacts.loadContact(args.id);
    },
  });
});
