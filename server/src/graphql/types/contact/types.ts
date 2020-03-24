import { objectType } from "nexus";
import { toGlobalId } from "../../../util/globalId";

export const Contact = objectType({
  name: "Contact",
  description: "A contact in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the contact.",
      resolve: (o) => toGlobalId("Contact", o.id),
    });
    t.string("email", {
      description: "The email of the contact.",
    });
    t.string("firstName", {
      description: "The first name of the contact.",
      nullable: true,
      resolve: (o) => o.first_name,
    });
    t.string("lastName", {
      description: "The last name of the contact.",
      nullable: true,
      resolve: (o) => o.last_name,
    });
    t.string("fullName", {
      description: "The full name of the contact.",
      nullable: true,
      resolve: (o) => {
        if (o.first_name) {
          return o.last_name ? `${o.first_name} ${o.last_name}` : o.first_name;
        } else {
          return null;
        }
      },
    });
  },
});
