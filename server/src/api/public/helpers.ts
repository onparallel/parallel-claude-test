import { openAsBlob } from "fs";
import { ClientError, gql, GraphQLClient } from "graphql-request";
import pMap from "p-map";
import { performance } from "perf_hooks";
import { filter, isNonNullish, isNullish, map, omit, pick, pipe, unique, zip } from "remeda";
import { ProfileTypeFieldType } from "../../db/__types";
import { EMAIL_REGEX } from "../../graphql/helpers/validators/validEmail";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { waitFor, WaitForOptions } from "../../util/promises/waitFor";
import { renderSlateToText } from "../../util/slate/render";
import { emptyRTEValue, fromPlainText, fromPlainTextWithMentions } from "../../util/slate/utils";
import { isValidDate } from "../../util/time";
import { Maybe, unMaybeArray, UnwrapArray } from "../../util/types";
import { FormDataFile, RestParameter } from "../rest/core";
import { BadRequestError, InternalError, ResourceNotFoundError } from "../rest/errors";
import {
  buildDefinition,
  buildParse,
  enumParam,
  GeneratedParameterType,
  IdParameterOptions,
  intParam,
  ParseError,
} from "../rest/params";
import {
  AWSPresignedPostDataFragment,
  CreatePetitionRecipients_contactDocument,
  CreatePetitionRecipients_createContactDocument,
  CreatePetitionRecipients_updateContactDocument,
  EventSubscriptionFragment,
  getTags_tagsByNameDocument,
  getTaskResultFileUrl_getTaskResultFileDocument,
  parsePetitionCommentBody_getUsersOrGroupsDocument,
  parsePetitionCommentBody_userGroupsDocument,
  parsePetitionCommentBody_usersByEmailDocument,
  PetitionFieldCommentFragment,
  PetitionFieldFragment,
  PetitionFieldReplyFragment,
  PetitionFieldType,
  PetitionFragment,
  PetitionSignatureRequestFragment,
  PetitionTagFilter,
  ProfileFragment,
  ProfileTypeFieldFragment,
  TagFragmentDoc,
  TemplateFragment,
  waitForTask_TaskDocument,
} from "./__types";
import { TaskFragment } from "./fragments";

export function paginationParams() {
  return {
    offset: intParam({
      description: "How many items to skip",
      defaultValue: 0,
      required: false,
      minimum: 0,
      example: 0,
    }),
    limit: intParam({
      description: "How many items to return at most. Maximum is 100.",
      defaultValue: 10,
      required: false,
      minimum: 0,
      maximum: 100,
      example: 10,
    }),
  };
}

type SortByDirection = "ASC" | "DESC";

export function sortByParam<T extends string>(fields: T[]) {
  const values = fields.flatMap((f) => [`${f}_ASC`, `${f}_DESC`]) as `${T}_${SortByDirection}`[];
  return {
    sortBy: enumParam({
      description: "Sort this resource list by one of the available options",
      values,
      required: false,
      array: true,
      example: values[0],
    }),
  };
}

export function idParam<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
>(
  options: IdParameterOptions<TRequired, TArray>,
): RestParameter<GeneratedParameterType<string, TRequired, TArray>> {
  // ignore defaultValue
  delete options.defaultValue;
  const prefixes = unMaybeArray(options.type);

  return {
    parse: buildParse(options, (value) => {
      try {
        if (typeof value !== "string") {
          throw new Error();
        }
        const parsed = fromGlobalId(value);
        if (!prefixes.includes(parsed.type)) {
          throw new Error();
        }
        return value;
      } catch {
        throw new ParseError(value, `Value is not a valid ID`);
      }
    }),
    spec: buildDefinition(options, {
      type: "string",
      example: toGlobalId(prefixes[0], 42),
    } as any),
  };
}

export function containsGraphQLError(error: unknown, errorCode: string): error is ClientError {
  if (!(error instanceof ClientError)) {
    return false;
  }

  return ((error.response.errors![0] as any).extensions.code as string) === errorCode;
}

