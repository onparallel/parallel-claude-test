import { nameCase } from "@foundernest/namecase";
import { ApolloError } from "apollo-server-core";
import { booleanArg, inputObjectType, list, mutationField, nonNull, nullable } from "nexus";
import pMap from "p-map";
import { chunk, countBy, isDefined, uniqBy } from "remeda";
import { CreateContact } from "../../db/__types";
import { withError } from "../../util/promises/withError";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { ExcelParsingError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { importFromExcel } from "../helpers/importDataFromExcel";
import { parseContactList } from "../helpers/parseContactList";
import { RESULT } from "../helpers/result";
import { uploadArg } from "../helpers/scalars";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { validateFile } from "../helpers/validators/validateFile";
import { validEmail } from "../helpers/validators/validEmail";
import { contextUserHasRole } from "../users/authorizers";
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
          t.nonNull.string("firstName");
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
          org_id: ctx.user!.org_id,
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName || null,
        },
        `User:${ctx.user!.id}`
      );
    } catch (error: any) {
      if (error?.constraint === "contact__org_id__email") {
        throw new ApolloError("Contact already exists.", "EXISTING_CONTACT");
      } else {
        throw new Error("INTERNAL_ERROR");
      }
    }
  },
});

export const updateContact = mutationField("updateContact", {
  description: "Updates a contact.",
  type: "Contact",
  authorize: authenticateAnd(userHasAccessToContacts("id")),
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
    if (isDefined(firstName)) {
      data.first_name = firstName;
    }
    if (lastName !== undefined) {
      data.last_name = lastName;
    }
    return await ctx.contacts.updateContact(args.id, data, ctx.user!);
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
      throw new ApolloError("Invalid file", "INVALID_FORMAT_ERROR");
    }

    const [parsedErrors, parsedContacts] = await withError(
      async () =>
        await parseContactList(importResult!, {
          validateEmail: (email: string) => ctx.emails.validateEmail(email),
        })
    );

    if (parsedErrors && parsedErrors instanceof AggregateError) {
      const rows = parsedErrors.errors.map((e: ExcelParsingError) => e.row);

      throw new ApolloError(parsedErrors.message, "INVALID_FORMAT_ERROR", {
        rows,
      });
    }

    if (!parsedContacts || parsedContacts.length === 0) {
      throw new ApolloError("No contacts found on file", "NO_CONTACTS_FOUND_ERROR");
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

export const deleteContacts = mutationField("deleteContacts", {
  description: "Delete contacts.",
  type: "Result",
  authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasAccessToContacts("ids")),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("Contact")))),
    force: nullable(
      booleanArg({
        description:
          "Pass true to force deleting contacts with active accesses. Their accesses will be set as INACTIVE",
      })
    ),
  },
  resolve: async (_, { ids, force }, ctx) => {
    const activeAccesses = await ctx.petitions.loadActiveAccessByContactId(ids);
    if (activeAccesses.some((contactAccess) => contactAccess.length > 0) && !force) {
      let data: any = {};
      if (ids.length === 1) {
        // fill extra error data only if we wanted to delete 1 contact
        const petitions = (
          await ctx.petitions.loadPetition(activeAccesses[0].map((a) => a.petition_id))
        ).filter(isDefined);
        data = {
          PENDING: countBy(petitions, (p) => p.status === "PENDING"),
          COMPLETED: countBy(petitions, (p) => p.status === "COMPLETED"),
          CLOSED: countBy(petitions, (p) => p.status === "CLOSED"),
        };
      }
      throw new ApolloError(
        "The contact has active accesses. Pass force=true to force deletion",
        "CONTACT_HAS_ACTIVE_ACCESSES_ERROR",
        data
      );
    }

    await ctx.contacts.deleteContactById(ids, ctx.user!);
    return RESULT.SUCCESS;
  },
});
