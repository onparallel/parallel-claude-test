import { Alert, AlertIcon, AlertProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { NormalLink } from "../common/Link";

interface PetitionLimitReachedAlertProps extends AlertProps {
  limit: number;
}

export function PetitionLimitReachedAlert({ limit, ...props }: PetitionLimitReachedAlertProps) {
  return (
    <Alert status="warning" {...props}>
      <AlertIcon color="yellow.500" />
      <FormattedMessage
        id="component.petition-limit-reached-alert.title"
        defaultMessage="It seems that you have reached your limit of {limit} petitions, <a>reach out to us to upgrade your plan.</a>"
        values={{
          limit,
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
