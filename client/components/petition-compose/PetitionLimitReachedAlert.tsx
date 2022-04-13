import { Alert, AlertDescription, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { SupportLink } from "../common/SupportLink";

interface PetitionLimitReachedAlertProps extends AlertProps {
  limit: number;
}

export function PetitionLimitReachedAlert({ limit, ...props }: PetitionLimitReachedAlertProps) {
  const intl = useIntl();
  return (
    <Alert status="warning" {...props}>
      <AlertIcon color="yellow.500" />
      <AlertDescription>
        <FormattedMessage
          id="component.petition-limit-reached-alert.title"
          defaultMessage="It seems that you have reached your limit of {limit} petitions, <a>reach out to us to upgrade your plan.</a>"
          values={{
            limit,
            a: (chunks: any) => (
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
