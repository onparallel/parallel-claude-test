import {
  arg,
  booleanArg,
  inputObjectType,
  intArg,
  list,
  mutationField,
  nonNull,
  nullable,
  objectType,
  stringArg,
} from "@nexus/schema";
import pMap from "p-map";
import { omit, pick, zip } from "remeda";
import { ApiContext } from "../../../context";
import { defaultFieldOptions } from "../../../db/helpers/fieldOptions";
import {
  CreatePetition,
  CreatePetitionField,
  Petition,
  PetitionUser,
} from "../../../db/__types";
import { unMaybeArray } from "../../../util/arrays";
import {
  fromGlobalId,
  fromGlobalIds,
  toGlobalId,
} from "../../../util/globalId";
import { withError } from "../../../util/promises/withError";
import { isDefined } from "../../../util/remedaExtensions";
import { calculateNextReminder } from "../../../util/reminderUtils";
import { random } from "../../../util/token";
import {
  userHasAccessToContactGroups,
  userHasAccessToContacts,
} from "../../contact/authorizers";
import {
  and,
  argIsDefined,
  authenticate,
  authenticateAnd,
  chain,
  ifArgDefined,
  or,
} from "../../helpers/authorize";
import { datetimeArg } from "../../helpers/date";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { importFromExcel } from "../../helpers/importDataFromExcel";
import { jsonArg, jsonObjectArg } from "../../helpers/json";
import { parseDynamicSelectValues } from "../../helpers/parseDynamicSelectValues";
import { RESULT } from "../../helpers/result";
import { uploadArg } from "../../helpers/upload";
import {
  validateAnd,
  validateIf,
  validateOr,
} from "../../helpers/validateArgs";
import { inRange } from "../../helpers/validators/inRange";
import { jsonSchema } from "../../helpers/validators/jsonSchema";
import { maxLength } from "../../helpers/validators/maxLength";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { notEmptyObject } from "../../helpers/validators/notEmptyObject";
import { notEmptyString } from "../../helpers/validators/notEmptyString";
import { validateFile } from "../../helpers/validators/validateFile";
import { validBooleanValue } from "../../helpers/validators/validBooleanValue";
import { validFieldVisibilityJson } from "../../helpers/validators/validFieldVisibility";
import { validIsDefined } from "../../helpers/validators/validIsDefined";
import { validRemindersConfig } from "../../helpers/validators/validRemindersConfig";
import { validRichTextContent } from "../../helpers/validators/validRichTextContent";
import { validSignatureConfig } from "../../helpers/validators/validSignatureConfig";
import { fieldHasType } from "../../public/authorizers";
import {
  accessesBelongToPetition,
  accessesBelongToValidContacts,
  fieldIsNotFixed,
  fieldsBelongsToPetition,
  messageBelongToPetition,
  petitionHasRepliableFields,
  petitionsArePublicTemplates,
  repliesBelongsToField,
  repliesBelongsToPetition,
  userHasAccessToPetitions,
} from "../authorizers";
import {
  validateAccessesRemindersLeft,
  validateAccessesStatus,
  validatePetitionStatus,
} from "../validations";
import { ArgValidationError, WhitelistedError } from "./../../helpers/errors";

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "PetitionBase",
  authorize: chain(
    authenticate(),
    ifArgDefined(
      (args) => args.petitionId,
      or(
        userHasAccessToPetitions("petitionId" as never),
        petitionsArePublicTemplates("petitionId" as never)
      ),
      argIsDefined("locale")
    )
  ),
  args: {
    name: stringArg(),
    locale: arg({ type: "PetitionLocale" }),
    petitionId: globalIdArg("Petition", {
      description: "GID of petition to base from",
    }),
    type: arg({
      type: "PetitionBaseType",
      description: "Type of petition to create",
      default: "PETITION",
    }),
    eventsUrl: stringArg({
      description: "URL to receive real-time events of this petition.",
    }),
  },
  resolve: async (_, { name, locale, petitionId, type, eventsUrl }, ctx) => {
    const isTemplate = type === "TEMPLATE";
    let petition: Petition;
    if (petitionId) {
      const original = (await ctx.petitions.loadPetition(petitionId))!;
      petition = await ctx.petitions.clonePetition(petitionId, ctx.user!, {
        is_template: isTemplate,
        status: isTemplate ? null : "DRAFT",
        name: original.is_template && !isTemplate ? name : original.name,
      });

      if (original.is_template && !isTemplate) {
        ctx.analytics.trackEvent(
          "TEMPLATE_USED",
          {
            template_id: petitionId,
            user_id: ctx.user!.id,
          },
          toGlobalId("User", ctx.user!.id)
        );
      } else if (!original.is_template) {
        ctx.analytics.trackEvent(
          "PETITION_CLONED",
          {
            from_petition_id: petitionId,
            petition_id: petition.id,
            user_id: ctx.user!.id,
            type: petition.is_template ? "TEMPLATE" : "PETITION",
          },
          toGlobalId("User", ctx.user!.id)
        );
      }
    } else {
      petition = await ctx.petitions.createPetition(
        {
          name,
          locale: locale!,
          email_subject: name,
          is_template: isTemplate,
        },
        ctx.user!
      );

      ctx.analytics.trackEvent(
        "PETITION_CREATED",
        {
          petition_id: petition.id,
          user_id: ctx.user!.id,
          type: isTemplate ? "TEMPLATE" : "PETITION",
        },
        toGlobalId("User", ctx.user!.id)
      );
    }

    if (eventsUrl) {
      await ctx.subscriptions.createSubscription(
        petition.id,
        eventsUrl,
        ctx.user!
      );
    }
    await ctx.petitions.createEvent({
      petitionId: petition.id,
      type: "PETITION_CREATED",
      data: {
        user_id: ctx.user!.id,
      },
    });
    return petition;
  },
});

