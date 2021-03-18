import { gql } from "@apollo/client";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { PetitionComposeFieldList_PetitionFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";

export function useReferencedFieldDialog() {
  return useDialog(ReferencedFieldDialog);
}

export function ReferencedFieldDialog({
  fieldsWithIndices,
  ...props
}: DialogProps<{
  fieldsWithIndices: {
    field: PetitionComposeFieldList_PetitionFragment["fields"][0];
    fieldIndex: PetitionFieldIndex;
  }[];
}>) {
  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="component.referenced-field-dialog.header"
          defaultMessage="This field is being referenced"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.referenced-field-dialog.description"
              defaultMessage="The following {count, plural, =1 {field is} other {fields are}} referencing this field:"
              values={{ count: fieldsWithIndices.length }}
            />
          </Text>
          {fieldsWithIndices.map(({ field, fieldIndex }) => (
            <Flex key={field.id} paddingLeft={2}>
              <PetitionFieldTypeIndicator
                as="div"
                type={field.type}
                fieldIndex={fieldIndex}
                isTooltipDisabled
                flexShrink={0}
              />
              <Box marginLeft={2} flex="1" minWidth="0" isTruncated>
                {field.title ? (
                  field.title
                ) : (
                  <Text as="span" textStyle="hint">
                    <FormattedMessage
                      id="generic.untitled-field"
                      defaultMessage="Untitled field"
                    />
                  </Text>
                )}
              </Box>
            </Flex>
          ))}
          <Text>
            <FormattedMessage
              id="component.referenced-field-dialog.description-2"
              defaultMessage="To proceed you need to remove the referencing conditions."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.referenced-field-dialog.confirm"
            defaultMessage="Remove conditions"
          />
        </Button>
      }
    />
  );
}

ReferencedFieldDialog.fragments = {
  PetitionField: gql`
    fragment ReferencedFieldDialogDialog_PetitionField on PetitionField {
      id
      title
      type
    }
  `,
};
