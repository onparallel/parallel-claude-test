import { gql, useApolloClient } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import {
  ProfileSelect_ProfileFragment,
  ProfileSelect_ProfileFragmentDoc,
  ProfileSelect_profileDocument,
  ProfileSelect_profilesDocument,
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
  forwardRef,
  useCallback,
  useRef,
  useState,
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
import { useCreateProfileDialog } from "../profiles/dialogs/CreateProfileDialog";
import { HighlightText } from "./HighlightText";
import { LocalizableUserTextRender, localizableUserTextRender } from "./LocalizableUserTextRender";
import { OverflownText } from "./OverflownText";
import { isDialogError } from "./dialogs/DialogProvider";

export type ProfileSelectSelection = ProfileSelect_ProfileFragment;

export type ProfileSelectInstance<
  IsMulti extends boolean,
  OptionType extends ProfileSelectSelection = ProfileSelectSelection,
> = SelectInstance<OptionType, IsMulti, never>;

const fragments = {
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
    query ProfileSelect_profiles(
      $offset: Int
      $limit: Int
      $search: String
      $filter: ProfileFilter
      $sortBy: [QueryProfiles_OrderBy!]
    ) {
      profiles(offset: $offset, limit: $limit, search: $search, filter: $filter, sortBy: $sortBy) {
        items {
          ...ProfileSelect_Profile
        }
        totalCount
      }
    }
    ${fragments.Profile}
  `,
  gql`
    query ProfileSelect_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        ...ProfileSelect_Profile
      }
    }
    ${fragments.Profile}
  `,
];

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
}

export const ProfileSelect = Object.assign(
  forwardRef(function ProfileSelect<
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

    const [hideCreate, setHideCreate] = useState<boolean | undefined>(undefined);

    const loadProfiles = useDebouncedAsync(
      async (search: string | null | undefined) => {
        const result = await apollo.query({
          query: ProfileSelect_profilesDocument,
          variables: {
            offset: 0,
            limit: 100,
            filter: {
              profileTypeId: isNonNullish(profileTypeId) ? unMaybeArray(profileTypeId) : null,
              status: ["OPEN", "CLOSED"],
            },
            search,
            sortBy: "name_ASC",
          },
          fetchPolicy: "no-cache",
        });

        const exclude = excludeProfiles ? [...excludeProfiles] : [];

        const items = result.data.profiles.items;

        const profiles = items.filter((p) => !exclude.includes(p.id));

        if (hideCreate === undefined) {
          setHideCreate(profiles.every((p) => !p.profileType.canCreate));
        }

        return profiles as any[];
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

    const [key, rerender] = useRerender();
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
        });
        if (profile) {
          rerender();
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
      } catch (e) {
        if (isDialogError(e)) {
          rerender();
          setTimeout(() => {
            // this line seems to be needed in some scenarios on FF
            innerRef.current?.controlRef?.closest("form")?.focus();
            innerRef.current?.focus();
          });
        }
      }
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
  ) => ReactElement,
  { fragments },
);

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
            return fromServer.data.profile;
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
      <OverflownText as="span">{data.name ?? ""}</OverflownText>
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
