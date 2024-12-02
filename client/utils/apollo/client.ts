import { ApolloClient, FieldMergeFunction, from, InMemoryCache } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { setContext } from "@apollo/client/link/context";
import { split } from "@apollo/client/link/core";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { getOperationName } from "@apollo/client/utilities";
import fragmentMatcher from "@parallel/graphql/__fragment-matcher";
import { Login_currentUserDocument } from "@parallel/graphql/__types";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import { DefinitionNode, Kind, OperationDefinitionNode, OperationTypeNode } from "graphql";
import { IncomingMessage } from "http";
import Router from "next/router";
import { filter, indexBy, map, pick, pipe, sortBy, uniqueBy } from "remeda";
import typeDefs from "./client-schema.graphql";

export interface CreateApolloClientOptions {
  req?: IncomingMessage;
}

function filterCookies(cookies: string) {
  return pipe(
    cookies ?? "",
    parseCookie,
    Object.entries,
    filter(([key]) => key.startsWith("parallel_")),
    map(([key, value]) => serializeCookie(key, value)),
    (values) => values.join("; "),
  );
}

export function mergeArraysBy(path: string[]): FieldMergeFunction {
  return function merge(existing, incoming, { canRead, readField, mergeObjects, fieldName }) {
    const getKey = (value: any) => {
      return path.reduce((acc, curr) => {
        const next = readField(curr, acc as any);
        if (!next) {
          throw new Error(`Please include ${path.join(".")} when fetching ${fieldName}`);
        }
        return next;
      }, value);
    };
    if (existing === undefined) {
      return incoming;
    } else {
      const existingByKey = indexBy(existing.filter(canRead), getKey);
      return incoming.map((value: any) => {
        const key = getKey(value);
        return existingByKey[key] ? mergeObjects(existingByKey[key], value) : value;
      });
    }
  };
}

