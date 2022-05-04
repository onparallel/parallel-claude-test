import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/dialogs/FailureGeneratingLinkDialog";
import {
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument,
  RecipientViewPetitionField_publicCreatePetitionFieldReplyDocument,
  RecipientViewPetitionField_publicDeletePetitionFieldReplyDocument,
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
  RecipientViewPetitionField_PublicPetitionFieldDocument,
  RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc,
  RecipientViewPetitionField_publicStartAsyncFieldCompletionDocument,
  RecipientViewPetitionField_publicUpdatePetitionFieldReplyDocument,
  Tone,
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
import { RecipientViewPetitionFieldCheckbox } from "./RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDate } from "./RecipientViewPetitionFieldDate";
import { RecipientViewPetitionFieldDynamicSelect } from "./RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "./RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "./RecipientViewPetitionFieldHeading";
import { RecipientViewPetitionFieldNumber } from "./RecipientViewPetitionFieldNumber";
import { RecipientViewPetitionFieldPhone } from "./RecipientViewPetitionFieldPhone";
import { RecipientViewPetitionFieldSelect } from "./RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldShortText } from "./RecipientViewPetitionFieldShortText";
import { RecipientViewPetitionFieldTaxDocuments } from "./RecipientViewPetitionFieldTaxDocuments";
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
  tone: Tone;
}

export type UploadCache = Record<string, XMLHttpRequest>;

export function RecipientViewPetitionField({ tone, ...props }: RecipientViewPetitionFieldProps) {
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
        tone,
      });
    } catch {}
  }

  const [publicDeletePetitionFieldReply] = useMutation(
    RecipientViewPetitionField_publicDeletePetitionFieldReplyDocument
  );
  const handleDeletePetitionFieldReply = useCallback(
    async (replyId: string) => {
      try {
        if (replyId in uploads.current) {
          uploads.current[replyId].abort();
          delete uploads.current[replyId];
        }
        await publicDeletePetitionFieldReply({
          variables: {
            replyId,
            keycode: props.keycode,
          },
        });
        updateLastSaved();
      } catch {}
    },
    [publicDeletePetitionFieldReply, updateLastSaved]
  );

  const [publicUpdatePetitionFieldReply] = useMutation(
    RecipientViewPetitionField_publicUpdatePetitionFieldReplyDocument
  );
  const handleUpdatePetitionFieldReply = useCallback(
    async (replyId: string, reply: any) => {
      try {
        await publicUpdatePetitionFieldReply({
          variables: {
            replyId,
            keycode: props.keycode,
            reply,
          },
        });
        updateLastSaved();
      } catch {}
    },
    [publicUpdatePetitionFieldReply, updateLastSaved]
  );

  const [publicCreatePetitionFieldReply] = useMutation(
    RecipientViewPetitionField_publicCreatePetitionFieldReplyDocument
  );
  const handleCreatePetitionFieldReply = useCallback(
    async (reply: any) => {
      try {
        const { data } = await publicCreatePetitionFieldReply({
          variables: {
            reply,
            fieldId: props.field.id,
            keycode: props.keycode,
          },
        });
        updateLastSaved();
        return data?.publicCreatePetitionFieldReply?.id;
      } catch {}

      return;
    },
    [publicCreatePetitionFieldReply, updateLastSaved]
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

  const [publicStartAsyncFieldCompletion] = useMutation(
    RecipientViewPetitionField_publicStartAsyncFieldCompletionDocument
  );

  const handleStartAsyncFieldCompletion = async () => {
    const { data } = await publicStartAsyncFieldCompletion({
      variables: {
        fieldId: props.field.id,
        keycode: props.keycode,
      },
    });
    return data!.publicStartAsyncFieldCompletion;
  };

  const { refetch } = useQuery(RecipientViewPetitionField_PublicPetitionFieldDocument, {
    skip: true,
  });
  const handleRefreshAsyncField = useCallback(
    () => refetch({ fieldId: props.field.id, keycode: props.keycode }),
    [refetch, props.field.id, props.keycode]
  );

  const commonProps = {
    onCommentsButtonClick: handleCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment,
    onDeleteReply: handleDeletePetitionFieldReply,
    onUpdateReply: handleUpdatePetitionFieldReply,
    onCreateReply: handleCreatePetitionFieldReply,
  };

  return props.field.type === "HEADING" ? (
    <RecipientViewPetitionFieldHeading {...props} {...commonProps} />
  ) : props.field.type === "TEXT" ? (
    <RecipientViewPetitionFieldText {...props} {...commonProps} />
  ) : props.field.type === "SHORT_TEXT" ? (
    <RecipientViewPetitionFieldShortText {...props} {...commonProps} />
  ) : props.field.type === "SELECT" ? (
    <RecipientViewPetitionFieldSelect {...props} {...commonProps} />
  ) : props.field.type === "FILE_UPLOAD" ? (
    <RecipientViewPetitionFieldFileUpload
      {...props}
      {...commonProps}
      onCreateReply={handleCreateFileUploadReply}
      onDownloadReply={handleDownloadFileUploadReply}
    />
  ) : props.field.type === "DYNAMIC_SELECT" ? (
    <RecipientViewPetitionFieldDynamicSelect {...props} {...commonProps} />
  ) : props.field.type === "CHECKBOX" ? (
    <RecipientViewPetitionFieldCheckbox {...props} {...commonProps} />
  ) : props.field.type === "NUMBER" ? (
    <RecipientViewPetitionFieldNumber {...props} {...commonProps} />
  ) : props.field.type === "DATE" ? (
    <RecipientViewPetitionFieldDate {...props} {...commonProps} />
  ) : props.field.type === "PHONE" ? (
    <RecipientViewPetitionFieldPhone {...props} {...commonProps} />
  ) : props.field.type === "ES_TAX_DOCUMENTS" ? (
    <RecipientViewPetitionFieldTaxDocuments
      {...props}
      {...commonProps}
      tone={tone}
      onDownloadReply={handleDownloadFileUploadReply}
      onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
      onRefreshField={handleRefreshAsyncField}
      view="recipient"
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

const _queries = [
  gql`
    query RecipientViewPetitionField_PublicPetitionField($keycode: ID!, $fieldId: GID!) {
      publicPetitionField(keycode: $keycode, petitionFieldId: $fieldId) {
        ...RecipientViewPetitionFieldCard_PublicPetitionField
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionField}
  `,
];

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
    mutation RecipientViewPetitionField_publicDeletePetitionFieldReply(
      $replyId: GID!
      $keycode: ID!
    ) {
      publicDeletePetitionFieldReply(replyId: $replyId, keycode: $keycode) {
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
    mutation RecipientViewPetitionField_publicCreatePetitionFieldReply(
      $keycode: ID!
      $fieldId: GID!
      $reply: JSON!
    ) {
      publicCreatePetitionFieldReply(keycode: $keycode, fieldId: $fieldId, reply: $reply) {
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
    mutation RecipientViewPetitionField_publicUpdatePetitionFieldReply(
      $keycode: ID!
      $replyId: GID!
      $reply: JSON!
    ) {
      publicUpdatePetitionFieldReply(keycode: $keycode, replyId: $replyId, reply: $reply) {
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
    mutation RecipientViewPetitionField_publicStartAsyncFieldCompletion(
      $keycode: ID!
      $fieldId: GID!
    ) {
      publicStartAsyncFieldCompletion(keycode: $keycode, fieldId: $fieldId) {
        type
        url
      }
    }
  `,
];
