import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import fragmentMatcher from "@parallel/graphql/__fragment-matcher";
import { setContext } from "@apollo/client/link/context";
import typeDefs from "./client-schema.graphql";

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
            userPermissions: { merge: false },
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
