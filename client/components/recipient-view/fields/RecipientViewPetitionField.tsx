import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { useTone } from "@parallel/components/common/ToneProvider";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/dialogs/FailureGeneratingLinkDialog";
import {
  RecipientViewPetitionFieldLayout_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument,
  RecipientViewPetitionField_PublicPetitionFieldDocument,
  RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc,
  RecipientViewPetitionField_publicCreatePetitionFieldRepliesDocument,
  RecipientViewPetitionField_publicDeletePetitionFieldReplyDocument,
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
  RecipientViewPetitionField_publicStartAsyncFieldCompletionDocument,
  RecipientViewPetitionField_publicUpdatePetitionFieldRepliesDocument,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useCallback, useRef } from "react";
import { useLastSaved } from "../LastSavedProvider";
import {
  RecipientViewPetitionFieldCommentsDialog,
  usePetitionFieldCommentsDialog,
} from "../dialogs/RecipientViewPetitionFieldCommentsDialog";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldCheckbox } from "./RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDate } from "./RecipientViewPetitionFieldDate";
import { RecipientViewPetitionFieldDateTime } from "./RecipientViewPetitionFieldDateTime";
import { RecipientViewPetitionFieldDynamicSelect } from "./RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "./RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "./RecipientViewPetitionFieldHeading";
import { RecipientViewPetitionFieldNumber } from "./RecipientViewPetitionFieldNumber";
import { RecipientViewPetitionFieldPhone } from "./RecipientViewPetitionFieldPhone";
import { RecipientViewPetitionFieldSelect } from "./RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldShortText } from "./RecipientViewPetitionFieldShortText";
import { RecipientViewPetitionFieldTaxDocuments } from "./RecipientViewPetitionFieldTaxDocuments";
import { RecipientViewPetitionFieldText } from "./RecipientViewPetitionFieldText";
import { useCreateFileUploadReply } from "./clientMutations";
import { RecipientViewPetitionFieldCard } from "./RecipientViewPetitionFieldCard";

export interface RecipientViewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment" | "field"
  > {
  field: RecipientViewPetitionFieldLayout_PublicPetitionFieldFragment;
  keycode: string;
  access: RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment;
  petitionId: string;
  isDisabled: boolean;
  isInvalid: boolean;
}

export function RecipientViewPetitionField(props: RecipientViewPetitionFieldProps) {
  const uploads = useRef<Record<string, AbortController>>({});
  const { updateLastSaved } = useLastSaved();
  const tone = useTone();

  const [publicPetitionFieldAttachmentDownloadLink] = useMutation(
    RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
  );
  const handleDownloadAttachment = async function (attachmentId: string) {
    await withError(
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
      }),
    );
  };

  const showFieldComments = usePetitionFieldCommentsDialog();
  async function handleCommentsButtonClick() {
    try {
      await showFieldComments({
        keycode: props.keycode,
        access: props.access,
        fieldId: props.field.id,
        tone,
      });
    } catch {}
  }

  const [publicDeletePetitionFieldReply] = useMutation(
    RecipientViewPetitionField_publicDeletePetitionFieldReplyDocument,
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
    [publicDeletePetitionFieldReply, updateLastSaved],
  );

  const [publicUpdatePetitionFieldReplies] = useMutation(
    RecipientViewPetitionField_publicUpdatePetitionFieldRepliesDocument,
  );
  const handleUpdatePetitionFieldReply = useCallback(
    async (replyId: string, content: any) => {
      await publicUpdatePetitionFieldReplies({
        variables: {
          keycode: props.keycode,
          replies: [
            {
              id: replyId,
              content,
            },
          ],
        },
      });
      updateLastSaved();
    },
    [publicUpdatePetitionFieldReplies, updateLastSaved],
  );

  const [publicCreatePetitionFieldReplies] = useMutation(
    RecipientViewPetitionField_publicCreatePetitionFieldRepliesDocument,
  );
  const handleCreatePetitionFieldReply = useCallback(
    async (content: any) => {
      const { data } = await publicCreatePetitionFieldReplies({
        variables: {
          keycode: props.keycode,
          fields: [
            {
              id: props.field.id,
              content,
            },
          ],
        },
      });
      updateLastSaved();
      return data?.publicCreatePetitionFieldReplies?.[0]?.id;
    },
    [publicCreatePetitionFieldReplies, updateLastSaved],
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
    [createFileUploadReply, uploads, updateLastSaved],
  );

  const [downloadFileUploadReply] = useMutation(
    RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument,
  );
  const showFailure = useFailureGeneratingLinkDialog();
  const apollo = useApolloClient();
  const handleDownloadFileUploadReply = useCallback(
    async (replyId: string) => {
      await withError(
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
        }),
      );
    },
    [downloadFileUploadReply],
  );

  const [publicStartAsyncFieldCompletion] = useMutation(
    RecipientViewPetitionField_publicStartAsyncFieldCompletionDocument,
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
    [refetch, props.field.id, props.keycode],
  );

  const commonProps = {
    onCommentsButtonClick: handleCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment,
    onDeleteReply: handleDeletePetitionFieldReply,
    onUpdateReply: handleUpdatePetitionFieldReply,
    onCreateReply: handleCreatePetitionFieldReply,
  };

  if (props.field.type === "HEADING") {
    return <RecipientViewPetitionFieldHeading {...props} {...commonProps} />;
  }

  return (
    <RecipientViewPetitionFieldCard isInvalid={props.isInvalid} field={props.field}>
      {props.field.type === "TEXT" ? (
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
      ) : props.field.type === "DATE_TIME" ? (
        <RecipientViewPetitionFieldDateTime {...props} {...commonProps} />
      ) : props.field.type === "PHONE" ? (
        <RecipientViewPetitionFieldPhone {...props} {...commonProps} />
      ) : props.field.type === "ES_TAX_DOCUMENTS" ? (
        <RecipientViewPetitionFieldTaxDocuments
          {...props}
          {...commonProps}
          onDownloadReply={handleDownloadFileUploadReply}
          onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
          onRefreshField={handleRefreshAsyncField}
        />
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
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
      ...RecipientViewPetitionFieldLayout_PublicPetitionField
      ...RecipientViewPetitionFieldCard_PublicPetitionField
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PublicPetitionField}
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
        ...RecipientViewPetitionFieldLayout_PublicPetitionField
      }
    }
    ${RecipientViewPetitionFieldLayout.fragments.PublicPetitionField}
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
    mutation RecipientViewPetitionField_publicCreatePetitionFieldReplies(
      $keycode: ID!
      $fields: [CreatePetitionFieldReplyInput!]!
    ) {
      publicCreatePetitionFieldReplies(keycode: $keycode, fields: $fields) {
        ...RecipientViewPetitionFieldLayout_PublicPetitionFieldReply
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
    ${RecipientViewPetitionFieldLayout.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientViewPetitionField_publicUpdatePetitionFieldReplies(
      $keycode: ID!
      $replies: [UpdatePetitionFieldReplyInput!]!
    ) {
      publicUpdatePetitionFieldReplies(keycode: $keycode, replies: $replies) {
        ...RecipientViewPetitionFieldLayout_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
        }
      }
    }
    ${RecipientViewPetitionFieldLayout.fragments.PublicPetitionFieldReply}
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
