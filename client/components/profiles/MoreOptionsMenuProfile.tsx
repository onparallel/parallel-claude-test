import { MenuDivider, MenuItem, MenuList } from "@chakra-ui/react";
import { BellSettingsIcon, DeleteIcon } from "@parallel/chakra/icons";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { FormattedMessage } from "react-intl";

interface MoreOptionsMenuProfileProps {
  onDelete: () => void;
  onSubscribe: () => void;
}

export function MoreOptionsMenuProfile({ onDelete, onSubscribe }: MoreOptionsMenuProfileProps) {
  return (
    <MoreOptionsMenuButton
      variant="outline"
      options={
        <MenuList width="fit-content" minWidth="200px">
          <MenuItem icon={<BellSettingsIcon display="block" boxSize={4} />} onClick={onSubscribe}>
            <FormattedMessage
              id="component.more-options-menu-profile.manage-profile-subscriptions"
              defaultMessage="Manage subscriptions"
            />
          </MenuItem>
          <MenuDivider />
          <MenuItem
            color="red.500"
            icon={<DeleteIcon display="block" boxSize={4} />}
            onClick={onDelete}
          >
            <FormattedMessage
              id="component.more-options-menu-profile.delete-profile"
              defaultMessage="Delete profile"
            />
          </MenuItem>
        </MenuList>
      }
    />
  );
}
