import { AlertPopover } from "@parallel/components/common/AlertPopover";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

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
