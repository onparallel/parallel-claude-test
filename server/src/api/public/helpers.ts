import FormData from "form-data";
import { createReadStream } from "fs";
import { ClientError, gql, GraphQLClient } from "graphql-request";
import fetch from "node-fetch";
import { performance } from "perf_hooks";
import { isDefined, omit, pick, pipe } from "remeda";
import { promisify } from "util";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { waitFor } from "../../util/promises/waitFor";
import { emptyRTEValue, fromPlainText } from "../../util/slate/utils";
import { Maybe, UnwrapArray } from "../../util/types";
import { File, RestParameter } from "../rest/core";
import { InternalError } from "../rest/errors";
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

function mapFieldReplyContent(fieldType: PetitionFieldType, content: any) {
  switch (fieldType) {
    case "ES_TAX_DOCUMENTS":
    case "FILE_UPLOAD":
    case "DOW_JONES_KYC":
      return content as {
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
    default:
      return content.value as string;
  }
}

export function mapPetitionFieldRepliesContent<T extends Pick<PetitionFragment, "fields">>(
  petition: T,
) {
  return {
    ...petition,
    fields: petition.fields?.map((field) => ({
      ...omit(field, ["options"]),
      options: field.options.values ?? undefined,
      replies: field.replies.map((reply) => ({
        // show metadata info only on FILE fields
        ...omit(reply, isFileTypeField(field.type) ? [] : ["metadata"]),
        content: mapFieldReplyContent(field.type, reply.content),
      })),
    })),
  };
}

function mapTemplateFields<T extends Pick<TemplateFragment, "fields">>(template: T) {
  return {
    ...template,
    fields: template.fields?.map((field) => ({
      ...omit(field, ["options"]),
      options: field.options.values ?? undefined,
    })),
  };
}

export function mapPetitionField<T extends PetitionFieldFragment>(field: T) {
  return {
    ...omit(field, ["options"]),
    options: field.options.values ?? undefined,
  };
}

function mapPetitionTags<T extends Pick<PetitionFragment, "tags">>(petition: T) {
  return {
    ...petition,
    tags: petition.tags?.map((t) => t.name),
  };
}

function mapPetitionReplies<T extends Pick<PetitionFragment, "replies">>(petition: T) {
  function mapReplyContentsForAlias(field: UnwrapArray<PetitionFragment["replies"]>) {
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
        return;
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

export function mapReplyResponse(
  reply: PetitionFieldReplyFragment & { field?: Maybe<{ id: string }> },
) {
  return {
    ...omit(reply, ["field"]),
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
