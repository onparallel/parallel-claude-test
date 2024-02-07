import { gql, useMutation, useQuery } from "@apollo/client";
import { Box, Button } from "@chakra-ui/react";
import { TagSelect, TagSelectInstance } from "@parallel/components/common/TagSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  useEditTagsDialog_TagFragment,
  useEditTagsDialog_petitionDocument,
  useEditTagsDialog_tagPetitionDocument,
  useEditTagsDialog_untagPetitionDocument,
} from "@parallel/graphql/__types";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { ActionMeta } from "react-select";

interface EditTagsDialogProps {
  petitionId: string;
}

function EditTagsDialog({ petitionId, ...props }: DialogProps<EditTagsDialogProps, {}>) {
  const { data } = useQuery(useEditTagsDialog_petitionDocument, {
    variables: { id: petitionId },
  });

  const selectRef = useRef<TagSelectInstance<true>>(null);

  const [tagPetition] = useMutation(useEditTagsDialog_tagPetitionDocument);
  const [untagPetition] = useMutation(useEditTagsDialog_untagPetitionDocument);
  const handleChange = async function (_: any, action: ActionMeta<useEditTagsDialog_TagFragment>) {
    switch (action.action) {
      case "select-option": {
        await tagPetition({
          variables: { tagId: action.option!.id, petitionId },
        });

        break;
      }
      case "pop-value":
      case "remove-value": {
        if (action.removedValue) {
          await untagPetition({
            variables: { tagId: action.removedValue.id, petitionId },
          });
        }
        break;
      }
    }
  };

  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={selectRef}
      header={
        <FormattedMessage id="component.edit-tags-dialog.header" defaultMessage="Edit tags" />
      }
      body={
        <Box>
          <TagSelect
            ref={selectRef}
            value={(data?.petition?.tags ?? []).map((t) => t.id)}
            isMulti
            allowCreatingTags
            allowUpdatingTags
            onChange={handleChange}
          />
        </Box>
      }
      confirm={null}
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
    />
  );
}

export function useEditTagsDialog() {
  return useDialog(EditTagsDialog);
}

useEditTagsDialog.fragments = {
  Tag: gql`
    fragment useEditTagsDialog_Tag on Tag {
      id
      ...TagSelect_Tag
    }
    ${TagSelect.fragments.Tag}
  `,
  PetitionBase: gql`
    fragment useEditTagsDialog_PetitionBase on PetitionBase {
      id
      tags {
        id
        ...TagSelect_Tag
      }
      lastChangeAt
    }
    ${TagSelect.fragments.Tag}
  `,
};

useEditTagsDialog.mutations = [
  gql`
    mutation useEditTagsDialog_tagPetition($tagId: GID!, $petitionId: GID!) {
      tagPetition(tagId: $tagId, petitionId: $petitionId) {
        ...useEditTagsDialog_PetitionBase
      }
    }
    ${useEditTagsDialog.fragments.PetitionBase}
  `,
  gql`
    mutation useEditTagsDialog_untagPetition($tagId: GID!, $petitionId: GID!) {
      untagPetition(tagId: $tagId, petitionId: $petitionId) {
        ...useEditTagsDialog_PetitionBase
      }
    }
    ${useEditTagsDialog.fragments.PetitionBase}
  `,
];

const _queries = [
  gql`
    query useEditTagsDialog_petition($id: GID!) {
      petition(id: $id) {
        ...useEditTagsDialog_PetitionBase
      }
    }
    ${useEditTagsDialog.fragments.PetitionBase}
  `,
];
