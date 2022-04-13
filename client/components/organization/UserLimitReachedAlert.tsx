import { Alert, AlertDescription, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { SupportLink } from "../common/SupportLink";

export function UserLimitReachedAlert(props: AlertProps) {
  const intl = useIntl();
  return (
    <Alert status="warning" borderRadius="md" mb={4}>
      <AlertIcon color="yellow.500" />
      <AlertDescription>
        <FormattedMessage
          id="component.user-limit-reached-alert.max-limit-reached"
          defaultMessage="You reached the maximum amount of users you can create, <a>reach out to us to upgrade your plan.</a>"
          values={{
            a: (chunks: any[]) => (
              <SupportLink
                message={intl.formatMessage({
                  id: "generic.upgrade-plan-support-message",
                  defaultMessage:
                    "Hi, I would like to get more information about how to upgrade my plan.",
                })}
              >
                {chunks}
              </SupportLink>
            ),
          }}
        />
      </AlertDescription>
    </Alert>
  );
}
