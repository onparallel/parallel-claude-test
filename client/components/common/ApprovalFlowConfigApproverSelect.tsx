import { gql } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { Box, HStack } from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import {
  ApprovalFlowConfigApproverSelect_PetitionBaseFragment,
  UserLocale,
  UserSelect_UserFragment,
  UserSelect_UserFragmentDoc,
  UserSelect_UserGroupFragment,
  UserSelect_UserGroupFragmentDoc,
  UserSelect_canCreateUsersDocument,
  UserSelect_useGetUsersOrGroupsDocument,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex, useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomAsyncSelectProps } from "@parallel/utils/react-select/types";
import { MaybeArray, UnwrapArray, unMaybeArray } from "@parallel/utils/types";
import { useAsyncMemo } from "@parallel/utils/useAsyncMemo";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { ForwardedRef, ReactElement, RefAttributes, forwardRef, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ActionMeta,
  GroupBase,
  GroupHeadingProps,
  MenuListProps,
  MultiValueGenericProps,
  NoticeProps,
  OnChangeValue,
  OptionProps,
  SelectComponentsConfig,
  SelectInstance,
  SingleValueProps,
  components,
} from "react-select";
import AsyncSelect from "react-select/async";
import { indexBy, isNonNullish, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import { HighlightText } from "./HighlightText";
import { OverflownText } from "./OverflownText";
import { UserDropdownEmpty } from "./UserDropdownEmpty";
import { UserGroupMembersPopover } from "./UserGroupMembersPopover";
import { userGroupReferenceText } from "./UserGroupReference";
import { UserSelectOption } from "./UserSelectOption";
import { Text } from "@parallel/components/ui";

type FieldOf<T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment> = UnwrapArray<
  Exclude<T["fields"], null | undefined>
>;

type ChildOf<T extends FieldOf<ApprovalFlowConfigApproverSelect_PetitionBaseFragment>> =
  UnwrapArray<Exclude<T["children"], null | undefined>>;

type AnyFieldOf<T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment> =
  | FieldOf<T>
  | ChildOf<FieldOf<T>>;

interface PetitionFieldOption<T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment> {
  field: AnyFieldOf<T>;
  fieldIndex: PetitionFieldIndex;
  __typename: "PetitionField";
  id: string; // Same as field.id for consistency
}

export type ApprovalFlowConfigApproverSelection<
  T extends
    ApprovalFlowConfigApproverSelect_PetitionBaseFragment = ApprovalFlowConfigApproverSelect_PetitionBaseFragment,
> = UserSelect_UserFragment | UserSelect_UserGroupFragment | PetitionFieldOption<T>;

export type ApprovalFlowConfigApproverSelectInstance<
  T extends
    ApprovalFlowConfigApproverSelect_PetitionBaseFragment = ApprovalFlowConfigApproverSelect_PetitionBaseFragment,
  OptionType extends
    ApprovalFlowConfigApproverSelection<T> = ApprovalFlowConfigApproverSelection<T>,
> = SelectInstance<OptionType, true, GroupBase<OptionType>>;

export interface ApprovalFlowConfigApproverSelectProps<
  T extends
    ApprovalFlowConfigApproverSelect_PetitionBaseFragment = ApprovalFlowConfigApproverSelect_PetitionBaseFragment,
  OptionType extends
    ApprovalFlowConfigApproverSelection<T> = ApprovalFlowConfigApproverSelection<T>,
> extends Omit<CustomAsyncSelectProps<OptionType, true, GroupBase<OptionType>>, "value"> {
  value: OptionType[] | string[];
  petition: T;
}

export const ApprovalFlowConfigApproverSelect = forwardRef(
  function ApprovalFlowConfigApproverSelect<
    T extends
      ApprovalFlowConfigApproverSelect_PetitionBaseFragment = ApprovalFlowConfigApproverSelect_PetitionBaseFragment,
    OptionType extends
      ApprovalFlowConfigApproverSelection<T> = ApprovalFlowConfigApproverSelection<T>,
  >(
    {
      value,
      onChange,
      petition,
      placeholder: _placeholder,
      ...props
    }: ApprovalFlowConfigApproverSelectProps<T, OptionType>,
    ref: ForwardedRef<ApprovalFlowConfigApproverSelectInstance<T, OptionType>>,
  ) {
    const searchUsers = useSearchUsers();
    const searchUserGroups = useSearchUserGroups();

    const handleSearchUsersAndGroups = useCallback(
      async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
        const [users, groups] = await Promise.all([
          searchUsers(search, { excludeIds: [...excludeUsers] }),
          searchUserGroups(search, {
            excludeIds: [...excludeUserGroups],
          }),
        ]);

        return [...groups, ...users];
      },
      [searchUsers, searchUserGroups],
    );

    const needsLoading =
      typeof value === "string" || (Array.isArray(value) && typeof value[0] === "string");
    const getUsersOrGroups = useGetUsersOrGroups();
    const allFieldsWithIndices = useAllFieldsWithIndices(petition);

    // Build petition field options
    const petitionFieldOptions = useMemo(() => {
      const options: PetitionFieldOption<T>[] = allFieldsWithIndices
        .flatMap(([field, fieldIndex]) => {
          return {
            field,
            fieldIndex,
            __typename: "PetitionField" as const,
            id: field.id,
          };
        })
        .filter(({ field }) => field.type === "USER_ASSIGNMENT");

      return options;
    }, [allFieldsWithIndices]);

    const petitionFieldIds = useMemo(
      () => new Set(petitionFieldOptions.map((opt) => opt.field.id)),
      [petitionFieldOptions],
    );
    const petitionFieldMap = useMemo(
      () => new Map(petitionFieldOptions.map((opt) => [opt.field.id, opt])),
      [petitionFieldOptions],
    );

    const _value = useAsyncMemo(async () => {
      if (value === null || value.length === 0) {
        return [];
      }
      if (needsLoading) {
        const valueArray = value as string[];

        // Separate field IDs from user/group IDs
        const userGroupIds = valueArray.filter((id) => !petitionFieldIds.has(id));

        // Load user/group IDs if any
        let loadedUsersOrGroups: (UserSelect_UserFragment | UserSelect_UserGroupFragment)[] = [];
        if (userGroupIds.length > 0) {
          const loaded = await getUsersOrGroups(userGroupIds);
          loadedUsersOrGroups = unMaybeArray(loaded) as (
            | UserSelect_UserFragment
            | UserSelect_UserGroupFragment
          )[];
        }

        // Combine results maintaining order
        const result: OptionType[] = [];
        for (const id of valueArray) {
          if (petitionFieldIds.has(id)) {
            const field = petitionFieldMap.get(id);
            if (field) {
              result.push(field as OptionType);
            }
          } else {
            const userOrGroup = loadedUsersOrGroups.find((item) => item.id === id);
            if (userOrGroup) {
              result.push(userOrGroup as OptionType);
            }
          }
        }

        return result;
      } else {
        // Value is already loaded, but we need to convert PetitionField objects back to PetitionFieldOption
        const valueArray = value as OptionType[] | AnyFieldOf<T>[];
        const result: OptionType[] = [];

        for (const item of valueArray) {
          // Check if it's a PetitionField (has type, title, etc. but not __typename "PetitionField")
          if (
            typeof item === "object" &&
            item !== null &&
            "type" in item &&
            "title" in item &&
            "id" in item &&
            (!("__typename" in item) ||
              (item as { __typename?: string }).__typename !== "PetitionField") &&
            petitionFieldIds.has((item as { id: string }).id)
          ) {
            // It's a PetitionField, convert it to PetitionFieldOption
            const fieldOption = petitionFieldMap.get((item as { id: string }).id);
            if (fieldOption) {
              result.push(fieldOption as OptionType);
            }
          } else if (typeof item === "object" && item !== null && "__typename" in item) {
            // It's already a User, UserGroup, or PetitionFieldOption
            result.push(item as OptionType);
          }
        }

        return result;
      }
    }, [
      needsLoading,
      petitionFieldIds,
      petitionFieldMap,
      getUsersOrGroups,
      // Rerun when value changes
      value === null || value.length === 0
        ? null
        : needsLoading
          ? // value is string[]
            (value as string[]).join(",")
          : // value is OptionType[] or PetitionField[]
            JSON.stringify(
              (value as OptionType[] | AnyFieldOf<T>[])
                .map((x) => (typeof x === "object" && x !== null && "id" in x ? String(x.id) : ""))
                .filter(Boolean),
            ),
    ]);

    const intl = useIntl();
    const placeholder = useMemo(() => {
      return (
        _placeholder ??
        intl.formatMessage({
          id: "component.user-select.placeholder-multi-with-groups",
          defaultMessage: "Select users or teams from your organization",
        })
      );
    }, [_placeholder, intl.locale]);

    const loadOptions = useMemo(
      () => async (search: string) => {
        const items = unMaybeArray(_value ?? []) as OptionType[];
        const groups: GroupBase<OptionType>[] = [];

        // If search is empty, show all fields. Otherwise, filter matching fields
        const fieldsToShow =
          search.trim() === ""
            ? petitionFieldOptions
            : petitionFieldOptions.filter((opt) =>
                (opt.field.title ?? "").toLowerCase().includes(search.toLowerCase()),
              );

        // Always show fields group if there are fields to show
        if (fieldsToShow.length > 0) {
          groups.push({
            label: intl.formatMessage({
              id: "component.user-select.fields-group-label",
              defaultMessage: "Fields",
            }),
            options: fieldsToShow as OptionType[],
          });
        }

        // Only search for users/groups if there's a search query
        if (search.trim() !== "") {
          const asyncResults = await handleSearchUsersAndGroups(
            search,
            items
              .filter((item) => "__typename" in item && item.__typename === "User")
              .map((item) => (item as UserSelect_UserFragment).id),
            items
              .filter((item) => "__typename" in item && item.__typename === "UserGroup")
              .map((item) => (item as UserSelect_UserGroupFragment).id),
          );

          // Add async results group first if there are results
          if (asyncResults.length > 0) {
            groups.unshift({
              label: intl.formatMessage({
                id: "component.user-select.users-and-teams-group-label",
                defaultMessage: "Users and teams",
              }),
              options: asyncResults as OptionType[],
            });
          }
        }

        // If no groups were created, return empty array to show placeholder
        if (groups.length === 0) {
          return [];
        }

        return groups.length > 0 ? groups : [];
      },
      [_value, petitionFieldOptions, intl],
    );

    const { data } = useQuery(UserSelect_canCreateUsersDocument);

    const handleChange = useCallback(
      (newValue: OnChangeValue<OptionType, true>, actionMeta: ActionMeta<OptionType>) => {
        const values = (newValue as OptionType[]) ?? [];
        onChange(
          values.map((item) => {
            if (item.__typename === "PetitionField") {
              return (item as PetitionFieldOption<T>).field;
            }
            return item;
          }) as OptionType[],
          actionMeta,
        );
      },
      [onChange],
    );

    const customComponents = useMemo(() => {
      const baseComponents = {
        NoOptionsMessage,
        SingleValue,
        MultiValueLabel,
        Option,
        GroupHeading: GroupHeading,
        MenuList: MenuListWithPlaceholder,
        ...props.components,
      };
      return baseComponents as unknown as SelectComponentsConfig<
        OptionType,
        true,
        GroupBase<OptionType>
      >;
    }, [props.components]);

    const rsProps = useReactSelectProps<OptionType, true, GroupBase<OptionType>>({
      ...props,
      components: customComponents,
    });

    const extensions = {
      canCreateUsers: data?.me.canCreateUsers ?? false,
    };

    // When petition fields are provided, use defaultOptions to show them initially
    const defaultOptions = useMemo(() => {
      if (petitionFieldOptions.length > 0) {
        return true; // This will call loadOptions with empty string to show all fields
      }
      return false;
    }, [petitionFieldOptions.length]);

    return (
      <AsyncSelect<OptionType, true, GroupBase<OptionType>>
        ref={ref}
        value={_value}
        onChange={handleChange}
        isMulti={true}
        loadOptions={loadOptions}
        defaultOptions={defaultOptions}
        getOptionLabel={getOptionLabel<T>(intl.locale as UserLocale)}
        getOptionValue={getOptionValue<T>}
        placeholder={placeholder}
        isClearable={props.isClearable}
        {...props}
        {...rsProps}
        {...extensions}
      />
    );
  },
) as <
  T extends
    ApprovalFlowConfigApproverSelect_PetitionBaseFragment = ApprovalFlowConfigApproverSelect_PetitionBaseFragment,
  OptionType extends
    ApprovalFlowConfigApproverSelection<T> = ApprovalFlowConfigApproverSelection<T>,
