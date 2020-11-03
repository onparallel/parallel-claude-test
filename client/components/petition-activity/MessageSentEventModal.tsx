import { gql } from "@apollo/client";
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
import { MessageSentEventModal_PetitionMessageFragment } from "@parallel/graphql/__types";
import { RenderSlate } from "@parallel/utils/RenderSlate";
import { FormattedMessage, useIntl } from "react-intl";
import { ContactLink } from "../common/ContactLink";
import { Divider } from "../common/Divider";

export type MessageSentEventModalProps = Omit<ModalProps, "children"> & {
  message: MessageSentEventModal_PetitionMessageFragment;
};

export function MessageSentEventModal({
  message,
  ...props
}: MessageSentEventModalProps) {
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
                {message.emailSubject}
              </Text>
              <Text>
                <FormattedMessage
                  id="generic.to"
                  defaultMessage="To {recipient}"
                  values={{
                    recipient: (
                      <ContactLink isFull contact={message.access.contact!} />
                    ),
                  }}
                />
              </Text>
              <Divider />
              <Box>
                <RenderSlate value={message.emailBody} />
              </Box>
            </Stack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

MessageSentEventModal.fragments = {
  PetitionMessage: gql`
    fragment MessageSentEventModal_PetitionMessage on PetitionMessage {
      emailBody
      emailSubject
      access {
        contact {
          ...ContactLink_Contact
        }
      }
    }
    ${ContactLink.fragments.Contact}
  `,
};
