import { gql } from "@apollo/client";
import { Box, IconButton, Text } from "@chakra-ui/react";
import { RelationshipIcon } from "@parallel/chakra/icons";
import { ProfileRelationshipTypeWithDirectionSelect_ProfileRelationshipTypeWithDirectionFragment } from "@parallel/graphql/__types";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { ForwardedRef, forwardRef, useCallback } from "react";
import { useIntl } from "react-intl";
import Select, {
  OptionProps,
  SelectComponentsConfig,
  SelectInstance,
  SingleValueProps,
  components,
} from "react-select";
import { isNonNullish } from "remeda";
import { HighlightText } from "./HighlightText";
import { LocalizableUserTextRender, localizableUserTextRender } from "./LocalizableUserTextRender";
import { OverflownText } from "./OverflownText";

export type ProfileRelationshipTypeWithDirectionSelectSelection =
  ProfileRelationshipTypeWithDirectionSelect_ProfileRelationshipTypeWithDirectionFragment;

export type ProfileRelationshipTypeWithDirectionSelectSelectionInstance = SelectInstance<
  ProfileRelationshipTypeWithDirectionSelectSelection,
  false,
  never
>;

export interface ProfileRelationshipTypeWithDirectionSelectProps
  extends CustomSelectProps<ProfileRelationshipTypeWithDirectionSelectSelection, false, never> {}

export const ProfileRelationshipTypeWithDirectionSelect = forwardRef(
  function ProfileRelationshipTypeWithDirectionSelect(
    {
      value,
      onChange,
      options,
      isMulti,
      placeholder,
      ...props
    }: ProfileRelationshipTypeWithDirectionSelectProps,
    ref: ForwardedRef<ProfileRelationshipTypeWithDirectionSelectSelectionInstance>,
  ) {
    const intl = useIntl();
    const rsProps = useReactSelectProps<
      ProfileRelationshipTypeWithDirectionSelectSelection,
      false,
      never
    >({
      ...props,
      components: {
        SingleValue,
        Option,
        IndicatorsContainer,
        ...props.components,
      } as unknown as SelectComponentsConfig<
        ProfileRelationshipTypeWithDirectionSelectSelection,
        false,
        never
      >,
    });

    const getOptionLabel = useCallback(
      (option: ProfileRelationshipTypeWithDirectionSelectSelection) => {
        return (
          (option.direction === "LEFT_RIGHT"
            ? localizableUserTextRender({
                intl,
                value: option.profileRelationshipType.leftRightName,
                default: "",
              })
            : localizableUserTextRender({
                intl,
                value: option.profileRelationshipType.rightLeftName,
                default: "",
              })) +
          " / " +
          (option.direction === "LEFT_RIGHT"
            ? localizableUserTextRender({
                intl,
                value: option.profileRelationshipType.rightLeftName,
                default: "",
              })
            : localizableUserTextRender({
                intl,
                value: option.profileRelationshipType.leftRightName,
                default: "",
              }))
        );
      },
      [],
    );

    const getOptionValue = (option: ProfileRelationshipTypeWithDirectionSelectSelection) => {
      return option.profileRelationshipType.id + "|" + option.direction;
    };

    return (
      <Select<ProfileRelationshipTypeWithDirectionSelectSelection, false, never>
        ref={ref as any}
        value={value}
        onChange={onChange}
        isMulti={isMulti}
        options={options}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        isClearable={props.isClearable}
        placeholder={intl.formatMessage({
          id: "component.profile-relationship-type-with-direction-select.placeholder",
          defaultMessage: "Select a relationship type",
        })}
        {...props}
        {...rsProps}
      />
    );
  },
);

