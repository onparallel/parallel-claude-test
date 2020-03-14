import {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState
} from "react";

export type DialogCallbacks<T> = {
  onResolve: (value?: T) => void;
  onReject: (reason?: any) => void;
};

export type Dialog<TProps, TResult> = ComponentType<
  TProps & DialogCallbacks<TResult>
>;

export type DialogOpener = <TResult>(
  opener: (callbacks: DialogCallbacks<TResult>) => ReactNode
) => Promise<TResult>;

export const DialogOpenerContext = createContext<DialogOpener>(null as any);

export function useDialog<TProps, TResult>(
  Dialog: Dialog<TProps, TResult>,
  deps: any[]
) {
  const opener = useContext(DialogOpenerContext);
  return useCallback(
    (props: Omit<TProps, keyof DialogCallbacks<TResult>>) =>
      opener((callbacks: DialogCallbacks<TResult>) => (
        <Dialog {...({ ...callbacks, ...props } as any)} />
      )),
    [Dialog, ...deps]
  );
}

export function DialogOpenerProvider({ children }: { children?: ReactNode }) {
  const [dialog, setDialog] = useState<ReactNode>([]);
  const opener = useCallback(function opener<TResult>(
    opener: (callbacks: DialogCallbacks<TResult>) => ReactNode
  ) {
    return new Promise<TResult>((resolve, reject) => {
      setDialog(
        opener({
          onResolve: (result?: TResult) => {
            setDialog(null);
            resolve(result);
          },
          onReject: (reason?: any) => {
            setDialog(null);
            reject(reason);
          }
        })
      );
    });
  },
  []);
  return (
    <DialogOpenerContext.Provider value={opener}>
      {children}
      {dialog}
    </DialogOpenerContext.Provider>
  );
}
