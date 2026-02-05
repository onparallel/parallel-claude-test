import { Image } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

export function ReportsReadyMessage({ title, body }: { title?: string; body?: string }) {
  return (
    <>
      <Image
        maxWidth="225px"
        height="100px"
        width="100%"
        marginBottom={6}
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/reports/reports-empty.svg`}
      />

      <Text fontWeight="bold">
        {title ?? (
          <FormattedMessage
            id="component.reports-ready-message.ready-to-generate-reports"
            defaultMessage="We are ready to generate your reports!"
          />
        )}
      </Text>
      <Text>
        {body ?? (
          <FormattedMessage
            id="component.reports-ready-message.choose-template"
            defaultMessage="Choose a template to view its statistics and results"
          />
        )}
      </Text>
    </>
  );
}
