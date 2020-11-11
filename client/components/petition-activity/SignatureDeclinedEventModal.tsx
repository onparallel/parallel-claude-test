import {
  Box,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  ModalProps,
  Stack,
  Text,
} from "@chakra-ui/core";
import { useIntl } from "react-intl";

export type SignatureDeclinedEventModalProps = Omit<ModalProps, "children"> & {
  declineReason: string;
  declinerEmail: string;
  declinerName: string;
};

export function SignatureDeclinedEventModal({
  declineReason,
  declinerEmail,
  declinerName,
  ...props
}: SignatureDeclinedEventModalProps) {
  const intl = useIntl();
  return (
    <Modal {...props} size="xl">
      <ModalOverlay>
        <ModalContent>
          <ModalCloseButton
            aria-label={intl.formatMessage({
              id: "generic.close",
              defaultMessage: "Close",
            })}
          />
          <ModalBody paddingY={6}>
            <Stack>
              <Text fontSize="lg" fontWeight="bold">
                {declinerName} ({declinerEmail})
              </Text>

              <Box>
                <Text>{declineReason}</Text>
              </Box>
            </Stack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}