function mapFieldReplyContent(fieldType: PetitionFieldType, content: any): any {
  switch (fieldType) {
    case "ES_TAX_DOCUMENTS":
    case "ID_VERIFICATION":
    case "FILE_UPLOAD":
    case "DOW_JONES_KYC":
      return pick(content, ["filename", "contentType", "size"]) as {
        filename: string;
        contentType: string;
        size: number;
      };
    case "DYNAMIC_SELECT":
      return content.value as [string, string][];
    case "CHECKBOX":
      return content.value as string[];
    case "NUMBER":
      return content.value as number;
    case "DATE_TIME":
      return content as {
        value: string;
        datetime: string;
        timezone: string;
      };
    case "FIELD_GROUP":
      return {};
    case "BACKGROUND_CHECK":
      return content;
    default:
      return content.value as string;
  }
}

function mapFieldReply(reply: PetitionFieldReplyFragment, type: PetitionFieldType) {
  function mapReply(reply: PetitionFieldReplyFragment, type: PetitionFieldType) {
    return {
      ...pick(reply, [
        "id",
        "status",
        // show metadata info only on FILE fields
        ...(isFileTypeField(type) ? ["metadata" as keyof PetitionFieldReplyFragment] : []),
        "createdAt",
        "updatedAt",
      ]),
      content: mapFieldReplyContent(type, reply.content),
    };
  }
  return {
    ...mapReply(reply, type),
    children:
      reply.children?.map((child) => ({
        field: pick(child.field, ["id", "type"]),
        replies: child.replies.map((r) => ({
          ...mapReply({ ...r, children: null }, child.field.type),
        })),
      })) ?? null,
  };
}

export function mapPetitionFieldRepliesContent<T extends Pick<PetitionFragment, "fields">>(
  petition: T,
) {
  return {
    ...petition,
    fields: petition.fields?.map((field) => ({
      ...mapPetitionField(field),
      replies: field.replies.map((reply) => mapFieldReply(reply, field.type)),
    })),
  };
}

function mapTemplateFields<T extends Pick<TemplateFragment, "fields">>(template: T) {
  return {
    ...template,
    fields: template.fields?.map(mapPetitionField),
  };
}

export function mapPetitionField<T extends PetitionFieldFragment>(field: T) {
  function mapField(field: PetitionFieldFragment) {
    return {
      ...pick(field, [
        "id",
        "title",
        "description",
        "type",
        "fromPetitionFieldId",
        "alias",
        "multiple",
        "optional",
      ]),
      options:
        ["CHECKBOX", "SELECT"].includes(field.type) && isNonNullish(field.options.labels)
          ? zip(field.options.values, field.options.labels).map(([value, label]) => ({
              value,
              label,
            }))
          : field.type === "DYNAMIC_SELECT"
            ? []
            : (field.options.values ?? []),
    };
  }
  return {
    ...mapField(field),
    children: field.children?.map((f) => mapField({ ...f, children: null })) ?? null,
  };
}

function mapPetitionTags<T extends Pick<PetitionFragment, "tags">>(petition: T) {
  return {
    ...petition,
    tags: petition.tags?.map((t) => t.name),
  };
}

