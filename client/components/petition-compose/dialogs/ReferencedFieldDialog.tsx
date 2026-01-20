import { gql } from "@apollo/client";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FieldErrorDialog } from "@parallel/components/common/dialogs/FieldErrorDialog";
import { ReferencedFieldDialog_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FormattedMessage } from "react-intl";

export function useReferencedFieldDialog() {
  return useDialog(ReferencedFieldDialog);
}

export function ReferencedFieldDialog({
  referencedInMath,
  referencesInVisibility,
  ...props
}: DialogProps<{
  fieldsWithIndices: [
    field: ReferencedFieldDialog_PetitionFieldFragment,
    fieldIndex: PetitionFieldIndex,
  ][];
  referencedInMath: boolean;
  referencesInVisibility: boolean;
}>) {
  return (
    <FieldErrorDialog
      {...props}
      closeOnOverlayClick={false}
      showCancel
      header={
        <FormattedMessage
          id="component.referenced-field-dialog.header"
          defaultMessage="This field is being referenced"
        />
      }
      message={
        referencedInMath && !referencesInVisibility ? (
          <FormattedMessage
            id="component.referenced-field-dialog.referenced-calculations"
            defaultMessage="The {count, plural, =1 {field below is} other {fields below are}} making calculations with this field. To proceed you need to remove the referencing calculations."
            values={{ count: props.fieldsWithIndices.length }}
          />
        ) : !referencedInMath && referencesInVisibility ? (
          <FormattedMessage
            id="component.referenced-field-dialog.referenced-conditions"
            defaultMessage="The {count, plural, =1 {field below has} other {fields below have}} conditions with this field. To proceed you need to remove the referencing conditions."
            values={{ count: props.fieldsWithIndices.length }}
          />
        ) : (
          <FormattedMessage
            id="component.referenced-field-dialog.referenced-logic"
            defaultMessage="The {count, plural, =1 {field below has} other {fields below have}} conditions and calculations with this field. To proceed you need to remove the referencing conditions and calculations."
            values={{ count: props.fieldsWithIndices.length }}
          />
        )
      }
      confirmText={
        !referencedInMath && referencesInVisibility ? (
          <FormattedMessage
            id="component.referenced-field-dialog.confirm-conditions"
            defaultMessage="Remove conditions"
          />
        ) : referencedInMath && !referencesInVisibility ? (
          <FormattedMessage
            id="component.referenced-field-dialog.confirm-calculations"
            defaultMessage="Remove calculations"
          />
        ) : (
          <FormattedMessage
            id="component.referenced-calculations-dialog.confirm-logic"
            defaultMessage="Remove logic"
          />
        )
      }
    />
  );
}

const _fragments = {
  PetitionField: gql`
    fragment ReferencedFieldDialog_PetitionField on PetitionField {
      ...FieldErrorDialog_PetitionField
    }
  `,
};
