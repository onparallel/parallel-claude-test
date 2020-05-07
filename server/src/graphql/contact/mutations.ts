import { idArg, inputObjectType, mutationField } from "@nexus/schema";
import { CreateContact } from "../../db/__types";
import { fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { authenticate, authorizeAnd } from "../helpers/authorize";
import { userHasAccessToContact, userHasAccessToContacts } from "./authorizers";
import { RESULT } from "../helpers/result";

export const createContact = mutationField("createContact", {
  description: "Create a contact.",
  type: "Contact",
  authorize: authenticate(),
  args: {
    data: inputObjectType({
      name: "CreateContactInput",
      definition(t) {
        t.string("email", { required: true });
        t.string("firstName", { nullable: true });
        t.string("lastName", { nullable: true });
      },
    }).asArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { email, firstName, lastName } = args.data;
    try {
      return await ctx.contacts.createContact(
        {
          email: email.toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || null,
        },
        ctx.user!
      );
    } catch (error) {
      if (error?.constraint === "contact__owner_id__email") {
        throw new Error("EXISTING_CONTACT");
      } else {
        throw new Error("INTERNAL_ERROR");
      }
    }
  },
});

export const updateContact = mutationField("updateContact", {
  description: "Updates a contact.",
  type: "Contact",
  authorize: authorizeAnd(authenticate(), userHasAccessToContact("id")),
  args: {
    id: idArg({ required: true }),
    data: inputObjectType({
      name: "UpdateContactInput",
      definition(t) {
        t.string("firstName", { nullable: true });
        t.string("lastName", { nullable: true });
      },
    }).asArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id } = fromGlobalId(args.id, "Contact");
    const { firstName, lastName } = args.data;
    const data: Partial<CreateContact> = {};
    if (firstName !== undefined) {
      data.first_name = firstName;
    }
    if (lastName !== undefined) {
      data.last_name = lastName;
    }
    return await ctx.contacts.updateContact(id, data, ctx.user!);
  },
});

export const deleteContacts = mutationField("deleteContacts", {
  description: "Delete contacts.",
  type: "Result",
  authorize: authorizeAnd(authenticate(), userHasAccessToContacts("ids")),
  args: {
    ids: idArg({ required: true, list: [true] }),
  },
  resolve: async (_, args, ctx) => {
    const { ids } = fromGlobalIds(args.ids, "Contact");
    await ctx.contacts.deleteContactById(ids, ctx.user!);
    return RESULT.SUCCESS;
  },
});
