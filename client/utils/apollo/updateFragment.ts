import { DataProxy } from "@apollo/client";
import { omit } from "remeda";

interface UpdateFragmentOptions<TData, TVariables>
  extends DataProxy.Fragment<TVariables, TData> {
  returnPartialData?: boolean;
  optimistic?: boolean;
  broadcast?: boolean;
  data: (data: TData | null) => TData;
}

export function updateFragment<TData = any, TVariables = any>(
  cache: DataProxy,
  { data, ...options }: UpdateFragmentOptions<TData, TVariables>
) {
  const cached = cache.readFragment<TData, TVariables>(
    omit(options, ["broadcast"])
  );
  if (cached !== null) {
    cache.writeFragment<TData, TVariables>({
      ...omit(options, ["returnPartialData", "optimistic"]),
      data: data(cached),
    });
  }
}
