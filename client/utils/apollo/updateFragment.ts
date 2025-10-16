import { ApolloCache, OperationVariables } from "@apollo/client";
import type { Cache } from "@apollo/client/cache";
import { omit } from "remeda";

interface UpdateFragmentOptions<TData, TVariables extends OperationVariables>
  extends Omit<Cache.ReadFragmentOptions<TData, TVariables>, "returnPartialData"> {
  returnPartialData?: boolean;
  optimistic?: boolean;
  broadcast?: boolean;
  data: (data: TData | null) => TData;
}

export function updateFragment<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(cache: ApolloCache, { data, ...options }: UpdateFragmentOptions<TData, TVariables>) {
  const cached = cache.readFragment<TData, TVariables>(omit(options, ["broadcast"]));
  if (cached !== null) {
    cache.writeFragment<TData, TVariables>({
      ...omit(options, ["returnPartialData", "optimistic"]),
      data: data(cached),
    });
  }
}