export const clonePetitions = mutationField("clonePetitions", {
  description: "Clone petition.",
  type: list(nonNull("PetitionBase")),
  authorize: chain(
    authenticate(),
    or(
      userHasAccessToPetitions("petitionIds"),
      petitionsArePublicTemplates("petitionIds")
    )
  ),
  args: {
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
  },
  validateArgs: notEmptyArray((args) => args.petitionIds, "petitionIds"),
  resolve: async (_, args, ctx) => {
    return await pMap(
      unMaybeArray(args.petitionIds),
      async (petitionId) => {
        const { name, locale } = (await ctx.petitions.loadPetition(
          petitionId
        ))!;
        const mark = `(${locale === "es" ? "copia" : "copy"})`;

        const cloned = await ctx.petitions.clonePetition(
          petitionId,
          ctx.user!,
          {
            name: `${name ? `${name} ` : ""}${mark}`.slice(0, 255),
          }
        );

        await ctx.petitions.createEvent({
          petitionId: cloned.id,
          type: "PETITION_CREATED",
          data: { user_id: ctx.user!.id },
        });

        ctx.analytics.trackEvent(
          "PETITION_CLONED",
          {
            from_petition_id: petitionId,
            petition_id: cloned.id,
            user_id: ctx.user!.id,
            type: cloned.is_template ? "TEMPLATE" : "PETITION",
          },
          toGlobalId("User", ctx.user!.id)
        );

        return cloned;
      },
      { concurrency: 1 }
    );
  },
});

export const deletePetitions = mutationField("deletePetitions", {
  description: "Delete petitions.",
  type: "Result",
  authorize: chain(authenticate(), userHasAccessToPetitions("ids")),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("Petition")))),
    force: booleanArg({ default: false }),
  },
  validateArgs: notEmptyArray((args) => args.ids, "ids"),
  resolve: async (_, args, ctx) => {
    const petitionIsSharedByOwner = (p: PetitionUser[]) => {
      return (
        p &&
        p.length > 1 && // the petition is being shared to another user
        p.find(
          (u) => u.permission_type === "OWNER" && u.user_id === ctx.user!.id // logged user is the owner
        )
      );
    };

    // user permissions grouped by permission_id
    const userPermissions = await ctx.petitions.loadUserPermissions(args.ids);

    if (userPermissions.some(petitionIsSharedByOwner) && !args.force) {
      throw new WhitelistedError(
        "Petition to delete is shared to another user",
        "DELETE_SHARED_PETITION_ERROR"
      );
    }

    await ctx.petitions.withTransaction(async (t) => {
      // delete my permissions to the petitions
      const deletedPermissions = await ctx.petitions.deleteUserPermissions(
        args.ids,
        ctx.user!.id,
        ctx.user!,
        t
      );

      const ownerPermissions = deletedPermissions.filter(
        (p) => p.permission_type === "OWNER"
      );

      // make sure to also remove every remaining permission on deleted owned petitions
      await ctx.petitions.deleteAllPermissions(
        ownerPermissions.map((p) => p.petition_id),
        ctx.user!,
        t
      );
      //finally, delete only petitions OWNED by me
      await ctx.petitions.deletePetitionById(
        ownerPermissions.map((p) => p.petition_id),
        ctx.user!,
        t
      );
    });

    return RESULT.SUCCESS;
  },
});

export const updateFieldPositions = mutationField("updateFieldPositions", {
  description: "Updates the positions of the petition fields",
  type: "PetitionBase",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldIds: nonNull(list(nonNull(globalIdArg("PetitionField")))),
  },
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.petitions.updateFieldPositions(
        args.petitionId,
        args.fieldIds,
        ctx.user!
      );
    } catch (e) {
      if (e.message === "INVALID_PETITION_FIELD_IDS") {
        throw new WhitelistedError(
          "Invalid petition field ids",
          "INVALID_PETITION_FIELD_IDS"
        );
      } else if (e.message === "INVALID_FIELD_CONDITIONS_ORDER") {
        throw new WhitelistedError(
          "Invalid field conditions order",
          "INVALID_FIELD_CONDITIONS_ORDER"
        );
      } else {
        throw e;
      }
    }
  },
});

