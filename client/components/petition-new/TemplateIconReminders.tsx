import { gql } from "@apollo/client";
import { PopoverProps } from "@chakra-ui/react";
import { BellSettingsIcon } from "@parallel/chakra/icons";
import { TemplateIconReminders_RemindersConfigFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { Text } from "@parallel/components/ui";

export interface TemplateIconRemindersProps extends PopoverProps {
  remindersConfig: TemplateIconReminders_RemindersConfigFragment;
}

export function TemplateIconReminders({ remindersConfig, ...props }: TemplateIconRemindersProps) {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.template-icon-reminders.text"
            defaultMessage="Automatic reminders set {days, plural, =1 {everyday} other {every # days}} at {time}{weekdays, select, true { on weekdays} other {}}"
            values={{
              days: remindersConfig.offset,
              time: remindersConfig.time,
              weekdays: remindersConfig.weekdaysOnly,
            }}
          />
        </Text>
      }
      width="200px"
      {...props}
    >
      <BellSettingsIcon color="gray.600" boxSize={4} />
    </SmallPopover>
  );
}

const _fragments = {
  RemindersConfig: gql`
    fragment TemplateIconReminders_RemindersConfig on RemindersConfig {
      offset
      time
      weekdaysOnly
    }
  `,
};