>(
  props: ApprovalFlowConfigApproverSelectProps<T, OptionType> &
    RefAttributes<ApprovalFlowConfigApproverSelectInstance<T, OptionType>>,
) => ReactElement;

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
      }),
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

      assert(
        isNonNullish(fromServer.data),
        "Result data in UserSelect_useGetUsersOrGroupsDocument is missing",
      );

      const fromServerById = indexBy(fromServer.data.getUsersOrGroups, (x) => x.id);
      const result = fromCache.map(([id, value]) => value ?? fromServerById[id]!);
      return Array.isArray(ids) ? result : result[0];
    } else {
      const result = fromCache.map(([, value]) => value!);
      return Array.isArray(ids) ? result : result[0];
    }
  }, []);
}

const getOptionLabel =
  <T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment>(locale: UserLocale) =>
  (option: ApprovalFlowConfigApproverSelection<T>) => {
    if ("__typename" in option) {
      if (option.__typename === "User") {
        const user = option as UserSelect_UserFragment;
        return user.fullName ? `${user.fullName} <${user.email}>` : user.email;
      } else if (option.__typename === "UserGroup") {
        return userGroupReferenceText(option as UserSelect_UserGroupFragment, locale);
      } else if (option.__typename === "PetitionField") {
        const fieldOption = option as PetitionFieldOption<T>;
        return fieldOption.field.title ?? "";
      }
    }
    return "";
  };

