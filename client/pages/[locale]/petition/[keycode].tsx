import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  CloseButton,
  Flex,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/core";
import { Logo } from "@parallel/components/common/Logo";
import {
  withApolloData,
  WithDataContext,
} from "@parallel/components/common/withApolloData";
import { RecipientViewProgressCard } from "@parallel/components/recipient-view/RecipientViewProgressCard";
import { RecipientViewSenderCard } from "@parallel/components/recipient-view/RecipientViewSenderCard";
import {
  CreateFileUploadReplyInput,
  CreateTextReplyInput,
  PublicPetitionQuery,
  PublicPetitionQueryVariables,
  RecipientView_createFileUploadReply_FieldFragment,
  RecipientView_createFileUploadReply_PublicPetitionFragment,
  RecipientView_createTextReply_FieldFragment,
  RecipientView_createTextReply_PublicPetitionFragment,
  RecipientView_deletePetitionReply_PublicPetitionFieldFragment,
  RecipientView_deletePetitionReply_PublicPetitionFragment,
  usePublicPetitionQuery,
  useRecipientView_publicCompletePetitionMutation,
  useRecipientView_publicCreateFileUploadReplyMutation,
  useRecipientView_publicCreateTextReplyMutation,
  useRecipientView_publicDeletePetitionReplyMutation,
  useRecipientView_publicFileUploadReplyCompleteMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { UnwrapPromise } from "@parallel/utils/types";
import { gql } from "apollo-boost";
import axios, { CancelTokenSource } from "axios";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit, pick } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import {
  CreateReply,
  RecipientViewPetitionField,
} from "../../../components/recipient-view/RecipientViewPetitionField";
import RecipientViewSideLinks from "@parallel/components/recipient-view/RecipientViewSideLinks";
import { Spacer } from "@parallel/components/common/Spacer";

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
  const { allCompleted, completed } = useMemo(() => {
    const fields: [string, boolean][] = petition.fields.map((f) => [
      f.id,
      f.optional || f.replies.length > 0,
    ]);
    return {
      allCompleted: fields.every(([_, completed]) => completed),
      completed: Object.fromEntries(fields),
    };
  }, [petition.fields]);

  const handleFinalize = useCallback(
    async function () {
      setFinalized(true);
      if (allCompleted) {
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
        const field = petition.fields.find((f) => !completed[f.id])!;
        const node = document.querySelector(`#field-${field.id}`)!;
        scrollIntoView(node);
      }
    },
    [petition.fields, granter]
  );

  const breakpoint = "md";
  return (
    <>
      {showCompletedAlert && petition.status === "COMPLETED" ? (
        <Alert
          status="success"
          variant="subtle"
          position="sticky"
          top="0"
          zIndex={2}
        >
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
                id={`field-${field.id}`}
                field={field}
                key={field.id}
                isInvalid={finalized && !completed[field.id]}
                uploadProgress={uploadProgress[field.id]}
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
        <Flex as="footer" justifyContent="center" paddingY={4}>
          <Flex flexDirection="column" alignItems="center">
            <Text as="span" fontSize="sm" marginBottom={2}>
              <FormattedMessage
                id="recipient-view.powered-by"
                defaultMessage="Powered by"
              />
            </Text>
            <Logo width={100} />
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
      }
    }
    ${RecipientViewPetitionField.fragments.PublicPetitionField}
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
        id
        publicContent
        createdAt
      }
    }
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
          id
          publicContent
          createdAt
        }
      }
    }
  `,
  gql`
    mutation RecipientView_publicFileUploadReplyComplete(
      $keycode: ID!
      $replyId: ID!
    ) {
      publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
        id
        publicContent
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

RecipientView.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  const keycode = query.keycode as string;
  await apollo.query<PublicPetitionQuery, PublicPetitionQueryVariables>({
    query: gql`
      query PublicPetition($keycode: ID!) {
        access(keycode: $keycode) {
          petition {
            ...RecipientView_PublicPetition
          }
          granter {
            ...RecipientView_PublicUser
          }
        }
      }
      ${RecipientView.fragments.PublicPetition}
      ${RecipientView.fragments.PublicUser}
    `,
    variables: { keycode },
  });
  return { keycode };
};

export default withApolloData(RecipientView);
