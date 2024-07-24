import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/dialogs/FailureGeneratingLinkDialog";
import {
  PreviewPetitionField_publicretryAsyncFieldCompletionDocument,
  RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument,
  RecipientViewPetitionField_PublicPetitionAccessFragment,
  RecipientViewPetitionField_PublicPetitionFieldFragment,
  RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc,
  RecipientViewPetitionField_publicCreatePetitionFieldRepliesDocument,
  RecipientViewPetitionField_publicDeletePetitionFieldReplyDocument,
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
  RecipientViewPetitionField_publicStartAsyncFieldCompletionDocument,
  RecipientViewPetitionField_publicUpdatePetitionFieldRepliesDocument,
  RecipientViewPetitionField_queryDocument,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";
import { isWindowBlockedError, openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useCallback, useRef } from "react";
import { pick } from "remeda";
import { useLastSaved } from "../LastSavedProvider";
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

export interface RecipientViewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment" | "field"
  > {
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  keycode: string;
  access: RecipientViewPetitionField_PublicPetitionAccessFragment;
  isDisabled: boolean;

  fieldLogic?: FieldLogicResult;
  onError: (error: any) => void;
}

export function RecipientViewPetitionField({
  fieldLogic,
  ...props
}: RecipientViewPetitionFieldProps) {
  const uploads = useRef<Record<string, AbortController>>({});
  const { updateLastSaved } = useLastSaved();

  const { ...rest } = props;

  const [publicPetitionFieldAttachmentDownloadLink] = useMutation(
    RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
  );
  const handleDownloadAttachment = useMemoFactory(
    (fieldId: string) => async (attachmentId: string) => {
      await withError(
        openNewWindow(async () => {
          const { data } = await publicPetitionFieldAttachmentDownloadLink({
            variables: {
              keycode: props.keycode,
              fieldId,
              attachmentId,
            },
          });
          const { url } = data!.publicPetitionFieldAttachmentDownloadLink;
          return url!;
        }),
      );
    },
    [props.keycode],
  );
  const [, setFieldId] = useFieldCommentsQueryState();
  async function handleCommentsButtonClick() {
    setFieldId(props.field.id);
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
      try {
        await createFileUploadReply({
          keycode: props.keycode,
          fieldId: _fieldId ?? props.field.id,
          content,
          uploads,
          parentReplyId,
        });
        updateLastSaved();
      } catch (e) {
        props.onError(e);
      }
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
      try {
        await openNewWindow(async () => {
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
      } catch (e) {
        if (!isWindowBlockedError(e)) {
          props.onError(e);
        }
      }
    },
    [downloadFileUploadReply],
  );

  const [publicStartAsyncFieldCompletion] = useMutation(
    RecipientViewPetitionField_publicStartAsyncFieldCompletionDocument,
  );

  const handleStartAsyncFieldCompletion = async (_fieldId?: string, parentReplyId?: string) => {
    const { data } = await publicStartAsyncFieldCompletion({
      variables: {
        fieldId: _fieldId ?? props.field.id,
        keycode: props.keycode,
        parentReplyId,
      },
    });
    return data!.publicStartAsyncFieldCompletion;
  };

  const [publicRetryAsyncFieldCompletion] = useMutation(
    PreviewPetitionField_publicretryAsyncFieldCompletionDocument,
  );
  const handleRetryAsyncFieldCompletion = async (_fieldId?: string, parentReplyId?: string) => {
    const { data } = await publicRetryAsyncFieldCompletion({
      variables: {
        keycode: props.keycode,
        fieldId: _fieldId ?? props.field.id,
        parentReplyId,
      },
    });
    return pick(data!.publicRetryAsyncFieldCompletion, ["type", "url"]);
  };

  const { refetch } = useQuery(RecipientViewPetitionField_queryDocument, {
    skip: true,
  });
  const handleRefreshAsyncField = useCallback(
    () => refetch({ fieldId: props.field.id, keycode: props.keycode }),
    [refetch, props.field.id, props.keycode],
  );

  const commonProps = {
    onCommentsButtonClick: handleCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment(props.field.id),
    onDeleteReply: handleDeletePetitionFieldReply,
    onUpdateReply: handleUpdatePetitionFieldReply,
    onCreateReply: handleCreatePetitionFieldReply,
  };

  if (props.field.type === "HEADING") {
    return (
      <RecipientViewPetitionFieldHeading
        field={props.field}
        onDownloadAttachment={handleDownloadAttachment(props.field.id)}
        onCommentsButtonClick={handleCommentsButtonClick}
      />
    );
  } else if (props.field.type === "FIELD_GROUP") {
    return (
      <RecipientViewPetitionFieldGroup
        {...props}
        {...commonProps}
        onDownloadAttachment={handleDownloadAttachment}
        onRefreshField={handleRefreshAsyncField}
        onCreateFileReply={handleCreateFileUploadReply}
        onDownloadFileUploadReply={handleDownloadFileUploadReply}
        onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
        onRetryAsyncFieldCompletion={handleRetryAsyncFieldCompletion}
        petition={props.access.petition}
        fieldLogic={fieldLogic!}
      />
    );
  }

  return (
    <RecipientViewPetitionFieldCard field={props.field}>
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
          onRetryAsyncFieldCompletion={handleRetryAsyncFieldCompletion}
          onRefreshField={handleRefreshAsyncField}
          hideDeleteReplyButton
        />
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}

RecipientViewPetitionField.fragments = {
  PublicPetitionAccess: gql`
    fragment RecipientViewPetitionField_PublicPetitionAccess on PublicPetitionAccess {
      petition {
        ...RecipientViewPetitionFieldGroup_PublicPetition
      }
    }
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
    query RecipientViewPetitionField_query($keycode: ID!, $fieldId: GID!) {
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
      $parentReplyId: GID
    ) {
      publicStartAsyncFieldCompletion(
        keycode: $keycode
        fieldId: $fieldId
        parentReplyId: $parentReplyId
      ) {
        type
        url
      }
    }
  `,
  gql`
    mutation PreviewPetitionField_publicretryAsyncFieldCompletion(
      $keycode: ID!
      $fieldId: GID!
      $parentReplyId: GID
    ) {
      publicRetryAsyncFieldCompletion(
        keycode: $keycode
        fieldId: $fieldId
        parentReplyId: $parentReplyId
      ) {
        type
        url
      }
    }
  `,
];
