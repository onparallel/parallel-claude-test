import { Text } from "@chakra-ui/layout";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "./Link";
import { SmallPopover } from "./SmallPopover";

export function UpgradePlanPopover({ children }: { children: ReactNode }) {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.upgrade-plan-popover.text"
            defaultMessage="This feature is not available on your current plan. <a>Upgrade your plan</a> to enable it."
            values={{
              a: (chunks: any) => <Link href={`/app/settings/account`}>{chunks}</Link>,
            }}
          />
        </Text>
      }
      placement="bottom"
    >
      {children}
    </SmallPopover>
  );
}
