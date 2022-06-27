import { Image, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function ReportsReadyMessage() {
  return (
    <>
      <Image
        maxWidth="225px"
        height="100px"
        width="100%"
        marginBottom={6}
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/reports/reports-empty.svg`}
      />
      <Text fontWeight="bold">
        <FormattedMessage
          id="component.reports-ready-message.ready-to-generate-reports"
          defaultMessage="We are ready to generate your reports!"
        />
      </Text>
      <Text>
        <FormattedMessage
          id="component.reports-ready-message.choose-template"
          defaultMessage="Choose a template to view its statistics and results"
        />
      </Text>
    </>
  );
}
