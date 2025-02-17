import { Alert, AlertDescription, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PetitionApprovalsDefinitiveRejectedAlert(props: AlertProps) {
  return (
    <Alert status="warning" {...props}>
      <AlertIcon />
      <AlertDescription>
        <FormattedMessage
          id="component.petition-approvals-definitive-rejected-alert.description"
          defaultMessage="This parallel has a <b>final rejected approval</b> process and cannot be edited."
        />
      </AlertDescription>
    </Alert>
  );
}