function SingleValue(props: SingleValueProps<ProfileRelationshipTypeWithDirectionSelectSelection>) {
  return (
    <components.SingleValue {...props}>
      <OverflownText key={props.data.profileRelationshipType.id + props.data.direction}>
        {props.data.direction === "LEFT_RIGHT" ? (
          <LocalizableUserTextRender
            value={props.data.profileRelationshipType.leftRightName}
            default={<></>}
          />
        ) : (
          <LocalizableUserTextRender
            value={props.data.profileRelationshipType.rightLeftName}
            default={<></>}
          />
        )}
        {props.data.profileRelationshipType.isReciprocal ? null : (
          <>
            <Text as="span" display="inline-block" width={1} />
            <Text as="span" fontSize="87.5%" color="gray.500">
              /
              <Text as="span" display="inline-block" width={1} />
              {props.data.direction === "LEFT_RIGHT" ? (
                <LocalizableUserTextRender
                  value={props.data.profileRelationshipType.rightLeftName}
                  default={<></>}
                />
              ) : (
                <LocalizableUserTextRender
                  value={props.data.profileRelationshipType.leftRightName}
                  default={<></>}
                />
              )}
            </Text>
          </>
        )}
      </OverflownText>
    </components.SingleValue>
  );
}

function Option({
  children,
  ...props
}: OptionProps<ProfileRelationshipTypeWithDirectionSelectSelection>) {
  const intl = useIntl();
  return (
    <components.Option {...props}>
      <Box verticalAlign="baseline" noOfLines={1} wordBreak="break-all">
        <HighlightText as="span" search={props.selectProps.inputValue}>
          {props.data.direction === "LEFT_RIGHT"
            ? localizableUserTextRender({
                intl,
                value: props.data.profileRelationshipType.leftRightName,
                default: "",
              })
            : localizableUserTextRender({
                intl,
                value: props.data.profileRelationshipType.rightLeftName,
                default: "",
              })}
        </HighlightText>
        {props.data.profileRelationshipType.isReciprocal ? null : (
          <>
            <Text as="span" display="inline-block" width={1} />
            <Text as="span" fontSize="87.5%" color={props.isSelected ? undefined : "gray.500"}>
              /
              <Text as="span" display="inline-block" width={1} />
              <HighlightText as="span" search={props.selectProps.inputValue}>
                {props.data.direction === "LEFT_RIGHT"
                  ? localizableUserTextRender({
                      intl,
                      value: props.data.profileRelationshipType.rightLeftName,
                      default: "",
                    })
                  : localizableUserTextRender({
                      intl,
                      value: props.data.profileRelationshipType.leftRightName,
                      default: "",
                    })}
              </HighlightText>
            </Text>
          </>
        )}
      </Box>
    </components.Option>
  );
}

function IndicatorsContainer({
  children,
  ...props
}: SingleValueProps<ProfileRelationshipTypeWithDirectionSelectSelection, false, never>) {
  const intl = useIntl();
  const value = props.getValue()?.[0];
  const reverse = isNonNullish(value)
    ? props.selectProps.options.find(
        (ptwd) =>
          ptwd.profileRelationshipType.id === value.profileRelationshipType.id &&
          ptwd.direction !== value.direction &&
          !value.profileRelationshipType.isReciprocal,
      )
    : null;
  return (
    <components.IndicatorsContainer {...props}>
      <>
        {isNonNullish(reverse) ? (
          <IconButton
            icon={<RelationshipIcon fontSize="md" />}
            variant="ghost"
            marginEnd={1}
            tabIndex={-1}
            aria-label={intl.formatMessage({
              id: "generic.clear",
              defaultMessage: "Clear",
            })}
            onMouseDown={(e) => {
              e.stopPropagation();
              props.setValue(reverse, "select-option");
            }}
            size="xs"
          />
        ) : null}
        {children}
      </>
    </components.IndicatorsContainer>
  );
}

const _fragments = {
  ProfileRelationshipTypeWithDirection: gql`
    fragment ProfileRelationshipTypeWithDirectionSelect_ProfileRelationshipTypeWithDirection on ProfileRelationshipTypeWithDirection {
      direction
      profileRelationshipType {
        id
        alias
        isReciprocal
        allowedLeftRightProfileTypeIds
        allowedRightLeftProfileTypeIds
        leftRightName
        rightLeftName
      }
    }
  `,
};
