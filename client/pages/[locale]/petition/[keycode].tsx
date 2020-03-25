import { useMutation } from "@apollo/react-hooks";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  CloseButton,
  Flex,
  Heading,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import { Title } from "@parallel/components/common/Title";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  CreateFileUploadReplyInput,
  CreateTextReplyInput,
  PublicPetitionQuery,
  PublicPetitionQueryVariables,
  PublicPetition_createFileUploadReply_FieldFragment,
  PublicPetition_createTextReply_FieldFragment,
  PublicPetition_createTextReply_PublicPetitionFragment,
  PublicPetition_deletePetitionReply_PublicPetitionFieldFragment,
  PublicPetition_deletePetitionReply_PublicPetitionFragment,
  PublicPetition_publicCompletePetitionMutation,
  PublicPetition_publicCompletePetitionMutationVariables,
  PublicPetition_publicCreateFileUploadReplyMutation,
  PublicPetition_publicCreateFileUploadReplyMutationVariables,
  PublicPetition_publicCreateTextReplyMutation,
  PublicPetition_publicCreateTextReplyMutationVariables,
  PublicPetition_publicDeletePetitionReplyMutation,
  PublicPetition_publicDeletePetitionReplyMutationVariables,
  PublicPetition_publicFileUploadReplyCompleteMutation,
  PublicPetition_publicFileUploadReplyCompleteMutationVariables,
} from "@parallel/graphql/__types";
import { RenderSlate } from "@parallel/utils/RenderSlate";
import { UnwrapPromise } from "@parallel/utils/types";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import axios, { CancelTokenSource } from "axios";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit, pick } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import {
  CreateReply,
  PublicPetitionField,
} from "../../../components/petition/PublicPetitionField";

type PublicPetitionProps = UnwrapPromise<
  ReturnType<typeof PublicPetition.getInitialProps>
>;

