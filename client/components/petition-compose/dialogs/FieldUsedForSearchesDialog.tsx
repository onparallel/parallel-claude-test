import { Box, Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function FieldUsedForSearchesDialog({ ...props }: DialogProps<{}>) {
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
            defaultMessage="This field is used to automate the search in a {fieldName} field. To continue, please first update the field configuration."
            values={{
              fieldName: (
                <Box as="em">
                  <FormattedMessage
                    id="generic.petition-field-type-background-check"
                    defaultMessage="Background check"
                  />
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