export const RemindersConfigInput = inputObjectType({
  name: "RemindersConfigInput",
  description: "The reminders settings for the petition",
  definition(t) {
    t.nonNull.int("offset", {
      description: "The amount of days between reminders.",
    });
    t.nonNull.string("time", {
      description: "The time at which the reminder should be sent.",
    });
    t.nonNull.string("timezone", {
      description: "The timezone the time is referring to.",
    });
    t.nonNull.boolean("weekdaysOnly", {
      description: "Whether to send reminders only from monday to friday.",
    });
  },
});

export const SignatureConfigInput = inputObjectType({
  name: "SignatureConfigInput",
  description: "The signature settings for the petition",
  definition(t) {
    t.nonNull.string("provider", {
      description: "The selected provider for the signature.",
    });
    t.nonNull.list.nonNull.id("contactIds", {
      description: "The contacts that need to sign the generated document.",
    });
    t.nonNull.string("timezone", {
      description: "The timezone used to generate the document.",
    });
    t.nonNull.string("title", {
      description: "The title of the signing document",
    });
    t.nonNull.boolean("review", {
      description:
        "If true, lets the user review the replies before starting the signature process",
    });
  },
});

export const updatePetition = mutationField("updatePetition", {
  description: "Updates a petition.",
  type: "PetitionBase",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    data: nonNull(
      inputObjectType({
        name: "UpdatePetitionInput",
        definition(t) {
          t.nullable.string("name");
          t.nullable.field("locale", { type: "PetitionLocale" });
          t.nullable.datetime("deadline");
          t.nullable.string("emailSubject");
          t.nullable.json("emailBody");
          t.nullable.field("remindersConfig", {
            type: "RemindersConfigInput",
          });
          t.nullable.boolean("hasCommentsEnabled");
          t.nullable.boolean("skipForwardSecurity");
          t.nullable.boolean("isRecipientViewContentsHidden");
          t.nullable.field("signatureConfig", {
            type: "SignatureConfigInput",
          });
          t.nullable.string("description");
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.name, "data.name", 255),
    maxLength((args) => args.data.emailSubject, "data.emailSubject", 255),
    maxLength((args) => args.data.description, "data.description", 1000),
    validRichTextContent((args) => args.data.emailBody, "data.emailBody"),
    validRemindersConfig(
      (args) => args.data.remindersConfig,
      "data.remindersConfig"
    ),
    validSignatureConfig(
      (args) => args.data.signatureConfig,
      "data.signatureConfig"
    )
  ),
  resolve: async (_, args, ctx) => {
    const {
      name,
      locale,
      deadline,
      emailSubject,
      emailBody,
      remindersConfig,
      hasCommentsEnabled,
      skipForwardSecurity,
      isRecipientViewContentsHidden,
      signatureConfig,
      description,
    } = args.data;
    const data: Partial<CreatePetition> = {};
    if (name !== undefined) {
      data.name = name?.trim() || null;
    }
    if (isDefined(locale)) {
      data.locale = locale;
    }
    if (deadline !== undefined) {
      data.deadline = deadline;
    }
    if (emailSubject !== undefined) {
      data.email_subject = emailSubject?.trim() || null;
    }
    if (emailBody !== undefined) {
      data.email_body = emailBody && JSON.stringify(emailBody);
    }
    if (remindersConfig !== undefined) {
      if (remindersConfig === null) {
        data.reminders_config = null;
        data.reminders_active = false;
      } else {
        data.reminders_config = remindersConfig;
        data.reminders_active = true;
      }
    }
    if (isDefined(hasCommentsEnabled)) {
      data.comments_enabled = hasCommentsEnabled;
    }
    if (isDefined(skipForwardSecurity)) {
      data.skip_forward_security = skipForwardSecurity;
    }
    if (isDefined(isRecipientViewContentsHidden)) {
      data.hide_recipient_view_contents = isRecipientViewContentsHidden;
    }
    if (signatureConfig !== undefined) {
      data.signature_config = signatureConfig && {
        ...pick(signatureConfig, ["provider", "timezone", "title", "review"]),
        contactIds: fromGlobalIds(signatureConfig.contactIds, "Contact").ids,
      };
    }
    if (description !== undefined) {
      data.template_description = description?.trim() || null;
    }

    return await ctx.petitions.updatePetition(
      args.petitionId,
      data,
      `User:${ctx.user!.id}`
    );
  },
});

export const createPetitionField = mutationField("createPetitionField", {
  description: "Creates a petition field",
  type: "PetitionBaseAndField",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    type: nonNull(arg({ type: "PetitionFieldType" })),
    position: intArg(),
  },
  validateArgs: inRange((args) => args.position, "position", 0),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldAtPosition(
      args.petitionId,
      {
        type: args.type,
        ...defaultFieldOptions(args.type),
      },
      args.position ?? -1,
      ctx.user!
    );
  },
});

