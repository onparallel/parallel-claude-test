import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { useTone } from "@parallel/components/common/ToneProvider";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/dialogs/FailureGeneratingLinkDialog";
import {
  RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument,
  RecipientViewPetitionField_PublicPetitionAccessFragment,
  RecipientViewPetitionField_PublicPetitionFieldDocument,
  RecipientViewPetitionField_PublicPetitionFieldFragment,
  RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc,
  RecipientViewPetitionField_publicCreatePetitionFieldRepliesDocument,
  RecipientViewPetitionField_publicDeletePetitionFieldReplyDocument,
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
  RecipientViewPetitionField_publicStartAsyncFieldCompletionDocument,
  RecipientViewPetitionField_publicUpdatePetitionFieldRepliesDocument,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useCallback, useRef } from "react";
import { useLastSaved } from "../LastSavedProvider";
import {
  RecipientViewPetitionFieldCommentsDialog,
  usePetitionFieldCommentsDialog,
} from "../dialogs/RecipientViewPetitionFieldCommentsDialog";
import { RecipientViewPetitionFieldCard } from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldCheckbox } from "./RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDate } from "./RecipientViewPetitionFieldDate";
import { RecipientViewPetitionFieldDateTime } from "./RecipientViewPetitionFieldDateTime";
import { RecipientViewPetitionFieldDynamicSelect } from "./RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "./RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldGroup } from "./RecipientViewPetitionFieldGroup";
import { RecipientViewPetitionFieldHeading } from "./RecipientViewPetitionFieldHeading";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldNumber } from "./RecipientViewPetitionFieldNumber";
import { RecipientViewPetitionFieldPhone } from "./RecipientViewPetitionFieldPhone";
import { RecipientViewPetitionFieldSelect } from "./RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldShortText } from "./RecipientViewPetitionFieldShortText";
import { RecipientViewPetitionFieldTaxDocuments } from "./RecipientViewPetitionFieldTaxDocuments";
import { RecipientViewPetitionFieldText } from "./RecipientViewPetitionFieldText";
import { useCreateFileUploadReply } from "./clientMutations";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";

export interface RecipientViewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment" | "field"
  > {
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  keycode: string;
  access: RecipientViewPetitionField_PublicPetitionAccessFragment;
  isDisabled: boolean;
  showErrors: boolean;
  fieldLogic?: FieldLogicResult;
  onError: (error: any) => void;
}

export function RecipientViewPetitionField({
  fieldLogic,
  ...props
}: RecipientViewPetitionFieldProps) {
  const uploads = useRef<Record<string, AbortController>>({});
  const { updateLastSaved } = useLastSaved();
  const tone = useTone();

  const { showErrors, ...rest } = props;

  const isInvalid =
    showErrors && !props.field.optional && completedFieldReplies(props.field).length === 0;

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
      } catch (e) {
        props.onError(e);
      }
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
    async (content: any, _fieldId?: string, parentReplyId?: string) => {
      const { data } = await publicCreatePetitionFieldReplies({
        variables: {
          keycode: props.keycode,
          fields: [
            {
              id: _fieldId ?? props.field.id,
              content,
              parentReplyId,
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
    async (content: File[], _fieldId?: string, parentReplyId?: string) => {
      await createFileUploadReply({
        keycode: props.keycode,
        fieldId: _fieldId ?? props.field.id,
        content,
        uploads,
        parentReplyId,
      });
      updateLastSaved();
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
    return (
      <RecipientViewPetitionFieldHeading
        field={props.field}
        onDownloadAttachment={handleDownloadAttachment}
        onCommentsButtonClick={handleCommentsButtonClick}
      />
    );
  } else if (props.field.type === "FIELD_GROUP") {
    return (
      <RecipientViewPetitionFieldGroup
        {...props}
        {...commonProps}
        onRefreshField={handleRefreshAsyncField}
        onCreateFileReply={handleCreateFileUploadReply}
        onDownloadFileUploadReply={handleDownloadFileUploadReply}
        onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
        petition={props.access.petition}
        fieldLogic={fieldLogic!}
      />
    );
  }

  return (
    <RecipientViewPetitionFieldCard isInvalid={isInvalid} field={props.field}>
      {props.field.type === "TEXT" ? (
        <RecipientViewPetitionFieldText {...rest} {...commonProps} />
      ) : props.field.type === "SHORT_TEXT" ? (
        <RecipientViewPetitionFieldShortText {...rest} {...commonProps} />
      ) : props.field.type === "SELECT" ? (
        <RecipientViewPetitionFieldSelect {...rest} {...commonProps} />
      ) : props.field.type === "FILE_UPLOAD" ? (
        <RecipientViewPetitionFieldFileUpload
          {...rest}
          {...commonProps}
          onCreateReply={handleCreateFileUploadReply}
          onDownloadReply={handleDownloadFileUploadReply}
        />
      ) : props.field.type === "DYNAMIC_SELECT" ? (
        <RecipientViewPetitionFieldDynamicSelect {...rest} {...commonProps} />
      ) : props.field.type === "CHECKBOX" ? (
        <RecipientViewPetitionFieldCheckbox {...rest} {...commonProps} />
      ) : props.field.type === "NUMBER" ? (
        <RecipientViewPetitionFieldNumber {...rest} {...commonProps} />
      ) : props.field.type === "DATE" ? (
        <RecipientViewPetitionFieldDate {...rest} {...commonProps} />
      ) : props.field.type === "DATE_TIME" ? (
        <RecipientViewPetitionFieldDateTime {...rest} {...commonProps} />
      ) : props.field.type === "PHONE" ? (
        <RecipientViewPetitionFieldPhone {...rest} {...commonProps} />
      ) : props.field.type === "ES_TAX_DOCUMENTS" ? (
        <RecipientViewPetitionFieldTaxDocuments
          {...rest}
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
      petition {
        ...RecipientViewPetitionFieldGroup_PublicPetition
      }
    }
    ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionAccess}
    ${RecipientViewPetitionFieldGroup.fragments.PublicPetition}
  `,
  PublicPetitionField: gql`
    fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
      ...RecipientViewPetitionFieldLayout_PublicPetitionField
      ...RecipientViewPetitionFieldCard_PublicPetitionField
      ...RecipientViewPetitionFieldGroup_PublicPetitionField
      ...completedFieldReplies_PublicPetitionField
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PublicPetitionField}
    ${RecipientViewPetitionFieldGroup.fragments.PublicPetitionField}
    ${completedFieldReplies.fragments.PublicPetitionField}
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
        parent {
          id
          replies {
            id
            children {
              field {
                id
              }
              replies {
                id
              }
            }
          }
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
        children {
          field {
            id
          }
        }
        field {
          id
          petition {
            id
            status
          }
          parent {
            id
            children {
              id
              replies {
                id
              }
            }
          }
          replies {
            id
            parent {
              id
              children {
                field {
                  id
                }
                replies {
                  id
                }
              }
            }
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
