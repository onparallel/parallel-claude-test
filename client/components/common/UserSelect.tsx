import { gql } from "@apollo/client";
import { Box, Image, Stack, Text } from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import {
  UserSelect_UserFragment,
  UserSelect_UserGroupFragment,
} from "@parallel/graphql/__types";
import {
  useReactSelectProps,
  UseReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { CustomAsyncSelectProps } from "@parallel/utils/react-select/types";
import { unMaybeArray } from "@parallel/utils/types";
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
import { NormalLink } from "./Link";
import { UserListPopover } from "./UserListPopover";

export type UserSelectSelection<IncludeGroups extends boolean = false> =
  | UserSelect_UserFragment
  | (IncludeGroups extends true ? UserSelect_UserGroupFragment : never);

export type UserSelectInstance<
  IsMulti extends boolean,
  IncludeGroups extends boolean = false
> = AsyncSelect<UserSelectSelection<IncludeGroups>, IsMulti, never>;

interface UserSelectProps<
  IsMulti extends boolean = false,
  IncludeGroups extends boolean = false
> extends UseReactSelectProps,
    CustomAsyncSelectProps<UserSelectSelection<IncludeGroups>, IsMulti, never> {
  isMulti?: IsMulti;
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
    const loadOptions = useCallback(
      async (search) => {
        const items = unMaybeArray(
          value ?? []
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
      [onSearch, value]
    );

    const reactSelectProps =
      useUserSelectReactSelectProps<IsMulti, IncludeGroups>(props);

    return (
      <AsyncSelect<UserSelectSelection<IncludeGroups>, IsMulti, never>
        ref={ref}
        value={value}
        onChange={onChange as any}
        isMulti={isMulti ?? (false as any)}
        loadOptions={loadOptions}
        {...reactSelectProps}
      />
    );
  }) as <IsMulti extends boolean = false>(
    props: UserSelectProps<IsMulti> & RefAttributes<UserSelectInstance<IsMulti>>
  ) => ReactElement | null,
  {
    fragments: {
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
              ...UserSelect_User
            }
          }
          ${this.User}
        `;
      },
    },
  }
);

type AsyncUserSelectProps<
  IsMulti extends boolean,
  IncludeGroups extends boolean
> = AsyncSelectProps<UserSelectSelection<IncludeGroups>, IsMulti, never>;

function useUserSelectReactSelectProps<
  IsMulti extends boolean,
  IncludeGroups extends boolean
>(props: UseReactSelectProps): AsyncUserSelectProps<IsMulti, IncludeGroups> {
  const reactSelectProps =
    useReactSelectProps<UserSelectSelection<IncludeGroups>, IsMulti>(props);
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
                  <FormattedMessage
                    id="component.user-select.search-hint"
                    defaultMessage="Search for existing users"
                  />
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
                <UserListPopover users={data.members}>
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
