import { gql, useApolloClient } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  CloseButton,
  Flex,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/core";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { RecipientViewPetitionFieldCommentsDialog } from "@parallel/components/recipient-view/RecipientViewPetitionFieldCommentsDialog";
import { RecipientViewProgressCard } from "@parallel/components/recipient-view/RecipientViewProgressCard";
import { RecipientViewSenderCard } from "@parallel/components/recipient-view/RecipientViewSenderCard";
import RecipientViewSideLinks from "@parallel/components/recipient-view/RecipientViewSideLinks";
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
  RecipientView_createTextReply_FieldFragment,
  RecipientView_createTextReply_PublicPetitionFragment,
  RecipientView_deletePetitionFieldCommentMutationVariables,
  RecipientView_deletePetitionFieldComment_PublicPetitionFieldFragment,
  RecipientView_deletePetitionReply_PublicPetitionFieldFragment,
  RecipientView_deletePetitionReply_PublicPetitionFragment,
  RecipientView_updatePetitionFieldCommentMutationVariables,
  usePublicPetitionQuery,
  useRecipientView_createPetitionFieldCommentMutation,
  useRecipientView_deletePetitionFieldCommentMutation,
  useRecipientView_markPetitionFieldCommentsAsReadMutation,
  useRecipientView_publicCompletePetitionMutation,
  useRecipientView_publicCreateFileUploadReplyMutation,
  useRecipientView_publicCreateTextReplyMutation,
  useRecipientView_publicDeletePetitionReplyMutation,
  useRecipientView_publicFileUploadReplyCompleteMutation,
  useRecipientView_submitUnpublishedCommentsMutation,
  useRecipientView_updatePetitionFieldCommentMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import axios, { CancelTokenSource } from "axios";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit, pick } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import {
  CreateReply,
  RecipientViewPetitionField,
} from "../../../components/recipient-view/RecipientViewPetitionField";
import Head from "next/head";

type PublicPetitionProps = UnwrapPromise<
  ReturnType<typeof RecipientView.getInitialProps>
>;

