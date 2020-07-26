import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from "@chakra-ui/core";
import {
  ChevronDownIcon,
  TimeIcon,
  PaperPlaneIcon,
} from "@parallel/chakra/icons";
import { MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SplitButton, SplitButtonProps } from "../common/SplitButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

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
      <Menu placement="bottom-end">
        <IconButtonWithTooltip
          as={MenuButton}
          colorScheme="purple"
          icon={<ChevronDownIcon />}
          label={intl.formatMessage({
            id: "generic.more-options",
            defaultMessage: "More options...",
          })}
          borderTopLeftRadius={0}
          borderBottomLeftRadius={0}
          minWidth={8}
        />
        <Portal>
          <MenuList minWidth={0}>
            <MenuItem onClick={onScheduleClick as any}>
              <TimeIcon marginRight={2} />
              <FormattedMessage
                id="component.send-button.schedule"
                defaultMessage="Schedule send"
              />
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </SplitButton>
  );
}
