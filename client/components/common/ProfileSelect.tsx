import { gql } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { Box, Text } from "@chakra-ui/react";
import {
  ProfileSelect_ProfileFragment,
  ProfileSelect_ProfileFragmentDoc,
  ProfileSelect_ProfileTypesDocument,
  ProfileSelect_profileDocument,
  ProfileSelect_profilesSimpleDocument,
  useCreateProfileDialog_ProfileFragment,
} from "@parallel/graphql/__types";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomAsyncCreatableSelectProps } from "@parallel/utils/react-select/types";
import { If, MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { useAsyncMemo } from "@parallel/utils/useAsyncMemo";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useRerender } from "@parallel/utils/useRerender";
import useMergedRef from "@react-hook/merged-ref";
import pMap from "p-map";
import {
  ForwardedRef,
  ReactElement,
  RefAttributes,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
import AsyncCreatableSelect from "react-select/async-creatable";
import { indexBy, isNonNullish, zip } from "remeda";
import { assert, noop } from "ts-essentials";
import { useCreateProfileDialog } from "../profiles/dialogs/CreateProfileDialog";
import { HighlightText } from "./HighlightText";
import { LocalizableUserTextRender, localizableUserTextRender } from "./LocalizableUserTextRender";
import { OverflownText } from "./OverflownText";

export type ProfileSelectSelection = ProfileSelect_ProfileFragment;

export type ProfileSelectInstance<
  IsMulti extends boolean,
  OptionType extends ProfileSelectSelection = ProfileSelectSelection,
> = SelectInstance<OptionType, IsMulti, never>;

export interface ProfileSelectProps<
  IsMulti extends boolean = false,
  IsSync extends boolean = false,
  OptionType extends ProfileSelectSelection = ProfileSelectSelection,
> extends Omit<CustomAsyncCreatableSelectProps<OptionType, IsMulti, never>, "value"> {
  value: If<IsMulti, OptionType[] | string[], OptionType | string | null>;
  profileTypeId?: MaybeArray<string>;
  defaultCreateProfileName?: string;
  defaultCreateProfileFieldValues?: Record<string, string | number>;
  excludeProfiles?: string[];
  isSync?: IsSync;
  defaultOptions?: boolean;
  canCreateProfiles?: boolean;
  hideProfileType?: boolean;
  onCreateProfile?: (profile: useCreateProfileDialog_ProfileFragment) => void;
}

export const ProfileSelect = forwardRef(function ProfileSelect<
  IsMulti extends boolean = false,
  IsSync extends boolean = false,
  OptionType extends ProfileSelectSelection = ProfileSelectSelection,
>(
  {
    value,
    isSync,
    onChange,
    options,
    isMulti,
    placeholder,
    profileTypeId,
    defaultCreateProfileName,
    defaultCreateProfileFieldValues,
    excludeProfiles,
    canCreateProfiles,
    onCreateProfile,
    ...props
  }: ProfileSelectProps<IsMulti, IsSync, OptionType>,
  ref: ForwardedRef<ProfileSelectInstance<IsMulti, OptionType>>,
) {
  const innerRef = useRef<ProfileSelectInstance<IsMulti, OptionType>>();
  const _ref = useMergedRef(ref, innerRef);
  const intl = useIntl();
  const needsLoading =
    typeof value === "string" || (Array.isArray(value) && typeof value[0] === "string");

  const apollo = useApolloClient();

  const { registerProfileSelect, triggerRerender } = useContext(ProfileSelectRerenderContext);
  const [key, rerender] = useRerender();

  useEffect(() => {
    if (isNonNullish(profileTypeId)) {
      return registerProfileSelect(profileTypeId, rerender);
    }
  }, [unMaybeArray(profileTypeId ?? []).join(",")]);

  const { data } = useQuery(ProfileSelect_ProfileTypesDocument, {
    variables: {
      limit: 100,
      offset: 0,
      filter: isNonNullish(profileTypeId)
        ? {
            profileTypeId: unMaybeArray(profileTypeId),
          }
        : undefined,
    },
    skip: !canCreateProfiles,
  });

  const hideCreate = isNonNullish(data)
    ? data.profileTypes.items.every((profileType) => !profileType.canCreate)
    : false;

  const loadProfiles = useDebouncedAsync(
    async (search: string | null | undefined) => {
      const { data } = await apollo.query({
        query: ProfileSelect_profilesSimpleDocument,
        variables: {
          offset: 0,
          limit: 100,
          profileTypeId: isNonNullish(profileTypeId) ? unMaybeArray(profileTypeId) : null,
          status: ["OPEN", "CLOSED"],
          search,
        },
        fetchPolicy: "no-cache",
      });

      const exclude = excludeProfiles ? [...excludeProfiles] : [];

      assert(isNonNullish(data), "Result data in ProfileSelect_profilesDocument is missing");

      return data.profilesSimple.items.filter((p) => !exclude.includes(p.id)) as any[];
    },
    300,
    [unMaybeArray(profileTypeId ?? []).join(","), hideCreate],
  );

  const getProfiles = useGetProfiles();

  const _value = useAsyncMemo(async () => {
    if (value === null) {
      return null;
    }
    if (needsLoading) {
      return await getProfiles(value as any);
    } else {
      return value as MaybeArray<ProfileSelectSelection>;
    }
  }, [
    needsLoading,
    // Rerun when value changes
    value === null
      ? null
      : needsLoading
        ? // value is string | string[]
          unMaybeArray(value as any).join(",")
        : // value is ProfileSelection[]
          unMaybeArray(value as any)
            .map((x) => x.id)
            .join(","),
  ]);

  const rsProps = useReactSelectProps<OptionType, IsMulti, never>({
    ...props,
    components: {
      SingleValue,
      MultiValueLabel,
      Option,
      ...props.components,
    } as unknown as SelectComponentsConfig<OptionType, IsMulti, never>,
  });

  const formatCreateLabel = (label: string) => {
    return (
      <Text as="em">
        {label || defaultCreateProfileName ? (
          <FormattedMessage
            id="component.profile-select.create-new-profile"
            defaultMessage="Create new profile for: <b>{label}</b>"
            values={{ label: label || defaultCreateProfileName }}
          />
        ) : (
          <FormattedMessage
            id="component.profile-select.create-new-profile-no-name"
            defaultMessage="Create new profile"
          />
        )}
      </Text>
    );
  };
  const hasCreatePermission = useHasPermission("PROFILES:CREATE_PROFILES");

  const userCanCreateProfiles = hideCreate !== true && hasCreatePermission && canCreateProfiles;

  const showCreateProfileDialog = useCreateProfileDialog();
  async function handleCreateOption(name: string) {
    try {
      const allowedProfileTypeIds = unMaybeArray(profileTypeId ?? []);
      const { profile } = await showCreateProfileDialog({
        profileTypeId: allowedProfileTypeIds.length === 1 ? allowedProfileTypeIds[0] : undefined,
        ...(name
          ? { suggestedName: name }
          : defaultCreateProfileFieldValues
            ? { profileFieldValues: defaultCreateProfileFieldValues }
            : {}),
        modalProps: innerRef.current?.inputRef
          ? { finalFocusRef: innerRef.current!.inputRef as any }
          : undefined,
      });
      if (profile) {
        triggerRerender(profile.profileType.id);
        if (isMulti) {
          const selectedValues = unMaybeArray(_value);
          onChange([...selectedValues, profile] as any, {
            action: "create-option",
            option: profile as any,
          });
        } else {
          onChange(profile as any, { action: "create-option", option: profile as any });
        }
      }
    } catch {}
    setTimeout(() => {
      // this line seems to be needed in some scenarios on FF
      innerRef.current?.controlRef?.closest("form")?.focus();
      innerRef.current?.focus();
    }, 1);
  }

  useEffectSkipFirst(() => {
    rerender();
  }, [unMaybeArray(profileTypeId ?? [])?.join(",")]);

  const getOptionLabel = useCallback(
    (option: ProfileSelectSelection) => {
      if ((option as any).__isNew__) {
        return (option as any).label;
      } else {
        return localizableUserTextRender({ intl, value: option.localizableName, default: "" });
      }
    },
    [intl.locale],
  );

  return isSync ? (
    <Select<OptionType, IsMulti, never>
      ref={_ref as any}
      value={_value as any}
      onChange={onChange as any}
      isMulti={isMulti}
      options={options}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      onCreateOption={handleCreateOption}
      placeholder={
        placeholder ??
        intl.formatMessage(
          {
            id: "component.profile-select.placeholder",
            defaultMessage: "Select {isMulti, select, true{profiles} other {a profile}}",
          },
          { isMulti },
        )
      }
      isClearable={props.isClearable}
      {...props}
      {...rsProps}
    />
  ) : userCanCreateProfiles ? (
    <AsyncCreatableSelect<OptionType, IsMulti, never>
      // a key is needed to force a rerender of the component and refetch of the default options
      key={key}
      cacheOptions={false}
      ref={_ref as any}
      value={_value as any}
      onChange={onChange as any}
      isMulti={isMulti}
      loadOptions={loadProfiles}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      onCreateOption={handleCreateOption}
      isValidNewOption={isNonNullish(defaultCreateProfileName) ? () => true : undefined}
      placeholder={
        placeholder ??
        intl.formatMessage(
          {
            id: "component.profile-select.placeholder",
            defaultMessage: "Select {isMulti, select, true{profiles} other {a profile}}",
          },
          { isMulti },
        )
      }
      isClearable={props.isClearable}
      formatCreateLabel={formatCreateLabel}
      {...props}
      {...rsProps}
    />
  ) : (
    <AsyncSelect<OptionType, IsMulti, never>
      // a key is needed to force a rerender of the component and refetch of the default options
      key={key}
      cacheOptions={false}
      ref={_ref as any}
      value={_value as any}
      onChange={onChange as any}
      isMulti={isMulti}
      loadOptions={loadProfiles}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      placeholder={
        placeholder ??
        intl.formatMessage(
          {
            id: "component.profile-select.placeholder",
            defaultMessage: "Select {isMulti, select, true{profiles} other {a profile}}",
          },
          { isMulti },
        )
      }
      isClearable={props.isClearable}
      {...props}
      {...rsProps}
    />
  );
}) as <
  IsMulti extends boolean = false,
  IsSync extends boolean = false,
  OptionType extends ProfileSelectSelection = ProfileSelectSelection,
>(
  props: ProfileSelectProps<IsMulti, IsSync, OptionType> &
    RefAttributes<ProfileSelectInstance<IsMulti, OptionType>>,
) => ReactElement;

function useGetProfiles() {
  const client = useApolloClient();
  return useCallback(async (ids: MaybeArray<string>) => {
    const _ids = unMaybeArray(ids);
    const fromCache = zip(
      _ids,
      _ids.map((id) => {
        const profile = client.readFragment({
          fragment: ProfileSelect_ProfileFragmentDoc,
          id,
          fragmentName: "ProfileSelect_Profile",
        });

        return profile ?? null;
      }),
    );
    const missing = fromCache.filter(([, value]) => value === null).map(([id]) => id);

    if (missing.length) {
      const profiles = await pMap(
        missing,
        async (profileId, i) => {
          try {
            const fromServer = await client.query({
              query: ProfileSelect_profileDocument,
              variables: {
                profileId,
              },
              fetchPolicy: "network-only",
            });
            return fromServer.data?.profile;
          } catch (e) {}
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

interface ReactSelectExtraProps {
  hideProfileType?: boolean;
}

const getOptionValue = (option: ProfileSelectSelection) => option.id;

function SingleValue(
  props: SingleValueProps<ProfileSelectSelection> & { selectProps: ReactSelectExtraProps },
) {
  return (
    <components.SingleValue {...props}>
      <OverflownText key={props.data.id}>
        <ProfileSelectOption
          data={props.data}
          isDisabled={props.isDisabled}
          hideProfileType={props.selectProps.hideProfileType}
        />
      </OverflownText>
    </components.SingleValue>
  );
}

function MultiValueLabel({ children, ...props }: MultiValueGenericProps<ProfileSelectSelection>) {
  const data = props.data;
  return (
    <components.MultiValueLabel {...(props as any)}>
      <OverflownText key={data.id}>
        <ProfileSelectOption data={data} hideProfileType={true} />
      </OverflownText>
    </components.MultiValueLabel>
  );
}

function Option({
  children,
  ...props
}: OptionProps<ProfileSelectSelection> & { selectProps: ReactSelectExtraProps }) {
  const intl = useIntl();
  if ((props.data as any).__isNew__) {
    return (
      <components.Option
        {...props}
        innerProps={{ ...props.innerProps, "data-testid": "create-profile-option" } as any}
      >
        {children} {/* from formatCreateLabel */}
      </components.Option>
    );
  } else {
    return (
      <components.Option
        {...props}
        innerProps={{
          ...props.innerProps,
          ...(props.data
            ? {
                "data-profile-id": props.data.id,
                "data-profile-name": localizableUserTextRender({
                  intl,
                  value: props.data.localizableName,
                  default: "",
                }),
              }
            : {}),
        }}
      >
        <Box verticalAlign="baseline" noOfLines={2} wordBreak="break-all">
          <ProfileSelectOption
            data={props.data}
            highlight={props.selectProps.inputValue}
            isDisabled={props.isDisabled}
            isSelected={props.isSelected}
            hideProfileType={props.selectProps.hideProfileType}
          />
        </Box>
      </components.Option>
    );
  }
}

interface ProfileSelectOptionProps {
  data: ProfileSelectSelection;
  highlight?: string;
  isDisabled?: boolean;
  isSelected?: boolean;
  hideProfileType?: boolean;
}

function ProfileSelectOption({
  data,
  highlight,
  isDisabled,
  isSelected,
  hideProfileType,
}: ProfileSelectOptionProps) {
  const intl = useIntl();
  const profileName = localizableUserTextRender({
    intl,
    value: data.localizableName,
    default: "",
  });
  return (
    <>
      {profileName ? (
        <HighlightText search={highlight} as="span">
          {profileName}
        </HighlightText>
      ) : (
        <Text as="span" textStyle="hint">
          <FormattedMessage id="generic.unnamed-profile" defaultMessage="Unnamed profile" />
        </Text>
      )}
      {hideProfileType ? null : (
        <Text as="span" fontSize="87.5%" color={isSelected ? undefined : "gray.500"}>
          <Text as="span" display="inline-block" width={2} />
          <LocalizableUserTextRender
            value={data.profileType.name}
            default={
              <FormattedMessage
                id="generic.unnamed-profile-type"
                defaultMessage="Unnamed profile type"
              />
            }
          />
        </Text>
      )}
    </>
  );
}

interface ProfileSelectRerenderValue {
  registerProfileSelect: (profileTypeId: MaybeArray<string>, forceRender: () => void) => () => void;
  triggerRerender: (profileTypeId: string) => void;
}

const ProfileSelectRerenderContext = createContext<ProfileSelectRerenderValue>({
  registerProfileSelect: () => noop,
  triggerRerender: noop,
});

export function ProfileSelectRerenderProvider({ children }: { children: React.ReactNode }) {
  const profileSelectsRef = useRef<Record<string, Set<() => void>>>({});

  const value = useMemo(() => {
    return {
      registerProfileSelect: (profileTypeId: MaybeArray<string>, callback: () => void) => {
        for (const id of unMaybeArray(profileTypeId)) {
          (profileSelectsRef.current[id] ??= new Set()).add(callback);
        }
        return () => {
          for (const id of unMaybeArray(profileTypeId)) {
            profileSelectsRef.current[id].delete(callback);
          }
        };
      },
      triggerRerender: (profileTypeId: string) => {
        profileSelectsRef.current[profileTypeId]?.forEach((rerender) => rerender());
      },
    };
  }, []);

  return (
    <ProfileSelectRerenderContext.Provider value={value}>
      {children}
    </ProfileSelectRerenderContext.Provider>
  );
}

const _fragments = {
  Profile: gql`
    fragment ProfileSelect_Profile on Profile {
      id
      localizableName
      status
      profileType {
        id
        name
        canCreate
      }
    }
  `,
};

const _queries = [
  gql`
    query ProfileSelect_profilesSimple(
      $offset: Int
      $limit: Int
      $search: String
      $profileTypeId: [GID!]
      $status: [ProfileStatus!]
    ) {
      profilesSimple(
        offset: $offset
        limit: $limit
        search: $search
        profileTypeId: $profileTypeId
        status: $status
      ) {
        items {
          ...ProfileSelect_Profile
        }
        totalCount
      }
    }
  `,
  gql`
    query ProfileSelect_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        ...ProfileSelect_Profile
      }
    }
  `,
  gql`
    query ProfileSelect_ProfileTypes($offset: Int, $limit: Int, $filter: ProfileTypeFilter) {
      profileTypes(offset: $offset, limit: $limit, filter: $filter) {
        items {
          id
          canCreate
        }
      }
    }
  `,
];