let _cached: ApolloClient<any>;
export function createApolloClient(initialState: any, { req }: CreateApolloClientOptions) {
  // Make sure to create a new client for every server-side request so that data isn't shared between connections
  if (typeof window !== "undefined" && _cached) {
    return _cached;
  }

  const uri = typeof window !== "undefined" ? "/graphql" : "http://localhost:4000/graphql";
  const isDefinitionNode = (node: DefinitionNode): node is OperationDefinitionNode =>
    node.kind === Kind.OPERATION_DEFINITION;

  const client = new ApolloClient({
    link: from([
      // Auth link
      setContext((_, { headers }) => {
        return {
          headers: {
            ...headers,
            ...(typeof window !== "undefined"
              ? {}
              : {
                  ...pick(req!.headers, ["x-forwarded-for", "user-agent"]),
                  cookie: filterCookies(req!.headers["cookie"]!),
                }),
          },
        };
      }),
      // Auth error handler
      onError(({ graphQLErrors, operation }) => {
        if (typeof window !== "undefined") {
          // CurrentUser is the operation used in the login page, if we dont
          // check for it we get into a redirect loop
          if (
            operation.operationName !== getOperationName(Login_currentUserDocument) &&
            graphQLErrors?.[0]?.extensions?.code === "UNAUTHENTICATED"
          ) {
            Router.push("/login");
          }
        }
      }),
      // When for whatever reason fetch fails, wait and retry again
      new RetryLink({
        attempts: {
          max: 3,
          retryIf: (error) => {
            return error instanceof TypeError && error.message === "fetch failed";
          },
        },
        delay: {
          initial: 300,
        },
      }),
      // if operation is Query, then batch
      split(
        (op) => {
          const definition = op.query.definitions.find(isDefinitionNode);
          return definition?.operation === OperationTypeNode.QUERY;
        },
        // Batch requests happening concurrently
        new BatchHttpLink({ uri, batchInterval: 0 }),
        createUploadLink({ uri, headers: { "Apollo-Require-Preflight": "true" } }),
      ),
    ]),
    ssrMode: typeof window === "undefined",
    cache: new InMemoryCache({
      dataIdFromObject: (o) => {
        // we don't want PetitionBaseMini to clash with Petition and PetitionTemplate objects in the Apollo cache
        if (o.__typename === "PetitionBaseMini") {
          return `_${o.id}`;
        } else if (o.__typename === "PublicPetitionAccess") {
          return o.keycode as string;
        } else if (o.__typename === "StandardListDefinition") {
          // when working on templates, listVersion will be null as we always want the latest version available at the moment
          // if the list details dialog is opened, a query will be made to obtain details of the list, including latest list version
          // in this case, we don't want to overwrite the cache with the latest version as we are still working on a template
          // so, separate cache entries are created for each specific list version of the same definition
          if ("listVersion" in o && o.listVersion === null) {
            return `_${o.id}`;
          }
        }
        return o.id as string;
      },
      possibleTypes: fragmentMatcher.possibleTypes,
      typePolicies: {
        Query: {
          fields: {
            templates: {
              keyArgs: ["isOwner", "isPublic", "locale", "search", "category", "path"],
              merge(existing, incoming, { readField, variables }) {
                if (existing === undefined || variables?.offset === 0) {
                  return incoming;
                } else {
                  return {
                    items: uniqueBy([...existing.items, ...incoming.items], (obj) =>
                      readField("id", obj),
                    ),
                    totalCount: incoming.totalCount,
                  };
                }
              },
            },
            accesses: {
              keyArgs: ["search", "status"],
              merge(existing, incoming, { readField, variables }) {
                if (existing === undefined || variables?.offset === 0) {
                  return incoming;
                } else {
                  return variables?.offset
                    ? {
                        items: uniqueBy(
                          [...(existing.items ?? []), ...(incoming.items ?? [])],
                          (obj) => readField("keycode", obj),
                        ),
                        totalCount: incoming.totalCount,
                      }
                    : incoming;
                }
              },
            },
            petitions: {
              keyArgs: ["offset", "limit", "search", "filters", "sortBy"],
              merge: false,
            },
            metadata: {
              keyArgs: ["keycode"],
              merge: true,
            },
          },
        },
        PetitionBase: {
          fields: {
            fields: {
              merge: mergeArraysBy(["id"]),
            },
            tags: {
              merge: mergeArraysBy(["id"]),
            },
            myEffectivePermission: { merge: true },
            effectivePermissions: { merge: mergeArraysBy(["user", "id"]) },
            permissions: {
              merge: function merge(existing, incoming, { readField, mergeObjects }) {
                const getKey = (value: any) => {
                  const user = readField("user", value);
                  const group = readField("group", value);
                  if (user) {
                    const id = readField("id", user as any);
                    if (!id) {
                      throw new Error(`Please include "user.id" when fetching permissions`);
                    }
                    return id as string;
                  } else if (group) {
                    const id = readField("id", group as any);
                    if (!id) {
                      throw new Error(`Please include "group.id" when fetching permissions`);
                    }
                    return id as string;
                  } else {
                    throw new Error(
                      `Please include either "user.id" or "group.id" when fetching permissions`,
                    );
                  }
                };
                if (existing === undefined) {
                  return incoming;
                } else {
                  const existingByKey = indexBy(existing, getKey);
                  return incoming.map((value: any) => {
                    const key = getKey(value);
                    return existingByKey[key] ? mergeObjects(existingByKey[key], value) : value;
                  });
                }
              },
            },
            signatureConfig: { merge: true },
          },
        },
        PetitionBaseMini: {
          fields: {
            myEffectivePermission: { merge: true },
          },
        },
        PetitionTemplate: {
          fields: {
            defaultPermissions: { merge: false },
            effectiveDefaultPermissions: { merge: mergeArraysBy(["user", "id"]) },
          },
        },
        Petition: {
          fields: {
            accesses: { merge: mergeArraysBy(["id"]) },
            emailBody: { merge: false },
            events: {
              keyArgs: ["id"],
              merge(existing, incoming, { readField, variables }) {
                if (existing === undefined || variables?.offset === 0) {
                  return incoming;
                } else {
                  return variables?.offset
                    ? {
                        items: uniqueBy(
                          [...(existing.items ?? []), ...(incoming.items ?? [])],
                          (obj) => readField("id", obj),
                        ),
                        totalCount: incoming.totalCount,
                      }
                    : incoming;
                }
              },
            },
          },
        },
        PetitionField: {
          fields: {
            comments: { merge: false },
            options: { merge: false },
            replies: { merge: false },
            attachments: { merge: false },
            previewReplies: {
              merge: false,
              read(value) {
                return value ?? [];
              },
            },
            children: {
              merge: false,
            },
          },
        },
        PetitionFieldReply: {
          fields: {
            children: {
              merge: false,
              read(value) {
                return value ?? [];
              },
            },
          },
        },
        PetitionFieldAttachment: {
          fields: {
            isUploading: {
              read(value) {
                return value ?? false;
              },
            },
          },
        },
        PetitionAttachment: {
          fields: {
            isUploading: {
              read(value) {
                return value ?? false;
              },
            },
          },
        },
        PublicPetitionField: {
          fields: {
            replies: {
              merge: false,
            },
            comments: {
              merge: false,
            },
          },
        },
        Organization: {
          fields: {
            brandTheme: { merge: true },
            users: { merge: false },
            integrations: { merge: false },
            pdfDocumentThemes: { merge: false },
            features: { merge: mergeArraysBy(["name"]) },
            currentUsagePeriod: { merge: true },
          },
        },
        User: {
          fields: {
            unreadNotificationIds: { merge: false },
            notifications: {
              keyArgs: ["filter"],
              merge(existing, incoming, { readField }) {
                if (existing === undefined) {
                  return incoming;
                } else {
                  return {
                    items: pipe(
                      // incoming first so more recent isUnread status is preserved
                      [...incoming.items, ...existing.items],
                      (arr) => uniqueBy(arr, (obj) => readField("id", obj)),
                      (arr) =>
                        sortBy(arr, [
                          (obj) => new Date(readField("createdAt", obj) as string),
                          "desc",
                        ]),
                    ),
                    hasMore: incoming.hasMore,
                  };
                }
              },
            },
            petitionListViews: { merge: false },
            profileListViews: { merge: false },
          },
        },
        UserGroup: {
          fields: {
            permissions: { merge: false },
          },
        },
        Profile: {
          fields: {
            petitions: { merge: false },
            properties: { merge: mergeArraysBy(["field", "id"]) },
          },
        },
        StandardListDefinition: {
          fields: {
            values: { merge: mergeArraysBy(["key"]) },
          },
        },
      },
    }).restore(initialState ?? {}),
    typeDefs,
    connectToDevTools: typeof window !== "undefined" && process.env.NODE_ENV === "development",
  });
  _cached = client;
  return client;
}
