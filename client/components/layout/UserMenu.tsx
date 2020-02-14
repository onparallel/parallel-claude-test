import {
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList
} from "@chakra-ui/core";
import { useIntl } from "react-intl";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { postJson } from "@parallel/utils/rest";
import { UserMenu_UserFragment } from "@parallel/graphql/__types";
import { NakedLink } from "../common/Link";

export interface UserMenuProps {
  user: UserMenu_UserFragment;
}

export function UserMenu({ user }: UserMenuProps) {
  const intl = useIntl();
  const router = useRouter();

  async function handleLogoutClick() {
    await postJson("/api/auth/logout");
    localStorage.removeItem("token");
    router.push("/[locale]/login", `/${router.query.locale}/login`);
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        {...{
          "aria-label": intl.formatMessage({
            id: "header.user-menu-button",
            defaultMessage: "User menu"
          }),
          rounded: "100%",
          height: 12,
          paddingLeft: 0,
          paddingRight: 0
        }}
      >
        <Avatar name={user.fullName!} size="md"></Avatar>
      </MenuButton>
      <MenuList placement="right-end">
        <NakedLink href="/app/settings/account">
          <MenuItem as="a">My Account</MenuItem>
        </NakedLink>
        <MenuDivider />
        <MenuItem onClick={handleLogoutClick}>Log out</MenuItem>
      </MenuList>
    </Menu>
  );
}

UserMenu.fragments = {
  user: gql`
    fragment UserMenu_User on User {
      fullName
    }
  `
};
