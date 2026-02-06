import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { Box } from "@chakra-ui/react";
import { Text } from "@parallel/components/ui";
import {
  ProfileTypeSelect_ProfileTypeFragment,
  ProfileTypeSelect_ProfileTypeFragmentDoc,
  ProfileTypeSelect_profileTypeDocument,
  ProfileTypeSelect_profileTypesDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { If, MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { useAsyncMemo } from "@parallel/utils/useAsyncMemo";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import pMap from "p-map";
import { ForwardedRef, ReactElement, RefAttributes, forwardRef, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, {
  MultiValueGenericProps,
  OptionProps,
  SelectComponentsConfig,
  SelectInstance,
  SingleValueProps,
  components,
} from "react-select";
import AsyncSelect from "react-select/async";
import { indexBy, isNonNullish, zip } from "remeda";
import { assert } from "ts-essentials";
import { LocalizableUserTextRender, localizableUserTextRender } from "./LocalizableUserTextRender";
import { OverflownText } from "./OverflownText";

export type ProfileTypeSelectSelection = ProfileTypeSelect_ProfileTypeFragment;

export type ProfileTypeSelectInstance<
  IsMulti extends boolean,
  OptionType extends ProfileTypeSelectSelection = ProfileTypeSelectSelection,
> = SelectInstance<OptionType, IsMulti, never>;

export interface ProfileTypeSelectProps<
  IsMulti extends boolean = false,
  IsSync extends boolean = false,
  OptionType extends ProfileTypeSelectSelection = ProfileTypeSelectSelection,
> extends Omit<CustomSelectProps<OptionType, IsMulti, never>, "value"> {
  value: If<IsMulti, OptionType[] | string[], OptionType | string | null>;
  isSync?: IsSync;
  defaultOptions?: boolean;
  showOnlyCreatable?: boolean;
}

export const ProfileTypeSelect = forwardRef(function ProfileTypeSelect<
  IsMulti extends boolean = false,
  IsSync extends boolean = false,
  OptionType extends ProfileTypeSelectSelection = ProfileTypeSelectSelection,
>(
  {
    value,
    isSync,
    onChange,
    options,
    isMulti,
    placeholder: _placeholder,
    showOnlyCreatable,
    ...props
  }: ProfileTypeSelectProps<IsMulti, IsSync, OptionType>,
  ref: ForwardedRef<ProfileTypeSelectInstance<IsMulti, OptionType>>,
) {
  const intl = useIntl();
  const needsLoading =
    typeof value === "string" || (Array.isArray(value) && typeof value[0] === "string");

  const apollo = useApolloClient();

  const loadProfileTypes = useDebouncedAsync(
    async (search: string | null | undefined) => {
      const { data } = await apollo.query({
        query: ProfileTypeSelect_profileTypesDocument,
        variables: {
          offset: 0,
          limit: 100,
          locale: intl.locale as UserLocale,
          search,
          sortBy: "name_ASC",
        },
        fetchPolicy: "no-cache",
      });

      assert(
        isNonNullish(data),
        "Result data in ProfileTypeSelect_profileTypesDocument is missing",
      );

      return (
        showOnlyCreatable
          ? data.profileTypes.items.filter((pt) => pt.canCreate)
          : data.profileTypes.items
      ) as any[];
    },
    300,
    [intl.locale, showOnlyCreatable],
  );

  const getProfileTypes = useGetProfileTypes();

  const _value = useAsyncMemo(async () => {
    if (value === null) {
      return null;
    }
    if (needsLoading) {
      return await getProfileTypes(value as any);
    } else {
      return value as MaybeArray<ProfileTypeSelectSelection>;
    }
  }, [
    needsLoading,
    // Rerun when value changes
    isNonNullish(value)
      ? needsLoading
        ? // value is string | string[]
          unMaybeArray(value as any).join(",")
        : // value is ProfileSelection[]
          unMaybeArray(value as any)
            .map((x) => x.id)
            .join(",")
      : null,
  ]);

  const placeholder = useMemo(() => {
    return (
      _placeholder ??
      intl.formatMessage(
        {
          id: "component.profile-type-select.placeholder",
          defaultMessage: "Select {isMulti, select, true{profiles types} other {a profile type}}",
        },
        {
          isMulti,
        },
      )
    );
  }, [_placeholder, isMulti]);

  const rsProps = useReactSelectProps<OptionType, IsMulti, never>({
    ...props,
    components: {
      SingleValue,
      MultiValueLabel,
      Option,
      ...props.components,
    } as unknown as SelectComponentsConfig<OptionType, IsMulti, never>,
  });

  const getOptionLabel = (option: ProfileTypeSelectSelection) => {
    return localizableUserTextRender({
      value: option.name,
      intl,
      default: intl.formatMessage({
        id: "generic.unnamed-profile-type",
        defaultMessage: "Unnamed profile type",
      }),
    });
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
      isClearable={props.isClearable}
      {...props}
      {...rsProps}
    />
  ) : (
    <AsyncSelect<OptionType, IsMulti, never>
      ref={ref as any}
      value={_value as any}
      onChange={onChange as any}
      isMulti={isMulti}
      loadOptions={loadProfileTypes}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      placeholder={placeholder}
      isClearable={props.isClearable}
      {...props}
      {...rsProps}
    />
  );
}) as <
  IsMulti extends boolean = false,
  IsSync extends boolean = false,
  OptionType extends ProfileTypeSelectSelection = ProfileTypeSelectSelection,
>(
  props: ProfileTypeSelectProps<IsMulti, IsSync, OptionType> &
    RefAttributes<ProfileTypeSelectInstance<IsMulti, OptionType>>,
) => ReactElement;

function useGetProfileTypes() {
  const client = useApolloClient();
  return useCallback(async (ids: MaybeArray<string>) => {
    const _ids = unMaybeArray(ids);
    const fromCache = zip(
      _ids,
      _ids.map((id) => {
        const profile = client.readFragment({
          fragment: ProfileTypeSelect_ProfileTypeFragmentDoc,
          id,
          fragmentName: "ProfileTypeSelect_ProfileType",
        });

        return profile ?? null;
      }),
    );
    const missing = fromCache.filter(([id, value]) => value === null && id).map(([id]) => id);

    if (missing.length) {
      const profiles = await pMap(
        missing,
        async (profileTypeId, i) => {
          try {
            const fromServer = await client.query({
              query: ProfileTypeSelect_profileTypeDocument,
              variables: {
                profileTypeId,
              },
              fetchPolicy: "network-only",
            });
            return fromServer.data?.profileType;
          } catch {}
        },
        {
          concurrency: 1,
        },
      );

      const fromServerById = indexBy(profiles.filter(isNonNullish), (x) => x.id);
      const result = fromCache.map(([id, value]) => value ?? fromServerById[id]!);
      return Array.isArray(ids) ? result : result[0];
    } else {
      const result = fromCache.map(([, value]) => value!);
      return Array.isArray(ids) ? result : result[0];
    }
  }, []);
}

const getOptionValue = (option: ProfileTypeSelectSelection) => option.id;

function SingleValue(props: SingleValueProps<ProfileTypeSelectSelection>) {
  return (
    <components.SingleValue {...props}>
      <ProfileTypeSelectOption data={props.data} isDisabled={props.isDisabled} />
    </components.SingleValue>
  );
}

function MultiValueLabel({
  children,
  ...props
}: MultiValueGenericProps<ProfileTypeSelectSelection>) {
  const data = props.data;
  return (
    <components.MultiValueLabel {...(props as any)}>
      <OverflownText as="span">{data.name ?? ""}</OverflownText>
    </components.MultiValueLabel>
  );
}

function Option({ children, ...props }: OptionProps<ProfileTypeSelectSelection>) {
  return (
    <components.Option
      {...props}
      innerProps={{
        ...props.innerProps,
        ...(props.data.name ? { "data-profile-type-id": props.data.id } : {}),
      }}
    >
      <ProfileTypeSelectOption
        data={props.data}
        highlight={props.selectProps.inputValue}
        isDisabled={props.isDisabled}
      />
    </components.Option>
  );
}

interface ProfileTypeSelectOptionProps {
  data: ProfileTypeSelectSelection;
  highlight?: string;
  isDisabled?: boolean;
}

function ProfileTypeSelectOption({ data, highlight, isDisabled }: ProfileTypeSelectOptionProps) {
  return (
    <Box verticalAlign="baseline" noOfLines={1} wordBreak="break-all">
      <Text as="span">
        <LocalizableUserTextRender
          value={data.name}
          default={
            <FormattedMessage
              id="generic.unnamed-profile-type"
              defaultMessage="Unnamed profile type"
            />
          }
        />
      </Text>
    </Box>
  );
}

const _fragments = {
  ProfileType: gql`
    fragment ProfileTypeSelect_ProfileType on ProfileType {
      id
      name
      canCreate
    }
  `,
};

const _queries = [
  gql`
    query ProfileTypeSelect_profileTypes(
      $offset: Int
      $limit: Int
      $search: String
      $locale: UserLocale
      $sortBy: [QueryProfileTypes_OrderBy!]
    ) {
      profileTypes(
        offset: $offset
        limit: $limit
        search: $search
        locale: $locale
        sortBy: $sortBy
      ) {
        items {
          ...ProfileTypeSelect_ProfileType
        }
        totalCount
      }
    }
  `,
  gql`
    query ProfileTypeSelect_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        ...ProfileTypeSelect_ProfileType
      }
    }
  `,
];
