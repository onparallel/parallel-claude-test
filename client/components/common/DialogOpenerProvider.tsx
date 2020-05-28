import {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
  Fragment,
  cloneElement,
} from "react";

export type DialogProps<T> = {
  position: number;
  onResolve: (value?: T) => void;
  onReject: (reason?: any) => void;
};

export type Dialog<TProps, TResult> = ComponentType<
  TProps & DialogProps<TResult>
>;

export type DialogOpener = <TResult>(
  opener: (callbacks: DialogProps<TResult>) => ReactNode
) => Promise<TResult>;

export const DialogOpenerContext = createContext<{
  opener: DialogOpener;
}>(null as any);

// eslint-disable-next-line @typescript-eslint/naming-convention
export function useDialog<TProps, TResult>(Dialog: Dialog<TProps, TResult>) {
  const { opener } = useContext(DialogOpenerContext);
  return useCallback(
    (props: Omit<TProps, keyof DialogProps<TResult>>) =>
      opener((callbacks: DialogProps<TResult>) => (
        <Dialog {...({ ...callbacks, ...props } as any)} />
      )),
    [Dialog]
  );
}

export function DialogOpenerProvider({ children }: { children?: ReactNode }) {
  const [stack, setStack] = useState<ReactNode[]>([]);
  const opener: DialogOpener = useCallback(
    function (opener) {
      return new Promise((resolve, reject) => {
        const dialog = opener({
          position: 0,
          onResolve: (result) => {
            setStack(stack.slice(0, -1));
            resolve(result);
          },
          onReject: (reason?: any) => {
            setStack(stack.slice(0, -1));
            reject(reason);
          },
        });
        setStack([...stack, dialog]);
      });
    },
    [stack]
  );
  return (
    <DialogOpenerContext.Provider value={{ opener }}>
      {children}
      {stack.map((dialog, index) => (
        // as long as it's a stack, using index as key is ok
        <Fragment key={index}>
          {cloneElement(dialog as any, { position: index })}
        </Fragment>
      ))}
    </DialogOpenerContext.Provider>
  );
}
