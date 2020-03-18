import { ApolloClient, MutationUpdaterFn } from "apollo-boost";
import { createHttpLink } from "apollo-link-http";
import { setContext } from "apollo-link-context";
import { InMemoryCache } from "apollo-cache-inmemory";
import { clearConfigCache } from "prettier";

if (!process.browser) {
  (<any>global).fetch = require("node-fetch");
}

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
    uri: "http://localhost/graphql"
  });

  const authLink = setContext((_, { headers }) => ({
    headers: {
      ...headers,
      Authorization: `Bearer ${getToken()}`
    }
  }));

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    ssrMode: !process.browser,
    cache: new InMemoryCache({
      // graphql returns unique ids
      dataIdFromObject: o => o.id
    }).restore(initialState ?? {}),
    connectToDevTools: process.browser && process.env.NODE_ENV === "development"
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
