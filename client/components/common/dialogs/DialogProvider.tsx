import { Prettify } from "@parallel/utils/types";
import { NextComponentType } from "next";
import {
  cloneElement,
  ComponentType,
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface DialogCallbacks<TResult = void> {
  onResolve: (value?: TResult) => void;
  onReject: (reason?: string) => void;
}

export type DialogProps<TProps = {}, TResult = void> = TProps & DialogCallbacks<TResult>;

export type DialogOpener = <TProps = {}, TResult = void>(
  opener: (callbacks: DialogCallbacks<TResult>) => ReactElement<DialogProps<TProps, TResult>>,
) => Promise<TResult>;

const DialogOpenerContext = createContext<DialogOpener | null>(null);

interface UseDialogReturn<TProps = {}, TResult = void> {
  (
    ...args: [keyof Omit<TProps, keyof DialogCallbacks>] extends [never]
      ? []
      : [props: Prettify<Omit<TProps, keyof DialogCallbacks>>]
  ): Promise<TResult>;
  ignoringDialogErrors: (
    ...args: [keyof Omit<TProps, keyof DialogCallbacks>] extends [never]
      ? []
      : [props: Prettify<Omit<TProps, keyof DialogCallbacks>>]
  ) => Promise<void>;
}

export function useDialog<TProps = {}, TResult = void>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Dialog: ComponentType<DialogProps<TProps, TResult>>,
): UseDialogReturn<TProps, TResult> {
  const opener = useContext(DialogOpenerContext)!;
  return useMemo(
    () =>
      Object.assign(
        async (props?: Omit<TProps, keyof DialogCallbacks>) =>
          await opener((callbacks: DialogCallbacks<TResult>) => (
            <Dialog {...callbacks} {...((props as any) ?? {})} />
          )),
        {
          ignoringDialogErrors: async (props?: Omit<TProps, keyof DialogCallbacks>) => {
            try {
              await opener((callbacks: DialogCallbacks<TResult>) => (
                <Dialog {...callbacks} {...((props as any) ?? {})} />
              ));
            } catch (e) {
              if (e instanceof DialogError) {
                return;
              } else {
                throw e;
              }
            }
          },
        },
      ),
    [Dialog],
  );
}

function DialogOpenerProvider({ children }: { children?: ReactNode }) {
  const [stack, setStack] = useState<ReactElement[]>([]);
  const opener = useCallback<DialogOpener>(function (createDialog) {
    return new Promise((resolve, reject) => {
      const dialog = createDialog({
        onResolve: (result) => {
          setStack((stack) => stack.slice(0, -1));
          resolve(result as any);
        },
        onReject: (reason?: string) => {
          setStack((stack) => stack.slice(0, -1));
          reject(new DialogError(reason ?? "CANCEL"));
        },
      });
      setStack((stack) => [...stack, dialog]);
    });
  }, []);
  return (
    <DialogOpenerContext.Provider value={opener}>
      {children}
      {stack.map((dialog, index) =>
        cloneElement(dialog, {
          key: index,
          // activate this only on the topmost dialog
          blockScrollOnMount: index === stack.length - 1 ? true : false,
        }),
      )}
    </DialogOpenerContext.Provider>
  );
}

export function withDialogs<P = {}>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: NextComponentType<any, P, P>,
): NextComponentType<any, P, P> {
  const WithDialogs: NextComponentType<any, P, P> = function ({ ...props }) {
    return (
      <DialogOpenerProvider>
        <Component {...(props as any)} />
      </DialogOpenerProvider>
    );
  };
  const { displayName, ...rest } = Component;
  return Object.assign(WithDialogs, rest, {
    displayName: `WithDialogs(${displayName ?? Component.name})`,
  });
}

export class DialogError extends Error {
  constructor(public reason: string) {
    super(reason);
  }
}

export function isDialogError(value: unknown): value is DialogError {
  return value instanceof DialogError;
}
