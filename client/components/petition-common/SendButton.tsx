import {
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  PaperPlaneIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";

export interface SendButtonProps {
  onSendClick: (event: MouseEvent) => void;
  onScheduleClick: (event: MouseEvent) => void;
}

export const SendButton = chakraForwardRef<"div", SendButtonProps>(
  function SendButton({ onSendClick, onScheduleClick, ...props }, ref) {
    const intl = useIntl();
    return (
      <ButtonGroup ref={ref} isAttached {...props}>
        <Button
          id="send-button"
          colorScheme="purple"
          leftIcon={<PaperPlaneIcon fontSize="18px" />}
          onClick={onSendClick}
        >
          <FormattedMessage id="generic.send" defaultMessage="Send" />
        </Button>
        <Divider isVertical color="purple.600" />
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
              minWidth={8}
            />
          </Tooltip>
          <Portal>
            <MenuList minWidth={0}>
              <MenuItem
                onClick={onScheduleClick as any}
                icon={<TimeIcon display="block" boxSize={4} />}
              >
                <FormattedMessage
                  id="component.send-button.schedule"
                  defaultMessage="Schedule send"
                />
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </ButtonGroup>
    );
  }
);
