export type ExtractArrayGeneric<T> = T extends Array<infer U> ? U : never;

export type Maybe<T> = T | null;
