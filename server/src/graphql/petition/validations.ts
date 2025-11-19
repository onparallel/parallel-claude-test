import Ajv from "ajv";
import { GraphQLResolveInfo } from "graphql";
import { groupBy, indexBy, isNonNullish, isNullish, mapValues, pipe, unique } from "remeda";
import { assert } from "ts-essentials";
import { ApiContext } from "../../context";
import { PetitionField } from "../../db/__types";
import { PetitionFieldOptions } from "../../services/PetitionFieldService";
import { ValidateReplyContentError } from "../../services/PetitionValidationService";
import { getAssertionErrorMessage, isAssertionError } from "../../util/assert";
import { toBytes } from "../../util/fileSize";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { keyBuilder } from "../../util/keyBuilder";
import { NexusGenInputs } from "../__types";
import { ArgWithPath, getArgWithPath } from "../helpers/authorize";
import { ArgValidationError, InvalidReplyError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { FIELD_REFERENCE_REGEX } from "./mutations";

export function validatePublicPetitionLinkSlug<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
  publicPetitionLinkIdProp?: ArgWithPath<TypeName, FieldName, number>,
) {
  const MIN_SLUG_LENGTH = 8;
  const MAX_SLUG_LENGTH = 30;

  return (async (_, args, ctx, info) => {
    const [slug, argName] = getArgWithPath(args, prop);
    if (!slug) {
      return;
    }

    if (slug.length < MIN_SLUG_LENGTH) {
      throw new ArgValidationError(
        info,
        argName,
        `Value can't have less than ${MIN_SLUG_LENGTH} characters.`,
        { code: "MIN_SLUG_LENGTH_VALIDATION_ERROR" },
      );
    }
    if (slug.length > MAX_SLUG_LENGTH) {
      throw new ArgValidationError(
        info,
        argName,
        `Value can't have more than ${MAX_SLUG_LENGTH} characters.`,
        { code: "MAX_SLUG_LENGTH_VALIDATION_ERROR" },
      );
    }
    if (!slug.match(/^[a-zA-Z0-9-]*$/)) {
      throw new ArgValidationError(info, argName, `Slug must match /^[a-zA-Z0-9-]*$/`, {
        code: "INVALID_SLUG_CHARS_VALIDATION_ERROR",
      });
    }

    const publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    const [publicPetitionLinkId] = publicPetitionLinkIdProp
      ? getArgWithPath(args, publicPetitionLinkIdProp)
      : [null];

    if (publicLink && publicLink.id !== publicPetitionLinkId) {
      throw new ArgValidationError(
        info,
        argName,
        "Slug is already being used on another public link",
        { code: "SLUG_ALREADY_TAKEN_VALIDATION_ERROR" },
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateCreatePetitionFieldReplyInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<TypeName, FieldName, NexusGenInputs["CreatePetitionFieldReplyInput"][]>,
  opts?: { publicContext: boolean },
) {
  return (async (_, args, ctx, info) => {
    const [fieldReplies, argName] = getArgWithPath(args, prop);
    await validateCreateReplyInput(fieldReplies, argName, ctx, info);

    const fields = (await ctx.petitions.loadField(
      fieldReplies.map((fr) => fr.id),
    )) as PetitionField[];

    const fieldsById = indexBy(fields, (f) => f.id);
    for (const [index, reply] of fieldReplies.entries()) {
      const field = fieldsById[reply.id];
      try {
        await ctx.petitionValidation.validateFieldReplyContent(
          field,
          reply.content,
          opts?.publicContext ? ctx.contact!.org_id : ctx.user!.org_id,
        );
      } catch (e) {
        if (e instanceof ValidateReplyContentError) {
          throw new InvalidReplyError(
            info,
            argName + [`[${index}]`, "content", e.argName].filter((v) => !!v).join("."),
            e.message,
            {
              subcode: e.code,
            },
          );
        } else {
          throw e;
        }
      }
      // for FILE replies, we need to make sure the user has access to the provided reply
      if (isFileTypeField(field.type)) {
        const { id: replyId } = fromGlobalId(
          reply.content.petitionFieldReplyId as string,
          "PetitionFieldReply",
        );
        const petitionFieldReply = await ctx.petitions.loadFieldReply(replyId);

        const isValid =
          isNonNullish(petitionFieldReply) &&
          ((field.type === "FILE_UPLOAD" &&
            ["FILE_UPLOAD", "ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(
              petitionFieldReply.type,
            )) ||
            field.type === petitionFieldReply.type);

        const hasAccess =
          isValid &&
          isNonNullish(ctx.user) &&
          (await ctx.petitions.userHasAccessToPetitionFieldReply(
            petitionFieldReply.id,
            ctx.user.id,
          ));

        if (!hasAccess) {
          throw new InvalidReplyError(
            info,
            argName + `[${index}].content.petitionFieldReplyId`,
            `PetitionFieldReply ID is invalid`,
          );
        }
      }

      // for PROFILE_SEARCH, make sure user has access to profile ids provided
      if (field.type === "PROFILE_SEARCH") {
        const profileIds = (reply.content.profileIds as string[]).map(
          (id) => fromGlobalId(id, "Profile").id,
        );
        const profiles = await ctx.profiles.loadProfile(unique(profileIds));
        if (isNullish(ctx.user) || profiles.some((p) => !p || p.org_id !== ctx.user?.org_id)) {
          throw new InvalidReplyError(
            info,
            argName + `[${index}].content.profileIds`,
            `Profile ID is invalid`,
          );
        }
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateUpdatePetitionFieldReplyInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<TypeName, FieldName, NexusGenInputs["UpdatePetitionFieldReplyInput"][]>,
  opts?: { publicContext: boolean },
) {
  return (async (_, args, ctx, info) => {
    const [replyContents, argName] = getArgWithPath(args, prop);
    const replyIds = unique(replyContents.map((r) => r.id));
    const [fields, replies] = await Promise.all([
      ctx.petitions.loadFieldForReply(replyIds),
      ctx.petitions.loadFieldReply(replyIds),
    ]);

    const replyCountByFieldId: Record<number, number> = {};
    for (const [index, { content, id: replyId }] of replyContents.entries()) {
      const reply = replies.find((r) => r!.id === replyId);
      const field = fields.find((f) => f!.id === reply!.petition_field_id)!;

      replyCountByFieldId[field.id] = (replyCountByFieldId[field.id] || 0) + 1;
      if (!field.multiple && replyCountByFieldId[field.id] > 1) {
        throw new InvalidReplyError(
          info,
          argName + `[${index}].content`,
          `Can't submit more than one reply on a single reply field`,
        );
      }

      try {
        await ctx.petitionValidation.validateFieldReplyContent(
          field,
          content,
          opts?.publicContext ? ctx.contact!.org_id : ctx.user!.org_id,
        );
      } catch (e) {
        if (e instanceof ValidateReplyContentError) {
          throw new InvalidReplyError(
            info,
            argName + [`[${index}]`, "content", e.argName].filter((v) => !!v).join("."),
            e.message,
            {
              subcode: e.code,
            },
          );
        } else {
          throw e;
        }
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateCreateFileReplyInput<TypeName extends string, FieldName extends string>(
  fieldIdProp: ArgWithPath<TypeName, FieldName, number>,
  parentReplyIdProp?: ArgWithPath<TypeName, FieldName, number | null | undefined>,
  fileProp?: ArgWithPath<TypeName, FieldName, NexusGenInputs["FileUploadInput"]>,
) {
  return (async (_, args, ctx, info) => {
    const formats: Record<string, string[]> = {
      PDF: ["application/pdf"],
      IMAGE: ["image/png", "image/jpeg"],
    };

    const [fieldId, argName] = getArgWithPath(args, fieldIdProp);

    if (isNonNullish(fileProp)) {
      const [file, fileArgName] = getArgWithPath(args, fileProp);
      const field = await ctx.petitions.loadField(fieldId);
      assert(isNonNullish(field), `Field ${fieldId} not found`);
      assert(field.type === "FILE_UPLOAD", `Field ${fieldId} is not a FILE_UPLOAD field`);
      const options = field.options as PetitionFieldOptions["FILE_UPLOAD"];

      const maxFileSize = Math.min(options.maxFileSize ?? Infinity, toBytes(300, "MB"));
      if (file.size > maxFileSize) {
        throw new ArgValidationError(
          info,
          fileArgName + ".size",
          `File size exceeds the maximum allowed size of ${options.maxFileSize} bytes`,
          { error_code: "FILE_SIZE_EXCEEDED_ERROR" },
        );
      }

      if (isNonNullish(options.accepts)) {
        const acceptedFormats = options.accepts.flatMap((format) => formats[format]);
        if (!acceptedFormats.includes(file.contentType)) {
          throw new ArgValidationError(
            info,
            fileArgName + ".contentType",
            `File format is not accepted.`,
            { error_code: "FILE_FORMAT_NOT_ACCEPTED_ERROR" },
          );
        }
      }
    }

    const [parentReplyId] = parentReplyIdProp ? getArgWithPath(args, parentReplyIdProp) : [null];
    await validateCreateReplyInput([{ id: fieldId, parentReplyId }], argName, ctx, info);
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateUpdateFileReplyInput<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, NexusGenInputs["FileUploadInput"]>,
  replyIdProp: ArgWithPath<TypeName, FieldName, number>,
) {
  return (async (_, args, ctx, info) => {
    const formats: Record<string, string[]> = {
      PDF: ["application/pdf"],
      IMAGE: ["image/png", "image/jpeg"],
    };
    const [file, argName] = getArgWithPath(args, prop);
    const [replyId] = getArgWithPath(args, replyIdProp);

    const field = await ctx.petitions.loadFieldForReply(replyId);
    assert(isNonNullish(field), `Field for reply ${replyId} not found`);
    assert(field.type === "FILE_UPLOAD", `Field for reply ${replyId} is not a FILE_UPLOAD field`);
    const options = field.options as PetitionFieldOptions["FILE_UPLOAD"];

    const maxFileSize = Math.min(options.maxFileSize ?? Infinity, toBytes(300, "MB"));
    if (file.size > maxFileSize) {
      throw new ArgValidationError(
        info,
        argName + ".size",
        `File size exceeds the maximum allowed size of ${options.maxFileSize} bytes`,
        { error_code: "FILE_SIZE_EXCEEDED_ERROR" },
      );
    }

    if (isNonNullish(options.accepts)) {
      const acceptedFormats = options.accepts.flatMap((format) => formats[format]);
      if (!acceptedFormats.includes(file.contentType)) {
        throw new ArgValidationError(
          info,
          argName + ".file.contentType",
          `File format is not accepted.`,
          { error_code: "FILE_FORMAT_NOT_ACCEPTED_ERROR" },
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

async function validateCreateReplyInput(
  fieldReplies: Omit<NexusGenInputs["CreatePetitionFieldReplyInput"], "content">[],
  argName: string,
  ctx: ApiContext,
  info: GraphQLResolveInfo,
) {
  const fields = await ctx.petitions.loadField(fieldReplies.map((fr) => fr.id));

  if (!fields.every(isNonNullish)) {
    const index = fields.findIndex((f) => isNullish(f));
    throw new InvalidReplyError(
      info,
      argName + `[${index}].id`,
      `Invalid PetitionField ${toGlobalId("PetitionField", fieldReplies[index].id)}`,
    );
  }

  const parentReplyIds = unique(
    fieldReplies.filter((fr) => isNonNullish(fr.parentReplyId)).map((fr) => fr.parentReplyId!),
  );
  const parentReplies = await ctx.petitions.loadFieldReply(parentReplyIds);
  if (!parentReplies.every(isNonNullish)) {
    const index = parentReplies.findIndex((r) => isNullish(r));
    throw new InvalidReplyError(
      info,
      argName + `[${index}].parentReplyId`,
      `Invalid PetitionFieldReply ${
        isNonNullish(fieldReplies[index].parentReplyId)
          ? toGlobalId("PetitionFieldReply", fieldReplies[index].parentReplyId!) // use globalIds as this messages are exposed on the API
          : null
      }`,
    );
  }

  for (const fieldReply of fieldReplies) {
    const field = fields.find((f) => f.id === fieldReply.id)!;
    // if replying into a child field, make sure the parentReplyId is passed and references the parent field
    if (isNonNullish(field.parent_petition_field_id) || isNonNullish(fieldReply.parentReplyId)) {
      const parentReply = parentReplies.find((r) => r.id === fieldReply.parentReplyId);
      if (
        isNullish(parentReply) ||
        parentReply.petition_field_id !== field.parent_petition_field_id
      ) {
        const index = fieldReplies.findIndex((r) => r.id === fieldReply.id);
        throw new InvalidReplyError(
          info,
          argName + `[${index}].parentReplyId`,
          `Invalid PetitionFieldReply ${
            isNonNullish(fieldReply.parentReplyId)
              ? toGlobalId("PetitionFieldReply", fieldReply.parentReplyId!)
              : null
          }`,
        );
      }
    }
  }

  const fieldsByIdParentReplyId = indexBy(
    fieldReplies.map((fr) => ({
      id: fr.id,
      field: fields.find((f) => f.id === fr.id)!,
      parentReplyId: fr.parentReplyId ?? null,
    })),
    keyBuilder(["id", "parentReplyId"]),
  );
  const replyCountByFieldIdParentReplyId = pipe(
    fieldReplies,
    groupBy(keyBuilder(["id", "parentReplyId"])),
    mapValues((r) => r.length),
  );
  // Validate that we are not creating more replies than allowed
  for (const { field, parentReplyId } of Object.values(fieldsByIdParentReplyId)) {
    const key = [field.id, parentReplyId].join(",");
    if (!field.multiple && replyCountByFieldIdParentReplyId[key] > 1) {
      const firstReplyIndex = fieldReplies.findIndex((r) => r.id === field.id);
      const index = fieldReplies.slice(firstReplyIndex + 1).findIndex((r) => r.id === field.id);
      throw new InvalidReplyError(
        info,
        argName + `[${index}].id`,
        `PetitionField ${toGlobalId("PetitionField", field.id)} only accepts one reply`,
      );
    }
  }
}

export function validateCommentContentSchema<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, any>,
) {
  return (async (_, args, ctx, info) => {
    const [content, argName] = getArgWithPath(args, prop);
    const ajv = new Ajv();
    if (!content) {
      throw new ArgValidationError(info, argName, "comment content is not defined");
    }
    const valid = ajv.validate(
      {
        definitions: {
          paragraph: {
            type: "object",
            properties: {
              children: { type: "array", items: { $ref: "#/definitions/leaf" } },
              type: { enum: ["paragraph"] },
            },
            required: ["type", "children"],
            additionalProperties: false,
          },
          mention: {
            type: "object",
            properties: {
              type: { const: "mention" },
              mention: { type: "string" },
              children: { type: "array", items: { $ref: "#/definitions/text" } },
            },
            additionalProperties: false,
            required: ["type", "mention", "children"],
          },
          text: {
            type: "object",
            properties: {
              text: { type: "string" },
            },
            additionalProperties: false,
            required: ["text"],
          },
          link: {
            type: "object",
            properties: {
              type: { const: "link" },
              url: { type: "string" },
              children: {
                type: "array",
                items: {
                  type: "object",
                  anyOf: [{ $ref: "#/definitions/text" }],
                },
              },
            },
          },
          leaf: {
            type: "object",
            anyOf: [
              { $ref: "#/definitions/mention" },
              { $ref: "#/definitions/text" },
              { $ref: "#/definitions/link" },
            ],
          },
          root: { type: "array", items: { $ref: "#/definitions/paragraph" } },
        },
        $ref: "#/definitions/root",
      },
      content,
    );
    if (!valid) {
      throw new ArgValidationError(info, argName, ajv.errorsText());
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

function validateVariableData(
  type: "NUMBER" | "ENUM",
  data: {
    defaultValue: any;
    valueLabels?: { value: any; label: string }[] | null;
  },
) {
  assert(type === "NUMBER" || type === "ENUM", `Invalid variable type: ${type}`);
  if (type === "NUMBER") {
    assert(typeof data.defaultValue === "number", `defaultValue must be a number`);
    for (const vl of data.valueLabels ?? []) {
      const index = (data.valueLabels ?? []).indexOf(vl);
      assert(typeof vl.value === "number", `valueLabels[${index}].value must be a number`);
    }
  } else if (type === "ENUM") {
    assert(typeof data.defaultValue === "string", `defaultValue must be a string`);
    assert(
      isNonNullish(data.valueLabels) && data.valueLabels.length > 0,
      `valueLabels must be an array with at least one element`,
    );
    for (const vl of data.valueLabels) {
      const index = data.valueLabels.indexOf(vl);
      assert(typeof vl.value === "string", `valueLabels[${index}].value must be a string`);
      assert(
        FIELD_REFERENCE_REGEX.test(vl.value),
        `valueLabels[${index}].value must match the regex ${FIELD_REFERENCE_REGEX.source}`,
      );
    }
    const uniqueValues = unique(data.valueLabels.map((vl) => vl.value));
    assert(uniqueValues.length === data.valueLabels.length, `valueLabels must have unique values`);
    assert(
      data.valueLabels.some((vl) => vl.value === data.defaultValue),
      `defaultValue must be one of the valueLabels values`,
    );
  }
}

export function validateCreatePetitionVariableInput<
  TypeName extends string,
  FieldName extends string,
>(prop: ArgWithPath<TypeName, FieldName, NexusGenInputs["CreatePetitionVariableInput"]>) {
  return (async (_, args, ctx, info) => {
    const [input, argName] = getArgWithPath(args, prop);

    try {
      validateVariableData(input.type, input);
    } catch (error) {
      if (isAssertionError(error)) {
        throw new ArgValidationError(info, argName, getAssertionErrorMessage(error));
      }
      throw error;
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateUpdatePetitionVariableInput<
  TypeName extends string,
  FieldName extends string,
>(
  petitionIdProp: ArgWithPath<TypeName, FieldName, number>,
  keyProp: ArgWithPath<TypeName, FieldName, string>,
  inputProp: ArgWithPath<TypeName, FieldName, NexusGenInputs["UpdatePetitionVariableInput"]>,
) {
  return (async (_, args, ctx, info) => {
    const [petitionId] = getArgWithPath(args, petitionIdProp);
    const [key] = getArgWithPath(args, keyProp);
    const [input, argName] = getArgWithPath(args, inputProp);

    const [variable] = await ctx.petitions.getPetitionVariables(petitionId, key);
    if (!variable) {
      return;
    }

    try {
      validateVariableData(variable.type, {
        defaultValue: input.defaultValue ?? variable.default_value,
        valueLabels: input.valueLabels ?? variable.value_labels,
      });
    } catch (error) {
      if (isAssertionError(error)) {
        throw new ArgValidationError(info, argName, getAssertionErrorMessage(error));
      }
      throw error;
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
