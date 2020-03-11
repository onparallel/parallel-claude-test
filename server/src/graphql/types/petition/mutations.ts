import {
  mutationField,
  stringArg,
  arg,
  idArg,
  inputObjectType,
  objectType,
  booleanArg
} from "nexus";
import { fromGlobalId, fromGlobalIds } from "../../../util/globalId";
import {
  authenticate,
  authorizeAnd,
  authorizeAndP
} from "../../helpers/authorize";
import { CreatePetition, CreatePetitionField } from "../../../db/__types";
import {
  userHasAccessToPetitions,
  userHasAccessToPetition,
  fieldBelongsToPetition,
  fieldsBelongsToPetition
} from "./authorizers";

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "Petition",
  authorize: authenticate(),
  args: {
    name: stringArg({ required: true }),
    locale: arg({ type: "PetitionLocale", required: true })
  },
  resolve: async (_, { name, locale }, ctx) => {
    return await ctx.petitions.createPetition({ name, locale }, ctx.user);
  }
});

export const deletePetitions = mutationField("deletePetitions", {
  description: "Delete petitions.",
  type: "Result",
  authorize: authorizeAnd(authenticate(), userHasAccessToPetitions("ids")),
  args: {
    ids: idArg({ required: true, list: [true] })
  },
  resolve: async (_, args, ctx) => {
    const { ids } = fromGlobalIds(args.ids, "Petition");
    await ctx.petitions.deletePetitionById(ids, ctx.user);
    return "SUCCESS" as const;
  }
});

export const updateFieldPositions = mutationField("updateFieldPositions", {
  description: "Updates the positions of the petition fields",
  type: "Petition",
  authorize: authorizeAnd(authenticate(), userHasAccessToPetition("id")),
  args: {
    id: idArg({ required: true }),
    fieldIds: idArg({
      required: true,
      list: [true]
    })
  },
  resolve: async (_, args, ctx) => {
    const { id } = fromGlobalId(args.id, "Petition");
    const { ids: fieldIds } = fromGlobalIds(args.fieldIds, "PetitionField");
    return await ctx.petitions.updateFieldPositions(id, fieldIds, ctx.user);
  }
});

export const updatePetition = mutationField("updatePetition", {
  description: "Updates a petition.",
  type: "Petition",
  authorize: authorizeAnd(authenticate(), userHasAccessToPetition("id")),
  args: {
    id: idArg({ required: true }),
    data: inputObjectType({
      name: "UpdatePetitionInput",
      definition(t) {
        t.string("name", { nullable: true });
        t.field("locale", { type: "PetitionLocale", nullable: true });
        t.datetime("deadline", { nullable: true });
        t.string("emailSubject", { nullable: true });
        t.json("emailBody", { nullable: true });
      }
    }).asArg({ required: true })
  },
  resolve: async (_, args, ctx) => {
    const { id } = fromGlobalId(args.id, "Petition");
    const { name, locale, deadline, emailSubject, emailBody } = args.data;
    const data: Partial<CreatePetition> = {};
    if (name !== undefined) {
      data.name = name;
    }
    if (locale !== undefined && locale !== null) {
      data.locale = locale;
    }
    if (deadline !== undefined) {
      data.deadline = deadline;
    }
    if (emailSubject !== undefined) {
      data.email_subject = emailSubject;
    }
    if (emailBody !== undefined) {
      data.email_body = emailBody === null ? null : JSON.stringify(emailBody);
    }
    return await ctx.petitions.updatePetition(id, data, ctx.user);
  }
});

export const createPetitionField = mutationField("createPetitionField", {
  description: "Creates a petition field",
  type: "PetitionAndField",
  authorize: authorizeAnd(authenticate(), userHasAccessToPetition("id")),
  args: {
    id: idArg({ required: true }),
    type: arg({ type: "PetitionFieldType", required: true })
  },
  resolve: async (_, args, ctx) => {
    const { id } = fromGlobalId(args.id, "Petition");
    return await ctx.petitions.createPetitionField(id, args.type, ctx.user);
  }
});

export const deletePetitionField = mutationField("deletePetitionField", {
  description: "Delete petitions fields.",
  type: "Petition",
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("id"),
      fieldBelongsToPetition("id", "fieldId")
    )
  ),
  args: {
    id: idArg({ required: true }),
    fieldId: idArg({ required: true })
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.id, "Petition");
    const { id: fieldId } = fromGlobalId(args.fieldId, "PetitionField");
    return await ctx.petitions.deletePetitionField(
      petitionId,
      fieldId,
      ctx.user
    );
  }
});

export const updatePetitionField = mutationField("updatePetitionField", {
  description: "Updates a petition field.",
  type: objectType({
    name: "PetitionAndField",
    definition(t) {
      t.field("petition", { type: "Petition" });
      t.field("field", { type: "PetitionField" });
    }
  }),
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("id"),
      fieldBelongsToPetition("id", "fieldId")
    )
  ),
  args: {
    id: idArg({ required: true }),
    fieldId: idArg({ required: true }),
    data: inputObjectType({
      name: "UpdatePetitionFieldInput",
      definition(t) {
        t.string("title", { nullable: true });
        t.string("description", { nullable: true });
        t.field("options", { type: "JSONObject", nullable: true });
        t.boolean("optional", { nullable: true });
      }
    }).asArg({ required: true })
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.id, "Petition");
    const { id: fieldId } = fromGlobalId(args.fieldId, "PetitionField");
    const { title, description, optional, options } = args.data;
    const data: Partial<CreatePetitionField> = {};
    if (title !== undefined) {
      data.title = title;
    }
    if (description !== undefined) {
      data.description = description;
    }
    if (optional !== undefined && optional !== null) {
      data.optional = optional;
    }
    if (options !== undefined && options !== null) {
      await ctx.petitions.validateFieldData(fieldId, { options });
      data.options = options;
    }
    return await ctx.petitions.updatePetitionField(
      petitionId,
      fieldId,
      data,
      ctx.user
    );
  }
});

export const validatePetitionFields = mutationField("validatePetitionFields", {
  description: "Updates the validation of a petition field.",
  type: objectType({
    name: "PetitionAndFields",
    definition(t) {
      t.field("petition", { type: "Petition" });
      t.field("fields", { type: "PetitionField", list: [true] });
    }
  }),
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("id"),
      fieldsBelongsToPetition("id", "fieldIds")
    )
  ),
  args: {
    id: idArg({ required: true }),
    fieldIds: idArg({ required: true, list: [true] }),
    value: booleanArg({ required: true })
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.id, "Petition");
    const { ids: fieldIds } = fromGlobalIds(args.fieldIds, "PetitionField");
    const { value } = args;
    return await ctx.petitions.validatePetitionFields(
      petitionId,
      fieldIds,
      value,
      ctx.user
    );
  }
});
