export type MaybePromise<T> = T | Promise<T>;

export type MaybeArray<T> = T | Array<T>;
export function unMaybeArray<T>(maybeArray: MaybeArray<T>) {
  return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
}

type AnyFunction = (...args: any) => any;

export type MaybeFunction<TResult, TArgs extends any[] = []> = TResult extends AnyFunction
  ? never
  : TResult | ((...args: TArgs) => TResult);
export function unMaybeFunction<TResult, TArgs extends any[] = []>(
  maybeFunction: MaybeFunction<TResult, TArgs>,
  ...args: TArgs
): TResult {
  return typeof maybeFunction === "function" ? maybeFunction(...args) : maybeFunction;
}

export type UnwrapArray<T> = T extends readonly (infer U)[] ? U : never;
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : never;
export type Maybe<T> = T | null;
export type Assert<T> = Exclude<T, null | undefined>;
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type If<Condition, Then, Else = never> = Condition extends false | undefined ? Else : Then;

export type UnionToArrayUnion<T> = T extends any ? T[] : never;

export type ArrayUnionToUnion<T> = T extends (infer U)[] ? U : never;

export type IsEmptyObject<T> = keyof T extends [never] ? true : false;

export interface Focusable {
  focus(options?: FocusOptions): void;
}

export function assertType<T>(value: unknown): asserts value is T {}
