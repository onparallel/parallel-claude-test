import { Alert, AlertDescription, AlertIcon, HStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PetitionPreviewOnlyAlert() {
  return (
    <Alert status="info">
      <AlertIcon />
      <HStack>
        <AlertDescription flex={1}>
          <FormattedMessage
            id="component.petition-preview-only-alert.description"
            defaultMessage="<b>Preview only</b> - Changes you add as replies or comments will not be saved. To complete and submit this template click on <b>{button}</b>."
            values={{
              button: (
                <FormattedMessage id="generic.create-petition" defaultMessage="Create parallel" />
              ),
            }}
          />
        </AlertDescription>
      </HStack>
    </Alert>
  );
}
