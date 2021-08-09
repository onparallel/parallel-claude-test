declare module "@camwiegert/typical" {
  export type TypicalArg = string | number | TypicalFunc | Promise<any>;
  export type TypicalFunc = (node: HTMLElement, ...args: TypicalArg[]) => Promise<void>;

  export const type: TypicalFunc;
}
