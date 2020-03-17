import { idArg, inputObjectType, mutationField } from "nexus";
import { fromGlobalIds } from "../../../util/globalId";
import { authenticate, authorizeAnd } from "../../helpers/authorize";
import { userHasAccessToContacts } from "./authorizers";

export const createContact = mutationField("createContact", {
  description: "Create contact.",
  type: "Contact",
  authorize: authenticate(),
  args: {
    data: inputObjectType({
      name: "CreateContactInput",
      definition(t) {
        t.string("email", { required: true });
        t.string("firstName", { nullable: true });
        t.string("lastName", { nullable: true });
      }
    }).asArg({ required: true })
  },
  resolve: async (_, args, ctx) => {
    const { email, firstName, lastName } = args.data;
    return await ctx.contacts.createContact(
      {
        email,
        first_name: firstName || null,
        last_name: lastName || null
      },
      ctx.user
    );
  }
});

export const deleteContacts = mutationField("deleteContacts", {
  description: "Delete contacts.",
  type: "Result",
  authorize: authorizeAnd(authenticate(), userHasAccessToContacts("ids")),
  args: {
    ids: idArg({ required: true, list: [true] })
  },
  resolve: async (_, args, ctx) => {
    const { ids } = fromGlobalIds(args.ids, "Contact");
    await ctx.contacts.deleteContactById(ids, ctx.user);
    return "SUCCESS" as const;
  }
});