export const clonePetitionField = mutationField("clonePetitionField", {
  description: "Clones a petition field",
  type: "PetitionBaseAndField",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.clonePetitionField(
      args.petitionId,
      args.fieldId,
      ctx.user!
    );
  },
});

export const deletePetitionField = mutationField("deletePetitionField", {
  description: "Deletes a petition field.",
  type: "PetitionBase",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldIsNotFixed("fieldId")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    force: booleanArg({ default: false }),
  },
  resolve: async (_, args, ctx) => {
    const replies = await ctx.petitions.loadRepliesForField(args.fieldId);
    if (!args.force && replies.length > 0) {
      throw new WhitelistedError(
        "The petition field has replies.",
        "FIELD_HAS_REPLIES_ERROR"
      );
    }

    const petitionFields = await ctx.petitions.loadFieldsForPetition(
      args.petitionId,
      { cache: false }
    );
    if (
      petitionFields.some((f) =>
        f.visibility?.conditions.some((c: any) => c.fieldId === args.fieldId)
      )
    ) {
      throw new WhitelistedError(
        "The petition field is being referenced in another field.",
        "FIELD_IS_REFERENCED_ERROR"
      );
    }

    return await ctx.petitions.deletePetitionField(
      args.petitionId,
      args.fieldId,
      ctx.user!
    );
  },
});

export const updatePetitionField = mutationField("updatePetitionField", {
  description: "Updates a petition field.",
  type: "PetitionBaseAndField",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    data: nonNull(
      inputObjectType({
        name: "UpdatePetitionFieldInput",
        definition(t) {
          t.nullable.string("title");
          t.nullable.string("description");
          t.nullable.field("options", { type: "JSONObject" });
          t.nullable.boolean("optional");
          t.nullable.boolean("multiple");
          t.nullable.field("visibility", { type: "JSONObject" });
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.title, "data.title", 500),
    validateIf(
      (args) => isDefined(args.data.visibility),
      validFieldVisibilityJson(
        (args) => args.petitionId,
        (args) => args.fieldId,
        (args) => args.data.visibility,
        "data.visibility"
      )
    )
  ),
  resolve: async (_, args, ctx, info) => {
    const {
      title,
      description,
      optional,
      multiple,
      options,
      visibility,
    } = args.data;
    const data: Partial<CreatePetitionField> = {};
    if (title !== undefined) {
      data.title = title?.trim() || null;
    }
    if (description !== undefined) {
      data.description = description?.trim() || null;
    }
    if (isDefined(optional)) {
      data.optional = optional;
    }
    if (isDefined(multiple)) {
      data.multiple = multiple;
    }
    if (isDefined(options)) {
      try {
        await ctx.petitions.validateFieldData(args.fieldId, { options });
        data.options = options;
      } catch (e) {
        throw new ArgValidationError(info, "data.options", e.toString());
      }
    }

    if (visibility !== undefined) {
      data.visibility =
        visibility === null
          ? null
          : {
              ...visibility,
              conditions: visibility.conditions.map((c: any) => ({
                ...c,
                fieldId: fromGlobalId(c.fieldId, "PetitionField").id,
              })),
            };
    }

    return await ctx.petitions.updatePetitionField(
      args.petitionId,
      args.fieldId,
      data,
      ctx.user!
    );
  },
});

export const uploadDynamicSelectFile = mutationField(
  "uploadDynamicSelectFieldFile",
  {
    description:
      "Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options",
    type: "PetitionField",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldHasType("fieldId", ["DYNAMIC_SELECT"])
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      file: nonNull(uploadArg()),
    },
    validateArgs: validateFile(
      (args) => args.file,
      {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        maxSize: 1024 * 1024 * 10,
      },
      "file"
    ),
    resolve: async (_, args, ctx) => {
      const file = await args.file;

      const [importError, importResult] = await withError(
        importFromExcel(file.createReadStream())
      );
      if (importError) {
        throw new WhitelistedError("Invalid file", "INVALID_FORMAT_ERROR");
      }
      const [parseError, parseResult] = await withError(() =>
        parseDynamicSelectValues(importResult!)
      );
      if (parseError) {
        throw new WhitelistedError(parseError.message, "INVALID_FORMAT_ERROR");
      }
      const { labels, values } = parseResult!;

      const key = random(16);
      const res = await ctx.aws.fileUploads.uploadFile(
        key,
        file.mimetype,
        file.createReadStream()
      );

      const fileUpload = await ctx.files.createFileUpload(
        {
          content_type: file.mimetype,
          filename: file.filename,
          path: key,
          size: res["ContentLength"]!.toString(),
          upload_complete: true,
        },
        `User:${ctx.user!.id}`
      );

      const options = {
        values,
        labels,
        file: {
          id: toGlobalId("FileUpload", fileUpload.id),
          name: fileUpload.filename,
          size: res["ContentLength"],
          updatedAt: fileUpload.updated_at.toISOString(),
        },
      };
      await ctx.petitions.validateFieldData(args.fieldId, { options });
      const { field } = await ctx.petitions.updatePetitionField(
        args.petitionId,
        args.fieldId,
        { options },
        ctx.user!
      );

      return field;
    },
  }
);

export const dynamicSelectFieldFileDownloadLink = mutationField(
  "dynamicSelectFieldFileDownloadLink",
  {
    description:
      "generates a signed download link for the xlsx file containing the listings of a dynamic select field",
    type: "FileUploadReplyDownloadLinkResult",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldHasType("fieldId", ["DYNAMIC_SELECT"])
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
    },
    resolve: async (_, args, ctx) => {
      try {
        const field = await ctx.petitions.loadField(args.fieldId);
        const fileId = field?.options.file?.id
          ? fromGlobalId(field.options.file.id, "FileUpload").id
          : null;
        const file = await ctx.files.loadFileUpload(fileId as any);
        return {
          result: RESULT.SUCCESS,
          url: await ctx.aws.fileUploads.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
            "attachment"
          ),
        };
      } catch {
        return { result: RESULT.FAILURE };
      }
    },
  }
);

