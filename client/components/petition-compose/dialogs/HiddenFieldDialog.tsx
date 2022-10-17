import { gql } from "@apollo/client";
import { Button, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HiddenFieldDialog_PetitionFieldFragment } from "@parallel/graphql/__types";

import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionFieldVisibilityEditor } from "../PetitionFieldVisibilityEditor";

type HiddenFieldDialogProps = {
  field: HiddenFieldDialog_PetitionFieldFragment;
  fields: HiddenFieldDialog_PetitionFieldFragment[];
};

export function HiddenFieldDialog({
  field,
  fields,
  ...props
}: DialogProps<HiddenFieldDialogProps, void>) {
  const focusRef = useRef<HTMLButtonElement>(null);

  return (
    <ConfirmDialog
      size="2xl"
      initialFocusRef={focusRef}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="component.hidden-field-dialog.header"
          defaultMessage="Field not visible"
        />
      }
      body={
        <Stack gridGap={3} spacing={0}>
          <FormattedMessage
            id="component.hidden-field-dialog.body"
            defaultMessage="The field you are trying to preview is not visible right now. The following conditions must be met for it to be displayed:"
          />
          <PetitionFieldVisibilityEditor
            fieldId={field.id}
            fields={fields}
            visibility={field.visibility as any}
            showError={false}
            isReadOnly={true}
            onVisibilityEdit={() => {}}
          />
        </Stack>
      }
      confirm={
        <Button ref={focusRef} colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      {...props}
    />
  );
}

export function useHiddenFieldDialog() {
  return useDialog(HiddenFieldDialog);
}

HiddenFieldDialog.fragments = {
  PetitionField: gql`
    fragment HiddenFieldDialog_PetitionField on PetitionField {
      id
      visibility
      ...PetitionFieldVisibilityEditor_PetitionField
    }
    ${PetitionFieldVisibilityEditor.fragments.PetitionField}
  `,
};
