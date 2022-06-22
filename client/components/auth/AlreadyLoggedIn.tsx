import { gql } from "@apollo/client";
import { Box, Button, Text } from "@chakra-ui/react";
import { NormalLink } from "@parallel/components/common/Link";
import { AlreadyLoggedIn_UserFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { UserAvatar } from "../common/UserAvatar";

interface AlreadyLoggedInProps {
  me: AlreadyLoggedIn_UserFragment;
  onRelogin: () => void;
  onContinueAs: () => void;
}
export function AlreadyLoggedIn({ me, onRelogin, onContinueAs }: AlreadyLoggedInProps) {
  return (
    <>
      <Box marginTop={4} textAlign="center">
        <UserAvatar user={me} size="lg" />
        <Text marginTop={4}>
          <FormattedMessage
            id="public.login.already-logged-in.explanation"
            defaultMessage="You are already logged in as {name}"
            values={{ name: <b>{me.fullName || me.email}</b> }}
          />
        </Text>
        {me.fullName ? <Text>({me.email})</Text> : null}
      </Box>
      <Button marginTop={6} width="100%" colorScheme="primary" type="submit" onClick={onContinueAs}>
        <FormattedMessage
          id="public.login.already-logged-in.continue-button"
          defaultMessage="Continue as {name}"
          values={{ name: me.fullName || me.email }}
        />
      </Button>
      <Box marginTop={4} textAlign="center">
        <NormalLink role="button" onClick={onRelogin}>
          <FormattedMessage
            id="public.login.already-logged-in.relogin"
            defaultMessage="Login as someone else"
          />
        </NormalLink>
      </Box>
    </>
  );
}

AlreadyLoggedIn.fragments = {
  User: gql`
    fragment AlreadyLoggedIn_User on User {
      email
      fullName
      ...UserAvatar_User
    }
    ${UserAvatar.fragments.User}
  `,
};
