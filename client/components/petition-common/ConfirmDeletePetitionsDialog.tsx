import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";
import { gql } from "@apollo/client";
import { ConfirmDeletePetitionsDialog_PetitionFragment } from "@parallel/graphql/__types";

export function ConfirmDeletePetitionsDialog({
  selected,
  ...props
}: DialogProps<
  {
    selected: ConfirmDeletePetitionsDialog_PetitionFragment[];
  },
  void
>) {
  const count = selected.length;
  const name = selected.length && selected[0].name;
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petitions.confirm-delete.header"
          defaultMessage="Delete petitions"
        />
      }
      body={
        <FormattedMessage
          id="petitions.confirm-delete.body"
          defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected petitions}}?"
          values={{
            count,
            name,
            b: (chunks: any[]) => <b>{chunks}</b>,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="generic.confirm-delete-button"
            defaultMessage="Yes, delete"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeletePetitionsDialog() {
  return useDialog(ConfirmDeletePetitionsDialog);
}

ConfirmDeletePetitionsDialog.fragments = {
  Petition: gql`
    fragment ConfirmDeletePetitionsDialog_Petition on Petition {
      id
      name
    }
  `,
};
