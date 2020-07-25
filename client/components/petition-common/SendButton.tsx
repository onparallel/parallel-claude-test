import { Button, IconButton, MenuItem, MenuList } from "@chakra-ui/core";
import {
  ChevronDownIcon,
  TimeIcon,
  PaperPlaneIcon,
} from "@parallel/chakra/icons";
import { MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { SplitButton, SplitButtonProps } from "../common/SplitButton";

export function SendButton({
  onSendClick,
  onScheduleClick,
  ...props
}: Omit<SplitButtonProps, "children"> & {
  onSendClick: (event: MouseEvent) => void;
  onScheduleClick: (event: MouseEvent) => void;
}) {
  const intl = useIntl();
  return (
    <SplitButton dividerColor="purple.600" {...props}>
      <Button
        colorScheme="purple"
        leftIcon={<PaperPlaneIcon />}
        onClick={onSendClick}
      >
        <FormattedMessage
          id="component.send-button.send"
          defaultMessage="Send"
        />
      </Button>
      <ButtonDropdown
        as={IconButton}
        colorScheme="purple"
        icon={<ChevronDownIcon />}
        aria-label={intl.formatMessage({
          id: "component.send-button.options",
          defaultMessage: "Options",
        })}
        minWidth={8}
        dropdown={
          <MenuList minWidth={0} placement="top-end">
            <MenuItem onClick={onScheduleClick as any}>
              <TimeIcon marginRight={2} />
              <FormattedMessage
                id="component.send-button.schedule"
                defaultMessage="Schedule send"
              />
            </MenuItem>
          </MenuList>
        }
      />
    </SplitButton>
  );
}
