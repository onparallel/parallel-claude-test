import { Box, Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";

function FieldUsedForSearchesDialog({
  fieldTitle,
  ...props
}: DialogProps<{ fieldTitle?: string | null }>) {
  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      header={
        <FormattedMessage
          id="component.field-used-for-searches.header"
          defaultMessage="Field used for searches"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.field-used-for-searches.body"
            defaultMessage="This field is used to automate the search in {fieldTitle}. To continue, please first update the field configuration."
            values={{
              fieldTitle: (
                <Box as="em" fontWeight={500}>
                  {isNonNullish(fieldTitle) ? (
                    fieldTitle
                  ) : (
                    <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
                  )}
                </Box>
              ),
            }}
          />
        </Text>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.field-used-for-searches.see-configuration"
            defaultMessage="See configuration"
          />
        </Button>
      }
    />
  );
}

export function useFieldUsedForSearchesDialog() {
  return useDialog(FieldUsedForSearchesDialog);
}
