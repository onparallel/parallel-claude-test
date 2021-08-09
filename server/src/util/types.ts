export type MaybePromise<T> = T | Promise<T>;

export type MaybeArray<T> = T | Array<T>;

export type UnwrapArray<T> = T extends Array<infer U> ? U : never;

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : never;

export type Maybe<T> = T | null;

export type If<Condition extends boolean | undefined, Then, Else = never> = Condition extends true
  ? Then
  : Else;

export type KeysOfTypeExact<T, U> = {
  [P in keyof T]-?: [U] extends [T[P]] ? ([T[P]] extends [U] ? P : never) : never;
}[keyof T];

export type KeysOfType<T, U> = {
  [P in keyof T]-?: T[P] extends U ? P : never;
}[keyof T];
