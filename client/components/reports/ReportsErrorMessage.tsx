import { Image, Text } from "@chakra-ui/react";
import { SupportLink } from "@parallel/components/common/SupportLink";
import { FormattedMessage, useIntl } from "react-intl";

export function ReportsErrorMessage() {
  const intl = useIntl();
  return (
    <>
      <Image
        maxWidth="120px"
        height="108px"
        width="100%"
        marginBottom={6}
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/reports/reports-error.svg`}
      />
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
          defaultMessage="If the problem persists, please <a>contact support</a> via chat."
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
