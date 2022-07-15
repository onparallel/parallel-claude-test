import { TableSorting, TableSortingDirection } from "@parallel/components/common/Table";
import type Router from "next/router";
import { NextRouter, useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import { equals, pick } from "remeda";
import { fromBase64, toBase64 } from "./base64";
import { pathParams, resolveUrl } from "./next";
import { useUpdatingRef } from "./useUpdatingRef";

export class QueryItem<T> {
  defaultValue: T | null = null;

  constructor(
    private _parseValue: (value: string | string[] | undefined) => T | null,
    private _serialize?: (value: NonNullable<T>) => string,
    private _isDefault?: (value: NonNullable<T>) => boolean
  ) {}

  orDefault(value: T) {
    this.defaultValue = value;
    return this as unknown as QueryItem<NonNullable<T>>;
  }

  isDefault(value: NonNullable<T>) {
    if (this._isDefault) {
      return this._isDefault(value);
    } else {
      return equals(this.defaultValue, value);
    }
  }

  parseValue(value: string | string[] | undefined) {
    return this._parseValue(value) ?? this.defaultValue;
  }

  serialize(value: NonNullable<T>) {
    if (this._serialize) {
      return this._serialize(value);
    } else {
      return `${value}`;
    }
  }
}

export function integer({ max, min }: { max?: number; min?: number } = {}) {
  return new QueryItem<number | null>((value) => {
    if (typeof value === "string") {
      const parsed = parseInt(value);
      if (!isNaN(parsed) && parsed >= (min ?? -Infinity) && parsed <= (max ?? Infinity)) {
        return parsed;
      }
    }
    return null;
  });
}

export function string() {
  return new QueryItem<string | null>((value) => {
    return typeof value === "string" ? value : null;
  });
}
export function boolean() {
  return new QueryItem<boolean | null>((value) => {
    return value === "true" ? true : value === "false" ? false : null;
  });
}

export function values<T>(values: T[]): QueryItem<T | null>;
export function values<T extends string>(values: T[]): QueryItem<T | null>;
export function values(values: any[]): QueryItem<any> {
  return new QueryItem<any>((value) => {
    // eslint-disable-next-line eqeqeq
    return values.find((v) => v == value) ?? null;
  });
}

export function list<T>(values: T[]): QueryItem<T[] | null>;
export function list<T extends string>(values: T[]): QueryItem<T[] | null>;
export function list(values: any[]): QueryItem<any> {
  return new QueryItem<any>(
    (value) => {
      if (value) {
        const parsed = (value as string).split(",").map((v) => (values.includes(v) ? v : null));
        return parsed.includes(null) ? null : parsed;
      } else {
        return null;
      }
    },
    (values) => values.join(",")
  );
}

export function sorting<T extends string>(fields: readonly T[]) {
  return new QueryItem<TableSorting<T>>(
    (value) => {
      if (value) {
        const [field, direction] = (value as string).split("_");
        if (fields.includes(field as any) && ["ASC", "DESC"].includes(direction)) {
          return {
            field: field as T,
            direction: direction as TableSortingDirection,
          };
        }
      }
      return null;
    },
    ({ field, direction }) => `${field}_${direction}`
  );
}

export function object<T>({
  flatten,
  unflatten,
}: {
  flatten?: (value: T) => any;
  unflatten?: (value: any) => T;
}) {
  return new QueryItem<T | null>(
    (value) => {
      if (value && typeof value === "string") {
        const decoded = JSON.parse(
          fromBase64(value.replaceAll("-", "+").replaceAll("_", "/").replaceAll(".", "="))
        );
        return unflatten ? unflatten(decoded) : decoded;
      }
      return null;
    },
    (value) => {
      return toBase64(JSON.stringify(flatten ? flatten(value) : value))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", ".");
    }
  );
}
export interface ParseQueryOptions {
  prefix?: string;
}

export function parseQuery<T extends {}>(
  query: typeof Router["query"],
  shape: QueryStateOf<T>,
  { prefix }: ParseQueryOptions = {}
): T {
  return Object.fromEntries(
    Object.entries(shape).map(([key, component]) => {
      return [key, (component as QueryItem<any>).parseValue(query[prefix ? prefix + key : key])];
    })
  ) as any;
}

export interface QueryStateOptions {
  prefix?: string;
}

export type QueryStateOf<T extends {}> = { [P in keyof T]: QueryItem<T[P]> };

type SetQueryState<T> = (state: T | ((prevState: T) => T), options?: SetQueryStateOptions) => void;

export interface SetQueryStateOptions {
  type?: "replace" | "push";
}

export function useQueryState<T extends {}>(
  shape: QueryStateOf<T>,
  { prefix }: QueryStateOptions = {}
): [T, SetQueryState<Partial<T>>] {
  const router = useRouter();
  const state = useMemo(() => {
    return parseQuery(router.query, shape, { prefix });
  }, [router.query, router.pathname]);
  const ref = useUpdatingRef<Pick<NextRouter, "query" | "pathname">>(
    pick(router, ["query", "pathname"])
  );
  return [
    state,
    useCallback(async function (state, { type = "replace" } = {}) {
      const { query, pathname } = ref.current;
      const newState =
        typeof state === "function" ? state(parseQuery(query, shape, { prefix })) : state;
      const invalid = Object.keys(newState).find((k) => !shape.hasOwnProperty(k));
      if (invalid) {
        console.error(`Invalid key "${invalid}" in setQueryState`);
      }
      const fromPath = pathParams(pathname);
      const fromState = Object.keys(shape).map((key) => (prefix ? prefix + key : key));
      const newQuery = [
        ...(Object.entries(newState)
          .filter(
            ([key, value]) =>
              value !== null &&
              value !== undefined &&
              !shape[key as keyof T].isDefault(value as any)
          )
          .map(([key, value]) => [
            prefix ? prefix + key : key,
            shape[key as keyof T].serialize(value as any),
          ]) as [string, string][]),
        // keep other params
        ...(Object.entries(query).filter(
          ([key]) => !fromState.includes(key) && !fromPath.includes(key)
        ) as [string, string][]),
      ];
      const route = resolveUrl(pathname, query);
      await router[type](
        newQuery.length > 0 ? `${route}?${new URLSearchParams(newQuery)}` : route,
        undefined,
        { shallow: true }
      );
    }, []),
  ];
}

export function useQueryStateSlice<T extends {}, K extends keyof T>(
  state: T,
  setState: SetQueryState<Partial<T>>,
  slice: K
): [T[K], SetQueryState<T[K]>] {
  return [
    state[slice],
    useCallback(
      function (value, options) {
        setState(
          (prevState) => ({
            ...prevState,
            [slice]: typeof value === "function" ? (value as any)(prevState[slice]) : value,
          }),
          options
        );
      },
      [setState]
    ),
  ];
}
