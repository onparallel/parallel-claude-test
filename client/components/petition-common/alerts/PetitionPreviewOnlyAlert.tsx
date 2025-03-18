import { Alert, AlertDescription, AlertIcon, Button, HStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";

export function PetitionPreviewOnlyAlert({
  onGeneratePrefilledLink,
}: {
  onGeneratePrefilledLink?: () => void;
}) {
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
        {isNonNullish(onGeneratePrefilledLink) ? (
          <Button size="sm" colorScheme="blue" marginStart={2} onClick={onGeneratePrefilledLink}>
            <FormattedMessage
              id="page.preview.generate-prefilled-link"
              defaultMessage="Generate prefilled link"
            />
          </Button>
        ) : null}
      </HStack>
    </Alert>
  );
}
