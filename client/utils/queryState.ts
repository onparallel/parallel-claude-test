import {
  TableSorting,
  TableSortingDirection,
} from "@parallel/components/common/Table";
import {
  FilterSharedBy,
  flatShared,
  unflatShared,
} from "@parallel/components/petition-list/filters/PetitionListSharedByFilterContainer";
import { NextRouter, useRouter } from "next/router";
import * as qs from "querystring";
import { ParsedUrlQuery } from "querystring";
import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { equals, pick } from "remeda";
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

export function values<T>(values: T[]): QueryItem<T | null>;
export function values<T extends string>(values: T[]): QueryItem<T | null>;
export function values(values: any[]): QueryItem<any> {
  return new QueryItem<any>((value) => {
    // eslint-disable-next-line eqeqeq
    return values.find((v) => v == value) ?? null;
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

export function filtering() {
  return new QueryItem(
    (value) => {
      if (value && typeof value === "string") {
        const decoded = decodeURI(value);
        const filters = JSON.parse(atob(decoded));

        Object.entries(filters).forEach(([key, value]) => {
          switch (key) {
            case "sharedWith": {
              filters.sharedWith = unflatShared(value as string[]);
              break;
            }
            default: {
              break;
            }
          }
        });

        return filters;
      }
      return null;
    },
    (filters) => {
      if (!filters) return "";

      Object.entries(filters).forEach(([key, value]) => {
        switch (key) {
          case "sharedWith": {
            filters.sharedWith = flatShared(value as FilterSharedBy);
            break;
          }
          default: {
            break;
          }
        }
      });

      const base64 = btoa(JSON.stringify(filters));
      const encoded = encodeURI(base64);
      return encoded;
    }
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
): [T, Dispatch<SetStateAction<Partial<T>>>] {
  const router = useRouter();
  const state = useMemo(() => {
    return parseQuery(router.query, shape, { prefix });
  }, [router.query, router.pathname]);
  const ref = useUpdatingRef<Pick<NextRouter, "query" | "pathname">>(
    pick(router, ["query", "pathname"])
  );
  return [
    state,
    useCallback(async function (state) {
      const { query, pathname } = ref.current;
      const newState =
        typeof state === "function"
          ? state(parseQuery(query, shape, { prefix }))
          : state;
      const fromPath = pathParams(pathname);
      const fromState = Object.keys(shape).map((key) =>
        prefix ? prefix + key : key
      );
      const newQuery = qs.stringify(
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
          ...Object.entries(query).filter(
            ([key]) => !fromState.includes(key) && !fromPath.includes(key)
          ),
        ])
      );
      const route = resolveUrl(pathname, query);
      await router.replace(
        `${pathname}${newQuery ? "?" + newQuery : ""}`,
        `${route}${newQuery ? "?" + newQuery : ""}`,
        { shallow: true }
      );
    }, []),
  ];
}

export function useQueryStateSlice<T extends {}, K extends keyof T>(
  state: T,
  setState: Dispatch<SetStateAction<Partial<T>>>,
  slice: K
): [T[K], Dispatch<SetStateAction<T[K]>>] {
  return [
    state[slice],
    useCallback(
      function (value) {
        setState((prevState) => ({
          ...prevState,
          [slice]:
            typeof value === "function"
              ? (value as any)(prevState[slice])
              : value,
        }));
      },
      [setState]
    ),
  ];
}
