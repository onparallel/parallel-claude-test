import { gql } from "@apollo/client";

import { CircleCheckIcon } from "@parallel/chakra/icons";
import { HighlightText } from "@parallel/components/common/HighlightText";
import {
  ProfileQueryFilterProperty,
  ProfileTypeFieldSelect_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { memo, useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import Select, {
  ActionMeta,
  CSSObjectWithLabel,
  GroupBase,
  GroupHeadingProps,
  OnChangeValue,
  OptionProps,
  SingleValue as SV,
  SingleValueProps,
  components,
} from "react-select";
import { isNonNullish } from "remeda";
import { ProfileTypeFieldTypeIndicator } from "../organization/profiles/ProfileTypeFieldTypeIndicator";
import { HStack } from "../ui";
import { localizableUserTextRender } from "./LocalizableUserTextRender";
import { Box, Flex, Text } from "@parallel/components/ui";

type ProfileTypeFieldSelection = ProfileTypeFieldSelect_ProfileTypeFieldFragment;

interface MetadataFieldOption {
  type: "METADATA";
  label: string;
  value: ProfileQueryFilterProperty;
}

interface ProfileTypeFieldSelectOption<T extends ProfileTypeFieldSelection> {
  type: "FIELD";
  field: T;
  fieldIndex: number;
  label: string;
}

type SelectOption<T extends ProfileTypeFieldSelection> =
  | MetadataFieldOption
  | ProfileTypeFieldSelectOption<T>;

export interface ProfileQueryFilterSubjectSelectProps<OptionType extends ProfileTypeFieldSelection>
  extends Omit<
    CustomSelectProps<SelectOption<OptionType>, false, GroupBase<SelectOption<OptionType>>>,
    "value" | "onChange"
  > {
  value: OptionType | ProfileQueryFilterProperty | null;
  onChange: (
    value: OptionType | ProfileQueryFilterProperty | null,
    actionMeta: ActionMeta<SelectOption<OptionType>>,
  ) => void;
  fields: OptionType[];
  filterFields?: (field: OptionType) => boolean;
  fontSize?: string;
}

export function ProfileQueryFilterSubjectSelect<OptionType extends ProfileTypeFieldSelection>({
  value,
  onChange,
  fields,
  filterFields,
  ...props
}: ProfileQueryFilterSubjectSelectProps<OptionType>) {
  const intl = useIntl();

  const metadataOptions = useMemo<MetadataFieldOption[]>(() => {
    return [
      {
        type: "METADATA",
        label: intl.formatMessage({
          id: "component.profile-type-field-and-metadata-select.metadata-status",
          defaultMessage: "Status",
        }),
        value: "status",
      },
      {
        type: "METADATA",
        label: intl.formatMessage({
          id: "component.profile-type-field-and-metadata-select.metadata-creation-date",
          defaultMessage: "Creation date",
        }),
        value: "createdAt",
      },
      {
        type: "METADATA",
        label: intl.formatMessage({
          id: "component.profile-type-field-and-metadata-select.metadata-update-date",
          defaultMessage: "Update date",
        }),
        value: "updatedAt",
      },
      {
        type: "METADATA",
        label: intl.formatMessage({
          id: "component.profile-type-field-and-metadata-select.metadata-close-date",
          defaultMessage: "Close date",
        }),
        value: "closedAt",
      },
    ];
  }, [intl]);

  const rsProps = useReactSelectProps<
    SelectOption<OptionType>,
    false,
    GroupBase<SelectOption<OptionType>>
  >({
    ...(props as any),
    components: {
      SingleValue,
      Option,
      GroupHeading: GroupHeading,
      ...props.components,
    },
    styles: {
      option: (styles: CSSObjectWithLabel) => ({
        ...styles,
        display: "flex",
        padding: "6px 8px",
      }),
    },
  });

  const { options, _value } = useMemo(() => {
    let fieldOptions: ProfileTypeFieldSelectOption<OptionType>[] = fields.map((field, index) => {
      const label = localizableUserTextRender({
        value: field.name,
        intl,
        default: intl.formatMessage({
          id: "generic.unnamed-profile-type-field",
          defaultMessage: "Unnamed property",
        }),
      });
      return {
        type: "FIELD",
        field,
        fieldIndex: index + 1,
        label,
      };
    });
    if (isNonNullish(filterFields)) {
      fieldOptions = fieldOptions.filter(({ field }) => filterFields(field));
    }

    // Create grouped options
    const groupedOptions: GroupBase<SelectOption<OptionType>>[] = [
      {
        label: intl.formatMessage({
          id: "component.profile-type-field-and-metadata-select.metadata-group-label",
          defaultMessage: "Metadata",
        }),
        options: metadataOptions,
      },
      {
        label: intl.formatMessage({
          id: "component.profile-type-field-and-metadata-select.properties-group-label",
          defaultMessage: "Properties",
        }),
        options: fieldOptions,
      },
    ];

    // Map value to options
    const _value = (() => {
      if (!value) return null;
      // Check if it's a metadata field type
      if (typeof value === "string") {
        if (["status", "createdAt", "updatedAt", "closedAt"].includes(value)) {
          return metadataOptions.find((opt) => opt.value === value) ?? null;
        }
      } else if (typeof value === "object" && value !== null && "id" in value) {
        // It's a ProfileTypeField
        return fieldOptions.find((opt) => opt.field.id === (value as OptionType).id) ?? null;
      }
      return null;
    })();

    return { options: groupedOptions, _value };
  }, [fields, value, intl.locale, metadataOptions, filterFields]);

  const handleChange = useCallback(
    (
      newValue: OnChangeValue<SelectOption<OptionType>, false>,
      actionMeta: ActionMeta<SelectOption<OptionType>>,
    ) => {
      const singleValue = newValue as SV<SelectOption<OptionType>> | null;
      if (singleValue) {
        if (singleValue.type === "FIELD") {
          onChange(singleValue.field, actionMeta);
        } else if (singleValue.type === "METADATA") {
          onChange(singleValue.value, actionMeta);
        }
      } else {
        onChange(null, actionMeta);
      }
    },
    [onChange],
  );

  return (
    <Select<SelectOption<OptionType>, false, GroupBase<SelectOption<OptionType>>>
      options={options}
      isSearchable={true}
      value={_value as any}
      onChange={(value, meta) => {
        handleChange(value as any, meta as ActionMeta<SelectOption<OptionType>>);
      }}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      placeholder={
        props.placeholder ??
        intl.formatMessage({
          id: "component.profile-type-field-select.placeholder",
          defaultMessage: "Select a property",
        })
      }
      {...(props as any)}
      {...rsProps}
    />
  );
}

ProfileQueryFilterSubjectSelect.fragments = {
  ProfileTypeField: gql`
    fragment ProfileQueryFilterSubjectSelect_ProfileTypeField on ProfileTypeField {
      id
      name
      type
    }
  `,
};

function GroupHeading(props: GroupHeadingProps<SelectOption<ProfileTypeFieldSelection>>) {
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

const ProfileTypeFieldSelectItem = memo(function ProfileTypeFieldSelectItem<
  T extends ProfileTypeFieldSelection,
>({
  option,
  highlight,
  fontSize = "md",
}: {
  option: ProfileTypeFieldSelectOption<T>;
  highlight?: string;
  fontSize?: string;
}) {
  const { field, fieldIndex, label } = option;
  return (
    <>
      <ProfileTypeFieldTypeIndicator type={field.type} fieldIndex={fieldIndex} />
      <Box
        fontSize={fontSize}
        marginStart={2}
        paddingEnd={1}
        flex="1"
        minWidth="0"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        <HighlightText as="span" search={highlight}>
          {label}
        </HighlightText>
      </Box>
    </>
  );
});

const MetadataFieldSelectItem = memo(function MetadataFieldSelectItem({
  option,
  highlight,
  fontSize = "md",
}: {
  option: MetadataFieldOption;
  highlight?: string;
  fontSize?: string;
}) {
  return (
    <HStack fontSize={fontSize}>
      {option.value === "status" ? (
        <Box
          borderRadius="sm"
          paddingX={1}
          minHeight={5}
          minWidth={6}
          backgroundColor="green.400"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <CircleCheckIcon boxSize="14px" role="presentation" />
        </Box>
      ) : (
        <ProfileTypeFieldTypeIndicator type="DATE" isTooltipDisabled />
      )}

      <HighlightText as="span" search={highlight}>
        {option.label}
      </HighlightText>
    </HStack>
  );
});

const getOptionValue = (option: SelectOption<ProfileTypeFieldSelection>) => {
  if (option.type === "METADATA") {
    return option;
  }
  if (option.type === "FIELD") {
    return option.field.id;
  }
  return "";
};

const getOptionLabel = (option: SelectOption<ProfileTypeFieldSelection>) => {
  return option.label;
};

interface ReactSelectExtraProps {
  fontSize?: string;
}

function SingleValue(
  props: SingleValueProps<SelectOption<ProfileTypeFieldSelection>> & {
    selectProps: ReactSelectExtraProps;
  },
) {
  const data = props.data;
  return (
    <components.SingleValue {...props}>
      <Flex>
        {data.type === "METADATA" ? (
          <MetadataFieldSelectItem
            option={data}
            highlight={props.selectProps.inputValue ?? ""}
            fontSize={props.selectProps.fontSize}
          />
        ) : data.type === "FIELD" ? (
          <ProfileTypeFieldSelectItem
            option={data}
            highlight={props.selectProps.inputValue ?? ""}
            fontSize={props.selectProps.fontSize}
          />
        ) : null}
      </Flex>
    </components.SingleValue>
  );
}

function Option(props: OptionProps<SelectOption<ProfileTypeFieldSelection>>) {
  const data = props.data;

  return (
    <components.Option {...props}>
      {data.type === "METADATA" ? (
        <MetadataFieldSelectItem option={data} highlight={props.selectProps.inputValue ?? ""} />
      ) : data.type === "FIELD" ? (
        <ProfileTypeFieldSelectItem option={data} highlight={props.selectProps.inputValue ?? ""} />
      ) : null}
    </components.Option>
  );
}
