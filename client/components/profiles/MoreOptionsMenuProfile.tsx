import { MenuItem, MenuList } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { FormattedMessage } from "react-intl";

interface MoreOptionsMenuProfileProps {
  onDelete: () => void;
}

export function MoreOptionsMenuProfile({ onDelete }: MoreOptionsMenuProfileProps) {
  return (
    <MoreOptionsMenuButton
      variant="outline"
      options={
        <MenuList width="min-content" minWidth="200px">
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
