import { ApolloClient, FieldMergeFunction, from, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { getOperationName } from "@apollo/client/utilities";
import fragmentMatcher from "@parallel/graphql/__fragment-matcher";
import { Login_currentUserDocument } from "@parallel/graphql/__types";
import { createUploadLink } from "apollo-upload-client";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import { IncomingMessage } from "http";
import Router from "next/router";
import { filter, indexBy, map, pipe, sortBy, uniqBy } from "remeda";

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
    (values) => values.join("; ")
  );
}

export function mergeArraysBy(path: string[]): FieldMergeFunction {
  return function merge(existing, incoming, { readField, mergeObjects, fieldName }) {
    const getKey = (value: any) => {
      return path.reduce((acc, curr) => {
        const next = readField(curr, acc as any);
        if (!next) {
          throw new Error(`Please include ${path.join(".")} when fetching ${fieldName}`);
        }
        return next;
      }, value);
    };
    const existingByKey = indexBy(existing || [], getKey);
    return incoming.map((value: any) => {
      const key = getKey(value);
      return existingByKey[key] ? mergeObjects(existingByKey[key], value) : value;
    });
  };
}

let _cached: ApolloClient<any>;
export function createApolloClient(initialState: any, { req }: CreateApolloClientOptions) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections
  if (typeof window !== "undefined" && _cached) {
    return _cached;
  }

  const httpLink = createUploadLink({
    uri: typeof window !== "undefined" ? "/graphql" : "http://localhost:4000/graphql",
  });

  const authLink = setContext((_, { headers, ...re }) => {
    return {
      headers: {
        ...headers,
        ...(typeof window !== "undefined"
          ? {}
          : { cookie: filterCookies(req!.headers["cookie"]!) }),
      },
    };
  });

  const authErrorHandler = onError(({ graphQLErrors, operation }) => {
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
  });

  const client = new ApolloClient({
    link: from([authLink, authErrorHandler, httpLink]),
    ssrMode: typeof window === "undefined",
    cache: new InMemoryCache({
      dataIdFromObject: (o) => o.id as string,
      possibleTypes: fragmentMatcher.possibleTypes,
      typePolicies: {
        Query: {
          fields: {
            petitionFieldComments: { merge: false },
            templates: {
              keyArgs: ["isOwner", "isPublic", "locale", "search", "category"],
              merge(existing, incoming, { readField }) {
                if (existing === undefined) {
                  return incoming;
                } else {
                  return {
                    items: uniqBy([...existing.items, ...incoming.items], (obj) =>
                      readField("id", obj)
                    ),
                    totalCount: incoming.totalCount,
                  };
                }
              },
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
          },
        },
        Petition: {
          fields: {
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
                      `Please include either "user.id" or "group.id" when fetching permissions`
                    );
                  }
                };
                const existingByKey = indexBy(existing || [], getKey);
                return incoming.map((value: any) => {
                  const key = getKey(value);
                  return existingByKey[key] ? mergeObjects(existingByKey[key], value) : value;
                });
              },
            },
            emailBody: { merge: false },
            signatureConfig: { merge: true },
          },
        },
        PetitionField: {
          fields: {
            options: { merge: false },
            replies: { merge: false },
            attachments: {
              merge: mergeArraysBy(["id"]),
            },
          },
        },
        PublicPetitionField: {
          fields: {
            replies: {
              merge: mergeArraysBy(["id"]),
            },
          },
        },
        Organization: {
          fields: {
            users: { merge: false },
            usageLimits: { merge: false },
            integrations: { merge: false },
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
                      (arr) => uniqBy(arr, (obj) => readField("id", obj)),
                      (arr) =>
                        sortBy(arr, [
                          (obj) => new Date(readField("createdAt", obj) as string),
                          "desc",
                        ])
                    ),
                    hasMore: incoming.hasMore,
                  };
                }
              },
            },
          },
        },
      },
    }).restore(initialState ?? {}),
    connectToDevTools: typeof window !== "undefined" && process.env.NODE_ENV === "development",
  });
  _cached = client;
  return client;
}
