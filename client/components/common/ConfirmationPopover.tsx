import {
  Button,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  MouseEvent,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  cloneElement,
  useRef,
} from "react";
import { FormattedMessage } from "react-intl";

interface ConfirmPopoverProps {
  description: ReactNode;
  confirm: ReactElement;
  cancel?: ReactNode;
}

export function ConfimationPopover({
  children,
  description,
  confirm,
  cancel,
}: PropsWithChildren<ConfirmPopoverProps>) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Popover returnFocusOnClose={false}>
      {({ onClose }) => (
        <>
          <PopoverTrigger>{children}</PopoverTrigger>
          <Portal>
            <PopoverContent width="fit-content">
              <PopoverBody>
                <Stack>
                  <Text>{description}</Text>
                  <HStack justifyContent="center">
                    {cancel ?? (
                      <Button ref={cancelRef} onClick={onClose} size="sm">
                        <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
                      </Button>
                    )}
                    {cloneElement(confirm, {
                      ...confirm.props,
                      onClick: (e: MouseEvent) => {
                        onClose();
                        confirm.props.onClick?.(e);
                      },
                    })}
                  </HStack>
                </Stack>
              </PopoverBody>
              <PopoverArrow />
            </PopoverContent>
          </Portal>
        </>
      )}
    </Popover>
  );
}
