import {
  ApolloClient,
  FieldMergeFunction,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import fragmentMatcher from "@parallel/graphql/__fragment-matcher";
import { createUploadLink } from "apollo-upload-client";
import { indexBy } from "remeda";
import typeDefs from "./client-schema.graphql";

export interface CreateApolloClientOptions {
  getToken: () => string;
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
  { getToken }: CreateApolloClientOptions
) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections
  if (process.browser && _cached) {
    return _cached;
  }

  const uploadLink = createUploadLink({
    uri: process.browser ? "/graphql" : "http://localhost:4000/graphql",
  });

  const authLink = setContext((_, { headers }) => {
    const token = getToken();
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const client = new ApolloClient({
    link: authLink.concat(uploadLink as any),
    ssrMode: !process.browser,
    cache: new InMemoryCache({
      dataIdFromObject: (o) => o.id as string,
      possibleTypes: Object.fromEntries(
        fragmentMatcher.__schema.types.map(({ name, possibleTypes }) => [
          name,
          possibleTypes.map((t) => t.name),
        ])
      ),
      typePolicies: {
        Petition: {
          fields: {
            fields: {
              merge: mergeArraysBy(["id"]),
            },
            userPermissions: {
              merge: mergeArraysBy(["user", "id"]),
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
      },
    }).restore(initialState ?? {}),
    typeDefs,
    connectToDevTools:
      process.browser && process.env.NODE_ENV === "development",
  });
  _cached = client;
  return client;
}
