import { objectType } from "@nexus/schema";
import { fullName } from "../../util/fullName";

export const Contact = objectType({
  name: "Contact",
  description: "A contact in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.globalId("id", {
      description: "The ID of the contact.",
    });
    t.string("email", {
      description: "The email of the contact.",
    });
    t.nullable.string("firstName", {
      description: "The first name of the contact.",
      resolve: (o) => o.first_name,
    });
    t.nullable.string("lastName", {
      description: "The last name of the contact.",
      resolve: (o) => o.last_name,
    });
    t.nullable.string("fullName", {
      description: "The full name of the contact.",
      resolve: (o) => fullName(o.first_name, o.last_name),
    });
    t.paginationField("accesses", {
      type: "PetitionAccess",
      description: "The petition accesses for this contact",
      resolve: async (root, { offset, limit }, ctx) => {
        return ctx.contacts.loadAccessesForContact(root.id, ctx.user!.id, {
          offset,
          limit,
        });
      },
    });
  },
});
