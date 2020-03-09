import {
  useLazyQuery,
  useMutation,
  useApolloClient
} from "@apollo/react-hooks";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  IconButtonProps,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Stack
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { CollapseCard } from "@parallel/components/common/CollapseCard";
import { DateTimeInput } from "@parallel/components/common/DatetimeInput";
import { Divider } from "@parallel/components/common/Divider";
import { RecipientSelect } from "@parallel/components/common/RecipientSelect";
import {
  isEmptyContent,
  RichTextEditor,
  RichTextEditorContent
} from "@parallel/components/common/RichTextEditor";
import { Spacer } from "@parallel/components/common/Spacer";
import { SplitButton } from "@parallel/components/common/SplitButton";
import { Title } from "@parallel/components/common/Title";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  PetitionLocale,
  PetitionSendQuery,
  PetitionSendQueryVariables,
  PetitionSendSearchContactsQuery,
  PetitionSendSearchContactsQueryVariables,
  PetitionSendUserQuery,
  PetitionSend_updatePetitionMutation,
  PetitionSend_updatePetitionMutationVariables,
  UpdatePetitionInput
} from "@parallel/graphql/__types";
import {
  usePetitionState,
  useWrapPetitionUpdater
} from "@parallel/utils/petitions";
import { UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import { ChangeEvent, ReactNode, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";

type PetitionProps = UnwrapPromise<
  ReturnType<typeof PetitionSend.getInitialProps>
>;

function PetitionSend({ petitionId }: PetitionProps) {
  const intl = useIntl();
  const { me } = useQueryData<PetitionSendUserQuery>(
    GET_PETITION_SEND_USER_DATA
  );
  const { petition } = useQueryData<
    PetitionSendQuery,
    PetitionSendQueryVariables
  >(GET_PETITION_SEND_DATA, { variables: { id: petitionId } });

  const [subject, setSubject] = useState(petition!.emailSubject ?? "");
  const [body, setBody] = useState<RichTextEditorContent>(
    petition!.emailBody ?? [{ children: [{ text: "" }] }]
  );

  const [state, setState] = usePetitionState();
  const wrapper = useWrapPetitionUpdater(setState);
  const [_updatePetition] = useUpdatePetition();

  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await _updatePetition({ variables: { id: petitionId, data } });
    }),
    [petitionId]
  );
  const updateSubject = useDebouncedCallback(handleUpdatePetition, 500, []);
  const updateBody = useDebouncedCallback(handleUpdatePetition, 500, []);
  const updateDeadline = useDebouncedCallback(handleUpdatePetition, 500, []);

  const handleSubjectChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSubject(event.target.value);
      updateSubject({ emailSubject: event.target.value || null });
    },
    []
  );

  const handleLocaleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      handleUpdatePetition({
        locale: event.target.value as PetitionLocale
      });
    },
    []
  );

  const handleDeadlineChange = useCallback((value: Date | null) => {
    updateDeadline({ deadline: value ? value.toISOString() : null });
  }, []);

  const handleBodyChange = useCallback((value: RichTextEditorContent) => {
    setBody(value);
    updateBody({ emailBody: isEmptyContent(value) ? null : value });
  }, []);

  const searchContacts = useSearchContacts();

  return (
    <>
      <Title>
        {petition!.name ||
          intl.formatMessage({
            id: "generic.untitled-petition",
            defaultMessage: "Untitled petition"
          })}
      </Title>
      <PetitionLayout
        user={me}
        petition={petition!}
        onUpdatePetition={handleUpdatePetition}
        section="send"
        state={state}
      >
        <Flex flexDirection={{ base: "column", md: "row" }} padding={4}>
          <Box
            flex={{ base: "auto", md: 2 }}
            marginRight={{ base: 0, md: 4 }}
            marginBottom={{ base: 4, md: 0 }}
          >
            <Card padding={4}>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel
                    htmlFor="petition-recipients"
                    paddingBottom={0}
                    minWidth="120px"
                  >
                    <FormattedMessage
                      id="petition.recipients-label"
                      defaultMessage="Recipients"
                    />
                  </FormLabel>
                  <RecipientSelect
                    inputId="petition-recipients"
                    searchContacts={searchContacts}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel
                    htmlFor="petition-subject"
                    paddingBottom={0}
                    minWidth="120px"
                  >
                    <FormattedMessage
                      id="petition.subject-label"
                      defaultMessage="Subject"
                    />
                  </FormLabel>
                  <Input
                    id="petition-subject"
                    type="text"
                    value={subject ?? ""}
                    placeholder={intl.formatMessage({
                      id: "petition.subject-placeholder",
                      defaultMessage: "Enter the subject of the email"
                    })}
                    onChange={handleSubjectChange}
                  ></Input>
                </FormControl>
                <Box marginTop={2}>
                  <RichTextEditor
                    placeholder={intl.formatMessage({
                      id: "petition.body-placeholder",
                      defaultMessage: "Write a message to include in the email"
                    })}
                    value={body}
                    onChange={handleBodyChange}
                    style={{ minHeight: "100px" }}
                  ></RichTextEditor>
                </Box>
                <Flex>
                  <Spacer />
                  <SplitButton dividerColor="purple.600">
                    <Button
                      variantColor="purple"
                      leftIcon={"paper-plane" as any}
                    >
                      <FormattedMessage
                        id="petition.send-button"
                        defaultMessage="Send"
                      />
                    </Button>
                    <IconButtonMenu
                      variantColor="purple"
                      icon="chevron-down"
                      aria-label="Options"
                    >
                      <MenuItem>
                        <Icon name="time" marginRight={2} />
                        <FormattedMessage
                          id="petition.schedule-send-button"
                          defaultMessage="Schedule send"
                        />
                      </MenuItem>
                    </IconButtonMenu>
                  </SplitButton>
                </Flex>
              </Stack>
            </Card>
          </Box>
          <Box flex={{ base: "auto", md: 1 }}>
            <CollapseCard
              header={
                <Heading size="sm">
                  <FormattedMessage
                    id="petition.advanced-settings"
                    defaultMessage="Advanced settings"
                  />
                </Heading>
              }
            >
              <Stack padding={4} paddingTop={0} spacing={4}>
                <Divider />
                <FormControl>
                  <FormLabel htmlFor="petition-locale">
                    <FormattedMessage
                      id="petition.locale-label"
                      defaultMessage="Language"
                    />
                  </FormLabel>
                  <Select
                    id="petition-locale"
                    value={petition!.locale}
                    onChange={handleLocaleChange}
                  >
                    <option value="en">
                      {intl.formatMessage({
                        id: "petition.locale.en",
                        defaultMessage: "English"
                      })}
                    </option>
                    <option value="es">
                      {intl.formatMessage({
                        id: "petition.locale.es",
                        defaultMessage: "Spanish"
                      })}
                    </option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel
                    htmlFor="petition-deadline"
                    paddingBottom={0}
                    minWidth="120px"
                  >
                    <FormattedMessage
                      id="petition.deadline-label"
                      defaultMessage="Deadline"
                    />
                  </FormLabel>
                  <DateTimeInput
                    id="petition-deadline"
                    type="datetime-local"
                    isFullWidth
                    value={
                      petition!.deadline ? new Date(petition!.deadline) : null
                    }
                    onChange={handleDeadlineChange}
                  />
                </FormControl>
              </Stack>
            </CollapseCard>
          </Box>
        </Flex>
      </PetitionLayout>
    </>
  );
}

