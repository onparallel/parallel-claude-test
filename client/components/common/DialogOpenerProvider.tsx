import {
  cloneElement,
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
  ReactElement,
} from "react";

type DialogCallbacks<TResult = void> = {
  onResolve: (value?: TResult) => void;
  onReject: (reason?: any) => void;
};

export type DialogProps<TProps = {}, TResult = void> = TProps &
  DialogCallbacks<TResult>;

export type DialogOpener = <TProps = {}, TResult = void>(
  opener: (
    callbacks: DialogCallbacks<TResult>
  ) => ReactElement<DialogProps<TProps, TResult>>
) => Promise<TResult>;

export const DialogOpenerContext = createContext<DialogOpener | null>(null);
// export const DialogCallbacksContext = createContext<DialogCallbacks<any>>();

export function useDialog<TProps = {}, TResult = void>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Dialog: ComponentType<DialogProps<TProps, TResult>>
): (props: Omit<TProps, keyof DialogCallbacks>) => Promise<TResult> {
  const opener = useContext(DialogOpenerContext)!;
  return useCallback(
    (props: Omit<TProps, keyof DialogCallbacks>) =>
      opener((callbacks: DialogCallbacks<TResult>) => (
        <Dialog {...callbacks} {...(props as any)} />
      )),
    [Dialog]
  );
}

export function DialogOpenerProvider({ children }: { children?: ReactNode }) {
  const [stack, setStack] = useState<ReactElement[]>([]);
  const opener = useCallback<DialogOpener>(function (createDialog) {
    return new Promise((resolve, reject) => {
      const dialog = createDialog({
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
  }, []);
  return (
    <DialogOpenerContext.Provider value={opener}>
      {children}
      {stack.map((dialog, index) => cloneElement(dialog, { key: index }))}
    </DialogOpenerContext.Provider>
  );
}
