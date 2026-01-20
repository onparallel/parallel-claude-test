import { gql } from "@apollo/client";
import { Button, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  HiddenFieldDialog_PetitionBaseFragment,
  HiddenFieldDialog_PetitionFieldFragment,
} from "@parallel/graphql/__types";

import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionVisibilityEditor } from "../logic/PetitionVisibilityEditor";

interface HiddenFieldDialogProps {
  field: HiddenFieldDialog_PetitionFieldFragment;
  petition: HiddenFieldDialog_PetitionBaseFragment;
}

export function HiddenFieldDialog({
  field,
  petition,
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
        <FormattedMessage id="generic.field-not-visible" defaultMessage="Field not visible" />
      }
      body={
        <Stack gridGap={3} spacing={0}>
          <FormattedMessage
            id="component.hidden-field-dialog.body"
            defaultMessage="The field you are trying to preview is not visible right now. The following conditions must be met for it to be displayed:"
          />
          <PetitionVisibilityEditor
            petition={petition}
            fieldId={field.id}
            showErrors={false}
            isReadOnly={true}
            onChange={() => {}}
            visibilityOn="FIELD"
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

const _fragments = {
  PetitionBase: gql`
    fragment HiddenFieldDialog_PetitionBase on PetitionBase {
      ...PetitionVisibilityEditor_PetitionBase
    }
  `,
  PetitionField: gql`
    fragment HiddenFieldDialog_PetitionField on PetitionField {
      id
      ...PetitionVisibilityEditor_PetitionField
    }
  `,
};
