import { gql } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Stack,
  StackProps,
  Text,
} from "@chakra-ui/react";
import {
  UserSelect,
  UserSelectInstance,
  useSearchUsers,
} from "@parallel/components/common/UserSelect";
import { AccountDelegates_UserFragment, UserSelect_UserFragment } from "@parallel/graphql/__types";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { SupportLink } from "../common/SupportLink";

export interface AccountDelegatesData {
  delegates: UserSelect_UserFragment[];
}

interface AccountDelegatesProps extends Omit<StackProps, "onSubmit"> {
  user: AccountDelegates_UserFragment;
  onSubmit: (ids: string[]) => void;
}

export function AccountDelegates({ user, onSubmit, ...props }: AccountDelegatesProps) {
  const intl = useIntl();
  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<AccountDelegatesData>({
    mode: "onSubmit",
    defaultValues: {
      delegates: user.delegates ?? [],
    },
  });

  const delegates = watch("delegates");

  const usersRef = useRef<UserSelectInstance<true>>(null);

  const _handleSearchUsers = useSearchUsers();

  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      const exclude = delegates.map((d) => d.id) ?? [];
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers, ...exclude, user.id],
      });
    },
    [_handleSearchUsers, delegates]
  );

  return (
    <Stack {...props}>
      <Heading as="h4" size="md" marginBottom={2}>
        <FormattedMessage id="component.account-delegates.delegates" defaultMessage="Delegates" />
      </Heading>
      <Stack
        as="form"
        onSubmit={handleSubmit((values) => {
          onSubmit(values.delegates.map((d) => d.id));
          reset(values);
        })}
        spacing={4}
      >
        <FormControl id="delegates" isDisabled={!user.hasOnBehalfOf}>
          <Stack spacing={4} paddingBottom={2}>
            <Text>
              <FormattedMessage
                id="component.account-delegates.delegates-description"
                defaultMessage="Delegates can submit petitions on your behalf."
              />
            </Text>
            {user.hasOnBehalfOf ? null : (
              <Alert status="info" rounded="md">
                <AlertIcon />
                <HStack spacing={3}>
                  <Text flex="1">
                    <FormattedMessage
                      id="component.account-delegates.upgrade-delegates"
                      defaultMessage="This is an Enterprise feature. Contact with our support team for more information."
                    />
                  </Text>
                  <Button
                    as={SupportLink}
                    variant="outline"
                    colorScheme="blue"
                    backgroundColor="white"
                    message={intl.formatMessage({
                      id: "component.account-delegates.upgrade-delegates-support-message",
                      defaultMessage:
                        "Hi, I would like more information about sending petitions on behalf of another user.",
                    })}
                  >
                    <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                  </Button>
                </HStack>
              </Alert>
            )}
            <FormLabel>
              <FormattedMessage
                id="component.account-delegates.delegates-label"
                defaultMessage="Delegates"
              />
            </FormLabel>
          </Stack>

          <Controller
            name="delegates"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <UserSelect
                ref={usersRef}
                isMulti
                value={value}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                    e.preventDefault();
                  }
                }}
                onChange={(users) => {
                  onChange(users);
                }}
                onBlur={onBlur}
                onSearch={handleSearchUsers}
              />
            )}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="purple"
          width="min-content"
          isDisabled={!user.hasOnBehalfOf || !isDirty}
        >
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      </Stack>
    </Stack>
  );
}

AccountDelegates.fragments = {
  User: gql`
    fragment AccountDelegates_User on User {
      id
      delegates {
        ...UserSelect_User
      }
      hasOnBehalfOf: hasFeatureFlag(featureFlag: ON_BEHALF_OF)
    }
    ${UserSelect.fragments.User}
  `,
};