const getOptionValue = <T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment>(
  option: ApprovalFlowConfigApproverSelection<T>,
) => option.id;

function GroupHeading<T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment>(
  props: GroupHeadingProps<ApprovalFlowConfigApproverSelection<T>>,
) {
  return (
    <components.GroupHeading {...props}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        textTransform="uppercase"
        color="gray.600"
        paddingX={2}
        paddingY={1}
      >
        {props.children}
      </Text>
    </components.GroupHeading>
  );
}

interface ReactSelectExtraProps {
  canCreateUsers?: boolean;
}

function MenuListWithPlaceholder<T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment>(
  props: MenuListProps<ApprovalFlowConfigApproverSelection<T>>,
) {
  const { children, selectProps } = props;
  const inputValue = selectProps.inputValue;

  // Show placeholder message when there's no search and we have children (field options)
  const showPlaceholder = !inputValue && children && Array.isArray(children) && children.length > 0;

  return (
    <components.MenuList {...props}>
      {showPlaceholder && (
        <Box paddingX={4} paddingY={2}>
          <Text fontSize="sm" color="gray.400">
            <FormattedMessage
              id="component.user-dropdown-empty.search-hint-include-groups"
              defaultMessage="Search for existing users and teams"
            />
          </Text>
        </Box>
      )}

      {children}
    </components.MenuList>
  );
}

