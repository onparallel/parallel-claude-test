import { SplitButton, SplitButtonProps } from "../common/SplitButton";
import { Button, IconButton, MenuList, MenuItem, Icon } from "@chakra-ui/core";
import { FormattedMessage, useIntl } from "react-intl";
import { MouseEvent } from "react";
import { ButtonDropdown } from "../common/ButtonDropdown";

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
        variantColor="purple"
        leftIcon={"paper-plane" as any}
        onClick={onSendClick}
      >
        <FormattedMessage
          id="component.send-button.send"
          defaultMessage="Send"
        />
      </Button>
      <ButtonDropdown
        as={IconButton}
        variantColor="purple"
        icon="chevron-down"
        aria-label={intl.formatMessage({
          id: "component.send-button.options",
          defaultMessage: "Options",
        })}
        minWidth={8}
        dropdown={
          <MenuList minWidth={0} placement="top-end">
            <MenuItem onClick={onScheduleClick as any}>
              <Icon name="time" marginRight={2} />
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
