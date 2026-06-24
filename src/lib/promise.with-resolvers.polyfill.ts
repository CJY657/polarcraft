type PromiseWithResolversResult<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

declare global {
  interface PromiseConstructor {
    withResolvers<T>(): PromiseWithResolversResult<T>;
  }
}

const PromiseConstructorWithResolvers = Promise as PromiseConstructor & {
  withResolvers?: PromiseConstructor["withResolvers"];
};

if (typeof PromiseConstructorWithResolvers.withResolvers !== "function") {
  Object.defineProperty(PromiseConstructorWithResolvers, "withResolvers", {
    configurable: true,
    value: <T>() => {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
      });

      return { promise, resolve, reject };
    },
    writable: true,
  });
}

export {};