function NoOptionsMessage(props: NoticeProps & { selectProps: ReactSelectExtraProps }) {
  const {
    selectProps: { inputValue: search, canCreateUsers },
  } = props;
  return <UserDropdownEmpty search={search} canCreateUsers={canCreateUsers} includeGroups={true} />;
}

function SingleValue<T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment>(
  props: SingleValueProps<ApprovalFlowConfigApproverSelection<T>>,
) {
  return (
    <components.SingleValue {...props}>
      <ApprovalFlowConfigApproverSelectOption data={props.data} isDisabled={props.isDisabled} />
    </components.SingleValue>
  );
}

function MultiValueLabel<T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment>({
  children,
  ...props
}: MultiValueGenericProps<ApprovalFlowConfigApproverSelection<T>>) {
  const intl = useIntl();
  const data = props.data;
  return (
    <components.MultiValueLabel {...props}>
      {data.__typename === "User" ? (
        <OverflownText as="span">
          {(data as UserSelect_UserFragment).fullName
            ? `${(data as UserSelect_UserFragment).fullName} <${(data as UserSelect_UserFragment).email}>`
            : (data as UserSelect_UserFragment).email}
        </OverflownText>
      ) : data.__typename === "UserGroup" ? (
        <UserGroupMembersPopover userGroupId={data.id}>
          <OverflownText>
            <UsersIcon
              marginEnd={1}
              aria-label={intl.formatMessage({
                id: "component.user-select.user-group-icon-alt",
                defaultMessage: "Team",
              })}
            />
            {userGroupReferenceText(
              data as UserSelect_UserGroupFragment,
              intl.locale as UserLocale,
            )}{" "}
            (
            <FormattedMessage
              id="generic.n-group-members"
              defaultMessage="{count, plural, =1 {1 member} other {# members}}"
              values={{ count: (data as UserSelect_UserGroupFragment).memberCount }}
            />
            )
          </OverflownText>
        </UserGroupMembersPopover>
      ) : data.__typename === "PetitionField" ? (
        <HStack spacing={2}>
          <PetitionFieldTypeIndicator
            as="div"
            type={data.field.type}
            fieldIndex={data.fieldIndex}
            isTooltipDisabled
            flexShrink={0}
          />

          <Box
            paddingEnd={1}
            flex="1"
            minWidth="0"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {data.field.title ? (
              data.field.title
            ) : (
              <Text as="span" textStyle="hint">
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              </Text>
            )}
          </Box>
        </HStack>
      ) : null}
    </components.MultiValueLabel>
  );
}