export const validatePetitionFields = mutationField("validatePetitionFields", {
  description:
    "Updates the validation of a field and sets the petition as closed if all fields are validated.",
  type: "PetitionAndPartialFields",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldIds")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldIds: nonNull(list(nonNull(globalIdArg("PetitionField")))),
    value: nonNull(booleanArg()),
    validateRepliesWith: arg({ type: "PetitionFieldReplyStatus" }),
  },
  validateArgs: notEmptyArray((args) => args.fieldIds, "fieldIds"),
  resolve: async (_, args, ctx) => {
    const fields = await ctx.petitions.validatePetitionFields(
      args.petitionId,
      args.fieldIds,
      args.value,
      ctx.user!
    );
    if (args.value || args.validateRepliesWith) {
      const replies = await ctx.petitions.loadRepliesForField(args.fieldIds, {
        cache: false,
      });
      await ctx.petitions.updatePetitionFieldRepliesStatus(
        replies.flatMap((r) =>
          r.filter((r) => r.status === "PENDING").map((r) => r.id)
        ),
        args.validateRepliesWith || "APPROVED"
      );
    }

    const petition = (await ctx.petitions.loadPetition(args.petitionId, {
      cache: false,
    }))!;

    if (
      args.validateRepliesWith &&
      args.validateRepliesWith !== "PENDING" &&
      petition.status === "CLOSED"
    ) {
      await ctx.petitions.createEvent({
        type: "PETITION_CLOSED",
        petitionId: petition.id,
        data: {
          user_id: ctx.user!.id,
        },
      });
      ctx.analytics.trackEvent(
        "PETITION_CLOSED",
        {
          petition_id: petition.id,
          user_id: ctx.user!.id,
        },
        toGlobalId("User", ctx.user!.id)
      );
    }
    return { petition, fields };
  },
});

export const updatePetitionFieldRepliesStatus = mutationField(
  "updatePetitionFieldRepliesStatus",
  {
    description:
      "Updates the status of a petition field reply and sets the petition as closed if all fields are validated.",
    type: objectType({
      name: "PetitionWithFieldAndReplies",
      definition(t) {
        t.field("petition", { type: "Petition" });
        t.field("field", { type: "PetitionField" });
        t.list.nonNull.field("replies", { type: "PetitionFieldReply" });
      },
    }),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "petitionFieldId"),
        repliesBelongsToField("petitionFieldId", "petitionFieldReplyIds")
      )
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      petitionFieldId: nonNull(globalIdArg("PetitionField")),
      petitionFieldReplyIds: nonNull(
        list(nonNull(globalIdArg("PetitionFieldReply")))
      ),
      status: nonNull(arg({ type: "PetitionFieldReplyStatus" })),
    },
    validateArgs: notEmptyArray(
      (args) => args.petitionFieldReplyIds,
      "petitionFieldReplyIds"
    ),
    resolve: async (_, args, ctx) => {
      const replies = await ctx.petitions.updatePetitionFieldRepliesStatus(
        args.petitionFieldReplyIds,
        args.status
      );
      if (args.status === "APPROVED") {
        const allReplies = await ctx.petitions.loadRepliesForField(
          args.petitionFieldId
        );
        if (
          allReplies.every((r) => ["APPROVED", "REJECTED"].includes(r.status))
        ) {
          const field = (
            await ctx.petitions.validatePetitionFields(
              args.petitionId,
              [args.petitionFieldId],
              true,
              ctx.user!
            )
          )[0];
          return {
            petition: (await ctx.petitions.loadPetition(args.petitionId, {
              cache: false,
            }))!,
            replies,
            field,
          };
        }
      }
      return {
        petition: (await ctx.petitions.loadPetition(args.petitionId))!,
        replies,
        field: (await ctx.petitions.loadField(args.petitionFieldId))!,
      };
    },
  }
);

