import { gql } from "@apollo/client";
import { Button, Stack, Text } from "@chakra-ui/react";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FieldErrorDialog } from "@parallel/components/common/dialogs/FieldErrorDialog";
import { ReferencedFieldDialog_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";

export function useReferencedFieldDialog() {
  return useDialog(ReferencedFieldDialog);
}

export function ReferencedFieldDialog({
  type,
  ...props
}: DialogProps<{
  type: "DELETING_FIELD" | "INVALID_CONDITION";
  fieldsWithIndices: {
    field: ReferencedFieldDialog_PetitionFieldFragment;
    fieldIndex: PetitionFieldIndex;
  }[];
}>) {
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <FieldErrorDialog
      {...props}
      initialFocusRef={focusRef}
      closeOnOverlayClick={false}
      showCancel
      header={
        <FormattedMessage
          id="component.referenced-field-dialog.header"
          defaultMessage="This field is being referenced"
        />
      }
      message={
        type === "DELETING_FIELD" ? (
          <FormattedMessage
            id="component.referenced-field-dialog.referenced-error"
            defaultMessage="The {count, plural, =1 {field below is} other {fields below are}} referencing this field. To proceed you need to remove the referencing conditions."
            values={{ count: props.fieldsWithIndices.length }}
          />
        ) : type === "INVALID_CONDITION" ? (
          <FormattedMessage
            id="component.referenced-field-dialog.referenced-invalid-conditions"
            defaultMessage="The {count, plural, =1 {field below is} other {fields below are}} referencing this field with invalid conditions. To proceed you need to remove the referencing invalid conditions."
            values={{ count: props.fieldsWithIndices.length }}
          />
        ) : null
      }
      confirm={
        <Button colorScheme="purple" ref={focusRef} onClick={() => props.onResolve()}>
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
    fragment ReferencedFieldDialog_PetitionField on PetitionField {
      ...FieldErrorDialog_PetitionField
    }
    ${FieldErrorDialog.fragments.PetitionField}
  `,
};
