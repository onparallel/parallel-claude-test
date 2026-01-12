import type { TableSorting, TableSortingDirection } from "@parallel/components/common/Table";
import { NextRouter, useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { MouseEvent, useCallback, useMemo } from "react";
import { isDeepEqual, isNonNullish, pick } from "remeda";
import { fromBase64, toBase64 } from "./base64";
import { NavigationOptions, useHandleNavigation } from "./navigation";
import { pathParams, resolveUrl } from "./next";
import { useUpdatingRef } from "./useUpdatingRef";

type QueryItemValidator = (value: string | string[] | undefined) => boolean;

export class QueryItem<T> {
  defaultValue: T | null = null;
  private validators: QueryItemValidator[] = [];

  constructor(
    private _parseValue: (value: string | string[] | undefined) => T | null,
    private _serialize?: (value: NonNullable<T>) => string,
    private _isDefault?: (value: NonNullable<T>) => boolean,
  ) {}

  withValidation(validator: QueryItemValidator) {
    this.validators.push(validator);
    return this;
  }

  orDefault(value: T) {
    this.defaultValue = value;
    return this as unknown as QueryItem<Exclude<T, null>>;
  }

  isDefault(value: NonNullable<T>) {
    if (this._isDefault) {
      return this._isDefault(value);
    } else {
      return isDeepEqual(this.defaultValue, value);
    }
  }

  parseValue(value: string | string[] | undefined) {
    const isValid = this.validators.reduce((prev, current) => prev && current(value), true);
    if (!isValid) {
      return this.defaultValue;
    }
    return this._parseValue(value) ?? this.defaultValue;
  }

  serialize(value: NonNullable<T>) {
    if (this._serialize) {
      return this._serialize(value);
    } else {
      return `${value}`;
    }
  }

  list({ maxItems, allowEmpty }: { maxItems?: number; allowEmpty?: boolean } = {}) {
    return new QueryItem<Exclude<T, null>[] | null>(
      (value) => {
        if (value === "" && allowEmpty) {
          return [];
        }
        if (value) {
          const parsed = (value as string)
            .split(",")
            .slice(0, maxItems)
            .map((v) => this.parseValue(v));
          return parsed.includes(null) ? null : (parsed as Exclude<T, null>[]);
        } else {
          return null;
        }
      },
      (value) =>
        value
          .filter(isNonNullish)
          .map((v) => this.serialize(v))
          .join(","),
    );
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

export function date() {
  return new QueryItem<Date | null>(
    (value) => {
      const parsed = typeof value === "string" ? new Date(parseInt(value)) : null;
      return isNonNullish(parsed) && !isNaN(parsed.valueOf()) ? parsed : null;
    },
    (value: Date) => {
      return value.valueOf().toString();
    },
  );
}

export function values<const T extends string | number>(values: readonly T[]): QueryItem<T | null> {
  return new QueryItem<any>((value) => {
    // eslint-disable-next-line eqeqeq
    return values.find((v) => v == (value as string)) ?? null;
  });
}

export function sorting<const T extends string>(
  fields: readonly T[],
  options?: { allowDynamicFields?: string | ((field: string) => boolean) },
) {
  return new QueryItem<TableSorting<T | string> | null>(
    (value) => {
      if (!value) {
        return null;
      }
      const parts = (value as string).split("_");
      if (parts.length < 2) {
        return null;
      }
      const direction = parts[parts.length - 1];
      if (!["ASC", "DESC"].includes(direction)) {
        return null;
      }
      const field = parts.slice(0, -1).join("_");
      const isStaticField = fields.includes(field as any);
      const isDynamicField = options?.allowDynamicFields
        ? typeof options.allowDynamicFields === "string"
          ? field.startsWith(options.allowDynamicFields)
          : options.allowDynamicFields(field)
        : false;

      if (isStaticField || isDynamicField) {
        return {
          field: field as T | string,
          direction: direction as TableSortingDirection,
        };
      }
      return null;
    },
    ({ field, direction }) => `${field}_${direction}`,
  );
}

export function object<T>({
  flatten,
  unflatten,
  isDefault,
}: {
  flatten?: (value: T) => any;
  unflatten?: (value: any) => T;
  isDefault?: (value: T) => boolean;
}) {
  return new QueryItem<T | null>(
    (value) => {
      if (value && typeof value === "string") {
        const decoded = JSON.parse(
          fromBase64(value.replaceAll("-", "+").replaceAll("_", "/").replaceAll(".", "=")),
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
    },
    isDefault,
  );
}

export interface ParseQueryOptions {
  prefix?: string;
}

export function parseQuery<T extends {}>(
  query: ParsedUrlQuery,
  shape: QueryStateOf<T>,
  { prefix }: ParseQueryOptions = {},
): T {
  return Object.fromEntries(
    Object.entries(shape).map(([key, component]) => {
      return [key, (component as QueryItem<any>).parseValue(query[prefix ? prefix + key : key])];
    }),
  ) as any;
}

export interface QueryStateOptions extends ParseQueryOptions {}

export type QueryStateOf<T extends {}> = { [P in keyof T]: QueryItem<T[P]> };
export type QueryStateFrom<T extends Record<string, QueryItem<any>>> =
  T extends QueryStateOf<infer U> ? U : never;

type NextQueryState<T> = T | ((prevState: T) => T);
export type SetQueryState<T> = (state: NextQueryState<T>, options?: SetQueryStateOptions) => void;

export interface SetQueryStateOptions {
  type?: "replace" | "push";
  event?: MouseEvent | globalThis.MouseEvent;
}

export function useBuildStateUrl<T extends {}>(
  shape: QueryStateOf<T>,
  options: QueryStateOptions = {},
): (state: NextQueryState<Partial<T>>) => string {
  const router = useRouter();
  const state = useMemo(() => {
    return parseQuery(router.query, shape, options);
  }, [router.query, router.pathname]);
  const stateRef = useUpdatingRef(state);
  return useBuildStateUrlInternal(() => stateRef.current, shape, options);
}

export function useQueryState<T extends {}>(
  shape: QueryStateOf<T>,
  options: QueryStateOptions = {},
): [T, SetQueryState<Partial<T>>] {
  const router = useRouter();
  const state = useMemo(() => {
    return parseQuery(router.query, shape, options);
  }, [router.query, router.pathname]);
  const stateRef = useUpdatingRef(state);
  const buildStateUrl = useBuildStateUrlInternal(() => stateRef.current, shape, options);
  const navigate = useHandleNavigation();
  return [
    state,
    useCallback(function (state, { type = "replace", event } = {}) {
      navigate(buildStateUrl(state), event, {
        type,
        shallow: true,
      });
    }, []),
  ];
}

export function buildStateUrl<T extends {}>(
  shape: QueryStateOf<T>,
  state: Partial<T>,
  currentPathname: string,
  currentQuery: ParsedUrlQuery,
  { prefix }: QueryStateOptions = {},
) {
  const invalid = Object.keys(state).find((k) => !shape.hasOwnProperty(k));
  if (invalid) {
    console.error(`Invalid key "${invalid}" in setQueryState`);
  }
  const fromPath = pathParams(currentPathname);
  const fromState = Object.keys(shape).map((key) => (prefix ? prefix + key : key));
  const newQuery = [
    ...(Object.entries(state)
      .filter(
        ([key, value]) =>
          value !== null && value !== undefined && !shape[key as keyof T].isDefault(value as any),
      )
      .map(([key, value]) => [
        prefix ? prefix + key : key,
        shape[key as keyof T].serialize(value as any),
      ]) as [string, string][]),
    // keep other params
    ...(Object.entries(currentQuery).filter(
      ([key]) => !fromState.includes(key) && !fromPath.includes(key),
    ) as [string, string][]),
  ];
  const route = resolveUrl(currentPathname, currentQuery);
  return newQuery.length > 0 ? `${route}?${new URLSearchParams(newQuery)}` : route;
}

function useBuildStateUrlInternal<T extends {}>(
  getCurrentState: () => T,
  shape: QueryStateOf<T>,
  options: QueryStateOptions = {},
): (state: NextQueryState<Partial<T>>) => string {
  const router = useRouter();
  const ref = useUpdatingRef<Pick<NextRouter, "query" | "pathname">>(
    pick(router, ["query", "pathname"]),
  );
  return useCallback(function (state) {
    const { query, pathname } = ref.current;
    const newState = typeof state === "function" ? state(getCurrentState()) : state;
    return buildStateUrl(shape, newState, pathname, query, options);
  }, []);
}

export function useQueryStateSlice<T extends {}, const K extends keyof T>(
  state: T,
  setState: SetQueryState<Partial<T>>,
  slice: K,
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
          options,
        );
      },
      [setState],
    ),
  ];
}

export function buildUseQueryState<T extends {}>(
  shape: QueryStateOf<T>,
  options: QueryStateOptions = {},
) {
  return function () {
    return useQueryState(shape, options);
  };
}

export function buildUseQueryStateSlice<T extends {}>(
  shape: QueryStateOf<T>,
  options: QueryStateOptions = {},
) {
  return function <const K extends keyof T>(slice: K) {
    return useQueryStateSlice(...useQueryState(shape, options), slice);
  };
}

export function buildParseQuery<T extends {}>(
  shape: QueryStateOf<T>,
  { prefix }: ParseQueryOptions = {},
) {
  return function (query: ParsedUrlQuery) {
    return parseQuery(query, shape, { prefix });
  };
}

export function buildBuildStateUrl<T extends {}>(
  pathname: string,
  shape: QueryStateOf<T>,
  options: QueryStateOptions = {},
) {
  return function (state: Partial<T>, query: ParsedUrlQuery = {}) {
    return buildStateUrl(shape, state, pathname, query, options);
  };
}

export function buildUseGoTo<T extends {}>(
  pathname: string,
  shape: QueryStateOf<T>,
  options: QueryStateOptions = {},
) {
  const buildStateUrl = buildBuildStateUrl(pathname, shape, options);
  return function () {
    const navigate = useHandleNavigation();
    return useCallback(
      (
        state: Partial<T>,
        query = {},
        event?: MouseEvent | globalThis.MouseEvent,
        options: NavigationOptions = {},
      ) => navigate(buildStateUrl(state, query), event, options),
      [],
    );
  };
}
