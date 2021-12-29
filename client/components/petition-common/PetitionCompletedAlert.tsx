import { Alert, AlertDescription, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PetitionCompletedAlert(props: AlertProps) {
  return (
    <Alert status="warning" {...props}>
      <AlertIcon color="yellow.500" />
      <AlertDescription>
        <FormattedMessage
          id="component.petition-completed-alert.description"
          defaultMessage="<b>Petition completed</b>, if you make any changes, the petition must be <b>finalized again</b>."
        />
      </AlertDescription>
    </Alert>
  );
}
