import {
  mutationField,
  stringArg,
  arg,
  idArg,
  inputObjectType,
  objectType,
  booleanArg,
} from "nexus";
import { fromGlobalId, fromGlobalIds } from "../../../util/globalId";
import {
  authenticate,
  authorizeAnd,
  authorizeAndP,
} from "../../helpers/authorize";
import { CreatePetition, CreatePetitionField } from "../../../db/__types";
import {
  userHasAccessToPetitions,
  userHasAccessToPetition,
  fieldBelongsToPetition,
  fieldsBelongsToPetition,
  replyBelongsToPetition,
} from "./authorizers";
import { RESULT } from "../../helpers/result";

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "Petition",
  authorize: authenticate(),
  args: {
    name: stringArg({ required: true }),
    locale: arg({ type: "PetitionLocale", required: true }),
  },
  resolve: async (_, { name, locale }, ctx) => {
    return await ctx.petitions.createPetition({ name, locale }, ctx.user!);
  },
});

export const deletePetitions = mutationField("deletePetitions", {
  description: "Delete petitions.",
  type: "Result",
  authorize: authorizeAnd(authenticate(), userHasAccessToPetitions("ids")),
  args: {
    ids: idArg({ required: true, list: [true] }),
  },
  resolve: async (_, args, ctx) => {
    const { ids } = fromGlobalIds(args.ids, "Petition");
    await ctx.petitions.deletePetitionById(ids, ctx.user!);
    return RESULT.SUCCESS;
  },
});

export const updateFieldPositions = mutationField("updateFieldPositions", {
  description: "Updates the positions of the petition fields",
  type: "Petition",
  authorize: authorizeAnd(
    authenticate(),
    userHasAccessToPetition("petitionId")
  ),
  args: {
    petitionId: idArg({ required: true }),
    fieldIds: idArg({
      required: true,
      list: [true],
    }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { ids: fieldIds } = fromGlobalIds(args.fieldIds, "PetitionField");
    return await ctx.petitions.updateFieldPositions(
      petitionId,
      fieldIds,
      ctx.user!
    );
  },
});

export const updatePetition = mutationField("updatePetition", {
  description: "Updates a petition.",
  type: "Petition",
  authorize: authorizeAnd(
    authenticate(),
    userHasAccessToPetition("petitionId")
  ),
  args: {
    petitionId: idArg({ required: true }),
    data: inputObjectType({
      name: "UpdatePetitionInput",
      definition(t) {
        t.string("name", { nullable: true });
        t.field("locale", { type: "PetitionLocale", nullable: true });
        t.datetime("deadline", { nullable: true });
        t.string("emailSubject", { nullable: true });
        t.json("emailBody", { nullable: true });
      },
    }).asArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
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
    return await ctx.petitions.updatePetition(petitionId, data, ctx.user!);
  },
});

export const createPetitionField = mutationField("createPetitionField", {
  description: "Creates a petition field",
  type: "PetitionAndField",
  authorize: authorizeAnd(
    authenticate(),
    userHasAccessToPetition("petitionId")
  ),
  args: {
    petitionId: idArg({ required: true }),
    type: arg({ type: "PetitionFieldType", required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    return await ctx.petitions.createPetitionField(
      petitionId,
      args.type,
      ctx.user!
    );
  },
});

export const deletePetitionField = mutationField("deletePetitionField", {
  description: "Delete petitions fields.",
  type: "Petition",
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      fieldBelongsToPetition("petitionId", "fieldId")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    fieldId: idArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { id: fieldId } = fromGlobalId(args.fieldId, "PetitionField");
    return await ctx.petitions.deletePetitionField(
      petitionId,
      fieldId,
      ctx.user!
    );
  },
});

export const updatePetitionField = mutationField("updatePetitionField", {
  description: "Updates a petition field.",
  type: objectType({
    name: "PetitionAndField",
    definition(t) {
      t.field("petition", { type: "Petition" });
      t.field("field", { type: "PetitionField" });
    },
  }),
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      fieldBelongsToPetition("petitionId", "fieldId")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    fieldId: idArg({ required: true }),
    data: inputObjectType({
      name: "UpdatePetitionFieldInput",
      definition(t) {
        t.string("title", { nullable: true });
        t.string("description", { nullable: true });
        t.field("options", { type: "JSONObject", nullable: true });
        t.boolean("optional", { nullable: true });
        t.boolean("multiple", { nullable: true });
      },
    }).asArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { id: fieldId } = fromGlobalId(args.fieldId, "PetitionField");
    const { title, description, optional, multiple, options } = args.data;
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
    if (multiple !== undefined && multiple !== null) {
      data.multiple = multiple;
    }
    if (options !== undefined && options !== null) {
      await ctx.petitions.validateFieldData(fieldId, { options });
      data.options = options;
    }
    return await ctx.petitions.updatePetitionField(
      petitionId,
      fieldId,
      data,
      ctx.user!
    );
  },
});

export const validatePetitionFields = mutationField("validatePetitionFields", {
  description: "Updates the validation of a petition field.",
  type: objectType({
    name: "PetitionAndFields",
    definition(t) {
      t.field("petition", { type: "Petition" });
      t.field("fields", { type: "PetitionField", list: [true] });
    },
  }),
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldIds")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    fieldIds: idArg({ required: true, list: [true] }),
    value: booleanArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { ids: fieldIds } = fromGlobalIds(args.fieldIds, "PetitionField");
    const { value } = args;
    return await ctx.petitions.validatePetitionFields(
      petitionId,
      fieldIds,
      value,
      ctx.user!
    );
  },
});

export const fileUploadReplyDownloadLink = mutationField(
  "fileUploadReplyDownloadLink",
  {
    description: "Generates a download link for a file reply.",
    type: objectType({
      name: "FileUploadReplyDownloadLinkResult",
      definition(t) {
        t.field("result", { type: "Result" });
        t.string("url", { nullable: true });
      },
    }),
    authorize: authorizeAnd(
      authenticate(),
      authorizeAndP(
        userHasAccessToPetition("petitionId"),
        replyBelongsToPetition("petitionId", "replyId")
      )
    ),
    args: {
      petitionId: idArg({ required: true }),
      replyId: idArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const { id: replyId } = fromGlobalId(
          args.replyId,
          "PetitionFieldReply"
        );
        const reply = await ctx.petitions.loadFieldReply(replyId);
        if (reply!.type !== "FILE_UPLOAD") {
          throw new Error("Invalid field type");
        }
        const file = await ctx.files.loadOneById(
          reply!.content["file_upload_id"]
        );
        if (file && !file.upload_complete) {
          await ctx.aws.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id);
        }
        return {
          result: RESULT.SUCCESS,
          url: await ctx.aws.getSignedDownloadEndpoint(
            file!.path,
            file!.filename
          ),
        };
      } catch {
        return {
          result: RESULT.FAILURE,
        };
      }
    },
  }
);