export const fileUploadReplyDownloadLink = mutationField(
  "fileUploadReplyDownloadLink",
  {
    description: "Generates a download link for a file reply.",
    type: "FileUploadReplyDownloadLinkResult",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        repliesBelongsToPetition("petitionId", "replyId")
      )
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      replyId: nonNull(globalIdArg("PetitionFieldReply")),
      preview: booleanArg({
        description:
          "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const reply = await ctx.petitions.loadFieldReply(args.replyId);
        if (reply!.type !== "FILE_UPLOAD") {
          throw new WhitelistedError(
            "Only FILE_UPLOAD replies can be downloaded",
            "INVALID_FIELD_TYPE"
          );
        }
        const file = await ctx.files.loadFileUpload(
          reply!.content["file_upload_id"]
        );
        if (file && !file.upload_complete) {
          await ctx.aws.fileUploads.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id);
        }
        return {
          result: RESULT.SUCCESS,
          url: await ctx.aws.fileUploads.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
            args.preview ? "inline" : "attachment"
          ),
        };
      } catch (error) {
        if (error instanceof WhitelistedError) {
          throw error;
        }
        return {
          result: RESULT.FAILURE,
        };
      }
    },
  }
);

/**
 * creates the required accesses and messages to send a petition to a group of contacts
 */
async function presendPetition(
  petition: Petition,
  contactIds: number[],
  args: {
    remindersConfig?: any | null;
    scheduledAt?: Date | null;
    subject: string;
    body: any;
  },
  ctx: ApiContext
) {
  try {
    const accesses = await ctx.petitions.createAccesses(
      petition.id,
      contactIds.map((id) => ({
        petition_id: petition.id,
        contact_id: id,
        reminders_left: 10,
        reminders_active: Boolean(args.remindersConfig),
        reminders_config: args.remindersConfig,
        next_reminder_at: args.remindersConfig
          ? calculateNextReminder(
              args.scheduledAt ?? new Date(),
              args.remindersConfig
            )
          : null,
      })),
      ctx.user!
    );

    const messages = await ctx.petitions.createMessages(
      petition.id,
      args.scheduledAt ?? null,
      accesses.map((access) => ({
        petition_access_id: access.id,
        status: args.scheduledAt ? "SCHEDULED" : "PROCESSING",
        email_subject: args.subject,
        email_body: JSON.stringify(args.body),
      })),
      ctx.user!
    );

    const updatedPetition = await ctx.petitions.updatePetition(
      petition.id,
      { name: petition.name ?? args.subject, status: "PENDING" },
      `User:${ctx.user!.id}`
    );

    return {
      petition: updatedPetition,
      accesses,
      messages,
      result: RESULT.SUCCESS,
    };
  } catch (error) {
    ctx.logger.error(error);
    return { result: RESULT.FAILURE, error };
  }
}

export const batchSendPetition = mutationField("batchSendPetition", {
  description:
    "Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages",
  type: nonNull(list(nonNull("SendPetitionResult"))),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionHasRepliableFields("petitionId"),
    userHasAccessToContactGroups("contactIdGroups")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    contactIdGroups: nonNull(
      list(nonNull(list(nonNull(globalIdArg("Contact")))))
    ),
    subject: nonNull(stringArg()),
    body: nonNull(jsonArg()),
    scheduledAt: datetimeArg(),
    remindersConfig: arg({ type: "RemindersConfigInput" }),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.contactIdGroups, "contactIdGroups"),
    maxLength((args) => args.subject, "subject", 255),
    notEmptyString((args) => args.subject, "subject"),
    validRichTextContent((args) => args.body, "body"),
    validRemindersConfig((args) => args.remindersConfig, "remindersConfig")
  ),
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.loadPetition(args.petitionId);
    if (!petition) {
      throw new Error("Petition not available");
    }
    const clonedPetitions = await Promise.all(
      args.contactIdGroups
        .slice(1)
        .map(() => ctx.petitions.clonePetition(args.petitionId, ctx.user!))
    );

    // copy the user permissions of the original petition to the cloned ones
    if (clonedPetitions.length > 0) {
      await ctx.petitions.copyPetitionPermissions(
        args.petitionId,
        clonedPetitions.map((p) => p.id),
        ctx.user!
      );
    }

    const results = await pMap(
      zip([petition, ...clonedPetitions], args.contactIdGroups),
      async ([petition, contactIds]) =>
        await presendPetition(petition, contactIds, args, ctx),
      { concurrency: 5 }
    );

    const successfulSends = results.filter((r) => r.result === "SUCCESS");
    const messages = successfulSends.map((r) => r.messages!).flat();

    if (!args.scheduledAt) {
      await ctx.emails.sendPetitionMessageEmail(messages.map((m) => m.id));
    }

    successfulSends.map((s) =>
      ctx.analytics.trackEvent(
        "PETITION_SENT",
        {
          petition_id: s.petition!.id,
          user_id: ctx.user!.id,
          access_ids: s.accesses!.map((a) => a.id),
        },
        toGlobalId("User", ctx.user!.id)
      )
    );

    return results.map((r) => omit(r, ["messages"]));
  },
});

