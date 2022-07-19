import { MenuItem, MenuList } from "@chakra-ui/react";
import { PaperPlaneIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { MouseEvent } from "react";
import { FormattedMessage } from "react-intl";
import { ButtonWithMoreOptions } from "../common/ButtonWithMoreOptions";

export interface SendButtonProps {
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
      onClick={onSendClick}
      {...props}
      options={
        <MenuList minWidth={0}>
          <MenuItem
            onClick={onScheduleClick as any}
            icon={<TimeIcon display="block" boxSize={4} />}
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
