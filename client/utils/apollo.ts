import {
  ApolloClient,
  InMemoryCache,
  MutationUpdaterFn,
  createHttpLink,
} from "@apollo/client";
import { QueryResult } from "@apollo/react-common";
import fragmentMatcher from "@parallel/graphql/__fragment-matcher";
import { setContext } from "@apollo/client/link/context";
import { Assert } from "./types";
import { useRef } from "react";

export interface CreateApolloClientOptions {
  getToken: () => string;
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

  const httpLink = createHttpLink({
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
    link: authLink.concat(httpLink),
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
            fields: { merge: false },
          },
        },
        PetitionField: {
          fields: {
            options: { merge: false },
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

type DataProxy = Parameters<MutationUpdaterFn>[0];
export function clearCache(cache: DataProxy, regex: RegExp) {
  const data = (cache as any).data;
  for (const key of Object.keys(data.data)) {
    if (regex.test(key)) {
      data.delete(key);
    }
  }
}

export function assertQuery<TData, TVariables>(
  result: QueryResult<TData, TVariables>
): Omit<QueryResult<TData, TVariables>, "data"> & {
  data: Assert<QueryResult<TData, TVariables>["data"]>;
} {
  const { data, ...rest } = result;
  if (!data) {
    throw new Error("Expected data to be present on the Apollo cache");
  }
  return {
    data: data!,
    ...rest,
  };
}

export function useAssertQueryOrPreviousData<TData, TVariables>(
  result: QueryResult<TData, TVariables>
): Omit<QueryResult<TData, TVariables>, "data"> & {
  data: Assert<QueryResult<TData, TVariables>["data"]>;
} {
  const { data, ...rest } = result;
  const previous = useRef<TData>();
  if (!data) {
    if (!previous.current) {
      throw new Error("Expected data to be present on the Apollo cache");
    } else {
      return {
        data: previous.current!,
        ...rest,
      };
    }
  } else {
    previous.current = data!;
    return {
      data: data!,
      ...rest,
    };
  }
}
