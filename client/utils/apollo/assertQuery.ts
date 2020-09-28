import { QueryResult } from "@apollo/react-common";
import { Assert } from "../types";
import { useRef } from "react";

export function assertQuery<T extends QueryResult>(
  result: T
): T extends QueryResult<infer TData> ? T & { data: TData } : never {
  const { data, ...rest } = result;
  if (!data) {
    throw new Error("Expected data to be present on the Apollo cache");
  }
  return {
    ...rest,
    data: data!,
  } as any;
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
