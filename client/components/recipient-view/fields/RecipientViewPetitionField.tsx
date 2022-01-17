import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/dialogs/FailureGeneratingLinkDialog";
import {
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument,
  RecipientViewPetitionField_publicCreateCheckboxReplyDocument,
  RecipientViewPetitionField_publicCreateDynamicSelectReplyDocument,
  RecipientViewPetitionField_publicCreateSimpleReplyDocument,
  RecipientViewPetitionField_publicDeletePetitionReplyDocument,
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
  RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc,
  RecipientViewPetitionField_publicUpdateCheckboxReplyDocument,
  RecipientViewPetitionField_publicUpdateDynamicSelectReplyDocument,
  RecipientViewPetitionField_publicUpdateSimpleReplyDocument,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useCallback, useRef } from "react";
import {
  RecipientViewPetitionFieldCommentsDialog,
  usePetitionFieldCommentsDialog,
} from "../dialogs/RecipientViewPetitionFieldCommentsDialog";
import { useLastSaved } from "../LastSavedProvider";
import { useCreateFileUploadReply } from "./clientMutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import {
  CheckboxValue,
  RecipientViewPetitionFieldCheckbox,
} from "./RecipientViewPetitionFieldCheckbox";
import {
  DynamicSelectValue,
  RecipientViewPetitionFieldDynamicSelect,
} from "./RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "./RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "./RecipientViewPetitionFieldHeading";
import { RecipientViewPetitionFieldSelect } from "./RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldText } from "./RecipientViewPetitionFieldText";

export interface RecipientViewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment" | "field"
  > {
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  keycode: string;
  access: RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment;
  petitionId: string;
  isDisabled: boolean;
}

export type UploadCache = Record<string, XMLHttpRequest>;

export function RecipientViewPetitionField(props: RecipientViewPetitionFieldProps) {
  const uploads = useRef<UploadCache>({});
  const { updateLastSaved } = useLastSaved();

  const [publicPetitionFieldAttachmentDownloadLink] = useMutation(
    RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument
  );
  const handleDownloadAttachment = function (attachmentId: string) {
    openNewWindow(async () => {
      const { data } = await publicPetitionFieldAttachmentDownloadLink({
        variables: {
          keycode: props.keycode,
          fieldId: props.field.id,
          attachmentId,
        },
      });
      const { url } = data!.publicPetitionFieldAttachmentDownloadLink;
      return url!;
    });
  };

  const showFieldComments = usePetitionFieldCommentsDialog();
  async function handleCommentsButtonClick() {
    try {
      await showFieldComments({
        keycode: props.keycode,
        access: props.access,
        field: props.field,
      });
    } catch {}
  }

  const [deletePetitionReply] = useMutation(
    RecipientViewPetitionField_publicDeletePetitionReplyDocument
  );
  const handleDeletePetitionReply = useCallback(
    async (replyId: string) => {
      try {
        if (replyId in uploads.current) {
          uploads.current[replyId].abort();
          delete uploads.current[replyId];
        }
        await deletePetitionReply({
          variables: {
            replyId,
            keycode: props.keycode,
          },
        });
        updateLastSaved();
      } catch {}
    },
    [deletePetitionReply, updateLastSaved]
  );

  const [updateSimpleReply] = useMutation(
    RecipientViewPetitionField_publicUpdateSimpleReplyDocument
  );
  const handleUpdateSimpleReply = useCallback(
    async (replyId: string, value: string) => {
      try {
        await updateSimpleReply({
          variables: {
            replyId,
            keycode: props.keycode,
            value,
          },
        });
        updateLastSaved();
      } catch {}
    },
    [updateSimpleReply, updateLastSaved]
  );

  const [createSimpleReply] = useMutation(
    RecipientViewPetitionField_publicCreateSimpleReplyDocument
  );
  const handleCreateSimpleReply = useCallback(
    async (value: string) => {
      try {
        const { data } = await createSimpleReply({
          variables: {
            value,
            fieldId: props.field.id,
            keycode: props.keycode,
          },
        });
        updateLastSaved();
        return data?.publicCreateSimpleReply?.id;
      } catch {}

      return;
    },
    [createSimpleReply, updateLastSaved]
  );

  const [updateCheckboxReply] = useMutation(
    RecipientViewPetitionField_publicUpdateCheckboxReplyDocument
  );
  const handleUpdateCheckboxReply = useCallback(
    async (replyId: string, values: string[]) => {
      try {
        await updateCheckboxReply({
          variables: {
            replyId,
            keycode: props.keycode,
            values,
          },
        });
        updateLastSaved();
      } catch {}
    },
    [updateCheckboxReply, updateLastSaved]
  );

  const [createCheckboxReply] = useMutation(
    RecipientViewPetitionField_publicCreateCheckboxReplyDocument
  );
  const handleCreateCheckboxReply = useCallback(
    async (values: CheckboxValue) => {
      try {
        await createCheckboxReply({
          variables: {
            fieldId: props.field.id,
            keycode: props.keycode,
            values,
          },
        });
        updateLastSaved();
      } catch {}
    },
    [createCheckboxReply, updateLastSaved]
  );

  const [updateDynamicSelectReply] = useMutation(
    RecipientViewPetitionField_publicUpdateDynamicSelectReplyDocument
  );
  const handleUpdateDynamicSelectReply = useCallback(
    async (replyId: string, values: DynamicSelectValue) => {
      await updateDynamicSelectReply({
        variables: {
          keycode: props.keycode,
          replyId,
          values,
        },
      });
      updateLastSaved();
    },
    [updateDynamicSelectReply, updateLastSaved]
  );

  const [createDynamicSelectReply] = useMutation(
    RecipientViewPetitionField_publicCreateDynamicSelectReplyDocument
  );
  const handleCreateDynamicSelectReply = useCallback(
    async (value: DynamicSelectValue) => {
      try {
        const { data } = await createDynamicSelectReply({
          variables: {
            keycode: props.keycode,
            fieldId: props.field.id,
            value,
          },
        });
        updateLastSaved();
        return data?.publicCreateDynamicSelectReply.id;
      } catch {}
    },
    [createDynamicSelectReply, updateLastSaved]
  );

  const createFileUploadReply = useCreateFileUploadReply();
  const handleCreateFileUploadReply = useCallback(
    async (content: File[]) => {
      try {
        createFileUploadReply({
          keycode: props.keycode,
          fieldId: props.field.id,
          content,
          uploads,
        });
        updateLastSaved();
      } catch {}
    },
    [createFileUploadReply, uploads, updateLastSaved]
  );

  const [downloadFileUploadReply] = useMutation(
    RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument
  );
  const showFailure = useFailureGeneratingLinkDialog();
  const apollo = useApolloClient();
  const handleDownloadFileUploadReply = useCallback(
    async (replyId: string) => {
      try {
        openNewWindow(async () => {
          const reply = apollo.cache.readFragment({
            fragment: RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc,
          });
          const { data } = await downloadFileUploadReply({
            variables: {
              keycode: props.keycode,
              replyId,
              preview: false,
            },
          });
          const { url, result } = data!.publicFileUploadReplyDownloadLink;
          if (result !== "SUCCESS") {
            await withError(showFailure({ filename: reply!.content.filename }));
            throw new Error();
          }
          return url!;
        });
      } catch {}
    },
    [downloadFileUploadReply]
  );

  const commonProps = {
    onCommentsButtonClick: handleCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment,
  };

  return props.field.type === "HEADING" ? (
    <RecipientViewPetitionFieldHeading {...props} {...commonProps} />
  ) : props.field.type === "TEXT" || props.field.type === "SHORT_TEXT" ? (
    <RecipientViewPetitionFieldText
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateSimpleReply}
      onCreateReply={handleCreateSimpleReply}
    />
  ) : props.field.type === "SELECT" ? (
    <RecipientViewPetitionFieldSelect
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateSimpleReply}
      onCreateReply={handleCreateSimpleReply}
    />
  ) : props.field.type === "FILE_UPLOAD" ? (
    <RecipientViewPetitionFieldFileUpload
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onCreateReply={handleCreateFileUploadReply}
      onDownloadReply={handleDownloadFileUploadReply}
    />
  ) : props.field.type === "DYNAMIC_SELECT" ? (
    <RecipientViewPetitionFieldDynamicSelect
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateDynamicSelectReply}
      onCreateReply={handleCreateDynamicSelectReply}
    />
  ) : props.field.type === "CHECKBOX" ? (
    <RecipientViewPetitionFieldCheckbox
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateCheckboxReply}
      onCreateReply={handleCreateCheckboxReply}
    />
  ) : null;
}

