import { gql, useApolloClient, useQuery } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import {
  UserSelect_canCreateUsersDocument,
  UserSelect_useGetUsersOrGroupsDocument,
  UserSelect_UserFragment,
  UserSelect_UserFragmentDoc,
  UserSelect_UserGroupFragment,
  UserSelect_UserGroupFragmentDoc,
} from "@parallel/graphql/__types";
import { genericRsComponent, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { If, MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { useAsyncMemo } from "@parallel/utils/useAsyncMemo";
import { ForwardedRef, forwardRef, ReactElement, RefAttributes, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { components, SelectComponentsConfig, SelectInstance } from "react-select";
import AsyncSelect from "react-select/async";
import { indexBy, zip } from "remeda";
import { UserDropdownEmtpy } from "./UserDropdownEmtpy";
import { UserGroupMembersPopover } from "./UserGroupMembersPopover";
import { UserSelectOption } from "./UserSelectOption";

export type UserSelectSelection<IncludeGroups extends boolean = false> =
  | UserSelect_UserFragment
  | If<IncludeGroups, UserSelect_UserGroupFragment>;

export type UserSelectInstance<
  IsMulti extends boolean,
  IncludeGroups extends boolean = false,
  OptionType extends UserSelectSelection<IncludeGroups> = UserSelectSelection<IncludeGroups>
> = SelectInstance<OptionType, IsMulti, never>;

const fragments = {
  User: gql`
    fragment UserSelect_User on User {
      id
      fullName
      email
      ...UserSelectOption_User
    }
    ${UserSelectOption.fragments.User}
  `,
  UserGroup: gql`
    fragment UserSelect_UserGroup on UserGroup {
      id
      name
      memberCount
      ...UserSelectOption_UserGroup
    }
    ${UserSelectOption.fragments.UserGroup}
  `,
};

const _queries = [
  gql`
    query UserSelect_canCreateUsers {
      me {
        id
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

export interface UserSelectProps<
  IsMulti extends boolean = false,
  IncludeGroups extends boolean = false,
  IsSync extends boolean = false,
  OptionType extends UserSelectSelection<IncludeGroups> = UserSelectSelection<IncludeGroups>
> extends Omit<CustomSelectProps<OptionType, IsMulti, never>, "value"> {
  value: If<IsMulti, OptionType[] | string[], OptionType | string | null>;
  isSync?: IsSync;
  includeGroups?: IncludeGroups;
  onSearch: IsSync extends true
    ? undefined
    : (
        search: string,
        excludeUsers: string[],
        excludeUserGroups: string[]
      ) => Promise<OptionType[]>;
}

export const UserSelect = Object.assign(
  forwardRef(function UserSelect<
    IsMulti extends boolean = false,
    IncludeGroups extends boolean = false,
    IsSync extends boolean = false,
    OptionType extends UserSelectSelection<IncludeGroups> = UserSelectSelection<IncludeGroups>
  >(
    {
      value,
      onSearch,
      isSync,
      onChange,
      options,
      isMulti,
      includeGroups,
      placeholder: _placeholder,
      ...props
    }: UserSelectProps<IsMulti, IncludeGroups, IsSync, OptionType>,
    ref: ForwardedRef<UserSelectInstance<IsMulti, IncludeGroups, OptionType>>
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

    const { data } = useQuery(UserSelect_canCreateUsersDocument);

    const rsProps = useReactSelectProps<OptionType, IsMulti, never>({
      ...props,
      components: {
        NoOptionsMessage,
        SingleValue,
        MultiValueLabel,
        Option,
        ...props.components,
      } as unknown as SelectComponentsConfig<OptionType, IsMulti, never>,
    });

    const extensions = {
      canCreateUsers: data?.me.canCreateUsers ?? false,
      includeGroups,
    };

    return isSync ? (
      <Select<OptionType, IsMulti, never>
        ref={ref as any}
        value={_value as any}
        onChange={onChange as any}
        isMulti={isMulti}
        options={options}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        placeholder={placeholder}
        {...rsProps}
        {...(extensions as any)}
      />
    ) : (
      <AsyncSelect<OptionType, IsMulti, never>
        ref={ref as any}
        value={_value as any}
        onChange={onChange as any}
        isMulti={isMulti}
        loadOptions={loadOptions}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        placeholder={placeholder}
        {...rsProps}
        {...(extensions as any)}
      />
    );
  }) as <
    IsMulti extends boolean = false,
    IncludeGroups extends boolean = false,
    IsSync extends boolean = false,
    OptionType extends UserSelectSelection<IncludeGroups> = UserSelectSelection<IncludeGroups>
  >(
    props: UserSelectProps<IsMulti, IncludeGroups, IsSync, OptionType> &
      RefAttributes<UserSelectInstance<IsMulti, IncludeGroups, OptionType>>
  ) => ReactElement,
  { fragments }
);

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
          fragmentName: "UserSelect_User",
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

const rsComponent = genericRsComponent<
  UserSelectSelection<boolean>,
  boolean,
  never,
  {
    selectProps: {
      canCreateUsers?: boolean;
      includeGroups?: boolean;
    };
  }
>();

const NoOptionsMessage = rsComponent("NoOptionsMessage", function (props) {
  const {
    selectProps: { inputValue: search, canCreateUsers, includeGroups },
  } = props;
  return (
    <UserDropdownEmtpy
      search={search}
      canCreateUsers={canCreateUsers}
      includeGroups={includeGroups}
    />
  );
});

const SingleValue = rsComponent("SingleValue", function (props) {
  return (
    <components.SingleValue {...props}>
      <UserSelectOption data={props.data} isDisabled={props.isDisabled} />
    </components.SingleValue>
  );
});

const MultiValueLabel = rsComponent("MultiValueLabel", function ({ children, ...props }) {
  const intl = useIntl();
  const data = props.data as unknown as UserSelectSelection<any>;
  return (
    <components.MultiValueLabel {...(props as any)}>
      {data.__typename === "User" ? (
        <Text as="span">{data.fullName ? `${data.fullName} <${data.email}>` : data.email}</Text>
      ) : data.__typename === "UserGroup" ? (
        <UserGroupMembersPopover userGroupId={data.id}>
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
              id="generic.n-group-members"
              defaultMessage="{count, plural, =1 {1 member} other {# members}}"
              values={{ count: data.memberCount }}
            />
            )
          </Box>
        </UserGroupMembersPopover>
      ) : null}
    </components.MultiValueLabel>
  );
});

const Option = rsComponent("Option", function ({ children, ...props }) {
  return (
    <components.Option {...props}>
      <UserSelectOption
        data={props.data}
        highlight={props.selectProps.inputValue}
        isDisabled={props.isDisabled}
      />
    </components.Option>
  );
});
