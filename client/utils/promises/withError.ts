import { MaybePromise } from "../types";
import { isPromiseLike } from "./isPromiseLike";

export type AsyncResult<T = any, E = Error> = [E] | [null, T];

export async function withError<E = Error, T = any>(
  value: PromiseLike<T> | (() => MaybePromise<T>)
): Promise<AsyncResult<T, E>> {
  try {
    return [null, isPromiseLike(value) ? await value : await value()];
  } catch (e) {
    return [e];
  }
}
