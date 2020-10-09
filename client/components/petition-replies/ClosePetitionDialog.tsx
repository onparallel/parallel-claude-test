import {
  Button,
  ButtonProps,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/core";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import {
  useDialog,
  DialogProps,
} from "@parallel/components/common/DialogOpenerProvider";
import { ReactElement, ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export function ClosePetitionDialog({
  onResolve,
  onReject,
  ...props
}: DialogProps<{}, "APPROVE" | "REJECT" | "MANUAL">) {
  return (
    <Modal
      {...props}
      size="sm"
      isOpen={true}
      onClose={() => onReject({ reason: "CLOSE" })}
    >
      <ModalOverlay>
        <ModalContent borderRadius="md">
          <ModalHeader>
            <FormattedMessage
              id="petition-replies.close-petition.dialog-heading"
              defaultMessage="There are answers without approval or rejection..."
            />

            <Text fontWeight="normal" fontSize="sm">
              <FormattedMessage
                id="petition-replies.close-petition.dialog-subheading"
                defaultMessage="What do you want to do with them?"
              />
            </Text>
          </ModalHeader>
          <ModalBody>
            <Flex direction="column" alignItems="center" marginBottom={3}>
              <Option
                leftIcon={
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="green.500"
                    borderRadius="md"
                    margin={1}
                    height="24px"
                    width="24px"
                  >
                    <CheckIcon fontSize="sm" color="white" />
                  </Flex>
                }
                onClick={() => onResolve("APPROVE")}
              >
                <FormattedMessage
                  id="petition-replies.close-petition.dialog-approve"
                  defaultMessage="Approve unreviewed responses"
                />
              </Option>
              <Option
                leftIcon={
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="red.500"
                    borderRadius="md"
                    margin={1}
                    height="24px"
                    width="24px"
                  >
                    <CloseIcon fontSize="xs" color="white" />
                  </Flex>
                }
                onClick={() => onResolve("REJECT")}
              >
                <FormattedMessage
                  id="petition-replies.close-petition.dialog-reject"
                  defaultMessage="Reject unreviewed responses"
                />
              </Option>
              <Option
                backgroundColor="auto"
                fontWeight="bold"
                justifyContent="center"
                onClick={() => onResolve("MANUAL")}
              >
                <FormattedMessage
                  id="petition-replies.close-petition.dialog-manual-review"
                  defaultMessage="Manual review"
                />
              </Option>
            </Flex>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}
function Option({
  children,
  leftIcon,
  ...props
}: ButtonProps & {
  children?: ReactNode;
  leftIcon?: ReactElement;
}) {
  return (
    <Button
      leftIcon={leftIcon}
      margin={1}
      padding={1}
      height="46px"
      width="100%"
      fontWeight="normal"
      backgroundColor="white"
      border="1px solid"
      borderColor="gray.200"
      display="flex"
      justifyContent="flex-start"
      {...props}
    >
      {children}
    </Button>
  );
}

export function useClosePetitionDialog() {
  return useDialog(ClosePetitionDialog);
}
