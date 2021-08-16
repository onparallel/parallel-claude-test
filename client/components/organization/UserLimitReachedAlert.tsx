import { Alert, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { NormalLink } from "../common/Link";

export function UserLimitReachedAlert(props: AlertProps) {
  return (
    <Alert status="warning" borderRadius="md" mb={4}>
      <AlertIcon color="yellow.500" />
      <FormattedMessage
        id="organization-users.max-limit-reached"
        defaultMessage="You reached the maximum amount of users you can create, <a>reach out to us to upgrade your plan.</a>"
        values={{
          a: (chunks: any[]) => (
            <NormalLink display="contents" href="mailto:support@onparallel.com">
              {chunks}
            </NormalLink>
          ),
        }}
      />
    </Alert>
  );
}
