import { MaybePromise } from "../types";

type PromiseExecutor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void,
) => void;

export class LazyPromise<T> extends Promise<T> {
  private promise: Promise<T> | undefined;

  static from<T>(value: () => MaybePromise<T>) {
    return new LazyPromise<T>((resolve) => {
      resolve(value());
    });
  }

  static override resolve(): LazyPromise<void>;
  static override resolve<T>(value?: T | PromiseLike<T>): LazyPromise<T> {
    return new LazyPromise<T>((resolve) => {
      resolve(value as any);
    });
  }

  static override reject<T = never>(reason?: any) {
    return new LazyPromise<T>((resolve, reject) => {
      reject(reason);
    });
  }

  constructor(private executor: PromiseExecutor<T>) {
    super((resolve) => resolve(null as T));
  }

  override then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ): Promise<TResult1 | TResult2> {
    this.promise ??= new Promise(this.executor);
    return this.promise.then(onfulfilled, onrejected);
  }

  override catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined,
  ): Promise<T | TResult> {
    this.promise ??= new Promise(this.executor);
    return this.promise.catch(onrejected);
  }

  override finally(onfinally?: (() => void) | null | undefined): Promise<T> {
    this.promise ??= new Promise(this.executor);
    return this.promise.finally(onfinally);
  }
}
