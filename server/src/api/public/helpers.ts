import FormData from "form-data";
import { createReadStream } from "fs";
import { ClientError, gql, GraphQLClient } from "graphql-request";
import fetch from "node-fetch";
import { performance } from "perf_hooks";
import { isDefined, omit, pick, pipe, uniq } from "remeda";
import { promisify } from "util";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { waitFor } from "../../util/promises/waitFor";
import { emptyRTEValue, fromPlainText } from "../../util/slate/utils";
import { Maybe, UnwrapArray } from "../../util/types";
import { File, RestParameter } from "../rest/core";
import { BadRequestError, InternalError } from "../rest/errors";
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
  getTags_tagsDocument,
  getTaskResultFileUrl_getTaskResultFileDocument,
  PetitionFieldFragment,
  PetitionFieldReplyFragment,
  PetitionFieldType,
  PetitionFragment,
  PetitionTagFilter,
  ProfileFragment,
  SubscriptionFragment,
  TagFragmentDoc,
  TaskFragment as TaskType,
  TemplateFragment,
  waitForTask_TaskDocument,
} from "./__types";
import { TaskFragment } from "./fragments";
import pMap from "p-map";

export function paginationParams() {
  return {
    offset: intParam({
      description: "How many items to skip",
      defaultValue: 0,
      required: false,
      minimum: 0,
      example: 5,
    }),
    limit: intParam({
      description: "How many items to return at most",
      required: true,
      minimum: 0,
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
  const { type } = options;
  return {
    parse: buildParse(options, (value) => {
      try {
        if (fromGlobalId(value).type !== type) {
          throw new Error();
        }
      } catch {
        throw new ParseError(value, `Value is not a valid ID`);
      }
      return value;
    }),
    spec: buildDefinition(options, {
      type: "string",
      example: toGlobalId(type, 42),
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
        "content",
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
      options: (field.options.values ?? []) as any[],
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
      case "FILE_UPLOAD":
      case "ES_TAX_DOCUMENTS":
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
                ?.filter((child) => isDefined(child.field.alias) && child.replies.length > 0)
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
              ?.filter((child) => isDefined(child.field.alias) && child.replies.length > 0)
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
    if (isDefined(field.alias) && field.replies.length > 0) {
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
        : petition.signatureConfig?.signers ?? null,
  };
}

export function mapPetition<
  T extends Pick<
    PetitionFragment,
    "fromTemplate" | "tags" | "fields" | "replies" | "signatureConfig"
  >,
>(petition: T) {
  return pipe(
    petition,
    mapPetitionBase,
    mapPetitionFieldRepliesContent,
    mapPetitionTags,
    mapPetitionReplies,
  );
}

export function mapTemplate<T extends Pick<TemplateFragment, "tags" | "fields">>(petition: T) {
  return pipe(petition, mapTemplateFields, mapPetitionTags);
}

export async function getTags(client: GraphQLClient) {
  const _query = gql`
    query getTags_tags($offset: Int!, $limit: Int!) {
      tags(offset: $offset, limit: $limit) {
        items {
          ...Tag
        }
        totalCount
      }
    }
    ${TagFragmentDoc}
  `;
  const result = await client.request(getTags_tagsDocument, { offset: 0, limit: 1000 });
  return result.tags.items;
}

export async function waitForTask(client: GraphQLClient, task: TaskType) {
  const _query = gql`
    query waitForTask_Task($id: GID!) {
      task(id: $id) {
        ...Task
      }
    }
    ${TaskFragment}
  `;
  const interval = 1_000;
  const maxTime = performance.now() + 30_000;
  while (performance.now() < maxTime) {
    const result = await client.request(waitForTask_TaskDocument, {
      id: task.id,
    });
    switch (result.task.status) {
      case "ENQUEUED":
      case "PROCESSING":
        await waitFor(interval);
        break;
      case "FAILED":
        throw new InternalError("Failed generating file");
      case "COMPLETED":
        return result;
    }
  }
  throw new InternalError("Timeout while generating file");
}

export async function getTaskResultFileUrl(client: GraphQLClient, task: TaskType) {
  const _mutation = gql`
    mutation getTaskResultFileUrl_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId) {
        url
      }
    }
  `;
  const { getTaskResultFile } = await client.request(
    getTaskResultFileUrl_getTaskResultFileDocument,
    { taskId: task.id },
  );
  return getTaskResultFile.url;
}

export async function uploadFile(file: File, presignedPostData: AWSPresignedPostDataFragment) {
  const formData = new FormData();
  Object.keys(presignedPostData.fields).forEach((key) => {
    formData.append(key, presignedPostData.fields[key]);
  });
  formData.append("Content-Type", file.mimetype);
  formData.append("file", createReadStream(file.path));

  const contentLength = await promisify(formData.getLength.bind(formData))();

  return await fetch(presignedPostData.url, {
    method: "POST",
    body: formData,
    headers: { ...formData.getHeaders(), "Content-Length": contentLength.toString() },
  });
}

export function mapReplyResponse(reply: PetitionFieldReplyFragment) {
  return {
    ...reply,
    content:
      Object.keys(reply.content).length > 1 ? reply.content : reply.content.value ?? reply.content,
  };
}

export function mapSubscription(subscription: SubscriptionFragment) {
  return {
    ...omit(subscription, ["fromTemplate"]),
    fromTemplateId: subscription.fromTemplate?.id,
  };
}

export function buildTagsFilter(
  allTags: { id: string; name: string }[],
  tags: string[],
): PetitionTagFilter {
  if (tags.length > 0) {
    const _tags = tags.map((tagName) => allTags.find((t) => t.name === tagName));
    if (_tags.some((t) => !isDefined(t))) {
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
  return isDefined(message)
    ? message.format === "PLAIN_TEXT"
      ? fromPlainText(message.content)
      : emptyRTEValue()
    : null;
}

function mapProfileProperties<T extends Pick<ProfileFragment, "properties" | "propertiesByAlias">>(
  profile: T,
) {
  return {
    ...omit(profile, ["properties", "propertiesByAlias"]),
    fields: profile.properties?.map((prop) =>
      pick(prop, ["field", prop.field.type === "FILE" ? "files" : "value"]),
    ),
    fieldsByAlias: isDefined(profile.propertiesByAlias)
      ? fillPropertiesByAlias(profile.propertiesByAlias)
      : undefined,
  };
}

function fillPropertiesByAlias(props: ProfileFragment["propertiesByAlias"]) {
  return props.reduce(
    (acc, prop) => {
      if (isDefined(prop.field.alias)) {
        if (prop.field.type === "FILE") {
          acc[prop.field.alias] = prop.files?.map((f) => f.file) ?? null;
        } else {
          acc[prop.field.alias] = prop.value?.content?.value ?? null;
        }
      }

      return acc;
    },
    {} as Record<string, any>,
  );
}

export function mapProfile<T extends Pick<ProfileFragment, "properties" | "propertiesByAlias">>(
  profile: T,
) {
  return pipe(profile, mapProfileProperties);
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
              (contact.firstName !== data.firstName && isDefined(data.firstName)) ||
              (contact.lastName !== data.lastName && isDefined(data.lastName))
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

    return uniq(contactIds);
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
