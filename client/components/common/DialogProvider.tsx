import {
  useContext,
  createContext,
  ReactElement,
  ReactNode,
  useState,
  useMemo,
  useCallback
} from "react";

type OpenDialog<T> = (props: {
  onConfirm: (value?: T) => void;
  onCancel: (reason?: any) => void;
}) => ReactNode;

export const DialogContext = createContext<{
  <T>(opener: OpenDialog<T>): Promise<T>;
}>(null as any);

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children?: ReactNode }) {
  const [dialog, setDialog] = useState<ReactNode>([]);
  const openDialog = useCallback(function openDialog<T>(opener: OpenDialog<T>) {
    const promise = new Promise<T>((resolve, reject) => {
      setDialog(
        opener({
          onConfirm(result?: T) {
            setDialog(null);
            resolve(result);
          },
          onCancel(reason?: any) {
            setDialog(null);
            reject(reason);
          }
        })
      );
    });
    return promise;
  }, []);
  return (
    <DialogContext.Provider value={openDialog}>
      {children}
      {dialog}
    </DialogContext.Provider>
  );
}
