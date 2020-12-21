import {
  ApolloClient,
  createHttpLink,
  FieldMergeFunction,
  from,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import fragmentMatcher from "@parallel/graphql/__fragment-matcher";
import { IncomingMessage } from "http";
import { filter, indexBy, map, pipe } from "remeda";
import typeDefs from "./client-schema.graphql";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";

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

  const httpLink = createHttpLink({
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

  const client = new ApolloClient({
    link: from([authLink, httpLink]),
    ssrMode: !process.browser,
    cache: new InMemoryCache({
      dataIdFromObject: (o) => o.id as string,
      possibleTypes: fragmentMatcher.possibleTypes,
      typePolicies: {
        Petition: {
          fields: {
            fields: {
              merge: mergeArraysBy(["id"]),
            },
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
            options: { merge: false },
            isDescriptionShown: {
              read(value, { readField }) {
                return Boolean(value || readField("description"));
              },
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
      },
    }).restore(initialState ?? {}),
    typeDefs,
    connectToDevTools:
      process.browser && process.env.NODE_ENV === "development",
  });
  _cached = client;
  return client;
}