function RecipientView({ keycode }: PublicPetitionProps) {
  const intl = useIntl();
  const {
    data: { access },
  } = assertQuery(usePublicPetitionQuery({ variables: { keycode } }));
  const petition = access!.petition!;
  const granter = access!.granter!;
  const contact = access!.contact!;
  const [showCompletedAlert, setShowCompletedAlert] = useState(true);
  const deletePetitionReply = useDeletePetitionReply();
  const createTextReply = useCreateTextReply();
  const createFileUploadReply = useCreateFileUploadReply();
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
            try {
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
            } catch {}
          }
          break;
        case "TEXT":
          await createTextReply(keycode, petition.id, fieldId, {
            text: payload.content,
          });
          break;
      }
    },
    [keycode, petition.id]
  );

  const [finalized, setFinalized] = useState(false);

  const handleFinalize = useCallback(
    async function () {
      setFinalized(true);
      const canFinalize = petition.fields.every(
        (f) => f.optional || f.replies.length > 0
      );
      if (canFinalize) {
        await completePetition({ variables: { keycode } });
        toast({
          title: intl.formatMessage({
            id: "recipient-view.completed-petition.toast-title",
            defaultMessage: "Petition completed!",
          }),
          description: intl.formatMessage(
            {
              id: "recipient-view.completed-petition.toast-description",
              defaultMessage:
                "You have completed this petition and {name} will be notified",
            },
            { name: granter.firstName }
          ),
          status: "success",
          isClosable: true,
        });
      } else {
        // Scroll to first field without replies
        const field = petition.fields.find(
          (f) => f.replies.length === 0 && !f.optional
        )!;
        const node = document.querySelector(`#field-${field.id}`)!;
        scrollIntoView(node);
      }
    },
    [petition.fields, granter]
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
    (acc, f) => acc + f.comments.filter((c) => !c.publishedAt).length,
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
        await markPetitionFieldCommentsAsRead({
          variables: {
            keycode,
            petitionFieldCommentIds: selectedField!.comments
              .filter((c) => c.isUnread)
              .map((c) => c.id),
          },
        });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [selectedFieldId]);

  const breakpoint = "md";
  return (
    <>
      <Head>
        <title>Parallel</title>
      </Head>
      <Box position="sticky" top={0} zIndex={2}>
        {showCompletedAlert && petition.status === "COMPLETED" ? (
          <Alert status="success" variant="subtle" zIndex={2}>
            <Flex
              maxWidth="containers.lg"
              alignItems="center"
              marginX="auto"
              width="100%"
              paddingLeft={4}
              paddingRight={12}
            >
              <AlertIcon />
              <AlertDescription>
                <FormattedMessage
                  id="recipient-view.petition-completed-alert"
                  defaultMessage="This petition has been completed. If you want to make any changes don't forget to hit the submit button again."
                />
              </AlertDescription>
            </Flex>
            <CloseButton
              position="absolute"
              right="8px"
              top="8px"
              onClick={() => setShowCompletedAlert(false)}
            />
          </Alert>
        ) : null}
        {pendingComments ? (
          <Box backgroundColor="yellow.100" shadow="sm">
            <Flex
              maxWidth="containers.lg"
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
      </Box>
      <Flex
        backgroundColor="gray.50"
        minHeight="100vh"
        zIndex={1}
        flexDirection="column"
        alignItems="center"
      >
        <Flex
          flexDirection={{ base: "column", [breakpoint]: "row" }}
          width="100%"
          maxWidth="containers.lg"
          paddingX={4}
          paddingTop={8}
          marginBottom={4}
        >
          <Box
            flex="1"
            marginRight={{ base: 0, [breakpoint]: 4 }}
            marginBottom={4}
          >
            <Box position="sticky" top={8}>
              <RecipientViewSenderCard sender={granter} marginBottom={4} />
              <RecipientViewProgressCard
                sender={granter}
                petition={petition}
                onFinalize={handleFinalize}
                display={{ base: "none", [breakpoint]: "flex" }}
                marginBottom={4}
              />
              <RecipientViewSideLinks
                display={{ base: "none", [breakpoint]: "block" }}
              />
            </Box>
          </Box>
          <Stack flex="2" spacing={4}>
            {petition.fields.map((field) => (
              <RecipientViewPetitionField
                key={field.id}
                id={`field-${field.id}`}
                field={field}
                isInvalid={
                  finalized && field.replies.length === 0 && !field.optional
                }
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
        </Flex>
        <RecipientViewSideLinks
          textAlign="center"
          display={{ base: "block", [breakpoint]: "none" }}
        />
        <Spacer />
        <Flex
          as="footer"
          justifyContent="center"
          paddingTop={4}
          paddingBottom={8}
        >
          <Flex flexDirection="column" alignItems="center">
            <Text as="span" fontSize="sm" marginBottom={2}>
              <FormattedMessage
                id="recipient-view.powered-by"
                defaultMessage="Powered by"
              />
            </Text>
            <NakedLink href="/" passHref>
              <Box as="a">
                <Logo width={100} />
              </Box>
            </NakedLink>
          </Flex>
        </Flex>
        <RecipientViewProgressCard
          width="100%"
          sender={granter}
          petition={petition}
          onFinalize={handleFinalize}
          isStickyFooter
          display={{ base: "flex", [breakpoint]: "none" }}
        />
      </Flex>
      {selectedField ? (
        <RecipientViewPetitionFieldCommentsDialog
          field={selectedField}
          contactId={contact.id}
          onClose={() => setSelectedFieldId(null)}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onUpdateComment={handleUpdateComment}
        />
      ) : null}
    </>
  );
}

RecipientView.fragments = {
  PublicPetition: gql`
    fragment RecipientView_PublicPetition on PublicPetition {
      id
      status
      deadline
      fields {
        id
        ...RecipientViewPetitionField_PublicPetitionField
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
      }
    }
    ${RecipientViewPetitionField.fragments.PublicPetitionField}
    ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionField}
  `,
  PublicUser: gql`
    fragment RecipientView_PublicUser on PublicUser {
      ...RecipientViewSenderCard_PublicUser
      ...RecipientViewProgressCard_PublicUser
    }
    ${RecipientViewSenderCard.fragments.PublicUser}
    ${RecipientViewProgressCard.fragments.PublicUser}
  `,
};

RecipientView.mutations = [
  gql`
    mutation RecipientView_publicDeletePetitionReply(
      $replyId: ID!
      $keycode: ID!
    ) {
      publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
    }
  `,
  gql`
    mutation RecipientView_publicCreateTextReply(
      $keycode: ID!
      $fieldId: ID!
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
      $fieldId: ID!
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
    mutation RecipientView_publicFileUploadReplyComplete(
      $keycode: ID!
      $replyId: ID!
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
      $petitionFieldId: ID!
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
      $petitionFieldId: ID!
      $petitionFieldCommentId: ID!
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
      $petitionFieldId: ID!
      $petitionFieldCommentId: ID!
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
      $petitionFieldCommentIds: [ID!]!
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
          const cachedField = client.readFragment<
            RecipientView_deletePetitionReply_PublicPetitionFieldFragment
          >({ id: fieldId, fragment: fieldFragment });
          client.writeFragment<
            RecipientView_deletePetitionReply_PublicPetitionFieldFragment
          >({
            id: fieldId,
            fragment: fieldFragment,
            data: {
              ...cachedField,
              replies: cachedField!.replies.filter(({ id }) => id !== replyId),
            },
          });
          const petitionFragment = gql`
            fragment RecipientView_deletePetitionReply_PublicPetition on PublicPetition {
              status
            }
          `;
          const cachedPetition = client.readFragment<
            RecipientView_deletePetitionReply_PublicPetitionFragment
          >({ id: petitionId, fragment: petitionFragment });
          if (cachedPetition?.status === "COMPLETED") {
            client.writeFragment<
              RecipientView_deletePetitionReply_PublicPetitionFragment
            >({
              id: petitionId,
              fragment: petitionFragment,
              data: {
                ...cachedPetition,
                status: "PENDING",
              },
            });
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
        const cachedField = client.readFragment<
          RecipientView_createTextReply_FieldFragment
        >({ id: fieldId, fragment: fieldFragment });
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
        const cachedPetition = client.readFragment<
          RecipientView_createTextReply_PublicPetitionFragment
        >({ id: petitionId, fragment: petitionFragment });
        if (cachedPetition?.status === "COMPLETED") {
          client.writeFragment<
            RecipientView_createTextReply_PublicPetitionFragment
          >({
            id: petitionId,
            fragment: petitionFragment,
            data: {
              status: "PENDING",
            },
          });
        }
      },
    });
  },
  []);
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
          const cachedField = client.readFragment<
            RecipientView_createFileUploadReply_FieldFragment
          >({ id: fieldId, fragment: fieldFragment });
          client.writeFragment<
            RecipientView_createFileUploadReply_FieldFragment
          >({
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
            fragment RecipientView_createFileUploadReply_PublicPetition on PublicPetition {
              status
            }
          `;
          const cachedPetition = client.readFragment<
            RecipientView_createFileUploadReply_PublicPetitionFragment
          >({ id: petitionId, fragment: petitionFragment });
          if (cachedPetition?.status === "COMPLETED") {
            client.writeFragment<
              RecipientView_createFileUploadReply_PublicPetitionFragment
            >({
              id: petitionId,
              fragment: petitionFragment,
              data: {
                status: "PENDING",
              },
            });
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
          const field = client.readFragment<
            RecipientView_createPetitionFieldComment_PublicPetitionFieldFragment
          >(options);
          client.writeFragment<
            RecipientView_createPetitionFieldComment_PublicPetitionFieldFragment
          >({
            ...options,
            data: {
              ...field,
              comments: [
                ...field!.comments,
                data!.publicCreatePetitionFieldComment,
              ],
            },
          });
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
          const comment = apollo.readFragment<
            RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment
          >({
            fragment:
              RecipientViewPetitionFieldCommentsDialog.fragments
                .PublicPetitionFieldComment,
            id: variables.petitionFieldCommentId,
          });
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
          const field = client.readFragment<
            RecipientView_deletePetitionFieldComment_PublicPetitionFieldFragment
          >(options);
          client.writeFragment<
            RecipientView_deletePetitionFieldComment_PublicPetitionFieldFragment
          >({
            ...options,
            data: {
              ...field,
              comments: field!.comments.filter(
                (c) => c.id !== variables.petitionFieldCommentId
              ),
            },
          });
        },
      });
    },
    [deletePetitionFieldComment]
  );
}

RecipientView.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const keycode = query.keycode as string;
  await fetchQuery<PublicPetitionQuery, PublicPetitionQueryVariables>(
    gql`
      query PublicPetition($keycode: ID!) {
        access(keycode: $keycode) {
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
      }
      ${RecipientView.fragments.PublicPetition}
      ${RecipientView.fragments.PublicUser}
    `,
    {
      variables: { keycode },
    }
  );
  return { keycode };
};

export default withApolloData(RecipientView);
