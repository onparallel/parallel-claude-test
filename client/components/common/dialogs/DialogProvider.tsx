import { Modal, ModalOverlay, ModalProps } from "@chakra-ui/react";
import { Prettify } from "@parallel/utils/types";
import { NextComponentType } from "next";
import { useRouter } from "next/router";
import {
  ComponentType,
  createContext,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isNonNullish } from "remeda";
import { Wrap } from "../Wrap";

export interface DialogCallbacks<TResult = void> {
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
      ? [props?: { modalProps?: BaseModalProps }]
      : [props: Prettify<Omit<TProps, keyof DialogCallbacks> & { modalProps?: BaseModalProps }>]
  ): Promise<TResult>;
  ignoringDialogErrors: (
    ...args: [keyof Omit<TProps, keyof DialogCallbacks>] extends [never]
      ? [props?: { modalProps?: BaseModalProps }]
      : [props: Prettify<Omit<TProps, keyof DialogCallbacks> & { modalProps?: BaseModalProps }>]
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
        async (
          props?: Prettify<
            Omit<TProps, keyof DialogCallbacks | keyof BaseModalProps> & {
              modalProps?: BaseModalProps;
            }
          >,
        ) => {
          const { modalProps, ...rest } = props ?? {};
          return await opener((callbacks: DialogCallbacks<TResult>) => (
            <Wrap
              when={isNonNullish(modalProps)}
              wrapper={({ children }) => (
                <BaseDialogPropsProvider value={modalProps!}>{children}</BaseDialogPropsProvider>
              )}
            >
              <Dialog {...callbacks} {...(rest as any)} />
            </Wrap>
          ));
        },
        {
          ignoringDialogErrors: async (
            props?: Prettify<Omit<TProps, keyof DialogCallbacks> & { modalProps?: BaseModalProps }>,
          ) => {
            try {
              const { modalProps, ...rest } = props ?? {};
              await opener((callbacks: DialogCallbacks<TResult>) => (
                <Wrap
                  when={isNonNullish(modalProps)}
                  wrapper={({ children }) => (
                    <BaseDialogPropsProvider value={modalProps!}>
                      {children}
                    </BaseDialogPropsProvider>
                  )}
                >
                  <Dialog {...callbacks} {...(rest as any)} />
                </Wrap>
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
      ) as any,
    [Dialog],
  );
}

const BLOCKED_SCROLL = { blockScrollOnMount: true };
const UNBLOCKED_SCROLL = { blockScrollOnMount: false };

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
      {stack.map((dialog, index) => (
        <BaseDialogPropsProvider
          key={index}
          value={index === stack.length - 1 ? BLOCKED_SCROLL : UNBLOCKED_SCROLL}
        >
          {dialog}
        </BaseDialogPropsProvider>
      ))}
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

export type BaseModalProps = Omit<ModalProps, "children" | "isOpen" | "onClose">;

export interface BaseDialogProps<TResult> extends BaseModalProps, DialogProps<{}, TResult> {
  closeOnNavigation?: boolean;
  children: ReactNode;
}

export function BaseDialog<TResult = void>({
  onResolve,
  onReject,
  closeOnNavigation,
  children,
  ...props
}: BaseDialogProps<TResult>) {
  const router = useRouter();
  useEffect(() => {
    if (closeOnNavigation) {
      const routeChangeStartHandler = () => onReject("NAVIGATION");
      router.events.on("routeChangeStart", routeChangeStartHandler);
      return () => router.events.off("routeChangeStart", routeChangeStartHandler);
    }
  }, [closeOnNavigation]);
  const contextProps = useContext(BaseDialogPropsContext);
  return (
    <Modal isOpen={true} onClose={() => onReject("CLOSE")} {...contextProps} {...props}>
      <ModalOverlay>{children}</ModalOverlay>
    </Modal>
  );
}

const BaseDialogPropsContext = createContext<BaseModalProps>({});

export function BaseDialogPropsProvider({
  children,
  value,
}: PropsWithChildren<{ value: BaseModalProps }>) {
  const parent = useContext(BaseDialogPropsContext);
  const merged = useMemo(() => Object.assign({}, value, parent), [value, parent]);
  return (
    <BaseDialogPropsContext.Provider value={merged}>{children}</BaseDialogPropsContext.Provider>
  );
}
