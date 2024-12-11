import { Text } from "@chakra-ui/react";
import { AlertPopover } from "@parallel/components/common/AlertPopover";
import { FormattedMessage } from "react-intl";

export function DashboardModuleAlertIncongruent() {
  return (
    <AlertPopover marginStart={0}>
      <Text>
        <FormattedMessage
          id="component.dashboard-module-card.inconsistent-filters-popover"
          defaultMessage="The selected filters produce inconsistent results. Please review them."
        />
      </Text>
    </AlertPopover>
  );
}
