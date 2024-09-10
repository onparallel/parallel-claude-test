if (typeof Promise.withResolvers === "undefined") {
  Promise.withResolvers = function <T>() {
    let resolve: ((value: T | PromiseLike<T>) => void) | undefined = undefined;
    let reject: ((reason?: any) => void) | undefined = undefined;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}