function mapPetitionReplies<T extends Pick<PetitionFragment, "replies">>(petition: T) {
  function mapReplyContentsForAlias(field: UnwrapArray<PetitionFragment["replies"]>): any {
    const { type, replies } = field;
    switch (type) {
      case "TEXT":
      case "SHORT_TEXT":
      case "DATE":
      case "NUMBER":
      case "PHONE":
      case "SELECT":
      case "CHECKBOX":
        if (replies.length > 1) {
          return replies.map((r) => r.content.value);
        } else {
          return replies[0].content.value ?? null;
        }
      case "BACKGROUND_CHECK":
        return replies[0]?.content ?? null; // BACKGROUND_CHECK is always single-reply
      case "FILE_UPLOAD":
      case "ES_TAX_DOCUMENTS":
      case "ID_VERIFICATION":
      case "DOW_JONES_KYC":
        if (replies.length > 1) {
          return replies.map((r) => ({
            ...r.content,
            replyId: r.id,
            metadata: r.metadata,
            fieldId: field.id,
          }));
        } else {
          return (
            {
              ...replies[0].content,
              replyId: replies[0].id,
              metadata: replies[0].metadata,
              fieldId: field.id,
            } ?? null
          );
        }
      case "DYNAMIC_SELECT":
        if (replies.length > 1) {
          return replies.map((c) => c.content.value.map((v: string[]) => v[1] ?? null));
        } else {
          return replies[0].content.value.map((v: string[]) => v[1] ?? null) ?? null;
        }
      case "DATE_TIME":
        if (replies.length > 1) {
          return replies.map((r) => r.content);
        } else {
          return replies[0].content ?? null;
        }
      case "FIELD_GROUP":
        if (replies.length > 1) {
          return replies.map((r) =>
            Object.fromEntries(
              r.children
                ?.filter((child) => isNonNullish(child.field.alias) && child.replies.length > 0)
                .map((child) => [
                  child.field.alias!,
                  mapReplyContentsForAlias({
                    ...child.field,
                    replies: child.replies.map((r) => ({ ...r, children: null })),
                  }),
                ]) ?? [],
            ),
          );
        } else {
          return Object.fromEntries(
            replies[0].children
              ?.filter((child) => isNonNullish(child.field.alias) && child.replies.length > 0)
              .map((child) => [
                child.field.alias!,
                mapReplyContentsForAlias({
                  ...child.field,
                  replies: child.replies.map((r) => ({ ...r, children: null })),
                }),
              ]) ?? [],
          );
        }
      default:
        return null;
    }
  }

  const replies: Record<string, any> = {};
  petition.replies?.forEach((field) => {
    if (isNonNullish(field.alias) && field.replies.length > 0) {
      replies[field.alias] = mapReplyContentsForAlias(field);
    }
  });

  return {
    ...petition,
    replies: petition.replies ? replies : undefined,
  };
}

function mapPetitionBase<T extends Pick<PetitionFragment, "fromTemplate" | "signatureConfig">>(
  petition: T,
) {
  return {
    ...omit(petition, ["fromTemplate", "signatureConfig"]),
    fromTemplateId: petition.fromTemplate?.id ?? null,
    signers:
      petition.signatureConfig === undefined
        ? undefined // signers not included in response
        : (petition.signatureConfig?.signers ?? null),
  };
}

export function mapPetition<
  T extends Pick<
    PetitionFragment,
    | "fromTemplate"
    | "tags"
    | "fields"
    | "replies"
    | "signatureConfig"
    | "signatures"
    | "isAnonymized"
  >,
>(petition: T) {
  return pipe(
    petition,
    mapPetitionBase,
    mapPetitionFieldRepliesContent,
    mapPetitionTags,
    mapPetitionReplies,
    mapPetitionSignatures,
  );
}

export function mapTemplate<T extends Pick<TemplateFragment, "tags" | "fields">>(petition: T) {
  return pipe(petition, mapTemplateFields, mapPetitionTags);
}

function mapPetitionSignatures<T extends Pick<PetitionFragment, "signatures">>(petition: T) {
  return {
    ...petition,
    signatures: petition.signatures?.map((s) => mapSignatureRequest(s)),
  };
}

export function mapSignatureRequest<T extends PetitionSignatureRequestFragment>(signature: T) {
  return {
    ...pick(signature, ["id", "status", "environment", "createdAt", "updatedAt"]),
    signers: signature.signatureConfig.signers.filter(isNonNullish),
  };
}

export async function waitForTask(client: GraphQLClient, taskId: string, options: WaitForOptions) {
  const _query = gql`
    query waitForTask_Task($id: GID!) {
      task(id: $id) {
        ...Task
      }
    }
    ${TaskFragment}
  `;
  let interval = 1_000;
  const start = performance.now();
  // safety 1h limit just in case
  const maxTime = start + 60 * 60_000;
  let now;
  while ((now = performance.now()) < maxTime) {
    const result = await client.request(waitForTask_TaskDocument, {
      id: taskId,
    });
    switch (result.task.status) {
      case "ENQUEUED":
      case "PROCESSING":
        // slowly increase interval
        if (now - start > 30_000) {
          interval = 3_000;
        } else if (now - start > 20_000) {
          interval = 2_000;
        }
        await waitFor(interval, options);
        break;
      case "FAILED":
        throw new InternalError("Failed Task");
      case "COMPLETED":
        return result;
    }
  }
  throw new InternalError("MAX TIMEOUT");
}

