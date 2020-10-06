import {
  Box,
  Button,
  ButtonProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/core";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import {
  useDialog,
  DialogProps,
} from "@parallel/components/common/DialogOpenerProvider";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export function MarkAsReviewedDialog({
  onResolve,
  onReject,
  ...props
}: DialogProps<{}, "APPROVE" | "REJECT" | "MANUAL">) {
  return (
    <Modal
      {...props}
      isOpen={true}
      onClose={() => onReject({ reason: "CLOSE" })}
    >
      <ModalOverlay>
        <ModalContent borderRadius="md">
          <ModalHeader>
            <FormattedMessage
              id="petition-replies.mark-all-as-reviewed.dialog-heading"
              defaultMessage="There are answers without approval or rejection..."
            />

            <Text fontWeight="normal" fontSize="sm">
              <FormattedMessage
                id="petition-replies.mark-all-as-reviewed.dialog-subheading"
                defaultMessage="What do you want to do with them?"
              />
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack
              alignItems="center"
              width="fit-content"
              margin="auto"
              marginBottom={1}
            >
              <Option onClick={() => onResolve("APPROVE")}>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  backgroundColor="green.500"
                  borderRadius="md"
                  margin={1}
                  padding={1}
                >
                  <CheckIcon fontSize="sm" color="white" />
                </Box>
                <FormattedMessage
                  id="petition-replies.mark-all-as-reviewed.dialog-approve"
                  defaultMessage="Approve unreviewed responses"
                />
              </Option>
              <Option onClick={() => onResolve("REJECT")}>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  backgroundColor="red.500"
                  borderRadius="md"
                  margin={1}
                  padding={1}
                >
                  <CloseIcon fontSize="sm" color="white" />
                </Box>
                <FormattedMessage
                  id="petition-replies.mark-all-as-reviewed.dialog-reject"
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
                  id="petition-replies.mark-all-as-reviewed.dialog-manual-review"
                  defaultMessage="Manual review"
                />
              </Option>
            </Stack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}
function Option({
  children,
  ...props
}: ButtonProps & {
  children?: ReactNode;
}) {
  return (
    <Button
      margin={1}
      padding={1}
      height="46px"
      width="100%"
      fontWeight="normal"
      backgroundColor="white"
      border="1px solid"
      borderColor="gray.200"
      {...props}
    >
      {children}
    </Button>
  );
}

export function useMarkAsReviewedDialog() {
  return useDialog(MarkAsReviewedDialog);
}
