import { Alert, AlertDescription, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PetitionApprovalsAboutToStartAlert(props: AlertProps) {
  return (
    <Alert status="info" {...props}>
      <AlertIcon />
      <AlertDescription>
        <FormattedMessage
          id="component.petition-approvals-about-to-start-alert.title"
          defaultMessage="Approval process will start soon, please wait..."
        />
      </AlertDescription>
    </Alert>
  );
}
