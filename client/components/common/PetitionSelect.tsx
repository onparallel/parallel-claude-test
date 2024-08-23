import { gql, useApolloClient } from "@apollo/client";
import { Center, Text } from "@chakra-ui/react";
import { SearchIcon } from "@parallel/chakra/icons";
import {
  PetitionPermissionType,
  PetitionSelect_PetitionBaseFragmentDoc,
  PetitionSelect_petitionDocument,
  PetitionSelect_petitionsDocument,
} from "@parallel/graphql/__types";
import { assertTypenameArray } from "@parallel/utils/apollo/typename";
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
import { PetitionSelect_PetitionBaseFragment } from "../../graphql/__types";
import { OverflownText } from "./OverflownText";
import { PetitionSelectOption } from "./PetitionSelectOption";

export type PetitionSelectSelection = PetitionSelect_PetitionBaseFragment;

export type PetitionSelectInstance<
  IsMulti extends boolean,
  OptionType extends PetitionSelectSelection = PetitionSelectSelection,
> = SelectInstance<OptionType, IsMulti, never>;

const fragments = {
  PetitionBase: gql`
    fragment PetitionSelect_PetitionBase on PetitionBase {
      id
      ...PetitionSelectOption_PetitionBase
    }
    ${PetitionSelectOption.fragments.PetitionBase}
  `,
};

const _queries = [
  gql`
    query PetitionSelect_petitions(
      $offset: Int
      $limit: Int
      $search: String
      $filters: PetitionFilter
      $sortBy: [QueryPetitions_OrderBy!]
    ) {
      petitions(
        offset: $offset
        limit: $limit
        search: $search
        filters: $filters
        sortBy: $sortBy
        searchByNameOnly: true
        excludeAnonymized: true
      ) {
        items {
          ...PetitionSelect_PetitionBase
        }
        totalCount
      }
    }
    ${fragments.PetitionBase}
  `,
  gql`
    query PetitionSelect_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionSelect_PetitionBase
      }
    }
    ${fragments.PetitionBase}
  `,
];

export interface PetitionSelectProps<
  IsMulti extends boolean = false,
  IsSync extends boolean = false,
  OptionType extends PetitionSelectSelection = PetitionSelectSelection,
> extends Omit<CustomSelectProps<OptionType, IsMulti, never>, "value"> {
  value: If<IsMulti, OptionType[] | string[], OptionType | string | null>;
  type?: "PETITION" | "TEMPLATE";
  excludePetitions?: string[];
  isSync?: IsSync;
  defaultOptions?: boolean;
  permissionTypes?: PetitionPermissionType[];
  noOfLines?: number;
}

