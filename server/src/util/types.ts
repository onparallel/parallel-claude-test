export type MaybePromise<T> = T | Promise<T>;

export type MaybeArray<T> = T | Array<T>;

export function unMaybeArray<T>(items: MaybeArray<T>) {
  return Array.isArray(items) ? items : [items];
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

export type Replace<T, U extends Partial<Record<keyof T, any>>> = Omit<T, keyof U> & U;

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type If<Condition, Then, Else = never> = Condition extends false | undefined ? Else : Then;

export type KeysOfTypeExact<T, U> = {
  [P in keyof T]-?: [U] extends [T[P]] ? ([T[P]] extends [U] ? P : never) : never;
}[keyof T];

export type KeysOfType<T, U> = {
  [P in keyof T]-?: T[P] extends U ? P : never;
}[keyof T];