export async function getTaskResultFileUrl(client: GraphQLClient, taskId: string) {
  const _mutation = gql`
    mutation getTaskResultFileUrl_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId) {
        url
      }
    }
  `;

  try {
    const { getTaskResultFile } = await client.request(
      getTaskResultFileUrl_getTaskResultFileDocument,
      { taskId },
    );
    return getTaskResultFile.url;
  } catch (error) {
    if (containsGraphQLError(error, "FILE_NOT_FOUND_ERROR")) {
      throw new ResourceNotFoundError("File is not ready");
    }
  }
}

export async function uploadFile(
  file: FormDataFile,
  presignedPostData: AWSPresignedPostDataFragment,
) {
  const formData = new FormData();
  Object.keys(presignedPostData.fields).forEach((key) => {
    formData.append(key, presignedPostData.fields[key]);
  });
  formData.append("Content-Type", file.mimetype);
  const blob = await openAsBlob(file.path);
  formData.append("file", blob, file.filename);

  return await fetch(presignedPostData.url, {
    method: "POST",
    body: formData,
  });
}

export function mapReplyResponse(reply: PetitionFieldReplyFragment) {
  return {
    ...reply,
    content:
      Object.keys(reply.content).length > 1
        ? reply.content
        : (reply.content.value ?? reply.content),
  };
}

export function mapSubscription(subscription: EventSubscriptionFragment) {
  if (subscription.__typename === "PetitionEventSubscription") {
    return {
      ...omit(subscription, ["fromTemplate", "petitionEventTypes", "__typename"]),
      type: "PETITION" as const,
      eventTypes: subscription.petitionEventTypes,
      fromTemplateId: subscription.fromTemplate?.id ?? null,
    };
  } else {
    return {
      ...omit(subscription, ["fromProfileType", "profileEventTypes", "__typename"]),
      type: "PROFILE" as const,
      eventTypes: subscription.profileEventTypes,
      fromProfileTypeId: subscription.fromProfileType?.id ?? null,
    };
  }
}

async function getTags(client: GraphQLClient, search: string[]) {
  const _query = gql`
    query getTags_tagsByName($offset: Int!, $limit: Int!, $search: [String!]!) {
      tagsByName(offset: $offset, limit: $limit, search: $search) {
        items {
          ...Tag
        }
        totalCount
      }
    }
    ${TagFragmentDoc}
  `;
  try {
    const result = await client.request(getTags_tagsByNameDocument, {
      offset: 0,
      limit: 100,
      search,
    });
    return result.tagsByName.items;
  } catch {
    return [];
  }
}

export async function buildTagsFilter(
  client: GraphQLClient,
  tags: string[],
): Promise<PetitionTagFilter> {
  if (tags.length > 0) {
    const items = await getTags(client, tags);
    const _tags = tags.map((tagName) => items.find((t) => t.name === tagName));
    if (_tags.some((t) => isNullish(t))) {
      throw new Error("UNKNOWN_TAG_NAME");
    }

    return {
      filters: [
        {
          value: _tags.map((t) => t!.id),
          operator: "CONTAINS",
        },
      ],
      operator: "AND",
    };
  } else {
    return {
      filters: [
        {
          value: [],
          operator: "IS_EMPTY",
        },
      ],
      operator: "AND",
    };
  }
}

export function bodyMessageToRTE(message?: Maybe<{ format: "PLAIN_TEXT"; content: string }>) {
  return isNonNullish(message)
    ? message.format === "PLAIN_TEXT"
      ? fromPlainText(message.content)
      : emptyRTEValue()
    : null;
}

function mapProfilePropertyOptions(field: Pick<ProfileTypeFieldFragment, "type" | "options">) {
  if (field.type === "SELECT") {
    return pick(field.options ?? {}, ["values"]);
  } else if (field.type === "CHECKBOX") {
    return pick(field.options ?? {}, ["values"]);
  }

  return {};
}

