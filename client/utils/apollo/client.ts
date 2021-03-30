import {
  ApolloClient,
  FieldMergeFunction,
  from,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import fragmentMatcher from "@parallel/graphql/__fragment-matcher";
import { createUploadLink } from "apollo-upload-client";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import { IncomingMessage } from "http";
import Router from "next/router";
import { filter, indexBy, map, pipe } from "remeda";

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
  return function merge(
    existing,
    incoming,
    { readField, mergeObjects, fieldName }
  ) {
    const getKey = (value: any) => {
      return path.reduce((acc, curr) => {
        const next = readField(curr, acc as any);
        if (!next) {
          throw new Error(
            `Please include ${path.join(".")} when fetching ${fieldName}`
          );
        }
        return next;
      }, value);
    };
    const existingByKey = indexBy(existing || [], getKey);
    return incoming.map((value: any) => {
      const key = getKey(value);
      return existingByKey[key]
        ? mergeObjects(existingByKey[key], value)
        : value;
    });
  };
}

let _cached: ApolloClient<any>;
export function createApolloClient(
  initialState: any,
  { req }: CreateApolloClientOptions
) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections
  if (process.browser && _cached) {
    return _cached;
  }

  const httpLink = createUploadLink({
    uri: process.browser ? "/graphql" : "http://localhost:4000/graphql",
  });

  const authLink = setContext((_, { headers, ...re }) => {
    return {
      headers: {
        ...headers,
        ...(process.browser
          ? {}
          : { cookie: filterCookies(req!.headers["cookie"]!) }),
      },
    };
  });

  const authErrorHandler = onError(({ graphQLErrors, operation }) => {
    if (process.browser) {
      // CurrentUser is the operation used in the login page, if we dont
      // check for it we get into a redirect loop
      if (
        operation.operationName !== "CurrentUser" &&
        graphQLErrors?.[0]?.extensions?.code === "UNAUTHENTICATED"
      ) {
        Router.push(`/${Router.query.locale ?? "en"}/login`);
      }
    }
  });

  const client = new ApolloClient({
    link: from([authLink, authErrorHandler, httpLink]),
    ssrMode: !process.browser,
    cache: new InMemoryCache({
      dataIdFromObject: (o) => o.id as string,
      possibleTypes: fragmentMatcher.possibleTypes,
      typePolicies: {
        Query: {
          fields: {
            petitionFieldComments: {
              merge: false,
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
            userPermissions: {
              merge: mergeArraysBy(["user", "id"]),
            },
            emailBody: {
              merge: false,
            },
            signatureConfig: {
              merge: true,
            },
          },
        },
        PetitionField: {
          fields: {
            options: {
              merge: false,
            },
            replies: {
              merge: false,
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
          },
        },
        User: {
          fields: {
            authenticationTokens: { merge: false },
          },
        },
      },
    }).restore(initialState ?? {}),
    connectToDevTools:
      process.browser && process.env.NODE_ENV === "development",
  });
  _cached = client;
  return client;
}