function IconButtonMenu({
  children,
  ...props
}: IconButtonProps & { children: ReactNode }) {
  return (
    <Menu>
      <MenuButton as={IconButton} {...props}></MenuButton>
      <MenuList minWidth={0} placement="bottom-end">
        {children}
      </MenuList>
    </Menu>
  );
}

PetitionSend.fragments = {
  petition: gql`
    fragment PetitionSend_Petition on Petition {
      id
      ...PetitionLayout_Petition
      locale
      deadline
      emailSubject
      emailBody
    }
    ${PetitionLayout.fragments.petition}
  `,
  user: gql`
    fragment PetitionSend_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.user}
  `
};

const GET_PETITION_SEND_DATA = gql`
  query PetitionSend($id: ID!) {
    petition(id: $id) {
      ...PetitionSend_Petition
    }
  }
  ${PetitionSend.fragments.petition}
`;

const GET_PETITION_SEND_USER_DATA = gql`
  query PetitionSendUser {
    me {
      ...PetitionSend_User
    }
  }
  ${PetitionSend.fragments.user}
`;

function useUpdatePetition() {
  return useMutation<
    PetitionSend_updatePetitionMutation,
    PetitionSend_updatePetitionMutationVariables
  >(gql`
    mutation PetitionSend_updatePetition(
      $id: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(id: $id, data: $data) {
        ...PetitionSend_Petition
      }
    }
    ${PetitionSend.fragments.petition}
  `);
}

function useSearchContacts() {
  const apollo = useApolloClient();
  return useDebouncedAsync(
    async (search: string, exclude: string[]) => {
      const { data } = await apollo.query<
        PetitionSendSearchContactsQuery,
        PetitionSendSearchContactsQueryVariables
      >({
        query: gql`
          query PetitionSendSearchContacts($search: String, $exclude: [ID!]) {
            contacts(limit: 10, search: $search, exclude: $exclude) {
              items {
                ...RecipientSelect_Contact
              }
            }
          }
          ${RecipientSelect.fragments.contact}
        `,
        variables: { search, exclude }
      });
      return data.contacts.items;
    },
    300,
    []
  );
}

PetitionSend.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionSendQuery, PetitionSendQueryVariables>({
      query: GET_PETITION_SEND_DATA,
      variables: { id: query.petitionId as string }
    }),
    apollo.query<PetitionSendUserQuery>({
      query: GET_PETITION_SEND_USER_DATA
    })
  ]);
  return {
    petitionId: query.petitionId as string
  };
};

export default withData(PetitionSend);
