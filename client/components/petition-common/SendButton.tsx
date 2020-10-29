import {
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tooltip,
} from "@chakra-ui/core";
import {
  ChevronDownIcon,
  PaperPlaneIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
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
        leftIcon={<PaperPlaneIcon fontSize="18px" />}
        onClick={onSendClick}
      >
        <FormattedMessage id="generic.send" defaultMessage="Send" />
      </Button>
      <Menu placement="bottom-end">
        <Tooltip
          label={intl.formatMessage({
            id: "generic.more-options",
            defaultMessage: "More options...",
          })}
        >
          <MenuButton
            as={IconButton}
            colorScheme="purple"
            icon={<ChevronDownIcon />}
            aria-label={intl.formatMessage({
              id: "generic.more-options",
              defaultMessage: "More options...",
            })}
            borderTopLeftRadius={0}
            borderBottomLeftRadius={0}
            minWidth={8}
          />
        </Tooltip>
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
