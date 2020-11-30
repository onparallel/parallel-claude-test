import { gql, useApolloClient } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  CloseButton,
  Flex,
  ListItem,
  Stack,
  Text,
  UnorderedList,
  useDisclosure,
  useToast,
} from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
  withDialogs,
} from "@parallel/components/common/DialogProvider";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { RecipientViewContentsCard } from "@parallel/components/recipient-view/RecipientViewContentsCard";
import { RecipientViewFooter } from "@parallel/components/recipient-view/RecipientViewFooter";
import { RecipientViewHelpModal } from "@parallel/components/recipient-view/RecipientViewHelpModal";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import {
  CreateReply,
  RecipientViewPetitionField,
} from "@parallel/components/recipient-view/RecipientViewPetitionField";
import { RecipientViewPetitionFieldCommentsDialog } from "@parallel/components/recipient-view/RecipientViewPetitionFieldCommentsDialog";
import { RecipientViewProgressFooter } from "@parallel/components/recipient-view/RecipientViewProgressFooter";
import { RecipientViewSenderCard } from "@parallel/components/recipient-view/RecipientViewSenderCard";
import {
  CreateFileUploadReplyInput,
  CreateTextReplyInput,
  PublicPetitionQuery,
  PublicPetitionQueryVariables,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment,
  RecipientView_createFileUploadReply_FieldFragment,
  RecipientView_createFileUploadReply_PublicPetitionFragment,
  RecipientView_createPetitionFieldCommentMutationVariables,
  RecipientView_createPetitionFieldComment_PublicPetitionFieldFragment,
  RecipientView_createSelectReply_FieldFragment,
  RecipientView_createSelectReply_PublicPetitionFragment,
  RecipientView_createTextReply_FieldFragment,
  RecipientView_createTextReply_PublicPetitionFragment,
  RecipientView_deletePetitionFieldCommentMutationVariables,
  RecipientView_deletePetitionFieldComment_PublicPetitionFieldFragment,
  RecipientView_deletePetitionReply_PublicPetitionFieldFragment,
  RecipientView_deletePetitionReply_PublicPetitionFragment,
  RecipientView_PublicContactFragment,
  RecipientView_PublicPetitionFieldFragment,
  RecipientView_updatePetitionFieldCommentMutationVariables,
  usePublicPetitionQuery,
  useRecipientView_createPetitionFieldCommentMutation,
  useRecipientView_deletePetitionFieldCommentMutation,
  useRecipientView_markPetitionFieldCommentsAsReadMutation,
  useRecipientView_publicCompletePetitionMutation,
  useRecipientView_publicCreateFileUploadReplyMutation,
  useRecipientView_publicCreateSelectReplyMutation,
  useRecipientView_publicCreateTextReplyMutation,
  useRecipientView_publicDeletePetitionReplyMutation,
  useRecipientView_publicFileUploadReplyCompleteMutation,
  useRecipientView_submitUnpublishedCommentsMutation,
  useRecipientView_updatePetitionFieldCommentMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { groupFieldsByPages } from "@parallel/utils/groupFieldsByPage";
import { resolveUrl } from "@parallel/utils/next";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import axios, { CancelTokenSource } from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import ResizeObserver, { DOMRect } from "react-resize-observer";
import { countBy, omit, pick } from "remeda";

type RecipientViewProps = UnwrapPromise<
  ReturnType<typeof RecipientView.getInitialProps>
>;

function RecipientView({
  keycode,
  currentPage,
  pageCount,
}: RecipientViewProps) {
  const intl = useIntl();
  const router = useRouter();
  const {
    data: { access },
  } = assertQuery(usePublicPetitionQuery({ variables: { keycode } }));
  const petition = access!.petition!;
  const granter = access!.granter!;
  const contact = access!.contact!;
  const signers = petition!.signers!;

  const { fields, pages } = useGetPageFields(petition.fields, currentPage);

  const [showAlert, setShowAlert] = useState(true);
  const deletePetitionReply = useDeletePetitionReply();
  const createTextReply = useCreateTextReply();
  const createFileUploadReply = useCreateFileUploadReply();
  const createSelectReply = useCreateSelectReply();
  const [
    fileUploadReplyComplete,
  ] = useRecipientView_publicFileUploadReplyCompleteMutation();
  const [completePetition] = useRecipientView_publicCompletePetitionMutation();
  const toast = useToast();
  const [uploadTokens, setUploadTokens] = useState<{
    [replyId: string]: CancelTokenSource;
  }>({});
  const [uploadProgress, setUploadProgress] = useState<{
    [fieldId: string]: { [replyId: string]: number };
  }>({});

  const handleDeleteReply = useCallback(
    async function handleDeleteReply(fieldId: string, replyId: string) {
      if (uploadTokens[replyId]) {
        uploadTokens[replyId].cancel();
        setUploadTokens(omit(uploadTokens, [replyId]));
      }
      await deletePetitionReply(keycode, petition.id, fieldId, replyId);
    },
    [keycode, uploadTokens, petition.id]
  );

  const handleCreateReply = useCallback(
    async function handleCreateReply(fieldId: string, payload: CreateReply) {
      switch (payload.type) {
        case "FILE_UPLOAD":
          for (const file of payload.content) {
            const { data } = await createFileUploadReply(
              keycode,
              petition.id,
              fieldId,
              {
                filename: file.name,
                size: file.size,
                contentType: file.type,
              }
            );
            const { endpoint, reply } = data!.publicCreateFileUploadReply;

            const source = axios.CancelToken.source();
            setUploadTokens((tokens) => ({ ...tokens, [reply.id]: source }));
            await axios.put(endpoint, file, {
              cancelToken: source.token,
              onUploadProgress({ loaded, total }) {
                const progress: number = loaded / total;
                setUploadProgress((curr) => ({
                  ...curr,
                  [fieldId]: { ...curr[fieldId], [reply.id]: progress },
                }));
              },
              headers: {
                "Content-Type": file.type,
              },
            });
            await fileUploadReplyComplete({
              variables: { keycode, replyId: reply.id },
            });
            setUploadProgress((curr) => ({
              ...curr,
              [fieldId]: omit(curr[fieldId] ?? {}, [reply.id]),
            }));
          }
          break;
        case "TEXT":
          await createTextReply(keycode, petition.id, fieldId, {
            text: payload.content,
          });
          break;
        case "SELECT":
          await createSelectReply(keycode, petition.id, fieldId, {
            text: payload.content,
          });
          break;
        default:
          break;
      }
    },
    [keycode, petition.id]
  );

  const [finalized, setFinalized] = useState(false);

  const confirmStartSignatureProcessDialog = useDialog(
    ConfirmStartSignatureProcess
  );

  const handleFinalize = useCallback(
    async function () {
      try {
        setFinalized(true);
        const canFinalize = petition.fields.every(
          (f) => f.optional || f.replies.length > 0 || f.isReadOnly
        );
        if (canFinalize) {
          if (signers.length > 0) {
            await confirmStartSignatureProcessDialog({
              signers,
              contactId: contact.id,
            });
          }
          await completePetition({ variables: { keycode } });
          toast({
            title: intl.formatMessage({
              id: "recipient-view.completed-petition.toast-title",
              defaultMessage: "Petition completed!",
            }),
            description: intl.formatMessage(
              {
                id: "recipient-view.completed-petition.toast-description",
                defaultMessage: "{name} will be notified for its revision.",
              },
              { name: granter.fullName }
            ),
            status: "success",
            isClosable: true,
          });
        } else {
          // go to first repliable field without replies
          let page = 1;
          const field = petition.fields.find((f) => {
            if (f.type === "HEADING" && f.options?.hasPageBreak) {
              page += 1;
            }
            return f.replies.length === 0 && !f.optional && !f.isReadOnly;
          })!;
          const { keycode, locale } = router.query;
          router.push(
            `/${locale}/petition/${keycode}/${page}#field-${field.id}`
          );
        }
      } catch {}
    },
    [petition.fields, granter, router.query]
  );

  const [selectedFieldId, setSelectedFieldId] = useState<Maybe<string>>(null);
  const selectedField =
    petition.fields.find((f) => f.id === selectedFieldId) ?? null;

  const createPetitionFieldComment = useCreatePetitionFieldComment();
  async function handleAddComment(content: string) {
    await createPetitionFieldComment({
      keycode,
      petitionFieldId: selectedFieldId!,
      content,
    });
  }

  const updatePetitionFieldComment = useUpdatePetitionFieldComment();
  async function handleUpdateComment(
    petitionFieldCommentId: string,
    content: string
  ) {
    await updatePetitionFieldComment({
      keycode,
      petitionFieldId: selectedFieldId!,
      petitionFieldCommentId,
      content,
    });
  }

  const deletePetitionFieldComment = useDeletePetitionFieldComment();
  async function handleDeleteComment(petitionFieldCommentId: string) {
    await deletePetitionFieldComment({
      keycode,
      petitionFieldId: selectedFieldId!,
      petitionFieldCommentId,
    });
  }

  const [
    submitUnpublishedComments,
    { loading: isSubmitting },
  ] = useRecipientView_submitUnpublishedCommentsMutation();
  async function handleSubmitUnpublished() {
    await submitUnpublishedComments({
      variables: { keycode },
    });
  }

  const pendingComments = petition.fields.reduce(
    (acc, f) => acc + countBy(f.comments, (c) => !c.publishedAt),
    0
  );

  // Prevent closing when theres pending comments
  useEffect(() => {
    if (pendingComments) {
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
    function handler(event: BeforeUnloadEvent) {
      event.returnValue = "";
      event.preventDefault();
    }
  }, [pendingComments]);

  const [
    markPetitionFieldCommentsAsRead,
  ] = useRecipientView_markPetitionFieldCommentsAsReadMutation();
  useEffect(() => {
    if (selectedFieldId) {
      const timeout = setTimeout(async () => {
        const petitionFieldCommentIds = selectedField!.comments
          .filter((c) => c.isUnread)
          .map((c) => c.id);
        if (petitionFieldCommentIds.length > 0) {
          await markPetitionFieldCommentsAsRead({
            variables: { keycode, petitionFieldCommentIds },
          });
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [selectedFieldId]);

  const [sidebarTop, setSidebarTop] = useState(0);
  const readjustHeight = useCallback(function (rect: DOMRect) {
    setSidebarTop(rect.height + 16);
  }, []);

  const { onOpen: handleOpenHelp, ...helpModal } = useHelpModal();

  const breakpoint = "md";
  return (
    <>
      <Head>
        {fields[0]?.type === "HEADING" && fields[0].title ? (
          <title>{fields[0].title} | Parallel</title>
        ) : (
          <title>Parallel</title>
        )}
      </Head>
      <Flex
        backgroundColor="gray.50"
        minHeight="100vh"
        zIndex={1}
        flexDirection="column"
        alignItems="center"
      >
        <Box position="sticky" top={0} width="100%" zIndex={2} marginBottom={4}>
          {showAlert && ["COMPLETED", "CLOSED"].includes(petition.status) ? (
            <Alert status="success" variant="subtle" zIndex={2}>
              <Flex
                maxWidth="container.lg"
                alignItems="center"
                justifyContent="flex-start"
                marginX="auto"
                width="100%"
                paddingLeft={4}
                paddingRight={12}
              >
                <AlertIcon />
                <AlertDescription>
                  {petition.status === "COMPLETED" ? (
                    <>
                      <Text>
                        <FormattedMessage
                          id="recipient-view.petition-completed-alert-1"
                          defaultMessage="This petition has been completed and {name} has been notified for its revision and validation."
                          values={{
                            name: <b>{granter.fullName}</b>,
                          }}
                        />
                      </Text>
                      <Text>
                        <FormattedMessage
                          id="recipient-view.petition-completed-alert-2"
                          defaultMessage="If you want to make any changes don't forget to hit the <b>Finalize</b> button again."
                          values={{
                            b: (chunks: any[]) => <b>{chunks}</b>,
                          }}
                        />
                      </Text>
                    </>
                  ) : (
                    <FormattedMessage
                      id="recipient-view.petition-closed-alert"
                      defaultMessage="This petition has been closed. If you need to make any changes, please reach out to {name}."
                      values={{
                        name: <b>{granter.fullName}</b>,
                      }}
                    />
                  )}
                </AlertDescription>
              </Flex>
              <CloseButton
                position="absolute"
                right="8px"
                top="8px"
                onClick={() => setShowAlert(false)}
              />
            </Alert>
          ) : null}
          {pendingComments ? (
            <Box backgroundColor="yellow.100" boxShadow="sm">
              <Flex
                maxWidth="container.lg"
                alignItems="center"
                marginX="auto"
                width="100%"
                paddingX={4}
                paddingY={2}
              >
                <Text flex="1" color="yellow.900">
                  <FormattedMessage
                    id="recipient-view.submit-unpublished-comments-text"
                    defaultMessage="You have some pending comments. Submit them at once to notify {sender} in a single email."
                    values={{ sender: <b>{granter.fullName}</b> }}
                  />
                </Text>
                <Button
                  colorScheme="yellow"
                  size="sm"
                  marginLeft={4}
                  onClick={handleSubmitUnpublished}
                  isDisabled={isSubmitting}
                >
                  <FormattedMessage
                    id="recipient-view.submit-unpublished-comments-button"
                    defaultMessage="Submit {commentCount, plural, =1 {# comment} other{# comments}}"
                    values={{ commentCount: pendingComments }}
                  />
                </Button>
              </Flex>
            </Box>
          ) : null}
          <ResizeObserver onResize={readjustHeight} />
        </Box>
        <Flex
          flex="1"
          flexDirection={{ base: "column", [breakpoint]: "row" }}
          width="100%"
          maxWidth="container.lg"
          paddingX={4}
        >
          <Box
            flex="1"
            minWidth={0}
            marginRight={{ base: 0, [breakpoint]: 4 }}
            marginBottom={4}
          >
            <Stack
              spacing={4}
              position={{ base: "relative", [breakpoint]: "sticky" }}
              top={{ base: 0, [breakpoint]: `${sidebarTop}px` }}
            >
              <RecipientViewSenderCard sender={granter} />
              {petition.isRecipientViewContentsHidden ? null : (
                <RecipientViewContentsCard
                  currentPage={currentPage}
                  hasCommentsEnabled={petition.hasCommentsEnabled}
                  sender={granter}
                  petition={petition}
                  display={{ base: "none", [breakpoint]: "flex" }}
                />
              )}
              <Button variant="outline" onClick={handleOpenHelp}>
                <FormattedMessage
                  id="recipient-view.need-help"
                  defaultMessage="Help"
                />
              </Button>
            </Stack>
          </Box>
          <Flex flexDirection="column" flex="2" minWidth={0}>
            <Stack spacing={4}>
              {fields.map((field) => (
                <RecipientViewPetitionField
                  canReply={!field.validated && petition.status !== "CLOSED"}
                  key={field.id}
                  id={`field-${field.id}`}
                  field={field}
                  isInvalid={
                    finalized && field.replies.length === 0 && !field.optional
                  }
                  hasCommentsEnabled={petition.hasCommentsEnabled}
                  uploadProgress={uploadProgress[field.id]}
                  contactId={contact.id}
                  onOpenCommentsClick={() => setSelectedFieldId(field.id)}
                  onCreateReply={(payload) =>
                    handleCreateReply(field.id, payload)
                  }
                  onDeleteReply={(replyId) =>
                    handleDeleteReply(field.id, replyId)
                  }
                />
              ))}
            </Stack>
            <Spacer />
            {pages > 1 ? (
              <RecipientViewPagination
                marginTop={8}
                currentPage={currentPage}
                pageCount={pageCount}
              />
            ) : null}
            <RecipientViewFooter marginTop={12} />
          </Flex>
        </Flex>
        <Spacer />
        {petition.status !== "CLOSED" && (
          <RecipientViewProgressFooter
            petition={petition}
            onFinalize={handleFinalize}
          />
        )}
      </Flex>
      {selectedField && (
        <RecipientViewPetitionFieldCommentsDialog
          isOpen={Boolean(selectedField)}
          onClose={() => setSelectedFieldId(null)}
          field={selectedField}
          contactId={contact.id}
          granterName={granter.fullName}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onUpdateComment={handleUpdateComment}
        />
      )}
      <RecipientViewHelpModal {...helpModal} />
    </>
  );
}

type ConfirmStartSignatureProcessProps = {
  signers: Maybe<RecipientView_PublicContactFragment>[];
  contactId: string;
};

function ConfirmStartSignatureProcess({
  signers,
  contactId,
  ...props
}: DialogProps<ConfirmStartSignatureProcessProps>) {
  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      size="lg"
      header={
        <FormattedMessage
          id="petition.finalize-start-signature.header"
          defaultMessage="Sign petition"
        />
      }
      body={
        <>
          <FormattedMessage
            id="petition.finalize-start-signature.body-1"
            defaultMessage="This petition requires an eSignature in order to be completed."
          />
          <Spacer marginTop={2} />
          <FormattedMessage
            id="petition.finalize-start-signature.body-2"
            defaultMessage="After you click on <b>Continue with eSignature</b>, we will send an e-mail with information on how to complete the process to the following people:"
            values={{
              b: (chunks: any[]) => <b>{chunks}</b>,
            }}
          />
          <Spacer marginTop={4} />
          <UnorderedList>
            {signers.map((s, i) => {
              return (
                <ListItem key={i}>
                  {s?.fullName} {`<${s?.email}> `}
                </ListItem>
              );
            })}
          </UnorderedList>
        </>
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.continue-with-signature"
            defaultMessage="Continue with eSignature"
          />
        </Button>
      }
      {...props}
    />
  );
}

RecipientView.fragments = {
  get PublicPetitionAccess() {
    return gql`
      fragment RecipientView_PublicPetitionAccess on PublicPetitionAccess {
        petition {
          ...RecipientView_PublicPetition
        }
        granter {
          ...RecipientView_PublicUser
        }
        contact {
          id
        }
      }
      ${this.PublicPetition}
      ${this.PublicUser}
    `;
  },
  get PublicPetition() {
    return gql`
      fragment RecipientView_PublicPetition on PublicPetition {
        id
        status
        deadline
        hasCommentsEnabled
        isRecipientViewContentsHidden
        fields {
          ...RecipientView_PublicPetitionField
        }
        signers {
          ...RecipientView_PublicContact
        }
        ...RecipientViewContentsCard_PublicPetition
        ...RecipientViewProgressFooter_PublicPetition
      }

      ${this.PublicPetitionField}
      ${this.PublicContact}
      ${RecipientViewContentsCard.fragments.PublicPetition}
      ${RecipientViewProgressFooter.fragments.PublicPetition}
    `;
  },
  get PublicContact() {
    return gql`
      fragment RecipientView_PublicContact on PublicContact {
        id
        fullName
        email
      }
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientView_PublicPetitionField on PublicPetitionField {
        id
        ...RecipientViewPetitionField_PublicPetitionField
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
        ...RecipientViewContentsCard_PublicPetitionField
        ...RecipientViewProgressFooter_PublicPetitionField
      }
      ${RecipientViewPetitionField.fragments.PublicPetitionField}
      ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionField}
      ${RecipientViewContentsCard.fragments.PublicPetitionField}
      ${RecipientViewProgressFooter.fragments.PublicPetitionField}
    `;
  },
  get PublicUser() {
    return gql`
      fragment RecipientView_PublicUser on PublicUser {
        ...RecipientViewSenderCard_PublicUser
        ...RecipientViewContentsCard_PublicUser
      }
      ${RecipientViewSenderCard.fragments.PublicUser}
      ${RecipientViewContentsCard.fragments.PublicUser}
    `;
  },
};

RecipientView.mutations = [
  gql`
    mutation RecipientView_publicDeletePetitionReply(
      $replyId: GID!
      $keycode: ID!
    ) {
      publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
    }
  `,
  gql`
    mutation RecipientView_publicCreateTextReply(
      $keycode: ID!
      $fieldId: GID!
      $data: CreateTextReplyInput!
    ) {
      publicCreateTextReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
        ...RecipientViewPetitionField_PublicPetitionFieldReply
      }
    }
    ${RecipientViewPetitionField.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientView_publicCreateFileUploadReply(
      $keycode: ID!
      $fieldId: GID!
      $data: CreateFileUploadReplyInput!
    ) {
      publicCreateFileUploadReply(
        keycode: $keycode
        fieldId: $fieldId
        data: $data
      ) {
        endpoint
        reply {
          ...RecipientViewPetitionField_PublicPetitionFieldReply
        }
      }
    }
    ${RecipientViewPetitionField.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientView_publicCreateSelectReply(
      $keycode: ID!
      $fieldId: GID!
      $data: CreateTextReplyInput!
    ) {
      publicCreateSelectReply(
        keycode: $keycode
        fieldId: $fieldId
        data: $data
      ) {
        ...RecipientViewPetitionField_PublicPetitionFieldReply
      }
    }
    ${RecipientViewPetitionField.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientView_publicFileUploadReplyComplete(
      $keycode: ID!
      $replyId: GID!
    ) {
      publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
        id
        content
      }
    }
  `,
  gql`
    mutation RecipientView_publicCompletePetition($keycode: ID!) {
      publicCompletePetition(keycode: $keycode) {
        id
        status
      }
    }
  `,
  gql`
    mutation RecipientView_createPetitionFieldComment(
      $keycode: ID!
      $petitionFieldId: GID!
      $content: String!
    ) {
      publicCreatePetitionFieldComment(
        keycode: $keycode
        petitionFieldId: $petitionFieldId
        content: $content
      ) {
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
      }
    }
    ${RecipientViewPetitionFieldCommentsDialog.fragments
      .PublicPetitionFieldComment}
  `,
  gql`
    mutation RecipientView_updatePetitionFieldComment(
      $keycode: ID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
      $content: String!
    ) {
      publicUpdatePetitionFieldComment(
        keycode: $keycode
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
        content: $content
      ) {
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
      }
    }
    ${RecipientViewPetitionFieldCommentsDialog.fragments
      .PublicPetitionFieldComment}
  `,
  gql`
    mutation RecipientView_deletePetitionFieldComment(
      $keycode: ID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
    ) {
      publicDeletePetitionFieldComment(
        keycode: $keycode
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
      )
    }
  `,
  gql`
    mutation RecipientView_submitUnpublishedComments($keycode: ID!) {
      publicSubmitUnpublishedComments(keycode: $keycode) {
        id
        publishedAt
      }
    }
  `,
  gql`
    mutation RecipientView_markPetitionFieldCommentsAsRead(
      $keycode: ID!
      $petitionFieldCommentIds: [GID!]!
    ) {
      publicMarkPetitionFieldCommentsAsRead(
        keycode: $keycode
        petitionFieldCommentIds: $petitionFieldCommentIds
      ) {
        id
        isUnread
      }
    }
  `,
];

function useDeletePetitionReply() {
  const [mutate] = useRecipientView_publicDeletePetitionReplyMutation({
    optimisticResponse: { publicDeletePetitionReply: "SUCCESS" },
  });
  return useCallback(
    async function (
      keycode: string,
      petitionId: string,
      fieldId: string,
      replyId: string
    ) {
      return await mutate({
        variables: { replyId, keycode },
        update(client) {
          const fieldFragment = gql`
            fragment RecipientView_deletePetitionReply_PublicPetitionField on PublicPetitionField {
              replies {
                id
              }
            }
          `;
          const cachedField = client.readFragment<RecipientView_deletePetitionReply_PublicPetitionFieldFragment>(
            { id: fieldId, fragment: fieldFragment }
          );
          client.writeFragment<RecipientView_deletePetitionReply_PublicPetitionFieldFragment>(
            {
              id: fieldId,
              fragment: fieldFragment,
              data: {
                ...cachedField,
                replies: cachedField!.replies.filter(
                  ({ id }) => id !== replyId
                ),
              },
            }
          );
          const petitionFragment = gql`
            fragment RecipientView_deletePetitionReply_PublicPetition on PublicPetition {
              status
            }
          `;
          const cachedPetition = client.readFragment<RecipientView_deletePetitionReply_PublicPetitionFragment>(
            { id: petitionId, fragment: petitionFragment }
          );
          if (cachedPetition?.status === "COMPLETED") {
            client.writeFragment<RecipientView_deletePetitionReply_PublicPetitionFragment>(
              {
                id: petitionId,
                fragment: petitionFragment,
                data: {
                  ...cachedPetition,
                  status: "PENDING",
                },
              }
            );
          }
        },
      });
    },
    [mutate]
  );
}

function useCreateTextReply() {
  const [mutate] = useRecipientView_publicCreateTextReplyMutation();
  return useCallback(async function (
    keycode: string,
    petitionId: string,
    fieldId: string,
    data: CreateTextReplyInput
  ) {
    return await mutate({
      variables: { keycode, fieldId, data },
      update(client, { data }) {
        const fieldFragment = gql`
          fragment RecipientView_createTextReply_Field on PublicPetitionField {
            replies {
              id
            }
          }
        `;
        const reply = data!.publicCreateTextReply;
        const cachedField = client.readFragment<RecipientView_createTextReply_FieldFragment>(
          { id: fieldId, fragment: fieldFragment }
        );
        client.writeFragment<RecipientView_createTextReply_FieldFragment>({
          id: fieldId,
          fragment: fieldFragment,
          data: {
            __typename: "PublicPetitionField",
            replies: [
              ...cachedField!.replies,
              pick(reply, ["id", "__typename"]),
            ],
          },
        });
        const petitionFragment = gql`
          fragment RecipientView_createTextReply_PublicPetition on PublicPetition {
            status
          }
        `;
        const cachedPetition = client.readFragment<RecipientView_createTextReply_PublicPetitionFragment>(
          { id: petitionId, fragment: petitionFragment }
        );
        if (cachedPetition?.status === "COMPLETED") {
          client.writeFragment<RecipientView_createTextReply_PublicPetitionFragment>(
            {
              id: petitionId,
              fragment: petitionFragment,
              data: {
                status: "PENDING",
              },
            }
          );
        }
      },
    });
  },
  []);
}

function useCreateSelectReply() {
  const [mutate] = useRecipientView_publicCreateSelectReplyMutation();
  return useCallback(async function (
    keycode: string,
    petitionId: string,
    fieldId: string,
    data: CreateTextReplyInput // reusing TEXT input object
  ) {
    return await mutate({
      variables: { keycode, fieldId, data },
      update(client, { data }) {
        const fieldFragment = gql`
          fragment RecipientView_createSelectReply_Field on PublicPetitionField {
            replies {
              id
            }
          }
        `;
        const reply = data!.publicCreateSelectReply;
        const cachedField = client.readFragment<RecipientView_createSelectReply_FieldFragment>(
          { id: fieldId, fragment: fieldFragment }
        );
        client.writeFragment<RecipientView_createSelectReply_FieldFragment>({
          id: fieldId,
          fragment: fieldFragment,
          data: {
            __typename: "PublicPetitionField",
            replies: [
              ...cachedField!.replies,
              pick(reply, ["id", "__typename"]),
            ],
          },
        });
        const petitionFragment = gql`
          fragment RecipientView_createSelectReply_PublicPetition on PublicPetition {
            status
          }
        `;
        const cachedPetition = client.readFragment<RecipientView_createSelectReply_PublicPetitionFragment>(
          { id: petitionId, fragment: petitionFragment }
        );
        if (cachedPetition?.status === "COMPLETED") {
          client.writeFragment<RecipientView_createSelectReply_PublicPetitionFragment>(
            {
              id: petitionId,
              fragment: petitionFragment,
              data: {
                status: "PENDING",
              },
            }
          );
        }
      },
    });
  }, []);
}

function useCreateFileUploadReply() {
  const [mutate] = useRecipientView_publicCreateFileUploadReplyMutation();
  return useCallback(
    async function (
      keycode: string,
      petitionId: string,
      fieldId: string,
      data: CreateFileUploadReplyInput
    ) {
      return await mutate({
        variables: { keycode, fieldId, data },
        update(client, { data }) {
          const fieldFragment = gql`
            fragment RecipientView_createFileUploadReply_Field on PublicPetitionField {
              replies {
                id
              }
            }
          `;
          const { reply } = data!.publicCreateFileUploadReply;
          const cachedField = client.readFragment<RecipientView_createFileUploadReply_FieldFragment>(
            { id: fieldId, fragment: fieldFragment }
          );
          client.writeFragment<RecipientView_createFileUploadReply_FieldFragment>(
            {
              id: fieldId,
              fragment: fieldFragment,
              data: {
                __typename: "PublicPetitionField",
                replies: [
                  ...cachedField!.replies,
                  pick(reply, ["id", "__typename"]),
                ],
              },
            }
          );
          const petitionFragment = gql`
            fragment RecipientView_createFileUploadReply_PublicPetition on PublicPetition {
              status
            }
          `;
          const cachedPetition = client.readFragment<RecipientView_createFileUploadReply_PublicPetitionFragment>(
            { id: petitionId, fragment: petitionFragment }
          );
          if (cachedPetition?.status === "COMPLETED") {
            client.writeFragment<RecipientView_createFileUploadReply_PublicPetitionFragment>(
              {
                id: petitionId,
                fragment: petitionFragment,
                data: {
                  status: "PENDING",
                },
              }
            );
          }
        },
      });
    },
    [mutate]
  );
}

function useCreatePetitionFieldComment() {
  const [
    createPetitionFieldComment,
  ] = useRecipientView_createPetitionFieldCommentMutation();
  return useCallback(
    async (
      variables: RecipientView_createPetitionFieldCommentMutationVariables
    ) => {
      await createPetitionFieldComment({
        variables,
        update(client, { data }) {
          if (!data) {
            return;
          }
          const options = {
            fragment: gql`
              fragment RecipientView_createPetitionFieldComment_PublicPetitionField on PublicPetitionField {
                comments {
                  ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
                }
              }
              ${RecipientViewPetitionFieldCommentsDialog.fragments
                .PublicPetitionFieldComment}
            `,
            fragmentName:
              "RecipientView_createPetitionFieldComment_PublicPetitionField",
            id: variables.petitionFieldId,
          };
          const field = client.readFragment<RecipientView_createPetitionFieldComment_PublicPetitionFieldFragment>(
            options
          );
          client.writeFragment<RecipientView_createPetitionFieldComment_PublicPetitionFieldFragment>(
            {
              ...options,
              data: {
                ...field,
                comments: [
                  ...field!.comments,
                  data!.publicCreatePetitionFieldComment,
                ],
              },
            }
          );
        },
      });
    },
    [createPetitionFieldComment]
  );
}

function useUpdatePetitionFieldComment() {
  const [
    updatePetitionFieldComment,
  ] = useRecipientView_updatePetitionFieldCommentMutation();
  const apollo = useApolloClient();
  return useCallback(
    async (
      variables: RecipientView_updatePetitionFieldCommentMutationVariables
    ) => {
      await updatePetitionFieldComment({
        variables,
        optimisticResponse: () => {
          const comment = apollo.readFragment<RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment>(
            {
              fragment:
                RecipientViewPetitionFieldCommentsDialog.fragments
                  .PublicPetitionFieldComment,
              id: variables.petitionFieldCommentId,
            }
          );
          return {
            publicUpdatePetitionFieldComment: {
              ...comment!,
              content: variables.content,
            },
          };
        },
      });
    },
    [updatePetitionFieldComment]
  );
}

function useDeletePetitionFieldComment() {
  const [
    deletePetitionFieldComment,
  ] = useRecipientView_deletePetitionFieldCommentMutation();
  return useCallback(
    async (
      variables: RecipientView_deletePetitionFieldCommentMutationVariables
    ) => {
      await deletePetitionFieldComment({
        variables,
        update(client, { data }) {
          if (!data) {
            return;
          }
          const options = {
            fragment: gql`
              fragment RecipientView_deletePetitionFieldComment_PublicPetitionField on PublicPetitionField {
                comments {
                  id
                }
              }
            `,
            id: variables.petitionFieldId,
          };
          const field = client.readFragment<RecipientView_deletePetitionFieldComment_PublicPetitionFieldFragment>(
            options
          );
          client.writeFragment<RecipientView_deletePetitionFieldComment_PublicPetitionFieldFragment>(
            {
              ...options,
              data: {
                ...field,
                comments: field!.comments.filter(
                  (c) => c.id !== variables.petitionFieldCommentId
                ),
              },
            }
          );
        },
      });
    },
    [deletePetitionFieldComment]
  );
}

function useGetPageFields(
  fields: RecipientView_PublicPetitionFieldFragment[],
  page: number
) {
  return useMemo(() => {
    const fieldsByPage = groupFieldsByPages(fields);
    return { fields: fieldsByPage[page - 1], pages: fieldsByPage.length };
  }, [fields, page]);
}

function useHelpModal() {
  const { isOpen, onClose, onOpen } = useDisclosure();
  useEffect(() => {
    const key = "recipient-first-time-check";
    if (!window.localStorage.getItem(key)) {
      onOpen();
      window.localStorage.setItem(key, "check");
    }
  }, []);
  return { isOpen, onClose, onOpen };
}

RecipientView.getInitialProps = async ({
  req,
  query,
  pathname,
  apollo,
  fetchQuery,
}: WithApolloDataContext) => {
  const keycode = query.keycode as string;
  const page = parseInt(query.page as string);
  if (!Number.isInteger(page) || page <= 0) {
    throw new RedirectError(resolveUrl(pathname, { ...query, page: "1" }));
  }

  const result = await fetchQuery<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >(
    gql`
      query PublicPetition($keycode: ID!) {
        access(keycode: $keycode) {
          ...RecipientView_PublicPetitionAccess
        }
      }
      ${RecipientView.fragments.PublicPetitionAccess}
    `,
    { variables: { keycode } }
  );
  if (!result.data?.access?.petition) {
    throw new Error();
  }
  const pageCount =
    result.data.access.petition.fields.filter(
      (f) => f.type === "HEADING" && f.options!.hasPageBreak
    ).length + 1;
  if (page > pageCount) {
    throw new RedirectError(resolveUrl(pathname, { ...query, page: "1" }));
  }
  return { keycode, currentPage: page, pageCount };
};

export default compose(withDialogs, withApolloData)(RecipientView);
