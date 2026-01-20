import { gql } from "@apollo/client";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FieldErrorDialog } from "@parallel/components/common/dialogs/FieldErrorDialog";
import { ReferencedCalculationsDialog_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FormattedMessage } from "react-intl";

export function ReferencedCalculationsDialog({
  fieldsWithIndices,
  referencedInMath,
  referencesInVisibility,
  ...props
}: DialogProps<{
  fieldsWithIndices: [
    field: ReferencedCalculationsDialog_PetitionFieldFragment,
    fieldIndex: PetitionFieldIndex,
  ][];
  referencedInMath: boolean;
  referencesInVisibility: boolean;
}>) {
  return (
    <FieldErrorDialog
      {...props}
      fieldsWithIndices={fieldsWithIndices}
      closeOnOverlayClick={false}
      showCancel
      header={
        <FormattedMessage
          id="component.referenced-calculations-dialog.header"
          defaultMessage="Referenced variable"
        />
      }
      message={
        referencedInMath && !referencesInVisibility ? (
          <FormattedMessage
            id="component.referenced-calculations-dialog.referenced-math-error"
            defaultMessage="The {count, plural, =1 {field below have} other {fields below has}} calculations that affect this variable. To proceed you need to remove this calculations."
            values={{ count: fieldsWithIndices.length }}
          />
        ) : !referencedInMath && referencesInVisibility ? (
          <FormattedMessage
            id="component.referenced-calculations-dialog.referenced-visibility-error"
            defaultMessage="The {count, plural, =1 {field below have} other {fields below has}} conditions that use this variable. To proceed you need to remove the referencing conditions."
            values={{ count: fieldsWithIndices.length }}
          />
        ) : (
          <FormattedMessage
            id="component.referenced-calculations-dialog.referenced-error"
            defaultMessage="The {count, plural, =1 {field below have} other {fields below has}} calculations and conditions that use this variable. To proceed you need to remove the referencing conditions and calculations."
            values={{ count: fieldsWithIndices.length }}
          />
        )
      }
      confirmText={
        referencedInMath && !referencesInVisibility ? (
          <FormattedMessage
            id="component.referenced-calculations-dialog.confirm"
            defaultMessage="Remove calculations"
          />
        ) : !referencedInMath && referencesInVisibility ? (
          <FormattedMessage
            id="component.referenced-calculations-dialog.confirm-conditions"
            defaultMessage="Remove conditions"
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
    fragment ReferencedCalculationsDialog_PetitionField on PetitionField {
      ...FieldErrorDialog_PetitionField
    }
  `,
};

export function useReferencedCalculationsDialog() {
  return useDialog(ReferencedCalculationsDialog);
}
