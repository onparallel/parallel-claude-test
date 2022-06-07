import { Text } from "@chakra-ui/react";
import { SupportLink } from "@parallel/components/common/SupportLink";
import { ReportsErrorIlustration } from "@parallel/components/reports/ReportsErrorIlustration";
import { FormattedMessage, useIntl } from "react-intl";

export function ReportsErrorMessage() {
  const intl = useIntl();
  return (
    <>
      <ReportsErrorIlustration maxWidth="120px" height="108px" width="100%" marginBottom={6} />
      <Text fontWeight="bold" fontSize="xl">
        <FormattedMessage
          id="component.reports-error-message.title"
          defaultMessage="Oops, looks like something went wrong"
        />
      </Text>
      <Text>
        <FormattedMessage
          id="component.reports-error-message.try-again"
          defaultMessage="Try again or select another template."
        />
      </Text>
      <Text>
        <FormattedMessage
          id="component.reports-error-message.contact-support"
          defaultMessage="If the problem persists, please <a>contact support</a> vía chat."
          values={{
            a: (chunks: any) => (
              <SupportLink
                message={intl.formatMessage({
                  id: "page.reports.error-support-message",
                  defaultMessage: "Hi, I'm having issues generating reports.",
                })}
              >
                {chunks}
              </SupportLink>
            ),
          }}
        />
      </Text>
    </>
  );
}
