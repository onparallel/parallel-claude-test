import { Button, Stack, Text } from "@chakra-ui/react";
import { genericRsComponent, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { ForwardedRef, forwardRef, ReactElement, RefAttributes } from "react";
import { FormattedMessage } from "react-intl";
import Select, { SelectInstance } from "react-select";

export type DocumentThemeSelectSelection = { id: string; name: string };
export type DocumentThemeSelectInstance = SelectInstance<DocumentThemeSelectSelection>;

export interface DocumentThemeSelectProps
  extends Omit<CustomSelectProps<DocumentThemeSelectSelection, false, never>, "value"> {
  value: DocumentThemeSelectSelection;
  onCreateNewTheme: () => void;
}

export const DocumentThemeSelect = Object.assign(
  forwardRef(function DocumentThemeSelect(
    { value, onChange, options, placeholder, onCreateNewTheme, ...props }: DocumentThemeSelectProps,
    ref: ForwardedRef<DocumentThemeSelectInstance>
  ) {
    const rsProps = useReactSelectProps({
      ...props,
      components: {
        NoOptionsMessage,
        ...props.components,
      },
    });

    const extensions = { onCreateNewTheme };

    return (
      <Select<DocumentThemeSelectSelection, false, never>
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
  }) as (
    props: DocumentThemeSelectProps & RefAttributes<DocumentThemeSelectInstance>
  ) => ReactElement,
  { fragments: {} }
);

const rsComponent = genericRsComponent<
  DocumentThemeSelectSelection,
  false,
  never,
  {
    selectProps: {
      onCreateNewTheme: () => void;
    };
  }
>();

const NoOptionsMessage = rsComponent("NoOptionsMessage", function (props) {
  const {
    selectProps: { onCreateNewTheme },
  } = props;
  return (
    <Stack alignItems="center" textAlign="center" padding={2}>
      <Text>
        <FormattedMessage
          id="component.document-theme-select.no-options-text"
          defaultMessage="No more themes created"
        />
      </Text>
      <Button colorScheme="primary" onClick={onCreateNewTheme}>
        <FormattedMessage
          id="component.document-theme-select.new-theme-button"
          defaultMessage="New theme"
        />
      </Button>
    </Stack>
  );
});
