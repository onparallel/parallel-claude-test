import { DataProxy } from "@apollo/client";
import { omit } from "remeda";

interface UpdateQueryOptions<TData, TVariables> extends DataProxy.Query<TVariables, TData> {
  returnPartialData?: boolean;
  optimistic?: boolean;
  broadcast?: boolean;
  data: (data: TData | null) => TData;
}

export function updateQuery<TData = any, TVariables = any>(
  cache: DataProxy,
  { data, ...options }: UpdateQueryOptions<TData, TVariables>
) {
  const previous = cache.readQuery<TData, TVariables>(omit(options, ["broadcast"]));
  const current = data(previous);
  cache.writeQuery<TData, TVariables>({
    ...omit(options, ["returnPartialData", "optimistic"]),
    data: current,
  });
  return { previous, current };
}
