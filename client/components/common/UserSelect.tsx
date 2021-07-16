import { gql, useApolloClient } from "@apollo/client";
import { Box, Image, Stack, Text } from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import {
  useGetUsersOrGroupsQuery,
  useGetUsersOrGroupsQueryVariables,
  UserSelect_UserFragment,
  UserSelect_UserGroupFragment,
  useSearchUsers_searchUsersQuery,
  useSearchUsers_searchUsersQueryVariables,
} from "@parallel/graphql/__types";
import {
  useReactSelectProps,
  UseReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { If, MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { useAsyncMemo } from "@parallel/utils/useAsyncMemo";
import {
  ForwardedRef,
  forwardRef,
  memo,
  ReactElement,
  RefAttributes,
  useCallback,
  useMemo,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { components } from "react-select";
import AsyncSelect, { Props as AsyncSelectProps } from "react-select/async";
import { indexBy, zip } from "remeda";
import { NormalLink } from "./Link";
import { UserListPopover } from "./UserListPopover";

export type UserSelectSelection<IncludeGroups extends boolean = false> =
  | UserSelect_UserFragment
  | If<IncludeGroups, UserSelect_UserGroupFragment>;

export type UserSelectInstance<
  IsMulti extends boolean,
  IncludeGroups extends boolean = false
> = AsyncSelect<UserSelectSelection<IncludeGroups>, IsMulti, never>;

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

interface UserSelectProps<
  IsMulti extends boolean = false,
  IncludeGroups extends boolean = false
> extends UseReactSelectProps,
    Omit<
      AsyncSelectProps<UserSelectSelection<IncludeGroups>, IsMulti, never>,
      "value" | "onChange" | "options"
    > {
  isMulti?: IsMulti;
  value: If<
    IsMulti,
    UserSelectSelection<IncludeGroups>[] | string[],
    UserSelectSelection<IncludeGroups> | string | null
  >;
  onChange: (
    value: If<
      IsMulti,
      UserSelectSelection<IncludeGroups>[],
      UserSelectSelection<IncludeGroups> | null
    >
  ) => void;
  includeGroups?: IncludeGroups;
  onSearch: (
    search: string,
    excludeUsers: string[],
    excludeUserGroups: string[]
  ) => Promise<UserSelectSelection<IncludeGroups>[]>;
}

export const UserSelect = Object.assign(
  forwardRef(function UserSelect<
    IsMulti extends boolean = false,
    IncludeGroups extends boolean = false
  >(
    {
      value,
      onSearch,
      onChange,
      isMulti,
      ...props
    }: UserSelectProps<IsMulti, IncludeGroups>,
    ref: ForwardedRef<UserSelectInstance<IsMulti, IncludeGroups>>
  ) {
    const needsLoading =
      typeof value === "string" ||
      (Array.isArray(value) && typeof value[0] === "string");
    const getUsersOrGroups = useGetUsersOrGroups();
    const _value = useAsyncMemo(async () => {
      if (value === null) {
        return null;
      }
      if (needsLoading) {
        return await getUsersOrGroups(value as any);
      }
    }, [
      needsLoading,
      needsLoading ? unMaybeArray(value as any).join(",") : null,
    ]);

    const loadOptions = useCallback(
      async (search) => {
        const items = unMaybeArray(
          _value ?? []
        ) as UserSelectSelection<IncludeGroups>[];
        return await onSearch(
          search,
          items
            .filter((item) => item.__typename === "User")
            .map((item) => item.id),
          items
            .filter((item) => item.__typename === "UserGroup")
            .map((item) => item.id)
        );
      },
      [onSearch, _value]
    );

    const reactSelectProps = useUserSelectReactSelectProps<
      IsMulti,
      IncludeGroups
    >(props);

    return (
      <AsyncSelect<UserSelectSelection<IncludeGroups>, IsMulti, never>
        ref={ref}
        value={_value as any}
        onChange={onChange as any}
        isMulti={isMulti ?? (false as any)}
        loadOptions={loadOptions}
        {...reactSelectProps}
      />
    );
  }) as <
    IsMulti extends boolean = false,
    IncludeGroups extends boolean = false
  >(
    props: UserSelectProps<IsMulti, IncludeGroups> &
      RefAttributes<UserSelectInstance<IsMulti, IncludeGroups>>
  ) => ReactElement | null,
  { fragments }
);

type AsyncUserSelectProps<
  IsMulti extends boolean,
  IncludeGroups extends boolean
> = AsyncSelectProps<UserSelectSelection<IncludeGroups>, IsMulti, never>;

function useUserSelectReactSelectProps<
  IsMulti extends boolean,
  IncludeGroups extends boolean
>({
  includeGroups,
  ...props
}: UseReactSelectProps & {
  includeGroups?: IncludeGroups;
}): AsyncUserSelectProps<IsMulti, IncludeGroups> {
  const reactSelectProps = useReactSelectProps<
    UserSelectSelection<IncludeGroups>,
    IsMulti
  >(props);
  return useMemo<AsyncUserSelectProps<IsMulti, IncludeGroups>>(
    () => ({
      ...reactSelectProps,
      components: {
        ...reactSelectProps.components,
        NoOptionsMessage: memo(({ selectProps }) => {
          const search = selectProps.inputValue;
          return (
            <Stack alignItems="center" textAlign="center" padding={4}>
              {search ? (
                <>
                  <Image
                    width="120px"
                    src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_void.svg`}
                    role="presentation"
                  />
                  <Text as="strong">
                    <FormattedMessage
                      id="component.user-select.no-options"
                      defaultMessage="Can't find someone?"
                    />
                  </Text>
                  <Text>
                    <FormattedMessage
                      id="component.user-select.no-options-contact-us"
                      defaultMessage="Contact us via email on <a>support@onparallel.com</a> or the support chat and we will create them an account"
                      values={{
                        a: (chunks: any[]) => (
                          <NormalLink href={`mailto:${chunks[0]}`}>
                            {chunks}
                          </NormalLink>
                        ),
                      }}
                    />
                  </Text>
                </>
              ) : (
                <Text as="div" color="gray.400">
                  {includeGroups ? (
                    <FormattedMessage
                      id="component.user-select.search-hint-include-groups"
                      defaultMessage="Search for existing users and groups"
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
        }),
        SingleValue: ({ children, ...props }) => {
          const intl = useIntl();
          const data = props.data as UserSelectSelection<IncludeGroups>;
          return (
            <components.SingleValue {...props}>
              {data.__typename === "User" ? (
                <Text as="span">
                  {data.fullName
                    ? `${data.fullName} <${data.email}>`
                    : data.email}
                </Text>
              ) : data.__typename === "UserGroup" ? (
                <>
                  <UsersIcon
                    marginRight={2}
                    position="relative"
                    top={-0.5}
                    alt={intl.formatMessage({
                      id: "component.user-select.user-group-icon-alt",
                      defaultMessage: "User group",
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
        },
        MultiValueLabel: ({ children, ...props }) => {
          const intl = useIntl();
          const data = props.data as UserSelectSelection<IncludeGroups>;
          return (
            <components.MultiValueLabel {...(props as any)}>
              {data.__typename === "User" ? (
                <Text as="span">
                  {data.fullName
                    ? `${data.fullName} <${data.email}>`
                    : data.email}
                </Text>
              ) : data.__typename === "UserGroup" ? (
                <UserListPopover
                  usersOrGroups={data.members.map((m) => m.user)}
                >
                  <Box>
                    <UsersIcon
                      marginRight={1}
                      alt={intl.formatMessage({
                        id: "component.user-select.user-group-icon-alt",
                        defaultMessage: "User group",
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
        },
        Option: ({ children, ...props }) => {
          const intl = useIntl();
          const data = props.data as UserSelectSelection<IncludeGroups>;
          return (
            <components.Option {...props}>
              {data.__typename === "User" ? (
                <>
                  {data.fullName ? (
                    <Text as="span" verticalAlign="baseline">
                      <Text as="span">{data.fullName}</Text>
                      <Text as="span" display="inline-block" width={2} />
                      <Text as="span" fontSize="sm" color="gray.500">
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
                    alt={intl.formatMessage({
                      id: "component.user-select.user-group-icon-alt",
                      defaultMessage: "User group",
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
        },
      },
      getOptionLabel: (option) => {
        if (option.__typename === "User") {
          return option.fullName
            ? `${option.fullName} <${option.email}>`
            : option.email;
        } else if (option.__typename === "UserGroup") {
          return option.name;
        } else if ((option as any).__isNew__) {
          return (option as any).label;
        }
      },
      getOptionValue: (option) => option.id,
    }),
    [reactSelectProps]
  );
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
      const {
        excludeUsers,
        excludeUserGroups,
        includeGroups,
        includeInactive,
      } = options;
      const { data } = await client.query<
        useSearchUsers_searchUsersQuery,
        useSearchUsers_searchUsersQueryVariables
      >({
        query: gql`
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

function useGetUsersOrGroups() {
  const client = useApolloClient();
  return useCallback(async (ids: MaybeArray<string>) => {
    const _ids = unMaybeArray(ids);
    const fromCache = zip(
      _ids,
      _ids.map((id) => {
        const user = client.readFragment<UserSelect_UserFragment>({
          fragment: fragments.User,
          id,
        });
        if (user?.__typename === "User") {
          return user;
        }
        const userGroup = client.readFragment<UserSelect_UserGroupFragment>({
          fragment: fragments.UserGroup,
          id,
          fragmentName: "UserSelect_UserGroup",
        });
        if (userGroup?.__typename === "UserGroup") {
          return userGroup;
        }
        return null;
      })
    );
    const missing = fromCache
      .filter(([, value]) => value === null)
      .map(([id]) => id);
    if (missing.length) {
      const fromServer = await client.query<
        useGetUsersOrGroupsQuery,
        useGetUsersOrGroupsQueryVariables
      >({
        query: gql`
          query useGetUsersOrGroups($ids: [ID!]!) {
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
        variables: {
          ids: missing,
        },
        fetchPolicy: "network-only",
      });
      const fromServerById = indexBy(
        fromServer.data.getUsersOrGroups,
        (x) => x.id
      );
      const result = fromCache.map(
        ([id, value]) => value ?? fromServerById[id]!
      );
      return Array.isArray(ids) ? result : result[0];
    } else {
      const result = fromCache.map(([, value]) => value!);
      return Array.isArray(ids) ? result : result[0];
    }
  }, []);
}