function Option<T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment>({
  children,
  ...props
}: OptionProps<ApprovalFlowConfigApproverSelection<T>>) {
  const intl = useIntl();
  const data = props.data;

  return (
    <components.Option
      {...props}
      innerProps={{
        ...props.innerProps,
        ...(data.__typename === "User"
          ? {
              "data-option-type": "User",
              "data-user-id": data.id,
              "data-email": (data as UserSelect_UserFragment).email,
            }
          : data.__typename === "UserGroup"
            ? {
                "data-option-type": "UserGroup",
                "data-user-group-id": data.id,
                "data-all-users-group": (data as UserSelect_UserGroupFragment).type === "ALL_USERS",
                "data-name": userGroupReferenceText(
                  data as UserSelect_UserGroupFragment,
                  intl.locale as UserLocale,
                ),
              }
            : data.__typename === "PetitionField"
              ? {
                  "data-option-type": "PetitionField",
                  "data-field-id": data.id,
                }
              : {}),
      }}
    >
      <ApprovalFlowConfigApproverSelectOption
        data={data}
        highlight={props.selectProps.inputValue}
        isDisabled={props.isDisabled}
      />
    </components.Option>
  );
}

function ApprovalFlowConfigApproverSelectOption<
  T extends ApprovalFlowConfigApproverSelect_PetitionBaseFragment,
>({
  data,
  highlight,
  isDisabled,
}: {
  data: ApprovalFlowConfigApproverSelection<T>;
  highlight?: string;
  isDisabled?: boolean;
}) {
  if (data.__typename === "User" || data.__typename === "UserGroup") {
    return (
      <UserSelectOption
        data={data as UserSelect_UserFragment | UserSelect_UserGroupFragment}
        highlight={highlight}
        isDisabled={isDisabled}
      />
    );
  } else if (data.__typename === "PetitionField") {
    const fieldOption = data as PetitionFieldOption<T>;
    return (
      <HStack spacing={2}>
        <PetitionFieldTypeIndicator
          as="div"
          type={fieldOption.field.type}
          fieldIndex={fieldOption.fieldIndex}
          isTooltipDisabled
          flexShrink={0}
        />

        <Box
          fontSize="sm"
          paddingEnd={1}
          flex="1"
          minWidth="0"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {fieldOption.field.title ? (
            <HighlightText as="span" search={highlight}>
              {fieldOption.field.title}
            </HighlightText>
          ) : (
            <Text as="span" textStyle="hint">
              <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
            </Text>
          )}
        </Box>
      </HStack>
    );
  }
  return null;
}

const _fragments = {
  User: gql`
    fragment ApprovalFlowConfigApproverSelect_User on User {
      id
      fullName
      email
      ...UserSelectOption_User
    }
  `,
  UserGroup: gql`
    fragment ApprovalFlowConfigApproverSelect_UserGroup on UserGroup {
      id
      name
      memberCount
      ...UserSelectOption_UserGroup
      ...UserGroupReference_UserGroup
    }
  `,
  PetitionBase: gql`
    fragment ApprovalFlowConfigApproverSelect_PetitionBase on PetitionBase {
      id
      fields {
        id
        ...ApprovalFlowConfigApproverSelect_PetitionFieldInner
        children {
          id
          ...ApprovalFlowConfigApproverSelect_PetitionFieldInner
        }
      }
      ...useAllFieldsWithIndices_PetitionBase
    }
    fragment ApprovalFlowConfigApproverSelect_PetitionFieldInner on PetitionField {
      id
      type
      title
      options
      parent {
        id
      }
    }
  `,
};

const _queries = [
  gql`
    query ApprovalFlowConfigApproverSelect_canCreateUsers {
      me {
        id
        canCreateUsers
      }
    }
  `,
  gql`
    query ApprovalFlowConfigApproverSelect_useGetUsersOrGroups($ids: [ID!]!) {
      getUsersOrGroups(ids: $ids) {
        ... on User {
          ...ApprovalFlowConfigApproverSelect_User
        }
        ... on UserGroup {
          ...ApprovalFlowConfigApproverSelect_UserGroup
        }
      }
    }
  `,
];