export const sendPetition = mutationField("sendPetition", {
  description:
    "Sends the petition and creates the corresponding accesses and messages.",
  type: "SendPetitionResult",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    userHasAccessToContacts("contactIds"),
    petitionHasRepliableFields("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    contactIds: nonNull(list(nonNull(globalIdArg("Contact")))),
    subject: nonNull(stringArg()),
    body: nonNull(jsonArg()),
    scheduledAt: datetimeArg(),
    remindersConfig: arg({ type: "RemindersConfigInput" }),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.contactIds, "contactIds"),
    maxLength((args) => args.subject, "subject", 255),
    notEmptyString((args) => args.subject, "subject"),
    validRichTextContent((args) => args.body, "body"),
    validRemindersConfig((args) => args.remindersConfig, "remindersConfig")
  ),
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.loadPetition(args.petitionId);
    if (!petition) {
      throw new Error("Petition not available");
    }
    const {
      result,
      error,
      accesses,
      messages,
      petition: updatedPetition,
    } = await presendPetition(petition, args.contactIds, args, ctx);

    if (
      result === "FAILURE" &&
      error.constraint === "petition_access__petition_id_contact_id"
    ) {
      throw new WhitelistedError(
        "This petition was already sent to some of the contacts",
        "PETITION_ALREADY_SENT_ERROR"
      );
    }

    if (result === "SUCCESS") {
      if (!args.scheduledAt) {
        await ctx.emails.sendPetitionMessageEmail(messages!.map((s) => s.id));
      }

      ctx.analytics.trackEvent(
        "PETITION_SENT",
        {
          petition_id: args.petitionId,
          user_id: ctx.user!.id,
          access_ids: accesses!.map((a) => a.id),
        },
        toGlobalId("User", ctx.user!.id)
      );
    }

    return {
      petition: updatedPetition,
      accesses,
      result,
    };
  },
});

export const sendReminders = mutationField("sendReminders", {
  description: "Sends a reminder for the specified petition accesses.",
  type: "Result",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    body: jsonArg(),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  validateArgs: validRichTextContent((args) => args.body, "body"),
  resolve: async (_, args, ctx, info) => {
    const [petition, accesses] = await Promise.all([
      ctx.petitions.loadPetition(args.petitionId),
      ctx.petitions.loadAccess(args.accessIds),
    ]);

    validatePetitionStatus(petition, "PENDING", info);
    validateAccessesStatus(accesses, "ACTIVE", info);
    validateAccessesRemindersLeft(accesses, info);

    try {
      const reminders = await ctx.petitions.createReminders(
        args.petitionId,
        args.accessIds.map((accessId) => ({
          type: "MANUAL",
          status: "PROCESSING",
          petition_access_id: accessId,
          sender_id: ctx.user!.id,
          email_body: args.body ? JSON.stringify(args.body) : null,
          created_by: `User:${ctx.user!.id}`,
        }))
      );
      await ctx.emails.sendPetitionReminderEmail(reminders.map((r) => r.id));

      accesses.forEach((access) => {
        if (access) {
          ctx.analytics.trackEvent(
            "REMINDER_EMAIL_SENT",
            {
              petition_id: args.petitionId,
              user_id: ctx.user!.id,
              access_id: access.id,
              sent_count: 10 - access.reminders_left + 1,
              type: "MANUAL",
            },
            toGlobalId("User", ctx.user!.id)
          );
        }
      });
      return RESULT.SUCCESS;
    } catch (error) {
      return RESULT.FAILURE;
    }
  },
});

export const switchAutomaticReminders = mutationField(
  "switchAutomaticReminders",
  {
    description:
      "Switches automatic reminders for the specified petition accesses.",
    type: list(nonNull("PetitionAccess")),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        accessesBelongToPetition("petitionId", "accessIds")
      )
    ),
    args: {
      start: nonNull(booleanArg()),
      petitionId: nonNull(globalIdArg("Petition")),
      accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
      remindersConfig: arg({ type: "RemindersConfigInput" }),
    },
    validateArgs: validateOr(
      validBooleanValue((args) => args.start, "start", false),
      validateAnd(
        validIsDefined((args) => args.remindersConfig, "remindersConfig"),
        validRemindersConfig((args) => args.remindersConfig, "remindersConfig")
      )
    ),
    resolve: async (_, args, ctx, info) => {
      const [petition, accesses] = await Promise.all([
        ctx.petitions.loadPetition(args.petitionId),
        ctx.petitions.loadAccess(args.accessIds),
      ]);

      validatePetitionStatus(petition, "PENDING", info);
      validateAccessesStatus(accesses, "ACTIVE", info);

      if (args.start) {
        validateAccessesRemindersLeft(accesses, info);
        const validAccessIds: number[] = accesses
          .filter((a) => a !== null)
          .map((a) => a!.id);

        return await ctx.petitions.startAccessReminders(
          validAccessIds,
          args.remindersConfig!
        );
      } else {
        return await ctx.petitions.stopAccessReminders(args.accessIds);
      }
    },
  }
);

