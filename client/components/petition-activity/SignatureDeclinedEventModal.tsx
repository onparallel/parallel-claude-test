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
} from "@chakra-ui/react";
import { ContactLink_ContactFragment, Maybe } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { ContactLink } from "../common/ContactLink";
import { DeletedContact } from "../common/DeletedContact";

export type SignatureDeclinedEventModalProps = Omit<ModalProps, "children"> & {
  declineReason: string;
  contact: Maybe<ContactLink_ContactFragment>;
};

export function SignatureDeclinedEventModal({
  declineReason,
  contact,
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
                {contact ? (
                  <ContactLink contact={contact} />
                ) : (
                  <DeletedContact />
                )}
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