function mapProfileFields<T extends ProfileFragment>(profile: T) {
  return {
    ...profile,
    fields: profile.properties?.map((prop) => {
      return {
        field: {
          ...prop.field,
          options: prop.field.options ? mapProfilePropertyOptions(prop.field) : undefined,
        },
        ...(prop.field.type === "FILE" ? { files: prop.files } : { value: prop.value }),
      };
    }),
  };
}

function mapProfileValues<T extends ProfileFragment>(profile: T) {
  return {
    ...profile,
    values: pipe(
      profile.properties,
      filter((p) => isNonNullish(p.field.alias)),
      map(
        (p) =>
          [
            p.field.alias,
            p.field.type === "FILE"
              ? (p.files?.map((f) => ({ id: f.id, ...f.file })) ?? null)
              : (p.value?.content?.value ?? null),
          ] as const,
      ),
      Object.fromEntries,
    ),
  };
}

export function mapProfileRelationships<T extends Pick<ProfileFragment, "id" | "relationships">>(
  profile: T,
) {
  return {
    ...profile,
    relationships: profile.relationships?.map((r) => {
      const inverse = r.leftSideProfile.id === profile.id ? false : true;
      return {
        id: r.id,
        relationshipType: {
          id: r.relationshipType.id,
          alias: r.relationshipType.alias,
          name: r.relationshipType.leftRightName,
          inverseName: r.relationshipType.rightLeftName,
        },
        inverse,
        profile: inverse ? r.leftSideProfile : r.rightSideProfile,
      };
    }),
  };
}

export function mapProfile<T extends ProfileFragment>(
  profile: T,
  { includeFields }: { includeFields?: boolean } = {},
) {
  return pipe(
    profile,
    mapProfileValues,
    (p) => (includeFields ? mapProfileFields(p) : p),
    mapProfileRelationships,
    omit(["properties"]),
  );
}

export function flattenPetitionFields<T extends { children?: any[] | null }>(
  fields: T[],
): (Omit<T, "children"> & { isChild: boolean })[] {
  return (
    fields.flatMap((field) => [
      { ...omit(field, ["children"]), isChild: false },
      ...(field.children ?? []).map((c) => ({ ...c, isChild: true })),
    ]) ?? []
  );
}

export function buildSubmittedReplyContent(
  fields: Pick<PetitionFieldFragment, "id" | "type" | "options">[],
  fieldId: string,
  body: any,
) {
  const field = fields.find((f) => f.id === fieldId);
  if (!field) {
    // let backend manage errors
    return {};
  }

  let replyContent: any = {};
  switch (field.type) {
    case "TEXT":
    case "SHORT_TEXT":
    case "SELECT":
    case "DATE":
    case "PHONE":
    case "NUMBER":
    case "CHECKBOX":
      replyContent = { value: body.reply };
      break;
    case "DYNAMIC_SELECT": {
      const labels = (fields.find((f) => f.id === fieldId)?.options?.labels ?? []) as string[];
      const replies = body.reply as Maybe<string>[];
      replyContent = { value: labels.map((label, i) => [label, replies[i]]) };
      break;
    }
    case "DATE_TIME":
      replyContent = body.reply;
      break;
    case "FIELD_GROUP":
      replyContent = {};
      break;
    default:
      throw new Error(`Can't submit a reply for a field of type ${field?.type}`);
  }

  return replyContent;
}

