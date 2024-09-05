import { AlertDescription, AlertIcon } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { CloseableAlert } from "../common/CloseableAlert";
import { SupportLink } from "../common/SupportLink";

export function UserLimitReachedAlert() {
  const intl = useIntl();
  return (
    <CloseableAlert status="warning" rounded="md">
      <AlertIcon />
      <AlertDescription flex={1}>
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
    </CloseableAlert>
  );
}
