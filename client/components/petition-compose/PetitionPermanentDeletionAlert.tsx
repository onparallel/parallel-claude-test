import { Alert, AlertDescription, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";
import { HStack } from "../ui";

interface PetitionPermanentDeletionAlertProps extends AlertProps {
  date: string;
  isTemplate?: boolean;
}

export function PetitionPermanentDeletionAlert({
  date,
  isTemplate = false,
  ...props
}: PetitionPermanentDeletionAlertProps) {
  const intl = useIntl();
  return (
    <Alert status="error" {...props}>
      <AlertIcon />
      <HStack justifyContent="space-between" flex={1}>
        <AlertDescription>
          <FormattedMessage
            id="component.petition-permanent-deletion-alert.title"
            defaultMessage="This {isTemplate, select, true {template} other {parallel}} will be permanently deleted on {date}."
            values={{
              date: <b>{intl.formatDate(date, FORMATS.LL)}</b>,
              isTemplate,
            }}
          />
        </AlertDescription>
      </HStack>
    </Alert>
  );
}
