import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { UserAvatar } from "@parallel/components/common/UserAvatar";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
} from "@parallel/components/common/UserSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  useProfileSubscribersDialog_UserFragment,
  useProfileSubscribersDialog_subscribeToProfileDocument,
  useProfileSubscribersDialog_unsubscribeFromProfileDocument,
} from "@parallel/graphql/__types";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface ProfileSubscribersDialogData {
  subscribe: UserSelectSelection[];
}

interface ProfileSubscribersDialogProps extends DialogProps {
  profileIds: string[];
  me: useProfileSubscribersDialog_UserFragment;
  users: useProfileSubscribersDialog_UserFragment[];
  isSubscribed?: boolean;
}

function ProfileSubscribersDialog({
  profileIds,
  me,
  users,
  isSubscribed,
  ...props
}: ProfileSubscribersDialogProps) {
  const { handleSubmit, control, watch } = useForm<ProfileSubscribersDialogData>({
    mode: "onSubmit",
    defaultValues: {
      subscribe: [],
    },
  });

  const hasNewSubscribers = watch("subscribe")?.length;

  const [subscribers, setSubscribers] = useState<useProfileSubscribersDialog_UserFragment[]>(users);
  const [unsubscribers, setUnsubscribers] = useState<useProfileSubscribersDialog_UserFragment[]>(
    isSubscribed === false ? [me] : [],
  );

  const listedUsers =
    profileIds.length > 1
      ? [me]
      : isSubscribed
        ? users.sort((u) => (u.id === me.id ? -1 : 1))
        : [me, ...users];

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        includeGroups: false,
        excludeUsers: [...excludeUsers, ...listedUsers.map((u) => u.id)],
      });
    },
    [_handleSearchUsers, listedUsers.map((u) => u.id).join(",")],
  );

  const [subscribe] = useMutation(useProfileSubscribersDialog_subscribeToProfileDocument);
  const handleSubscribe = useCallback(async (users: useProfileSubscribersDialog_UserFragment[]) => {
    setSubscribers((subscribers) => [...subscribers, ...users]);
    setUnsubscribers((unsubscribers) => unsubscribers.filter((u) => u.id !== users[0].id));
    await subscribe({
      variables: {
        profileIds,
        userIds: users.map((u) => u.id),
      },
    });
  }, []);

  const [unsubscribe] = useMutation(useProfileSubscribersDialog_unsubscribeFromProfileDocument);
  const handleUnsubscribe = useCallback(async (user: useProfileSubscribersDialog_UserFragment) => {
    setSubscribers((subscribers) => subscribers.filter((u) => u.id !== user.id));
    setUnsubscribers((unsubscribers) => [...unsubscribers, user]);
    await unsubscribe({
      variables: {
        profileIds,
        userIds: [user.id],
      },
    });
  }, []);

  const usersRef = useRef<UserSelectInstance<true, true>>(null);

  return (
    <ConfirmDialog
      {...props}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          if (data.subscribe.length > 0) {
            await subscribe({
              variables: {
                profileIds,
                userIds: data.subscribe.map((u) => u.id),
              },
            });
          }
          props.onResolve();
        }),
      }}
      initialFocusRef={usersRef}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.profile-subscribers-dialog.header"
          defaultMessage="Profile subscriptions"
        />
      }
      body={
        <Stack>
          <FormControl id="subscribe" flex="1 1 auto" minWidth={0} width="auto">
            <Controller
              name="subscribe"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserSelect
                  data-testid="share-petition-select"
                  isMulti
                  ref={usersRef}
                  value={value}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                      e.preventDefault();
                    }
                  }}
                  onChange={onChange as any}
                  onBlur={onBlur}
                  onSearch={handleSearchUsers}
                />
              )}
            />
          </FormControl>
          {listedUsers.map((user) => {
            const userIsSubscribed = subscribers.some((u) => u.id === user.id);
            const userIsUnsubscribed = unsubscribers.some((u) => u.id === user.id);

            return (
              <Flex key={user.id} alignItems="center">
                <UserAvatar role="presentation" user={user} size="sm" />
                <Box flex="1" minWidth={0} fontSize="sm" marginLeft={2}>
                  <Flex direction="row" alignItems="center" gap={1}>
                    <Text noOfLines={1} wordBreak="break-all">
                      {user.fullName}
                    </Text>
                    {me.id === user.id ? (
                      <Text as="span">
                        {"("}
                        <FormattedMessage id="generic.you" defaultMessage="You" />
                        {")"}
                      </Text>
                    ) : null}
                  </Flex>
                  <Text color="gray.500" noOfLines={1}>
                    {user.email}
                  </Text>
                </Box>
                <Menu placement="bottom-end">
                  <MenuButton as={Button} variant="ghost" size="sm" rightIcon={<ChevronDownIcon />}>
                    {userIsUnsubscribed ? (
                      <FormattedMessage
                        id="component.profile-subscribers-dialog.not-subscribed"
                        defaultMessage="Not subscribed"
                      />
                    ) : userIsSubscribed ? (
                      <FormattedMessage
                        id="component.profile-subscribers-dialog.subscribed"
                        defaultMessage="Subscribed"
                      />
                    ) : (
                      "-"
                    )}
                  </MenuButton>
                  <MenuList minWidth={40}>
                    <MenuItem onClick={() => handleSubscribe([user])}>
                      <FormattedMessage id="generic.subscribe" defaultMessage="Subscribe" />
                    </MenuItem>
                    <MenuItem onClick={() => handleUnsubscribe(user)}>
                      <FormattedMessage
                        id="component.profile-subscribers-dialog.unsubscribe"
                        defaultMessage="Unsubscribe"
                      />
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            );
          })}
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          {hasNewSubscribers ? (
            <FormattedMessage id="generic.subscribe" defaultMessage="Subscribe" />
          ) : (
            <FormattedMessage id="generic.done" defaultMessage="Done" />
          )}
        </Button>
      }
    />
  );
}

export function useProfileSubscribersDialog() {
  return useDialog(ProfileSubscribersDialog);
}

useProfileSubscribersDialog.fragments = {
  get User() {
    return gql`
      fragment useProfileSubscribersDialog_User on User {
        id
        email
        ...UserAvatar_User
      }
      ${UserAvatar.fragments.User}
    `;
  },
  get Profile() {
    return gql`
      fragment useProfileSubscribersDialog_Profile on Profile {
        id
        subscribers {
          id
          user {
            id
            ...useProfileSubscribersDialog_User
          }
        }
      }
      ${this.User}
    `;
  },
};
useProfileSubscribersDialog.mutations = [
  gql`
    mutation useProfileSubscribersDialog_subscribeToProfile(
      $profileIds: [GID!]!
      $userIds: [GID!]!
    ) {
      subscribeToProfile(profileIds: $profileIds, userIds: $userIds) {
        ...useProfileSubscribersDialog_Profile
      }
    }
    ${useProfileSubscribersDialog.fragments.Profile}
  `,
  gql`
    mutation useProfileSubscribersDialog_unsubscribeFromProfile(
      $profileIds: [GID!]!
      $userIds: [GID!]!
    ) {
      unsubscribeFromProfile(profileIds: $profileIds, userIds: $userIds) {
        ...useProfileSubscribersDialog_Profile
      }
    }
    ${useProfileSubscribersDialog.fragments.Profile}
  `,
];