export async function resolveContacts(
  client: GraphQLClient,
  contacts: (
    | string
    | {
        lastName?: string | null;
        email: string;
        firstName: string;
      }
  )[],
) {
  try {
    const contactIds = await pMap(
      contacts,
      async (item) => {
        if (typeof item === "string") {
          return item;
        } else {
          const { email, ...data } = item;
          const _query = gql`
            query CreatePetitionRecipients_contact($email: String!) {
              contacts: contactsByEmail(emails: [$email]) {
                id
                firstName
                lastName
              }
            }
          `;
          const result = await client.request(CreatePetitionRecipients_contactDocument, {
            email,
          });
          const contact = result.contacts[0];
          if (contact) {
            if (
              (contact.firstName !== data.firstName && isNonNullish(data.firstName)) ||
              (contact.lastName !== data.lastName && isNonNullish(data.lastName))
            ) {
              const _mutation = gql`
                mutation CreatePetitionRecipients_updateContact(
                  $contactId: GID!
                  $data: UpdateContactInput!
                ) {
                  updateContact(id: $contactId, data: $data) {
                    id
                  }
                }
              `;
              await client.request(CreatePetitionRecipients_updateContactDocument, {
                contactId: contact.id,
                data,
              });
            }
            return contact.id;
          } else {
            const _mutation = gql`
              mutation CreatePetitionRecipients_createContact($data: CreateContactInput!) {
                createContact(data: $data) {
                  id
                }
              }
            `;
            const result = await client.request(CreatePetitionRecipients_createContactDocument, {
              data: item,
            });
            return result.createContact.id;
          }
        }
      },
      { concurrency: 3 },
    );

    return unique(contactIds);
  } catch (error) {
    if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
      const {
        email,
        error_code: errorCode,
        error_message: errorMessage,
      } = error.response.errors![0].extensions.extra as {
        email: string;
        error_code: string;
        error_message: string;
      };
      if (errorCode === "INVALID_EMAIL_ERROR" || errorCode === "INVALID_MX_EMAIL_ERROR") {
        throw new BadRequestError(`${email} is not a valid email`);
      } else if (errorCode === "VALUE_IS_EMPTY_ERROR") {
        throw new BadRequestError(`Error updating contacts: ${errorMessage}`);
      }
    }
    throw new BadRequestError("Error updating contacts");
  }
}

export function mapPetitionFieldComment(comment: PetitionFieldCommentFragment) {
  return {
    id: comment.id,
    content: comment.isAnonymized
      ? null
      : renderSlateToText(comment.content, {
          override: {
            // escape pipe character in mentions
            mention: (node) =>
              `@[${node.children![0].text?.replace(/\|/g, "\\|")}|id:${node.mention}]`,
          },
        }),
    author:
      comment.author?.__typename === "User"
        ? { type: "USER" as const, ...omit(comment.author, ["__typename"]) }
        : comment.author?.__typename === "PetitionAccess" && isNonNullish(comment.author.contact)
          ? { type: "CONTACT" as const, ...comment.author.contact }
          : null,
    mentions:
      comment.mentions?.map((m) =>
        m.__typename === "PetitionFieldCommentUserMention"
          ? m.user
            ? {
                type: "USER" as const,
                id: m.user.id,
                name: m.user.fullName || "",
                email: m.user.email,
              }
            : null
          : m.userGroup
            ? {
                type: "GROUP" as const,
                id: m.userGroup.id,
                name:
                  m.userGroup.name ||
                  m.userGroup.localizableName["en"] ||
                  m.userGroup.localizableName["es"] ||
                  "",
              }
            : null,
      ) ?? [],
    createdAt: comment.createdAt,
    isAnonymized: comment.isAnonymized,
  };
}

export function parseProfileTypeFieldInput<
  T extends { type: ProfileTypeFieldType; alias: string | null; isExpirable: boolean },
