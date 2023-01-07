import { ButtonProps, MenuItem, MenuList } from "@chakra-ui/react";
import { PaperPlaneIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { MouseEvent } from "react";
import { FormattedMessage } from "react-intl";
import { ButtonWithMoreOptions } from "../common/ButtonWithMoreOptions";

export interface SendButtonProps extends ButtonProps {
  onSendClick: (event: MouseEvent) => void;
  onScheduleClick: (event: MouseEvent) => void;
}

export const SendButton = chakraForwardRef<"button", SendButtonProps>(function SendButton(
  { onSendClick, onScheduleClick, ...props },
  ref
) {
  return (
    <ButtonWithMoreOptions
      ref={ref}
      colorScheme="primary"
      leftIcon={<PaperPlaneIcon fontSize="18px" />}
      data-testid="send-button"
      moreOptionsButtonProps={{ "data-testid": "send-button-more-options-button" } as any}
      onClick={onSendClick}
      {...props}
      options={
        <MenuList minWidth={0}>
          <MenuItem
            onClick={onScheduleClick as any}
            icon={<TimeIcon display="block" boxSize={4} />}
            data-testid="send-button-schedule-send-option"
          >
            <FormattedMessage id="component.send-button.schedule" defaultMessage="Schedule send" />
          </MenuItem>
        </MenuList>
      }
    >
      <FormattedMessage id="generic.send" defaultMessage="Send" />
    </ButtonWithMoreOptions>
  );
});
