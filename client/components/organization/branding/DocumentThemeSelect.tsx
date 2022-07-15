import { gql } from "@apollo/client";
import { Badge, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { DocumentThemeSelect_OrganizationThemeFragment } from "@parallel/graphql/__types";
import { genericRsComponent, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { ForwardedRef, forwardRef, ReactElement, RefAttributes } from "react";
import { FormattedMessage } from "react-intl";
import Select, { components, SelectInstance } from "react-select";

type Selection = DocumentThemeSelect_OrganizationThemeFragment;
export type DocumentThemeSelectInstance = SelectInstance<Selection>;

export interface DocumentThemeSelectProps<T extends Selection>
  extends CustomSelectProps<T, false, never> {
  onCreateNewTheme: () => void;
  isCreateNewThemeDisabled?: boolean;
}

export const DocumentThemeSelect = Object.assign(
  forwardRef(function DocumentThemeSelect<T extends Selection>(
    {
      value,
      onChange,
      options,
      placeholder,
      onCreateNewTheme,
      isCreateNewThemeDisabled,
      ...props
    }: DocumentThemeSelectProps<T>,
    ref: ForwardedRef<DocumentThemeSelectInstance>
  ) {
    const rsProps = useReactSelectProps({
      ...props,
      components: {
        NoOptionsMessage,
        SingleValue,
        Option,
        ...props.components,
      } as any,
    });

    const extensions = { onCreateNewTheme, isCreateNewThemeDisabled };

    return (
      <Select<Selection, false, never>
        ref={ref as any}
        value={value}
        onChange={onChange}
        options={options}
        getOptionLabel={(o) => o.name}
        getOptionValue={(o) => o.id}
        placeholder={placeholder}
        {...rsProps}
        {...(extensions as any)}
      />
    );
  }) as <T extends Selection>(
    props: DocumentThemeSelectProps<T> & RefAttributes<DocumentThemeSelectInstance>
  ) => ReactElement,
  {
    fragments: {
      OrganizationTheme: gql`
        fragment DocumentThemeSelect_OrganizationTheme on OrganizationTheme {
          id
          name
          isDefault
        }
      `,
    },
  }
);

const rsComponent = genericRsComponent<
  Selection,
  false,
  never,
  {
    selectProps: {
      onCreateNewTheme: () => void;
      isCreateNewThemeDisabled?: boolean;
    };
  }
>();

const NoOptionsMessage = rsComponent("NoOptionsMessage", function (props) {
  const {
    selectProps: { onCreateNewTheme, isCreateNewThemeDisabled },
  } = props;
  return (
    <Stack alignItems="center" textAlign="center" padding={2}>
      <Text>
        <FormattedMessage
          id="component.document-theme-select.no-options-text"
          defaultMessage="No more themes created"
        />
      </Text>
      <Button
        colorScheme="primary"
        onClick={onCreateNewTheme}
        isDisabled={isCreateNewThemeDisabled}
      >
        <FormattedMessage
          id="component.document-theme-select.new-theme-button"
          defaultMessage="New theme"
        />
      </Button>
    </Stack>
  );
});

const SingleValue = rsComponent("SingleValue", function (props) {
  return (
    <components.SingleValue {...props}>
      <HStack>
        <Box flex="1" minWidth={0} isTruncated>
          {props.data.name}
        </Box>
        {props.data.isDefault ? (
          <Badge colorScheme="primary">
            <FormattedMessage id="generic.default" defaultMessage="Default" />
          </Badge>
        ) : null}
      </HStack>
    </components.SingleValue>
  );
});

const Option = rsComponent("Option", function ({ children, ...props }) {
  return (
    <components.Option {...props}>
      <HStack>
        <Box flex="1" minWidth={0} isTruncated>
          {props.data.name}
        </Box>
        {props.data.isDefault ? (
          <Badge colorScheme="primary">
            <FormattedMessage id="generic.default" defaultMessage="Default" />
          </Badge>
        ) : null}
      </HStack>
    </components.Option>
  );
});