>(input: Record<string, any>, profileTypeFields: T[]) {
  return Object.entries(input).map(([alias, value]) => {
    // map every value to { value, expiryDate } format
    const field = profileTypeFields.find((f) => f.alias === alias);
    if (isNullish(field)) {
      throw new Error(`Unknown alias '${alias}' in values object`);
    }

    if (field.type === "BACKGROUND_CHECK") {
      throw new Error(
        `Field '${alias}' cannot be submitted via API. Please, remove it from the values and try again.`,
      );
    }

    const content = (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      Array.isArray(value)
        ? { value: value === "" ? null : value }
        : value && "value" in value && value.value === ""
          ? { value: null }
          : value
    ) as { value?: string | string[] | number | FormDataFile[] | null; expiryDate?: string };

    if (!field.isExpirable && isNonNullish(content.expiryDate)) {
      throw new Error(`Can't set expiryDate on field '${field.alias}', as it is not expirable`);
    }

    if (isNonNullish(content.expiryDate) && !isValidDate(content.expiryDate)) {
      throw new Error(`Invalid expiry date '${content.expiryDate}' for field '${field.alias}'`);
    }

    if (
      field.type === "FILE" &&
      content.value !== null &&
      (!Array.isArray(content.value) || !content.value.every((v) => v instanceof FormDataFile))
    ) {
      throw new Error(`Expected one or more files to be uploaded for field '${field.alias}'.`);
    }

    if (
      content.value &&
      field.type !== "FILE" &&
      field.type !== "CHECKBOX" &&
      typeof content.value !== "string" &&
      typeof content.value !== "number"
    ) {
      throw new Error(`Expected a string or number for field '${field.alias}'.`);
    }

    if (content.value && field.type === "CHECKBOX") {
      if (!Array.isArray(content.value) || !content.value.every((v) => typeof v === "string")) {
        throw new Error(`Expected an array of strings for field '${field.alias}'.`);
      }
    }

    return [
      field,
      isNonNullish(content.value)
        ? {
            value:
              field.type === "NUMBER" && content.value
                ? parseFloat(content.value as string)
                : content.value,
          }
        : // null is for removing the value
          // undefined is for keeping the value as it is (may only update expiryDate)
          content.value,
      content.expiryDate,
    ] as [T, { value: string | number | FormDataFile[] | null } | undefined, string | undefined];
  });
}

export async function parsePetitionCommentContent(client: GraphQLClient, content: string) {
  const _queries = gql`
    query parsePetitionCommentBody_usersByEmail($search: String!) {
      me {
        organization {
          usersByEmail(emails: [$search], limit: 1, offset: 0) {
            items {
              id
              fullName
            }
          }
        }
      }
    }
    query parsePetitionCommentBody_userGroups($search: String!) {
      userGroups(search: $search, limit: 1, offset: 0) {
        items {
          id
          name
          localizableName
        }
      }
    }
    query parsePetitionCommentBody_getUsersOrGroups($ids: [ID!]!) {
      getUsersOrGroups(ids: $ids) {
        __typename
        ... on User {
          id
          fullName
        }
        ... on UserGroup {
          id
          name
          localizableName
        }
      }
    }
  `;

  return await fromPlainTextWithMentions(content, async (mention) => {
    try {
      if (mention.startsWith("@[id:")) {
        const {
          getUsersOrGroups: [data],
        } = await client.request(parsePetitionCommentBody_getUsersOrGroupsDocument, {
          ids: [mention.slice(5, -1)],
        });

        return {
          id: data.id,
          name:
            data.__typename === "User"
              ? (data.fullName ?? "")
              : data.name || data.localizableName["en"] || data.localizableName["es"] || "",
        };
      } else if (mention.startsWith("@[group:")) {
        const search = mention.slice(8, -1);
        const {
          userGroups: {
            items: [firstGroup],
          },
        } = await client.request(parsePetitionCommentBody_userGroupsDocument, {
          search,
        });

        if (!firstGroup) {
          throw new Error();
        }

        const name = [
          firstGroup.name,
          firstGroup.localizableName["en"],
          firstGroup.localizableName["es"],
        ].filter(isNonNullish);

        if (name.every((name) => name.toLowerCase() !== search.toLowerCase())) {
          throw new Error(); // group name must fully match search term, case-insensitive
        }
        return {
          id: firstGroup.id,
          name: name.find((n) => n !== "") ?? "",
        };
      } else if (mention.startsWith("@[email:")) {
        const email = mention.slice(8, -1);
        if (!email.match(EMAIL_REGEX)) {
          throw new Error();
        }
        const {
          me: {
            organization: {
              usersByEmail: {
                items: [firstUser],
              },
            },
          },
        } = await client.request(parsePetitionCommentBody_usersByEmailDocument, {
          search: email,
        });

        if (!firstUser) {
          throw new Error();
        }

        return {
          id: firstUser.id,
          name: firstUser.fullName || "",
        };
      } else {
        throw new Error();
      }
    } catch {
      throw new BadRequestError(`${mention} is not a valid mention`);
    }
  });
}
