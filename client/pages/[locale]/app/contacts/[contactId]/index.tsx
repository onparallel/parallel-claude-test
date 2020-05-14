import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputProps,
  Stack,
  Text,
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionProgressBar } from "@parallel/components/common/PetitionProgressBar";
import { PetitionStatusText } from "@parallel/components/common/PetitionStatusText";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  Table,
  TableColumn,
  useTableColors,
} from "@parallel/components/common/Table";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import {
  ContactQuery,
  ContactQueryVariables,
  ContactUserQuery,
  Contact_ContactFragment,
  useContactQuery,
  useContactUserQuery,
  useContact_updateContactMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { FORMATS } from "@parallel/utils/dates";
import { UnwrapArray, UnwrapPromise } from "@parallel/utils/types";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useState,
  useMemo,
} from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type ContactProps = UnwrapPromise<ReturnType<typeof Contact.getInitialProps>>;

type ContactDetailsFormData = {
  firstName: string | null;
  lastName: string | null;
};

function Contact({ contactId }: ContactProps) {
  const intl = useIntl();
  const router = useRouter();
  const {
    data: { me },
  } = assertQuery(useContactUserQuery());
  const {
    data: { contact },
  } = assertQuery(useContactQuery({ variables: { id: contactId } }));
  const [isEditing, setIsEditing] = useState(false);
  const [updateContact, { loading }] = useContact_updateContactMutation();
  const { register, handleSubmit, reset } = useForm<ContactDetailsFormData>({
    defaultValues: {
      firstName: contact!.firstName ?? "",
      lastName: contact!.lastName ?? "",
    },
  });

  function goToPetition(id: string, section: "compose" | "replies") {
    router.push(
      `/[locale]/app/petitions/[petitionId]/${section}`,
      `/${router.query.locale}/app/petitions/${id}/${section}`
    );
  }

  function handleRowClick(row: SendoutSelection) {
    goToPetition(
      row.petition!.id,
      ({
        DRAFT: "compose",
        PENDING: "replies",
        COMPLETED: "replies",
      } as const)[row.petition!.status]
    );
  }

  const handleContactSaveSubmit = useCallback(
    handleSubmit(async ({ firstName, lastName }) => {
      await updateContact({
        variables: {
          id: contact!.id,
          data: {
            firstName: firstName || null,
            lastName: lastName || null,
          },
        },
      });
      reset({ firstName, lastName });
      setIsEditing(false);
    }),
    []
  );

  const { border } = useTableColors();
  const columns = useContactSendoutsColumns();

  return (
    <>
      <AppLayout user={me}>
        <Flex flex="1" padding={4}>
          <Box flex="2">
            <Card
              as={isEditing ? "form" : "div"}
              onSubmit={isEditing ? handleContactSaveSubmit : undefined}
            >
              <Heading as="h2" padding={4} size="md">
                {`${contact?.fullName ?? ""} <${contact?.email}>`}
              </Heading>
              <Divider marginY={0} />
              <Stack padding={4}>
                <FormControl>
                  <FormLabel htmlFor="contact-first-name" fontWeight="bold">
                    <FormattedMessage
                      id="generic.forms.first-name-label"
                      defaultMessage="First name"
                    />
                  </FormLabel>
                  <ToggleInput
                    isEditing={isEditing}
                    id="contact-first-name"
                    name="firstName"
                    isDisabled={loading}
                    ref={register()}
                  >
                    {contact!.firstName}
                  </ToggleInput>
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="contact-last-name" fontWeight="bold">
                    <FormattedMessage
                      id="generic.forms.last-name-label"
                      defaultMessage="Last name"
                    />
                  </FormLabel>
                  <ToggleInput
                    isEditing={isEditing}
                    id="contact-last-name"
                    name="lastName"
                    isDisabled={loading}
                    ref={register()}
                  >
                    {contact!.lastName}
                  </ToggleInput>
                </FormControl>
              </Stack>
              <Flex
                padding={4}
                paddingTop={0}
                justifyContent={{ sm: "flex-end" }}
                flexDirection={{ base: "column", sm: "row" }}
              >
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      marginRight={{ base: 0, sm: 2 }}
                      marginBottom={{ base: 2, sm: 0 }}
                    >
                      <FormattedMessage
                        id="generic.cancel-save-changes"
                        defaultMessage="Cancel"
                      />
                    </Button>
                    <Button
                      variantColor="purple"
                      type="submit"
                      isLoading={loading}
                      loadingText={intl.formatMessage({
                        id: "generic.saving-changes",
                        defaultMessage: "Saving...",
                      })}
                    >
                      <FormattedMessage
                        id="generic.save-changes"
                        defaultMessage="Save"
                      />
                    </Button>
                  </>
                ) : (
                  <Button
                    leftIcon="edit"
                    variantColor="gray"
                    onClick={() => setIsEditing(true)}
                  >
                    <FormattedMessage
                      id="contact.edit-details-button"
                      defaultMessage="Edit"
                    />
                  </Button>
                )}
              </Flex>
            </Card>
            <Card backgroundColor="white" marginTop={4}>
              <Box
                padding={4}
                borderBottom="1px solid"
                borderBottomColor={border}
              >
                <Heading size="sm">
                  <FormattedMessage
                    id="contact.petitions-header"
                    defaultMessage="Petitions sent{name, select, null {} other { to {name}}}"
                    values={{ name: contact?.firstName }}
                  />
                </Heading>
              </Box>
              {contact?.sendouts.items.length ? (
                <Table
                  columns={columns}
                  rows={contact?.sendouts.items ?? []}
                  rowKeyProp="id"
                  onRowClick={handleRowClick}
                  marginBottom={2}
                />
              ) : (
                <Flex
                  height="100px"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="contact.no-sendouts"
                      defaultMessage="You haven't send any petitions to {name, select, null {this contact} other {{name}}} yet"
                      values={{ name: contact?.firstName }}
                    />
                  </Text>
                </Flex>
              )}
            </Card>
          </Box>
          <Spacer flex="1" display={{ base: "none", md: "block" }} />
        </Flex>
      </AppLayout>
    </>
  );
}