RecipientViewPetitionField.fragments = {
  PublicPetitionAccess: gql`
    fragment RecipientViewPetitionField_PublicPetitionAccess on PublicPetitionAccess {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccess
    }
    ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionAccess}
  `,
  PublicPetitionField: gql`
    fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
      ...RecipientViewPetitionFieldCard_PublicPetitionField
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionField}
  `,
  PublicPetitionFieldReply: gql`
    fragment RecipientViewPetitionField_PublicPetitionFieldReply on PublicPetitionFieldReply {
      content
    }
  `,
};

RecipientViewPetitionField.mutations = [
  gql`
    mutation RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLink(
      $keycode: ID!
      $fieldId: GID!
      $attachmentId: GID!
    ) {
      publicPetitionFieldAttachmentDownloadLink(
        keycode: $keycode
        fieldId: $fieldId
        attachmentId: $attachmentId
      ) {
        url
      }
    }
  `,
  gql`
    mutation RecipientViewPetitionField_publicDeletePetitionReply($replyId: GID!, $keycode: ID!) {
      publicDeletePetitionReply(replyId: $replyId, keycode: $keycode) {
        id
        replies {
          id
        }
        petition {
          id
          status
        }
      }
    }
  `,
  gql`
    mutation RecipientViewPetitionField_publicCreateSimpleReply(
      $keycode: ID!
      $fieldId: GID!
      $value: String!
    ) {
      publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
          replies {
            id
          }
        }
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientViewPetitionField_publicUpdateSimpleReply(
      $keycode: ID!
      $replyId: GID!
      $value: String!
    ) {
      publicUpdateSimpleReply(keycode: $keycode, replyId: $replyId, value: $value) {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
        }
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientViewPetitionField_publicCreateCheckboxReply(
      $keycode: ID!
      $fieldId: GID!
      $values: [String!]!
    ) {
      publicCreateCheckboxReply(keycode: $keycode, fieldId: $fieldId, values: $values) {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
          replies {
            id
          }
        }
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientViewPetitionField_publicUpdateCheckboxReply(
      $keycode: ID!
      $replyId: GID!
      $values: [String!]!
    ) {
      publicUpdateCheckboxReply(keycode: $keycode, replyId: $replyId, values: $values) {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
        }
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientViewPetitionField_publicCreateDynamicSelectReply(
      $keycode: ID!
      $fieldId: GID!
      $value: [[String]!]!
    ) {
      publicCreateDynamicSelectReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
          replies {
            id
          }
        }
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientViewPetitionField_publicUpdateDynamicSelectReply(
      $keycode: ID!
      $replyId: GID!
      $values: [[String]!]!
    ) {
      publicUpdateDynamicSelectReply(keycode: $keycode, replyId: $replyId, value: $values) {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
        }
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
  `,
];
