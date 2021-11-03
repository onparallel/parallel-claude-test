import { QueryResult } from "@apollo/client/react";
import { useRef } from "react";
import { Assert } from "../types";

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

export function useAssertQueryOrPreviousData<T extends QueryResult<any, any>>(
  result: T
): T & {
  data: Assert<T["data"]>;
} {
  const { data, ...rest } = result;
  const previous = useRef<any>();
  if (!data) {
    if (!previous.current) {
      throw new Error("Expected data to be present on the Apollo cache");
    } else {
      return {
        data: previous.current!,
        ...rest,
      } as any;
    }
  } else {
    previous.current = data!;
    return {
      data: data!,
      ...rest,
    } as any;
  }
}
