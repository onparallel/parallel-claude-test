export type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | Array<T>;
export type MaybeFunction<T> = T | (() => T);
export type UnwrapArray<T> = T extends Array<infer U> ? U : never;
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : never;
export type Maybe<T> = T | null;
export type Assert<T> = Exclude<T, null | undefined>;

export function unMaybeArray<T>(items: MaybeArray<T>) {
  return Array.isArray(items) ? items : [items];
}

export type If<Condition extends boolean | undefined, Then, Else = never> = Condition extends true
  ? Then
  : Else;

export type UnionToArrayUnion<T> = T extends any ? T[] : never;

export type IsEmptyObject<T> = keyof T extends [never] ? true : false;

export interface Focusable {
  focus(options?: FocusOptions): void;
}
