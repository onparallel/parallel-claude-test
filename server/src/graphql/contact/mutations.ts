import { nameCase } from "@foundernest/namecase";
import { inputObjectType, list, mutationField, nonNull } from "@nexus/schema";
import pMap from "p-map";
import { chunk, uniqBy } from "remeda";
import { CreateContact } from "../../db/__types";
import { withError } from "../../util/promises/withError";
import { authenticate, chain } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { importFromExcel } from "../helpers/importDataFromExcel";
import { parseContactList } from "../helpers/parseContactList";
import { uploadArg } from "../helpers/upload";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { validateFile } from "../helpers/validators/validateFile";
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
        ctx.user!,
        `User:${ctx.user!.id}`
      );
    } catch (error) {
      if (error?.constraint === "contact__org_id__email") {
        throw new WhitelistedError("Contact already exists.", "EXISTING_CONTACT");
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
    throw new WhitelistedError("Contact deletion is disabled.", "DELETE_CONTACT_ERROR");
    // await ctx.contacts.deleteContactById(args.ids, ctx.user!);
    // return RESULT.SUCCESS;
  },
});

export const bulkCreateContacts = mutationField("bulkCreateContacts", {
  description: "Load contacts from an excel file, creating the ones not found on database",
  type: list("Contact"),
  authorize: authenticate(),
  args: {
    file: nonNull(uploadArg()),
  },
  validateArgs: validateFile(
    (args) => args.file,
    {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      maxSize: 1024 * 1024 * 10,
    },
    "file"
  ),
  resolve: async (_, args, ctx) => {
    const file = await args.file;

    const [importError, importResult] = await withError(importFromExcel(file.createReadStream()));
    if (importError) {
      throw new WhitelistedError("Invalid file", "INVALID_FORMAT_ERROR");
    }
    const [parseError, parsedContacts] = await withError(() => parseContactList(importResult!));
    if (parseError) {
      throw new WhitelistedError(parseError.message, "INVALID_FORMAT_ERROR");
    }

    if (!parsedContacts || parsedContacts.length === 0) {
      throw new WhitelistedError("No contacts found on file", "NO_CONTACTS_FOUND_ERROR");
    }

    const contacts = (
      await pMap(
        chunk(
          uniqBy(parsedContacts, (c) => c.email),
          50
        ),
        (chunk) =>
          ctx.contacts.createOrUpdate(
            chunk.map((parsed) => ({
              email: parsed.email,
              first_name: nameCase(parsed.firstName),
              last_name: parsed.lastName ? nameCase(parsed.lastName) : null,
              org_id: ctx.user!.org_id,
            })),
            `User:${ctx.user!.id}`
          ),
        { concurrency: 1 }
      )
    ).flat();

    return uniqBy(contacts, (c) => c.email);
  },
});
