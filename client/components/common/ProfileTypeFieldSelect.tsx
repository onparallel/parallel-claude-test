import { gql } from "@apollo/client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { ProfileTypeFieldSelect_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import {
  ForwardedRef,
  ReactElement,
  RefAttributes,
  forwardRef,
  memo,
  useCallback,
  useMemo,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, {
  ActionMeta,
  CSSObjectWithLabel,
  MultiValueProps,
  OnChangeValue,
  OptionProps,
  SingleValue as SV,
  SelectInstance,
  SingleValueProps,
  components,
} from "react-select";
import CreatableSelect from "react-select/creatable";
import { isNonNullish } from "remeda";
import { ProfileTypeFieldTypeIndicator } from "../organization/profiles/ProfileTypeFieldTypeIndicator";
import { localizableUserTextRender } from "./LocalizableUserTextRender";

type ProfileTypeFieldSelection = ProfileTypeFieldSelect_ProfileTypeFieldFragment;

export type ProfileTypeFieldSelectInstance<
  IsMulti extends boolean,
  OptionType extends ProfileTypeFieldSelection = ProfileTypeFieldSelection,
> = SelectInstance<OptionType, IsMulti, never>;

export interface ProfileTypeFieldSelectProps<
  OptionType extends ProfileTypeFieldSelection,
  IsMulti extends boolean = false,
> extends CustomSelectProps<OptionType, IsMulti, never> {
  fields: OptionType[];
  filterFields?: (field: OptionType) => boolean;
  onCreateProperty?: (name: string, isSuggested: boolean) => Promise<void>;
  suggestedPropertyName?: string;
  fontSize?: string;
  isTooltipDisabled?: boolean;
}

