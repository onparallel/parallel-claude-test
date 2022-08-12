import { Modal, ModalOverlay, ModalProps } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";
import { DialogProps } from "./DialogProvider";

export interface BaseDialogProps<TResult>
  extends Omit<ModalProps, "children" | "isOpen" | "onClose">,
    DialogProps<{}, TResult> {
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
  return (
    <Modal isOpen={true} onClose={() => onReject("CLOSE")} {...props}>
      <ModalOverlay>{children}</ModalOverlay>
    </Modal>
  );
}
