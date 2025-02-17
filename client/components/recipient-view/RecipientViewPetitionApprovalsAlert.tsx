import { AlertDescription, AlertIcon, Text } from "@chakra-ui/react";
import { Tone } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { CloseableAlert } from "../common/CloseableAlert";

interface RecipientViewPetitionApprovalsAlertProps {
  tone: Tone;
}

export function RecipientViewPetitionApprovalsAlert({
  tone,
}: RecipientViewPetitionApprovalsAlertProps) {
  return (
    <CloseableAlert status="success" zIndex={2} paddingX={6}>
      <AlertIcon />
      <AlertDescription flex="1">
        <Text>
          <FormattedMessage
            id="component.recipient-view-petition-approvals-alert.alert-description-1"
            defaultMessage="<b>Your information is being reviewed.</b> During this process, you will not be able to make changes."
            values={{
              tone,
            }}
          />
        </Text>
        <Text>
          <FormattedMessage
            id="component.recipient-view-petition-approvals-alert.alert-description-2"
            defaultMessage="If you need to correct anything, you can write to us through the enabled comments."
            values={{ tone }}
          />
        </Text>
      </AlertDescription>
    </CloseableAlert>
  );
}
