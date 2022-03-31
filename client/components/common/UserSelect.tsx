import { gql, useApolloClient } from "@apollo/client";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import {
  UserSelect_canCreateUsersDocument,
  UserSelect_useGetUsersOrGroupsDocument,
  UserSelect_UserFragment,
  UserSelect_UserFragmentDoc,
  UserSelect_UserGroupFragment,
  UserSelect_UserGroupFragmentDoc,
  useSearchUsers_searchUsersDocument,
} from "@parallel/graphql/__types";
import {
  ExtendComponentProps,
  useReactSelectProps,
  UseReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { If, MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { useAsyncMemo } from "@parallel/utils/useAsyncMemo";
import { ForwardedRef, forwardRef, ReactElement, RefAttributes, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CommonProps, components } from "react-select";
import Select from "react-select";
import AsyncSelect, { Props as AsyncSelectProps } from "react-select/async";
import { indexBy, zip } from "remeda";
import { EmptySearchTemplatesIcon } from "../petition-new/icons/EmtpySearchTemplatesIcon";
import { Link, NakedLink } from "./Link";
import { UserListPopover } from "./UserListPopover";

export type UserSelectSelection<IncludeGroups extends boolean = false> =
  | UserSelect_UserFragment
  | If<IncludeGroups, UserSelect_UserGroupFragment>;

export type UserSelectInstance<
  IsMulti extends boolean,
  IncludeGroups extends boolean = false,
  IsAsync extends boolean = true
> = IsAsync extends true
  ? AsyncSelect<UserSelectSelection<IncludeGroups>, IsMulti, never>
  : Select<UserSelectSelection<IncludeGroups>, IsMulti, never>;

const fragments = {
  get User() {
    return gql`
      fragment UserSelect_User on User {
        id
        fullName
        email
      }
    `;
  },
  get UserGroup() {
    return gql`
      fragment UserSelect_UserGroup on UserGroup {
        id
        name
        members {
          user {
            ...UserSelect_User
          }
        }
      }
      ${this.User}
    `;
  },
};

const queries = [
  gql`
    query UserSelect_canCreateUsers {
      me {
        canCreateUsers
      }
    }
  `,
  gql`
    query UserSelect_useGetUsersOrGroups($ids: [ID!]!) {
      getUsersOrGroups(ids: $ids) {
        ... on User {
          ...UserSelect_User
        }
        ... on UserGroup {
          ...UserSelect_UserGroup
        }
      }
    }
    ${fragments.User}
    ${fragments.UserGroup}
  `,
];

export type UserSelectProps<
  IsMulti extends boolean = false,
  IncludeGroups extends boolean = false,
  IsAsync extends boolean = true,
  T extends UserSelectSelection<IncludeGroups> = UserSelectSelection<IncludeGroups>
> = UseReactSelectProps &
  Omit<AsyncSelectProps<T, IsMulti, never>, "value" | "onChange" | "options"> & {
    isMulti?: IsMulti;
    value: If<IsMulti, T[] | string[], T | string | null>;
    onChange: (value: If<IsMulti, T[], T | null>) => void;
    includeGroups?: IncludeGroups;
  } & (IsAsync extends true
    ? {
        onSearch: (
          search: string,
          excludeUsers: string[],
          excludeUserGroups: string[]
        ) => Promise<T[]>;
      }
    : {
        options: IsAsync extends true ? never : T[];
      });

export const UserSelect = Object.assign(
  forwardRef(function UserSelect(
    {
      value,
      onSearch,
      onChange,
      options,
      isMulti,
      includeGroups,
      placeholder: _placeholder,
      ...props
    }: UserSelectProps<boolean, boolean, boolean>,
    ref: ForwardedRef<UserSelectInstance<boolean, boolean, boolean>>
  ) {
    const needsLoading =
      typeof value === "string" || (Array.isArray(value) && typeof value[0] === "string");
    const getUsersOrGroups = useGetUsersOrGroups();
    const _value = useAsyncMemo(async () => {
      if (value === null) {
        return null;
      }
      if (needsLoading) {
        return await getUsersOrGroups(value as any);
      } else {
        return value as MaybeArray<UserSelectSelection<boolean>>;
      }
    }, [
      needsLoading,
      // Rerun when value changes
      value === null
        ? null
        : needsLoading
        ? // value is string | string[]
          unMaybeArray(value as any).join(",")
        : // value is UserSelection | UserSelection[]
          unMaybeArray(value as any)
            .map((x) => x.id)
            .join(","),
    ]);
    const intl = useIntl();
    const placeholder = useMemo(() => {
      return (
        _placeholder ??
        (isMulti && includeGroups
          ? intl.formatMessage({
              id: "component.user-select.placeholder-multi-with-groups",
              defaultMessage: "Select users or teams from your organization",
            })
          : isMulti && !includeGroups
          ? intl.formatMessage({
              id: "component.user-select.placeholder-multi-without-groups",
              defaultMessage: "Select users from your organization",
            })
          : !isMulti && includeGroups
          ? intl.formatMessage({
              id: "component.user-select.placeholder-single-with-groups",
              defaultMessage: "Select a user or team from your organization",
            })
          : !isMulti && !includeGroups
          ? intl.formatMessage({
              id: "component.user-select.placeholder-single-without-groups",
              defaultMessage: "Select a user from your organization",
            })
          : (null as never))
      );
    }, [_placeholder, isMulti, includeGroups]);

    const loadOptions = useMemo(
      () =>
        onSearch &&
        (async (search: string) => {
          const items = unMaybeArray(_value ?? []) as UserSelectSelection<boolean>[];
          return await onSearch(
            search,
            items.filter((item) => item.__typename === "User").map((item) => item.id),
            items.filter((item) => item.__typename === "UserGroup").map((item) => item.id)
          );
        }),
      [onSearch, _value]
    );

    const apollo = useApolloClient();

    const data = apollo.cache.readQuery({ query: UserSelect_canCreateUsersDocument })!;

    const reactSelectProps = useUserSelectReactSelectProps<boolean, boolean>({
      placeholder,
      ...props,
      canCreateUsers: data.me.canCreateUsers,
    });

    return loadOptions ? (
      <AsyncSelect<UserSelectSelection<boolean>, boolean, never>
        ref={ref as any}
        value={_value as any}
        onChange={onChange as any}
        isMulti={isMulti}
        loadOptions={loadOptions}
        {...reactSelectProps}
      />
    ) : (
      <Select<UserSelectSelection<boolean>, boolean, never>
        ref={ref as any}
        value={_value as any}
        onChange={onChange as any}
        isMulti={isMulti}
        options={options}
        {...reactSelectProps}
      />
    );
  }) as <
    IsMulti extends boolean = false,
    IncludeGroups extends boolean = false,
    IsAsync extends boolean = true,
    T extends UserSelectSelection<IncludeGroups> = UserSelectSelection<IncludeGroups>
  >(
    props: UserSelectProps<IsMulti, IncludeGroups, IsAsync, T> &
      RefAttributes<UserSelectInstance<IsMulti, IncludeGroups, IsAsync>>
  ) => ReactElement | null,
  { fragments, queries }
);

type AsyncUserSelectProps<
  IsMulti extends boolean,
  IncludeGroups extends boolean
> = AsyncSelectProps<UserSelectSelection<IncludeGroups>, IsMulti, never>;

function useUserSelectReactSelectProps<IsMulti extends boolean, IncludeGroups extends boolean>({
  includeGroups,
  canCreateUsers,
  ...props
}: UseReactSelectProps & {
  includeGroups?: IncludeGroups;
  canCreateUsers?: boolean;
}): AsyncUserSelectProps<IsMulti, IncludeGroups> {
  const rsProps = useReactSelectProps<UserSelectSelection<IncludeGroups>, IsMulti>(props);

  const components = useMemo(
    () => ({
      NoOptionsMessage,
      SingleValue,
      MultiValueLabel,
      Option,
      ...rsProps.components,
    }),
    [rsProps.components]
  );

  return {
    ...rsProps,
    components,
    getOptionLabel,
    getOptionValue,
    canCreateUsers,
    includeGroups,
  };
}

export function useSearchUsers() {
  const client = useApolloClient();
  return useCallback(
    async <IncludeGroups extends boolean = false>(
      search: string,
      options: {
        excludeUsers?: string[];
        excludeUserGroups?: string[];
        includeGroups?: IncludeGroups;
        includeInactive?: boolean;
      } = {}
    ): Promise<UserSelectSelection<IncludeGroups>[]> => {
      const { excludeUsers, excludeUserGroups, includeGroups, includeInactive } = options;
      const { data } = await client.query({
        query: useSearchUsers_searchUsersDocument,
        variables: {
          search,
          excludeUsers,
          excludeUserGroups,
          includeGroups,
          includeInactive,
        },
        fetchPolicy: "no-cache",
      });
      return data!.searchUsers as UserSelectSelection<IncludeGroups>[];
    },
    []
  );
}

useSearchUsers.queries = [
  gql`
    query useSearchUsers_searchUsers(
      $search: String!
      $excludeUsers: [GID!]
      $excludeUserGroups: [GID!]
      $includeGroups: Boolean
      $includeInactive: Boolean
    ) {
      searchUsers(
        search: $search
        excludeUsers: $excludeUsers
        excludeUserGroups: $excludeUserGroups
        includeGroups: $includeGroups
        includeInactive: $includeInactive
      ) {
        ... on User {
          ...UserSelect_User
        }
        ... on UserGroup {
          ...UserSelect_UserGroup
        }
      }
    }
    ${UserSelect.fragments.User}
    ${UserSelect.fragments.UserGroup}
  `,
];

function useGetUsersOrGroups() {
  const client = useApolloClient();
  return useCallback(async (ids: MaybeArray<string>) => {
    const _ids = unMaybeArray(ids);
    const fromCache = zip(
      _ids,
      _ids.map((id) => {
        const user = client.readFragment({
          fragment: UserSelect_UserFragmentDoc,
          id,
        });
        if (user?.__typename === "User") {
          return user;
        }
        const userGroup = client.readFragment({
          fragment: UserSelect_UserGroupFragmentDoc,
          id,
          fragmentName: "UserSelect_UserGroup",
        });
        if (userGroup?.__typename === "UserGroup") {
          return userGroup;
        }
        return null;
      })
    );
    const missing = fromCache.filter(([, value]) => value === null).map(([id]) => id);
    if (missing.length) {
      const fromServer = await client.query({
        query: UserSelect_useGetUsersOrGroupsDocument,
        variables: {
          ids: missing,
        },
        fetchPolicy: "network-only",
      });
      const fromServerById = indexBy(fromServer.data.getUsersOrGroups, (x) => x.id);
      const result = fromCache.map(([id, value]) => value ?? fromServerById[id]!);
      return Array.isArray(ids) ? result : result[0];
    } else {
      const result = fromCache.map(([, value]) => value!);
      return Array.isArray(ids) ? result : result[0];
    }
  }, []);
}

export type UserSelectComponentPropExtensions = {
  canCreateUsers: boolean;
  includeGroups?: boolean;
};

export type UserSelectComponentProps<T = CommonProps<any, any, any>> = ExtendComponentProps<
  T,
  UserSelectComponentPropExtensions
>;

const getOptionLabel = (option: UserSelectSelection<any>) => {
  if (option.__typename === "User") {
    return option.fullName ? `${option.fullName} <${option.email}>` : option.email;
  } else if (option.__typename === "UserGroup") {
    return option.name;
  } else if ((option as any).__isNew__) {
    return (option as any).label;
  }
};

const getOptionValue = (option: UserSelectSelection<any>) => option.id;

const NoOptionsMessage: typeof components.NoOptionsMessage = function NoOptionsMessage(props) {
  const {
    selectProps: { inputValue: search, canCreateUsers, includeGroups },
  } = props as unknown as UserSelectComponentProps;
  return (
    <Stack alignItems="center" textAlign="center" padding={4} spacing={4}>
      {search ? (
        <>
          <EmptySearchTemplatesIcon width="166px" height="77px" />
          <Text as="strong">
            <FormattedMessage
              id="component.user-select.no-options"
              defaultMessage="Can't find someone?"
            />
          </Text>
          {canCreateUsers ? (
            <NakedLink href="/app/organization/users?dialog=true">
              <Button colorScheme="purple">
                <FormattedMessage
                  id="component.user-select.invite-button"
                  defaultMessage="Invite people"
                />
              </Button>
            </NakedLink>
          ) : (
            <Text>
              <FormattedMessage
                id="component.user-select.no-options-contact-admin"
                defaultMessage="Contact with <a>the owner or an admin</a> of your organization to create them an account."
                values={{
                  a: (chunks: any) => <Link href={`/app/organization/users`}>{chunks}</Link>,
                }}
              />
            </Text>
          )}
        </>
      ) : (
        <Text as="div" color="gray.400">
          {includeGroups ? (
            <FormattedMessage
              id="component.user-select.search-hint-include-groups"
              defaultMessage="Search for existing users and teams"
            />
          ) : (
            <FormattedMessage
              id="component.user-select.search-hint"
              defaultMessage="Search for existing users"
            />
          )}
        </Text>
      )}
    </Stack>
  );
};

const SingleValue: typeof components.SingleValue = function SingleValue(props) {
  const intl = useIntl();
  const data = props.data as unknown as UserSelectSelection<any>;
  return (
    <components.SingleValue {...props}>
      {data.__typename === "User" ? (
        <Text as="span">{data.fullName ? `${data.fullName} <${data.email}>` : data.email}</Text>
      ) : data.__typename === "UserGroup" ? (
        <>
          <UsersIcon
            marginRight={2}
            position="relative"
            top={-0.5}
            aria-label={intl.formatMessage({
              id: "component.user-select.user-group-icon-alt",
              defaultMessage: "Team",
            })}
          />
          {data.name} (
          <FormattedMessage
            id="component.user-select.group-members"
            defaultMessage="{count, plural, =1 {1 member} other {# members}}"
            values={{ count: data.members.length }}
          />
          )
        </>
      ) : null}
    </components.SingleValue>
  );
};

const MultiValueLabel: typeof components.MultiValueLabel = function MultiValueLabel({
  children,
  ...props
}) {
  const intl = useIntl();
  const data = props.data as unknown as UserSelectSelection<any>;
  return (
    <components.MultiValueLabel {...(props as any)}>
      {data.__typename === "User" ? (
        <Text as="span">{data.fullName ? `${data.fullName} <${data.email}>` : data.email}</Text>
      ) : data.__typename === "UserGroup" ? (
        <UserListPopover usersOrGroups={data.members.map((m) => m.user)}>
          <Box>
            <UsersIcon
              marginRight={1}
              aria-label={intl.formatMessage({
                id: "component.user-select.user-group-icon-alt",
                defaultMessage: "Team",
              })}
            />
            {data.name} (
            <FormattedMessage
              id="component.user-select.group-members"
              defaultMessage="{count, plural, =1 {1 member} other {# members}}"
              values={{ count: data.members.length }}
            />
            )
          </Box>
        </UserListPopover>
      ) : null}
    </components.MultiValueLabel>
  );
};

const Option: typeof components.Option = function Option({ children, ...props }) {
  const intl = useIntl();
  const data = props.data as unknown as UserSelectSelection<any>;
  return (
    <components.Option {...props}>
      {data.__typename === "User" ? (
        <>
          {data.fullName ? (
            <Text as="span" verticalAlign="baseline">
              <Text as="span">{data.fullName}</Text>
              <Text as="span" display="inline-block" width={2} />
              <Text as="span" fontSize="sm" opacity={0.7}>
                {data.email}
              </Text>
            </Text>
          ) : (
            <Text as="span">{data.email}</Text>
          )}
        </>
      ) : data.__typename === "UserGroup" ? (
        <>
          <UsersIcon
            marginRight={2}
            position="relative"
            aria-label={intl.formatMessage({
              id: "component.user-select.user-group-icon-alt",
              defaultMessage: "Team",
            })}
          />
          {data.name} (
          <FormattedMessage
            id="component.user-select.group-members"
            defaultMessage="{count, plural, =1 {1 member} other {# members}}"
            values={{ count: data.members.length }}
          />
          )
        </>
      ) : null}
    </components.Option>
  );
};
