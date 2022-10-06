import { TableSorting, TableSortingDirection } from "@parallel/components/common/Table";
import type Router from "next/router";
import { NextRouter, useRouter } from "next/router";
import { MouseEvent, useCallback, useMemo } from "react";
import { equals, isDefined, pick } from "remeda";
import { fromBase64, toBase64 } from "./base64";
import { useHandleNavigation } from "./navigation";
import { pathParams, resolveUrl } from "./next";
import { useUpdatingRef } from "./useUpdatingRef";

type QueryItemValidator = (value: string | string[] | undefined) => boolean;

export class QueryItem<T> {
  defaultValue: T | null = null;
  private validators: QueryItemValidator[] = [];

  constructor(
    private _parseValue: (value: string | string[] | undefined) => T | null,
    private _serialize?: (value: NonNullable<T>) => string,
    private _isDefault?: (value: NonNullable<T>) => boolean
  ) {}

  withValidation(validator: QueryItemValidator) {
    this.validators.push(validator);
    return this;
  }

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

  list(maxItems?: number) {
    return new QueryItem<NonNullable<T>[] | null>(
      (value) => {
        if (value) {
          const parsed = (value as string)
            .split(",")
            .slice(0, maxItems)
            .map((v) => this.parseValue(v));
          return parsed.includes(null) ? null : (parsed as NonNullable<T>[]);
        } else {
          return null;
        }
      },
      (value) =>
        value
          .filter(isDefined)
          .map((v) => this.serialize(v))
          .join(",")
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
      return isDefined(parsed) && !isNaN(parsed.valueOf()) ? parsed : null;
    },
    (value: Date) => {
      return value.valueOf().toString();
    }
  );
}

export function values<T extends string | number>(values: readonly T[]): QueryItem<T | null> {
  return new QueryItem<any>((value) => {
    // eslint-disable-next-line eqeqeq
    return values.find((v) => v == (value as string)) ?? null;
  });
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
export type QueryStateFrom<T extends Record<string, QueryItem<any>>> = T extends QueryStateOf<
  infer U
>
  ? U
  : never;

type NextQueryState<T> = T | ((prevState: T) => T);
export type SetQueryState<T> = (state: NextQueryState<T>, options?: SetQueryStateOptions) => void;

export interface SetQueryStateOptions {
  type?: "replace" | "push";
  event?: MouseEvent | globalThis.MouseEvent;
}

export function useBuildStateUrl<T extends {}>(
  shape: QueryStateOf<T>,
  options: QueryStateOptions = {}
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
  options: QueryStateOptions = {}
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

function useBuildStateUrlInternal<T extends {}>(
  getCurrentState: () => T,
  shape: QueryStateOf<T>,
  { prefix }: QueryStateOptions = {}
): (state: NextQueryState<Partial<T>>) => string {
  const router = useRouter();
  const ref = useUpdatingRef<Pick<NextRouter, "query" | "pathname">>(
    pick(router, ["query", "pathname"])
  );
  return useCallback(function (state) {
    const { query, pathname } = ref.current;
    const newState = typeof state === "function" ? state(getCurrentState()) : state;
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
            value !== null && value !== undefined && !shape[key as keyof T].isDefault(value as any)
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
    return newQuery.length > 0 ? `${route}?${new URLSearchParams(newQuery)}` : route;
  }, []);
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
