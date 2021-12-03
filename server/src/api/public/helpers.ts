import { ClientError, gql, GraphQLClient } from "graphql-request";
import { performance } from "perf_hooks";
import { pipe } from "remeda";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { RestParameter } from "../rest/core";
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
import { TaskFragment } from "./fragments";
import {
  getTags_tagsDocument,
  getTaskResultFileUrl_getTaskResultFileUrlDocument,
  PetitionFieldType,
  PetitionFragment,
  TagFragmentDoc,
  TaskFragment as TaskType,
  TemplateFragment,
  waitForTask_TaskDocument,
} from "./__types";

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
  TArray extends boolean | undefined = undefined
>(
  options: IdParameterOptions<TRequired, TArray>
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

export function containsGraphQLError(error: ClientError, errorCode: string) {
  return ((error.response.errors![0] as any).extensions.code as string) === errorCode;
}

function mapFieldReplyContent(fieldType: PetitionFieldType, content: any) {
  switch (fieldType) {
    case "FILE_UPLOAD":
      return content as {
        filename: string;
        contentType: string;
        size: number;
      };
    case "DYNAMIC_SELECT":
      return content.columns as [string, string][];
    case "CHECKBOX":
      return content.choices as string[];
    default:
      return content.text as string;
  }
}

function mapPetitionFieldRepliesContent<T extends Pick<PetitionFragment, "fields">>(petition: T) {
  return {
    ...petition,
    fields: petition.fields?.map((field) => ({
      ...field,
      replies: field.replies.map((reply) => ({
        ...reply,
        content: mapFieldReplyContent(field.type, reply.content),
      })),
    })),
  };
}

function mapPetitionTags<T extends Pick<PetitionFragment, "tags">>(petition: T) {
  return {
    ...petition,
    tags: petition.tags?.map((t) => t.name),
  };
}

export function mapPetition<T extends Pick<PetitionFragment, "tags" | "fields">>(petition: T) {
  return pipe(petition, mapPetitionFieldRepliesContent, mapPetitionTags);
}

export function mapTemplate<T extends Pick<TemplateFragment, "tags">>(petition: T) {
  return pipe(petition, mapPetitionTags);
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
        await new Promise((resolve) => setTimeout(resolve, interval));
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
    mutation getTaskResultFileUrl_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId) {
        result
        url
      }
    }
  `;
  const result = await client.request(getTaskResultFileUrl_getTaskResultFileUrlDocument, {
    taskId: task.id,
  });
  if (result.getTaskResultFileUrl.result === "FAILURE") {
    throw new Error();
  } else {
    return result.getTaskResultFileUrl.url!;
  }
}
