import { inputObjectType, list, mutationField, nonNull } from "@nexus/schema";
import { CreateContact } from "../../db/__types";
import { authenticate, chain } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { validEmail } from "../helpers/validators/validEmail";
import { userHasAccessToContacts } from "./authorizers";

export const createContact = mutationField("createContact", {
  description: "Create a contact.",
  type: "Contact",
  authorize: authenticate(),
  args: {
    data: nonNull(
      inputObjectType({
        name: "CreateContactInput",
        definition(t) {
          t.nonNull.string("email");
          t.string("firstName");
          t.string("lastName");
        },
      }).asArg()
    ),
  },
  validateArgs: validEmail((args) => args.data.email, "data.email"),
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
      if (error?.constraint === "contact__org_id__email") {
        throw new WhitelistedError(
          "Contact already exists.",
          "EXISTING_CONTACT"
        );
      } else {
        throw new Error("INTERNAL_ERROR");
      }
    }
  },
});

export const updateContact = mutationField("updateContact", {
  description: "Updates a contact.",
  type: "Contact",
  authorize: chain(authenticate(), userHasAccessToContacts("id")),
  args: {
    id: nonNull(globalIdArg("Contact")),
    data: nonNull(
      inputObjectType({
        name: "UpdateContactInput",
        definition(t) {
          t.nullable.string("firstName");
          t.nullable.string("lastName");
        },
      }).asArg()
    ),
  },
  validateArgs: notEmptyObject((arg) => arg.data, "data"),
  resolve: async (_, args, ctx) => {
    const { firstName, lastName } = args.data;
    const data: Partial<CreateContact> = {};
    if (firstName !== undefined) {
      data.first_name = firstName;
    }
    if (lastName !== undefined) {
      data.last_name = lastName;
    }
    return await ctx.contacts.updateContact(args.id, data, ctx.user!);
  },
});

export const deleteContacts = mutationField("deleteContacts", {
  description: "Delete contacts.",
  type: "Result",
  authorize: chain(authenticate(), userHasAccessToContacts("ids")),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("Contact")))),
  },
  resolve: async (_, args, ctx) => {
    throw new WhitelistedError(
      "Contact deletion is disabled.",
      "DELETE_CONTACT_ERROR"
    );
    // await ctx.contacts.deleteContactById(args.ids, ctx.user!);
    // return RESULT.SUCCESS;
  },
});