export const deactivateAccesses = mutationField("deactivateAccesses", {
  description: "Deactivates the specified active petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.deactivateAccesses(
      args.petitionId,
      args.accessIds,
      ctx.user!
    );
  },
});

export const reactivateAccesses = mutationField("reactivateAccesses", {
  description: "Reactivates the specified inactive petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds"),
      accessesBelongToValidContacts("accessIds")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  resolve: async (_, args, ctx, info) => {
    return await ctx.petitions.reactivateAccesses(
      args.petitionId,
      args.accessIds,
      ctx.user!
    );
  },
});

export const cancelScheduledMessage = mutationField("cancelScheduledMessage", {
  description: "Cancels a scheduled petition message.",
  type: nullable("PetitionMessage"),
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      messageBelongToPetition("petitionId", "messageId")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    messageId: nonNull(globalIdArg("PetitionMessage")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.cancelScheduledMessage(
      args.petitionId,
      args.messageId,
      ctx.user!
    );
  },
});

export const changePetitionFieldType = mutationField(
  "changePetitionFieldType",
  {
    description: "Changes the type of a petition Field",
    type: "PetitionBaseAndField",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "fieldId")
      )
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      type: nonNull(arg({ type: "PetitionFieldType" })),
      force: booleanArg({ default: false }),
    },
    resolve: async (_, args, ctx) => {
      const replies = await ctx.petitions.loadRepliesForField(args.fieldId, {
        cache: false,
      });
      if (!args.force && replies.length > 0) {
        throw new WhitelistedError(
          "The petition field has replies.",
          "FIELD_HAS_REPLIES_ERROR"
        );
      }
      try {
        return await ctx.petitions.changePetitionFieldType(
          args.petitionId,
          args.fieldId,
          args.type,
          ctx.user!
        );
      } catch (e) {
        if (e.message === "UPDATE_FIXED_FIELD_ERROR") {
          throw new WhitelistedError(
            "Can't change type of a fixed field",
            "UPDATE_FIXED_FIELD_ERROR"
          );
        } else {
          throw e;
        }
      }
    },
  }
);

export const sendPetitionClosedNotification = mutationField(
  "sendPetitionClosedNotification",
  {
    description:
      "Sends an email to all contacts of the petition confirming the replies are ok",
    type: "Petition",
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      emailBody: nonNull(jsonArg()),
      attachPdfExport: nonNull(booleanArg()),
      pdfExportTitle: stringArg(),
      force: booleanArg({ default: false }),
    },
    authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
    validateArgs: validRichTextContent((args) => args.emailBody, "emailBody"),
    resolve: async (_, args, ctx) => {
      const shouldSendNotification = await ctx.petitions.shouldNotifyPetitionClosed(
        args.petitionId
      );
      if (!shouldSendNotification && !args.force) {
        throw new WhitelistedError(
          "You already notified the contacts",
          "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR"
        );
      }

      const accesses = await ctx.petitions.loadAccessesForPetition(
        args.petitionId
      );

      const activeAccesses = accesses.filter((a) => a.status === "ACTIVE");

      await ctx.emails.sendPetitionClosedEmail(
        args.petitionId,
        ctx.user!.id,
        activeAccesses.map((a) => a.id),
        args.emailBody,
        args.attachPdfExport,
        args.pdfExportTitle ?? null
      );

      await Promise.all(
        activeAccesses.map((access) =>
          ctx.petitions.createEvent({
            type: "PETITION_CLOSED_NOTIFIED",
            petitionId: args.petitionId,
            data: {
              user_id: ctx.user!.id,
              petition_access_id: access.id,
            },
          })
        )
      );
      return (await ctx.petitions.loadPetition(args.petitionId))!;
    },
  }
);

export const reopenPetition = mutationField("reopenPetition", {
  description: "Reopens the petition",
  type: "Petition",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.withTransaction(async (t) => {
      await ctx.petitions.createEvent(
        {
          type: "PETITION_REOPENED",
          data: { user_id: ctx.user!.id },
          petitionId: args.petitionId,
        },
        t
      );
      return await ctx.petitions.updatePetition(
        args.petitionId,
        { status: "PENDING" },
        `User:${ctx.user!.id}`,
        t
      );
    });
  },
});

export const updatePetitionFieldReplyMetadata = mutationField(
  "updatePetitionFieldReplyMetadata",
  {
    description: "Updates the metada of the specified petition field reply",
    type: "PetitionFieldReply",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        repliesBelongsToPetition("petitionId", "replyId")
      )
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      replyId: nonNull(globalIdArg("PetitionFieldReply")),
      metadata: nonNull(jsonObjectArg()),
    },
    validateArgs: jsonSchema({
      type: "object",
      additionalProperties: { type: ["string", "boolean", "number"] },
    })((args) => args.metadata, "metadata"),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.updatePetitionFieldReplyMetadata(
        args.replyId,
        args.metadata
      );
    },
  }
);
