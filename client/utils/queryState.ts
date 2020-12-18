import {
  TableSorting,
  TableSortingDirection,
} from "@parallel/components/common/Table";
import { useRouter } from "next/router";
import * as qs from "querystring";
import { ParsedUrlQuery } from "querystring";
import { useCallback, useMemo } from "react";
import { equals } from "remeda";
import { pathParams, resolveUrl } from "./next";

export class QueryItem<T> {
  defaultValue: T | null = null;

  constructor(
    private _parseValue: (value: string | string[] | undefined) => T | null,
    private _serialize?: (value: NonNullable<T>) => string,
    private _isDefault?: (value: NonNullable<T>) => boolean
  ) {}

  orDefault(value: T) {
    this.defaultValue = value;
    return (this as unknown) as QueryItem<NonNullable<T>>;
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
      if (
        !isNaN(parsed) &&
        parsed >= (min ?? -Infinity) &&
        parsed <= (max ?? Infinity)
      ) {
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

export function enums<T extends string>(values: T[]) {
  return new QueryItem<T | null>((value) => {
    return values.includes(value as any) ? (value as T) : null;
  });
}

export function sorting<T extends string>(fields: readonly T[]) {
  return new QueryItem<TableSorting<T>>(
    (value) => {
      if (value) {
        const [field, direction] = (value as string).split("_");
        if (
          fields.includes(field as any) &&
          ["ASC", "DESC"].includes(direction)
        ) {
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

export interface ParseQueryOptions {
  prefix?: string;
}

export function parseQuery<T extends {}>(
  query: ParsedUrlQuery,
  shape: { [P in keyof T]: QueryItem<T[P]> },
  { prefix }: ParseQueryOptions = {}
): T {
  return Object.fromEntries(
    Object.entries(shape).map(([key, component]) => {
      return [
        key,
        (component as QueryItem<any>).parseValue(
          query[prefix ? prefix + key : key]
        ),
      ];
    })
  ) as any;
}

export interface QueryStateOptions {
  prefix?: string;
}

export function useQueryState<T extends {}>(
  shape: { [P in keyof T]: QueryItem<T[P]> },
  { prefix }: QueryStateOptions = {}
) {
  const router = useRouter();
  const state = useMemo(() => {
    const state = parseQuery(router.query, shape, { prefix });
    return state;
  }, [router.query, router.pathname]);
  return [
    state,
    useCallback(
      async function (
        state:
          | { [P in keyof T]?: T[P] }
          | ((current: { [P in keyof T]?: T[P] }) => { [P in keyof T]?: T[P] })
      ) {
        const newState =
          typeof state === "function"
            ? state(parseQuery(router.query, shape, { prefix }))
            : state;
        const fromPath = pathParams(router.pathname);
        const fromState = Object.keys(shape).map((key) =>
          prefix ? prefix + key : key
        );
        const query = qs.stringify(
          Object.fromEntries([
            ...Object.entries(newState)
              .filter(
                ([key, value]) =>
                  value !== null &&
                  value !== undefined &&
                  !shape[key as keyof T].isDefault(value as any)
              )
              .map(([key, value]) => [
                prefix ? prefix + key : key,
                shape[key as keyof T].serialize(value as any),
              ]),
            // keep other params
            ...Object.entries(router.query).filter(
              ([key]) => !fromState.includes(key) && !fromPath.includes(key)
            ),
          ])
        );
        const route = resolveUrl(router.pathname, router.query);
        await router.replace(
          `${router.pathname}${query ? "?" + query : ""}`,
          `${route}${query ? "?" + query : ""}`,
          { shallow: true }
        );
      },
      [router.query, router.pathname]
    ),
  ] as const;
}