export const PetitionSelect = Object.assign(
  forwardRef(function PetitionSelect<
    IsMulti extends boolean = false,
    IsSync extends boolean = false,
    OptionType extends PetitionSelectSelection = PetitionSelectSelection,
  >(
    {
      value,
      isSync,
      onChange,
      options,
      isMulti,
      placeholder: _placeholder,
      excludePetitions,
      permissionTypes,
      ...props
    }: PetitionSelectProps<IsMulti, IsSync, OptionType>,
    ref: ForwardedRef<PetitionSelectInstance<IsMulti, OptionType>>,
  ) {
    const needsLoading =
      typeof value === "string" || (Array.isArray(value) && typeof value[0] === "string");

    const apollo = useApolloClient();
    const type = props.type ?? "PETITION";

    const loadPetitions = useDebouncedAsync(
      async (search: string | null | undefined) => {
        const result = await apollo.query({
          query: PetitionSelect_petitionsDocument,
          variables: {
            offset: 0,
            limit: 100,
            filters: {
              type,
              permissionTypes,
            },
            search,
            sortBy: "lastUsedAt_DESC",
          },
          fetchPolicy: "no-cache",
        });
        assertTypenameArray(
          result.data.petitions.items,
          type === "PETITION" ? "Petition" : "PetitionTemplate",
        );

        return result.data.petitions.items.filter((p) =>
          excludePetitions ? !excludePetitions?.includes(p.id) : true,
        ) as any[];
      },
      300,
      [excludePetitions?.join(",")],
    );

    const getPetitions = useGetPetitions();

    const _value = useAsyncMemo(async () => {
      if (value === null) {
        return null;
      }
      if (needsLoading) {
        return await getPetitions(value as any);
      } else {
        return value as MaybeArray<PetitionSelectSelection>;
      }
    }, [
      needsLoading,
      // Rerun when value changes
      value === null
        ? null
        : needsLoading
          ? // value is string | string[]
            unMaybeArray(value as any).join(",")
          : // value is PetitionSelection[]
            unMaybeArray(value as any)
              .map((x) => x.id)
              .join(","),
    ]);
    const intl = useIntl();
    const placeholder = useMemo(() => {
      return (
        _placeholder ??
        (type === "PETITION"
          ? intl.formatMessage(
              {
                id: "component.petition-select.placeholder-petition",
                defaultMessage: "Select {isMulti, select, true{parallels} other {a parallel}}",
              },
              {
                isMulti,
              },
            )
          : intl.formatMessage(
              {
                id: "component.petition-select.placeholder-petition-template",
                defaultMessage: "Select {isMulti, select, true{templates} other {a template}}",
              },
              {
                isMulti,
              },
            ))
      );
    }, [_placeholder, isMulti]);

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
        loadOptions={loadPetitions}
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
    OptionType extends PetitionSelectSelection = PetitionSelectSelection,
  >(
    props: PetitionSelectProps<IsMulti, IsSync, OptionType> &
      RefAttributes<PetitionSelectInstance<IsMulti, OptionType>>,
  ) => ReactElement,
  { fragments },
);

function useGetPetitions() {
  const client = useApolloClient();
  return useCallback(async (ids: MaybeArray<string>) => {
    const _ids = unMaybeArray(ids);
    const fromCache = zip(
      _ids,
      _ids.map((id) => {
        const petition = client.readFragment({
          fragment: PetitionSelect_PetitionBaseFragmentDoc,
          id,
          fragmentName: "PetitionSelect_PetitionBase",
        });

        return petition ?? null;
      }),
    );
    const missing = fromCache.filter(([, value]) => value === null).map(([id]) => id);

    if (missing.length) {
      const petitions = await pMap(
        missing,
        async (id, i) => {
          try {
            const fromServer = await client.query({
              query: PetitionSelect_petitionDocument,
              variables: {
                id,
              },
              fetchPolicy: "network-only",
            });
            return fromServer.data.petition;
          } catch (e) {}
        },
        {
          concurrency: 1,
        },
      );

      const fromServerById = indexBy(petitions.filter(isNonNullish), (x) => x.id);
      const result = fromCache.map(([id, value]) => value ?? fromServerById[id]!);
      return Array.isArray(ids) ? result : result[0];
    } else {
      const result = fromCache.map(([, value]) => value!);
      return Array.isArray(ids) ? result : result[0];
    }
  }, []);
}

const getOptionLabel = (option: PetitionSelectSelection) => {
  return option.name ?? "";
};

const getOptionValue = (option: PetitionSelectSelection) => option.id;

function SingleValue(props: SingleValueProps<PetitionSelectSelection>) {
  return (
    <components.SingleValue {...props}>
      <PetitionSelectOption data={props.data} isDisabled={props.isDisabled} />
    </components.SingleValue>
  );
}

function MultiValueLabel({ children, ...props }: MultiValueGenericProps<PetitionSelectSelection>) {
  const data = props.data;
  return (
    <components.MultiValueLabel {...(props as any)}>
      <OverflownText as="span">{data.name ?? ""}</OverflownText>
    </components.MultiValueLabel>
  );
}

interface ReactSelectExtraProps {
  noOfLines?: number;
  type?: "PETITION" | "TEMPLATE";
}

function NoOptionsMessage(
  props: OptionProps<PetitionSelectSelection> & { selectProps: ReactSelectExtraProps },
) {
  const {
    selectProps: { inputValue: search, type },
  } = props;
  return (
    <Center alignItems="center" textAlign="center" padding={4}>
      {search ? (
        <Text textStyle="hint">
          <FormattedMessage id="generic.no-results" defaultMessage="No results" />
        </Text>
      ) : (
        <Text color="gray.500">
          <SearchIcon marginEnd={2} position="relative" top="-1px" />
          {type === "TEMPLATE" ? (
            <FormattedMessage
              id="component.petition-select.search-hint-template"
              defaultMessage="Type to search among the existing templates"
            />
          ) : (
            <FormattedMessage
              id="component.petition-select.search-hint-petition"
              defaultMessage="Type to search among the existing parallels"
            />
          )}
        </Text>
      )}
    </Center>
  );
}

function Option({
  children,
  ...props
}: OptionProps<PetitionSelectSelection> & { selectProps: ReactSelectExtraProps }) {
  return (
    <components.Option
      {...props}
      innerProps={{
        ...props.innerProps,
        ...(props.data ? { "data-petition-id": props.data.id } : {}),
      }}
    >
      <PetitionSelectOption
        data={props.data}
        highlight={props.selectProps.inputValue}
        isDisabled={props.isDisabled}
        noOfLines={props.selectProps.noOfLines}
      />
    </components.Option>
  );
}
