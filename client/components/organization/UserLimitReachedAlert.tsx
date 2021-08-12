import { Alert, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { NormalLink } from "../common/Link";

export function UserLimitReachedAlert(props: AlertProps) {
  return (
    <Alert status="warning" borderRadius="md" mb={4}>
      <AlertIcon color="yellow.500" />
      <FormattedMessage
        id="organization-users.max-limit-reached"
        defaultMessage="You reached the maximum amount of users you can create, <a>contact with us to upgrade your plan.</a>"
        values={{
          a: (chunks: any[]) => (
            <NormalLink href="mailto:support@onparallel.com">&nbsp;{chunks}</NormalLink>
          ),
        }}
      />
    </Alert>
  );
}
