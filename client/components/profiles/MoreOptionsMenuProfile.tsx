import { MenuDivider, MenuItem, MenuList } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon } from "@parallel/chakra/icons";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { FormattedMessage } from "react-intl";

interface MoreOptionsMenuProfileProps {
  onDelete: () => void;
  onClone: () => void;
}

export function MoreOptionsMenuProfile({ onDelete, onClone }: MoreOptionsMenuProfileProps) {
  return (
    <MoreOptionsMenuButton
      variant="outline"
      options={
        <MenuList width="min-content" minWidth="256px">
          <MenuItem icon={<CopyIcon display="block" boxSize={4} />} onClick={onClone}>
            <FormattedMessage
              id="component.more-options-menu-profile.duplicate-profile"
              defaultMessage="Duplicate profile"
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