function PublicPetition({ keycode }: PublicPetitionProps) {
  const intl = useIntl();
  const { sendout } = useQueryData<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >(GET_PUBLIC_PETITION_DATA, { variables: { keycode } });
  const petition = sendout!.petition!;
  const sender = sendout!.sender!;
  const [showCompletedAlert, setShowCompletedAlert] = useState(true);
  const deletePetitionReply = useDeletePetitionReply();
  const createTextReply = useCreateTextReply();
  const createFileUploadReply = useCreateFileUploadReply();
  const [fileUploadReplyComplete] = useFileUploadReplyComplete();
  const [completePetition] = useCompletePetition();
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
                [fieldId]: omit(curr[fieldId], [reply.id]),
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

  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = useCallback(
    async function () {
      setSubmitted(true);
      if (allCompleted) {
        await completePetition({ variables: { keycode } });
        toast({
          title: intl.formatMessage({
            id: "sendout.completed-petition.toast-title",
            defaultMessage: "Petition completed!",
          }),
          description: intl.formatMessage(
            {
              id: "sendout.completed-petition.toast-description",
              defaultMessage:
                "You have completed this petition and {name} will be notified",
            },
            { name: sender.firstName }
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
    [petition.fields, sender]
  );

  return (
    <>
      <Title>{petition.emailSubject}</Title>
      <Box backgroundColor="gray.50">
        {showCompletedAlert && petition.status === "COMPLETED" ? (
          <Alert status="success" variant="subtle">
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
                  id="sendout.petition-completed-alert"
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
          flexDirection="row"
          maxWidth="containers.lg"
          marginX="auto"
          paddingX={4}
        >
          <Flex flex="2" flexDirection="column">
            <Box marginY={8}>
              <Logo width={152}></Logo>
            </Box>
            <Card
              padding={4}
              backgroundColor="transparent"
              shadow="none"
              rounded="md"
              marginBottom={8}
            >
              <Text marginBottom={2}>
                <FormattedMessage
                  id="sendout.sender-message"
                  defaultMessage="<b>{name}</b> sent you this petition:"
                  values={{
                    name: sender.fullName,
                    b: (...chunks: any[]) => <b>{chunks}</b>,
                  }}
                />
              </Text>
              <RenderSlate
                value={petition?.emailBody}
                fontSize="md"
                marginLeft={4}
              />
            </Card>
            <Stack spacing={4} marginBottom={8}>
              {petition.fields.map((field) => (
                <PublicPetitionField
                  id={`field-${field.id}`}
                  field={field}
                  key={field.id}
                  isInvalid={submitted && !completed[field.id]}
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
            <Button
              variantColor="purple"
              isDisabled={petition.status === "COMPLETED"}
              onClick={handleSubmit}
              display={{ base: "block", md: "none" }}
              marginBottom={8}
            >
              <FormattedMessage
                id="sendout.submit-button"
                defaultMessage="Submit and notify {name}"
                values={{ name: sender.firstName }}
              />
            </Button>
          </Flex>
          <Box flex="1" marginLeft={8} display={{ base: "none", md: "block" }}>
            <Flex
              flexDirection="column"
              position="sticky"
              top={0}
              minHeight="100vh"
            >
              <Card marginTop={{ base: 0, md: "94px" }}>
                <Box backgroundColor="purple.500" roundedTop="sm" padding={4}>
                  <Heading as="h2" fontSize="lg" color="white">
                    <FormattedMessage
                      id="sendout.first-time-header"
                      defaultMessage="Is this your first time using Parallel?"
                    />
                  </Heading>
                </Box>
                <Stack padding={4} spacing={4}>
                  <Text>
                    <FormattedMessage
                      id="sendout.first-time-p1"
                      defaultMessage="Don't worry, it's very simple. To complete this petition you need to fill each of the fields on the left."
                    />
                  </Text>
                  <Text fontWeight="bold">
                    <FormattedMessage
                      id="sendout.first-time-p2"
                      defaultMessage="Make sure you have upload all the requested files before submitting."
                    />
                  </Text>
                  <Text>
                    <FormattedMessage
                      id="sendout.first-time-p3"
                      defaultMessage="If you accidentally make any mistakes, you will be able to come back and make any amends necessary."
                    />
                  </Text>
                  <Button
                    variantColor="purple"
                    isDisabled={petition.status === "COMPLETED"}
                    onClick={handleSubmit}
                  >
                    <FormattedMessage
                      id="sendout.submit-button"
                      defaultMessage="Submit and notify {name}"
                      values={{ name: sender.firstName }}
                    />
                  </Button>
                </Stack>
              </Card>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </>
  );
}

PublicPetition.fragments = {
  publicPetition: gql`
    fragment PublicPetition_PublicPetition on PublicPetition {
      id
      status
      deadline
      emailSubject
      emailBody
    }
  `,
  publicUser: gql`
    fragment PublicPetition_PublicUser on PublicUser {
      id
      firstName
      fullName
    }
  `,
};

const GET_PUBLIC_PETITION_DATA = gql`
  query PublicPetition($keycode: ID!) {
    sendout(keycode: $keycode) {
      petition {
        ...PublicPetition_PublicPetition
        fields {
          id
          ...PublicPetitionField_PublicPetitionField
        }
      }
      sender {
        ...PublicPetition_PublicUser
      }
    }
  }
  ${PublicPetition.fragments.publicPetition}
  ${PublicPetition.fragments.publicUser}
  ${PublicPetitionField.fragments.publicPetitionField}
`;

function useDeletePetitionReply() {
  const [mutate] = useMutation<
    PublicPetition_publicDeletePetitionReplyMutation,
    PublicPetition_publicDeletePetitionReplyMutationVariables
  >(
    gql`
      mutation PublicPetition_publicDeletePetitionReply(
        $replyId: ID!
        $keycode: ID!
      ) {
        publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
      }
    `,
    {
      optimisticResponse: { publicDeletePetitionReply: "SUCCESS" },
    }
  );
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
            fragment PublicPetition_deletePetitionReply_PublicPetitionField on PublicPetitionField {
              replies {
                id
              }
            }
          `;
          const cachedField = client.readFragment<
            PublicPetition_deletePetitionReply_PublicPetitionFieldFragment
          >({ id: fieldId, fragment: fieldFragment });
          client.writeFragment<
            PublicPetition_deletePetitionReply_PublicPetitionFieldFragment
          >({
            id: fieldId,
            fragment: fieldFragment,
            data: {
              ...cachedField,
              replies: cachedField!.replies.filter(({ id }) => id !== replyId),
            },
          });
          const petitionFragment = gql`
            fragment PublicPetition_deletePetitionReply_PublicPetition on PublicPetition {
              status
            }
          `;
          const cachedPetition = client.readFragment<
            PublicPetition_deletePetitionReply_PublicPetitionFragment
          >({ id: petitionId, fragment: petitionFragment });
          if (cachedPetition?.status === "COMPLETED") {
            client.writeFragment<
              PublicPetition_deletePetitionReply_PublicPetitionFragment
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
  const [mutate] = useMutation<
    PublicPetition_publicCreateTextReplyMutation,
    PublicPetition_publicCreateTextReplyMutationVariables
  >(
    gql`
      mutation PublicPetition_publicCreateTextReply(
        $keycode: ID!
        $fieldId: ID!
        $data: CreateTextReplyInput!
      ) {
        publicCreateTextReply(
          keycode: $keycode
          fieldId: $fieldId
          data: $data
        ) {
          id
          publicContent
          createdAt
        }
      }
    `
  );
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
          fragment PublicPetition_createTextReply_Field on PublicPetitionField {
            replies {
              id
            }
          }
        `;
        const reply = data!.publicCreateTextReply;
        const cachedField = client.readFragment<
          PublicPetition_createTextReply_FieldFragment
        >({ id: fieldId, fragment: fieldFragment });
        client.writeFragment<PublicPetition_createTextReply_FieldFragment>({
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
          fragment PublicPetition_createTextReply_PublicPetition on PublicPetition {
            status
          }
        `;
        const cachedPetition = client.readFragment<
          PublicPetition_createTextReply_PublicPetitionFragment
        >({ id: petitionId, fragment: petitionFragment });
        if (cachedPetition?.status === "COMPLETED") {
          client.writeFragment<
            PublicPetition_createTextReply_PublicPetitionFragment
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
  const [mutate] = useMutation<
    PublicPetition_publicCreateFileUploadReplyMutation,
    PublicPetition_publicCreateFileUploadReplyMutationVariables
  >(
    gql`
      mutation PublicPetition_publicCreateFileUploadReply(
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
    `
  );
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
            fragment PublicPetition_createFileUploadReply_Field on PublicPetitionField {
              replies {
                id
              }
            }
          `;
          const { reply } = data!.publicCreateFileUploadReply;
          const cachedField = client.readFragment<
            PublicPetition_createFileUploadReply_FieldFragment
          >({ id: fieldId, fragment: fieldFragment });
          client.writeFragment<
            PublicPetition_createFileUploadReply_FieldFragment
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
            fragment PublicPetition_createTextReply_PublicPetition on PublicPetition {
              status
            }
          `;
          const cachedPetition = client.readFragment<
            PublicPetition_createTextReply_PublicPetitionFragment
          >({ id: petitionId, fragment: petitionFragment });
          if (cachedPetition?.status === "COMPLETED") {
            client.writeFragment<
              PublicPetition_createTextReply_PublicPetitionFragment
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

function useFileUploadReplyComplete() {
  return useMutation<
    PublicPetition_publicFileUploadReplyCompleteMutation,
    PublicPetition_publicFileUploadReplyCompleteMutationVariables
  >(
    gql`
      mutation PublicPetition_publicFileUploadReplyComplete(
        $keycode: ID!
        $replyId: ID!
      ) {
        publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
          id
          publicContent
        }
      }
    `
  );
}

function useCompletePetition() {
  return useMutation<
    PublicPetition_publicCompletePetitionMutation,
    PublicPetition_publicCompletePetitionMutationVariables
  >(
    gql`
      mutation PublicPetition_publicCompletePetition($keycode: ID!) {
        publicCompletePetition(keycode: $keycode) {
          id
          status
        }
      }
    `
  );
}

PublicPetition.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  const keycode = query.keycode as string;
  await apollo.query<PublicPetitionQuery, PublicPetitionQueryVariables>({
    query: GET_PUBLIC_PETITION_DATA,
    variables: { keycode },
  });
  return { keycode };
};

export default withData(PublicPetition);
