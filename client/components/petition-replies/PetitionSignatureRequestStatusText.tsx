import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/layout";
import { AlertCircleIcon, CheckIcon, PaperPlaneIcon, TimeIcon } from "@parallel/chakra/icons";
import { PetitionSignatureRequestStatusText_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export function PetitionSignatureRequestStatusText({
  signature,
}: {
  signature: PetitionSignatureRequestStatusText_PetitionSignatureRequestFragment;
}) {
  switch (signature.status) {
    case "ENQUEUED":
    case "PROCESSING":
      return (
        <Stack direction="row" display="inline-flex" alignItems="center" color="gray.600">
          <PaperPlaneIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.starting"
              defaultMessage="Starting"
            />
          </Text>
        </Stack>
      );
    case "PROCESSED":
      return (
        <Stack direction="row" display="inline-flex" alignItems="center" color="yellow.600">
          <TimeIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.awaiting"
              defaultMessage="Awaiting"
            />
          </Text>
        </Stack>
      );
    case "CANCELLED":
      return (
        <Stack direction="row" display="inline-flex" alignItems="center" color="red.500">
          <AlertCircleIcon />
          <Text>
            {signature.cancelReason === "REQUEST_ERROR" ? (
              <FormattedMessage
                id="component.petition-sigatures-card.cancelled-request-error"
                defaultMessage="Error sending"
              />
            ) : (
              <FormattedMessage
                id="component.petition-sigatures-card.cancelled"
                defaultMessage="Cancelled"
              />
            )}
          </Text>
        </Stack>
      );
    case "COMPLETED":
      return (
        <Stack direction="row" display="inline-flex" alignItems="center" color="green.500">
          <CheckIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.completed"
              defaultMessage="Completed"
            />
          </Text>
        </Stack>
      );
  }
}

PetitionSignatureRequestStatusText.fragments = {
  PetitionSignatureRequest: gql`
    fragment PetitionSignatureRequestStatusText_PetitionSignatureRequest on PetitionSignatureRequest {
      status
      cancelReason
    }
  `,
};
