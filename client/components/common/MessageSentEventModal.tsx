import { gql } from "@apollo/client";
import {
  Box,
  Divider,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
} from "@chakra-ui/core";
import { MessageSentEventModal_MessageSentEventFragment } from "@parallel/graphql/__types";
import { RenderSlate } from "@parallel/utils/RenderSlate";
import { FormattedMessage } from "react-intl";
import { ContactLink } from "./ContactLink";

export type MessageSentEventModalProps = Omit<ModalProps, "children"> & {
  message: MessageSentEventModal_MessageSentEventFragment;
};

export function MessageSentEventModal({
  message,
  ...props
}: MessageSentEventModalProps) {
  console.log(message);

  return (
    <Modal {...props} size="xl" isCentered>
      <ModalOverlay>
        <ModalContent borderRadius="md">
          <ModalHeader paddingBottom={2}>{message.emailSubject}</ModalHeader>
          <ModalCloseButton />
          <ModalBody paddingBottom={6}>
            <Text fontSize={14}></Text>
            <Text paddingBottom={2} fontSize={14}>
              <FormattedMessage id="generic.to" defaultMessage="to" />{" "}
              <ContactLink contact={message.access.contact} />
            </Text>
            <Divider />
            <Box paddingTop={2}>
              <RenderSlate value={message.emailBody} />
            </Box>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

MessageSentEventModal.fragments = {
  MessageSentEvent: gql`
    fragment MessageSentEventModal_MessageSentEvent on MessageSentEvent {
      message {
        emailBody
        emailSubject
        access {
          contact {
            ...ContactLink_Contact
          }
        }
      }
    }
    ${ContactLink.fragments.Contact}
  `,
};