type SendoutSelection = UnwrapArray<
  Contact_ContactFragment["sendouts"]["items"]
>;

function useContactSendoutsColumns(): TableColumn<SendoutSelection>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "petitions.header.name",
          defaultMessage: "Petition name",
        }),
        Cell: memo(({ row }) => (
          <>
            {row.petition?.name || (
              <Text as="span" color="gray.400" fontStyle="italic">
                <FormattedMessage
                  id="generic.untitled-petition"
                  defaultMessage="Untitled petition"
                />
              </Text>
            )}
          </>
        )),
      },
      {
        key: "progress",
        header: intl.formatMessage({
          id: "petitions.sendouts-header.progress",
          defaultMessage: "Progress",
        }),
        Cell: memo(({ row: { petition } }) => (
          <>
            {petition ? (
              <PetitionProgressBar
                status={petition.status}
                {...petition.progress}
              ></PetitionProgressBar>
            ) : null}
          </>
        )),
      },
      {
        key: "deadline",
        header: intl.formatMessage({
          id: "petitions.sendouts-header.deadline",
          defaultMessage: "Deadline",
        }),
        Cell: memo(({ row: { petition } }) => (
          <>
            {petition?.deadline ? (
              <DateTime value={petition.deadline} format={FORMATS.LLL} />
            ) : null}
          </>
        )),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "petitions.sendouts-header.status",
          defaultMessage: "Status",
        }),
        Cell: memo(({ row: { petition } }) => (
          <>
            {petition ? <PetitionStatusText status={petition.status} /> : null}
          </>
        )),
      },
    ],
    []
  );
}

Contact.fragments = {
  contact: gql`
    fragment Contact_Contact on Contact {
      id
      email
      fullName
      firstName
      lastName
      sendouts(limit: 100) {
        items {
          id
          petition {
            id
            name
            emailSubject
            status
            deadline
            progress {
              validated
              replied
              optional
              total
            }
          }
        }
      }
    }
  `,
  user: gql`
    fragment Contact_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.user}
  `,
};

Contact.mutations = [
  gql`
    mutation Contact_updateContact($id: ID!, $data: UpdateContactInput!) {
      updateContact(id: $id, data: $data) {
        ...Contact_Contact
      }
    }
    ${Contact.fragments.contact}
  `,
];

const ToggleInput = forwardRef(function ToggleInput(
  {
    isEditing,
    children,
    ...props
  }: { isEditing: boolean; children: ReactNode } & InputProps,
  ref: Ref<HTMLInputElement>
) {
  return isEditing ? (
    <Input ref={ref} {...props} />
  ) : children === null ? (
    <Text
      paddingLeft={4}
      height="40px"
      lineHeight="40px"
      color="gray.400"
      fontStyle="italic"
    >
      <FormattedMessage
        id="generic.not-specified"
        defaultMessage="Not specified"
      />
    </Text>
  ) : (
    <Box
      height="40px"
      display="flex"
      borderLeft="1px solid transparent"
      paddingLeft={4}
      alignItems="center"
    >
      {children}
    </Box>
  );
});

const GET_CONTACT_DATA = gql`
  query Contact($id: ID!) {
    contact(id: $id) {
      ...Contact_Contact
    }
  }
  ${Contact.fragments.contact}
`;

const GET_CONTACT_USER_DATA = gql`
  query ContactUser {
    me {
      ...Contact_User
    }
  }
  ${Contact.fragments.user}
`;

Contact.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  await Promise.all([
    apollo.query<ContactQuery, ContactQueryVariables>({
      query: GET_CONTACT_DATA,
      variables: { id: query.contactId as string },
    }),
    apollo.query<ContactUserQuery>({
      query: GET_CONTACT_USER_DATA,
    }),
  ]);
  return {
    contactId: query.contactId as string,
  };
};
export default withData(Contact);
