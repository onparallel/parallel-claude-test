import { Stack, Text } from "@chakra-ui/layout";
import { AlertCircleIcon, CheckIcon, PaperPlaneIcon, TimeIcon } from "@parallel/chakra/icons";
import { PetitionSignatureRequestStatus } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export function PetitionSignatureRequestStatusText({
  status,
}: {
  status: PetitionSignatureRequestStatus;
}) {
  switch (status) {
    case "ENQUEUED":
      return (
        <Stack direction="row" display="inline-flex" alignItems="center" color="gray.600">
          <PaperPlaneIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.sending"
              defaultMessage="Sending"
            />
          </Text>
        </Stack>
      );
    case "PROCESSING":
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
            <FormattedMessage
              id="component.petition-sigatures-card.cancelled"
              defaultMessage="Cancelled"
            />
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
