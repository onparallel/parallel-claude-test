import {
  cloneElement,
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactElement,
} from "react";

export type DialogProps<T = void> = {
  onResolve: (value?: T) => void;
  onReject: (reason?: any) => void;
};

export type Dialog<TProps, TResult> = ComponentType<
  TProps & DialogProps<TResult>
>;

export type DialogOpener = <TResult>(
  opener: (
    callbacks: DialogProps<TResult>
  ) => ReactElement<DialogProps<TResult>>
) => Promise<TResult>;

export const DialogOpenerContext = createContext<{
  opener: DialogOpener;
}>(null as any);

// eslint-disable-next-line @typescript-eslint/naming-convention
export function useDialog<TProps, TResult>(Dialog: Dialog<TProps, TResult>) {
  const { opener } = useContext(DialogOpenerContext);
  return useCallback(
    (props: TProps) =>
      opener((callbacks: DialogProps<TResult>) => (
        <Dialog {...callbacks} {...props} />
      )),
    [Dialog]
  );
}

export function DialogOpenerProvider({ children }: { children?: ReactNode }) {
  const [stack, setStack] = useState<ReactElement[]>([]);
  const value = useMemo(
    () => ({
      opener: function (opener) {
        return new Promise((resolve, reject) => {
          const dialog = opener({
            onResolve: (result) => {
              setStack((stack) => stack.slice(0, -1));
              resolve(result as any);
            },
            onReject: (reason?: any) => {
              setStack((stack) => stack.slice(0, -1));
              reject(reason);
            },
          });
          setStack((stack) => [...stack, dialog]);
        });
      } as DialogOpener,
    }),
    []
  );
  return (
    <DialogOpenerContext.Provider value={value}>
      {children}
      {stack.map((dialog, index) => cloneElement(dialog, { key: index }))}
    </DialogOpenerContext.Provider>
  );
}
