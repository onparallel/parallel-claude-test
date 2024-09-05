import { Modal, ModalOverlay, ModalProps } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { createContext, PropsWithChildren, ReactNode, useContext, useEffect } from "react";
import { DialogProps } from "./DialogProvider";

type BaseModalProps = Omit<ModalProps, "children" | "isOpen" | "onClose">;

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
  return (
    <BaseDialogPropsContext.Provider value={value}>{children}</BaseDialogPropsContext.Provider>
  );
}
