import { Text } from "@chakra-ui/react";
import { EmptyReportsIlustration } from "@parallel/components/reports/EmptyReportsIlustration";
import { FormattedMessage } from "react-intl";

export function ReportsReadyMessage() {
  return (
    <>
      <EmptyReportsIlustration maxWidth="225px" height="100px" width="100%" marginBottom={6} />
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