export const ProfileTypeFieldSelect = forwardRef(function ProfileTypeFieldSelect<
  OptionType extends ProfileTypeFieldSelection,
  IsMulti extends boolean = false,
>(
  {
    value,
    onChange,
    fields,
    isMulti,
    filterFields,
    onCreateProperty,
    suggestedPropertyName,
    ...props
  }: ProfileTypeFieldSelectProps<OptionType, IsMulti>,
  ref: ForwardedRef<ProfileTypeFieldSelectInstance<IsMulti, OptionType>>,
) {
  const intl = useIntl();
  const rsProps = useReactSelectProps<ProfileTypeFieldSelectOption<OptionType>, IsMulti, never>({
    ...(props as any),
    components: {
      SingleValue,
      MultiValueLabel,
      Option,
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
    let options = fields.map((field, index) => {
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
      options = options.filter(({ field }) => filterFields(field));
    }
    if (isNonNullish(suggestedPropertyName)) {
      options.push({
        type: "SUGGESTION",
        field: {} as any,
        fieldIndex: 0,
        label: suggestedPropertyName,
      });
    }

    const _value = isMulti
      ? (value as OptionType[]).map((v) => mapValue(v, options)!)
      : mapValue(value as OptionType | null, options);
    return { options, _value };
  }, [fields, value, intl.locale]);

  const handleChange = useCallback(
    (
      value: OnChangeValue<ProfileTypeFieldSelectOption<OptionType>, IsMulti>,
      actionMeta: ActionMeta<ProfileTypeFieldSelectOption<OptionType>>,
    ) => {
      if (isMulti) {
        onChange(
          (value as ProfileTypeFieldSelectOption<OptionType>[]).map(
            (value) => value?.field ?? null,
          ) as any,
          actionMeta as any,
        );
      } else {
        onChange(
          ((value as SV<ProfileTypeFieldSelectOption<OptionType>>)?.field ?? null) as any,
          actionMeta as any,
        );
      }
    },
    [onChange, isMulti],
  );

  async function handleCreate(name: string) {
    await onCreateProperty?.(name, name === suggestedPropertyName);
  }

  const formatCreateLabel = (label: string) => {
    return (
      <Text as="span">
        <FormattedMessage
          id="component.profile-type-field-select.create-property"
          defaultMessage="Create property: <b>{label}</b>"
          values={{ label }}
        />
      </Text>
    );
  };

  return isNonNullish(onCreateProperty) ? (
    <CreatableSelect
      ref={ref as any}
      options={options}
      isMulti={isMulti}
      isSearchable={true}
      value={_value as any}
      onChange={(value, meta) => {
        if (!isMulti && (value as any).type === "SUGGESTION") {
          handleCreate((value as any).label);
        } else {
          handleChange(value as any, meta as ActionMeta<ProfileTypeFieldSelectOption<OptionType>>);
        }
      }}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      onCreateOption={handleCreate}
      formatCreateLabel={formatCreateLabel}
      suggestedPropertyName={suggestedPropertyName}
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
  ) : (
    <Select<OptionType, IsMulti, never>
      ref={ref as any}
      options={options}
      isMulti={isMulti}
      isSearchable={true}
      value={_value as any}
      onChange={(value, meta) => {
        handleChange(value as any, meta as ActionMeta<ProfileTypeFieldSelectOption<OptionType>>);
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
}) as <
  IsMulti extends boolean = false,
  OptionType extends ProfileTypeFieldSelection = ProfileTypeFieldSelection,
>(
  props: ProfileTypeFieldSelectProps<OptionType, IsMulti> &
    RefAttributes<ProfileTypeFieldSelectInstance<IsMulti, OptionType>>,
) => ReactElement;

interface ProfileTypeFieldSelectOption<T extends ProfileTypeFieldSelection> {
  field: T;
  fieldIndex: number;
  label: string;
}

const ProfileTypeFieldSelectItem = memo(function ProfileTypeFieldSelectItem<
  T extends ProfileTypeFieldSelection,
>({
  option,
  highlight,
  fontSize = "md",
  isTooltipDisabled,
}: {
  option: ProfileTypeFieldSelectOption<T>;
  highlight?: string;
  fontSize?: string;
  isTooltipDisabled?: boolean;
}) {
  const { field, fieldIndex, label } = option;
  return (
    <>
      <ProfileTypeFieldTypeIndicator
        type={field.type}
        fieldIndex={fieldIndex}
        isTooltipDisabled={isTooltipDisabled}
      />
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

const getOptionValue = (option: ProfileTypeFieldSelectOption<ProfileTypeFieldSelection>) => {
  return option?.field?.id;
};

const getOptionLabel = (option: ProfileTypeFieldSelectOption<ProfileTypeFieldSelection>) => {
  return (option as any).label;
};

function mapValue<T extends { field: { id: string } }>(value: { id: string } | null, options: T[]) {
  return value ? (options.find((o) => o.field.id === value.id) ?? null) : null;
}

interface ReactSelectExtraProps {
  fontSize?: string;
  isTooltipDisabled?: boolean;
}

function SingleValue(
  props: SingleValueProps<ProfileTypeFieldSelectOption<ProfileTypeFieldSelection>> & {
    selectProps: ReactSelectExtraProps;
  },
) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <ProfileTypeFieldSelectItem
          option={props.data}
          highlight={props.selectProps.inputValue ?? ""}
          fontSize={props.selectProps.fontSize}
          isTooltipDisabled={props.selectProps.isTooltipDisabled}
        />
      </Flex>
    </components.SingleValue>
  );
}

function MultiValueLabel({
  children,
  ...props
}: MultiValueProps<ProfileTypeFieldSelectOption<ProfileTypeFieldSelection>> & {
  selectProps: ReactSelectExtraProps;
}) {
  return (
    <components.MultiValueLabel {...props}>
      <Flex flexWrap="nowrap">
        <ProfileTypeFieldSelectItem
          option={props.data}
          highlight={props.selectProps.inputValue ?? ""}
          fontSize={props.selectProps.fontSize}
          isTooltipDisabled={props.selectProps.isTooltipDisabled}
        />
      </Flex>
    </components.MultiValueLabel>
  );
}

function Option(
  props: OptionProps<ProfileTypeFieldSelectOption<ProfileTypeFieldSelection>> & {
    selectProps: ReactSelectExtraProps;
  },
) {
  if ((props.data as any).__isNew__) {
    return (
      <components.Option
        {...props}
        innerProps={{ ...props.innerProps, "data-testid": "create-property-option" } as any}
      >
        {props.children} {/* from formatCreateLabel */}
      </components.Option>
    );
  }

  if ((props.data as any).type === "SUGGESTION") {
    return (
      <components.Option
        {...props}
        innerProps={
          {
            ...props.innerProps,
            "data-testid": "create-property-option",
          } as any
        }
      >
        <Text as="span">
          <FormattedMessage
            id="component.profile-type-field-select.suggested-property"
            defaultMessage="Suggested property: <b>{label}</b>"
            values={{ label: (props.data as any).label }}
          />
        </Text>
      </components.Option>
    );
  }

  return (
    <components.Option {...props}>
      <ProfileTypeFieldSelectItem
        option={props.data}
        highlight={props.selectProps.inputValue ?? ""}
        isTooltipDisabled={props.selectProps.isTooltipDisabled}
      />
    </components.Option>
  );
}

const _fragments = {
  ProfileTypeField: gql`
    fragment ProfileTypeFieldSelect_ProfileTypeField on ProfileTypeField {
      id
      name
      type
    }
  `,
};
