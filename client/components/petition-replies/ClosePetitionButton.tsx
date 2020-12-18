import {
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import { CheckIcon, ChevronDownIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { SplitButton, SplitButtonProps } from "../common/SplitButton";

type ClosePetitionButtonProps = Omit<SplitButtonProps, "children"> & {
  onClosePetition: (sendNotification: boolean) => void;
};
export function ClosePetitionButton({
  onClosePetition,
  ...props
}: ClosePetitionButtonProps) {
  const intl = useIntl();
  return (
    <SplitButton dividerColor="green.600" {...props}>
      <Button
        colorScheme="green"
        leftIcon={<CheckIcon />}
        onClick={() => onClosePetition(true)}
      >
        <FormattedMessage
          id="petition-replies.close-petition.button"
          defaultMessage="Close petition and notify"
        />
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
            colorScheme="green"
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
            <MenuItem onClick={() => onClosePetition(false)}>
              <CheckIcon marginRight={2} />
              <FormattedMessage
                id="petition-replies.close-petition-without-notify.button"
                defaultMessage="Close petition without notifying"
              />
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </SplitButton>
  );
}
