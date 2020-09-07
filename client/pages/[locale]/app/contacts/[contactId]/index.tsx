import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputProps,
  Stack,
  Text,
} from "@chakra-ui/core";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionProgressBar } from "@parallel/components/common/PetitionProgressBar";
import { PetitionStatusIcon } from "@parallel/components/common/PetitionStatusIcon";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableColumn } from "@parallel/components/common/Table";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  ContactQuery,
  ContactQueryVariables,
  ContactUserQuery,
  Contact_PetitionAccessFragment,
  useContactQuery,
  useContactUserQuery,
  useContact_updateContactMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { FORMATS } from "@parallel/utils/dates";
import { UnwrapPromise } from "@parallel/utils/types";

import {
  forwardRef,
  ReactNode,
  Ref,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { EditIcon } from "@parallel/chakra/icons";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";

type ContactProps = UnwrapPromise<ReturnType<typeof Contact.getInitialProps>>;

type ContactDetailsFormData = {
  firstName: string | null;
  lastName: string | null;
};

function Contact({ contactId }: ContactProps) {
  const intl = useIntl();

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

  const goToPetition = useGoToPetition();
  function handleRowClick(row: PetitionAccessSelection) {
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

  const columns = useContactPetitionAccessesColumns();

  return (
    <AppLayout title={contact!.fullName ?? contact!.email} user={me}>
      <Flex flex="1" padding={4}>
        <Box flex="2">
          <Card
            as={isEditing ? "form" : "div"}
            onSubmit={isEditing ? handleContactSaveSubmit : undefined}
            id="contact-details"
          >
            <CardHeader headingAs="h2" headingSize="md">
              {`${contact!.fullName ?? ""} <${contact!.email}>`}
            </CardHeader>
            <Stack padding={4}>
              <FormControl id="contact-first-name">
                <FormLabel fontWeight="bold">
                  <FormattedMessage
                    id="generic.forms.first-name-label"
                    defaultMessage="First name"
                  />
                </FormLabel>
                <ToggleInput
                  isEditing={isEditing}
                  name="firstName"
                  isDisabled={loading}
                  ref={register()}
                >
                  {contact!.firstName}
                </ToggleInput>
              </FormControl>
              <FormControl id="contact-last-name">
                <FormLabel fontWeight="bold">
                  <FormattedMessage
                    id="generic.forms.last-name-label"
                    defaultMessage="Last name"
                  />
                </FormLabel>
                <ToggleInput
                  isEditing={isEditing}
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
                    colorScheme="purple"
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
                  leftIcon={<EditIcon />}
                  colorScheme="gray"
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
          <Card marginTop={4} id="contact-petitions">
            <CardHeader>
              <FormattedMessage
                id="contact.petitions-header"
                defaultMessage="Petitions sent{name, select, null {} other { to {name}}}"
                values={{ name: contact!.firstName }}
              />
            </CardHeader>
            {contact!.accesses.items.length ? (
              <Table
                columns={columns}
                rows={contact!.accesses.items ?? []}
                rowKeyProp="id"
                onRowClick={handleRowClick}
                marginBottom={2}
              />
            ) : (
              <Flex height="100px" alignItems="center" justifyContent="center">
                <Text color="gray.300" fontSize="lg">
                  <FormattedMessage
                    id="contact.no-petitions"
                    defaultMessage="You haven't sent any petitions to {name, select, null {this contact} other {{name}}} yet"
                    values={{ name: contact!.firstName }}
                  />
                </Text>
              </Flex>
            )}
          </Card>
        </Box>
        <Spacer flex="1" display={{ base: "none", md: "block" }} />
      </Flex>
    </AppLayout>
  );
}

type PetitionAccessSelection = Contact_PetitionAccessFragment;

function useContactPetitionAccessesColumns(): TableColumn<
  PetitionAccessSelection
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "petitions.header.name",
          defaultMessage: "Petition name",
        }),
        CellContent: ({ row: { petition } }) => (
          <>
            {petition?.name || (
              <Text as="span" textStyle="hint">
                <FormattedMessage
                  id="generic.untitled-petition"
                  defaultMessage="Untitled petition"
                />
              </Text>
            )}
          </>
        ),
      },
      {
        key: "deadline",
        header: intl.formatMessage({
          id: "petition-accesses.deadline-header",
          defaultMessage: "Deadline",
        }),
        CellContent: ({ row: { petition } }) =>
          petition?.deadline ? (
            <DateTime value={petition.deadline} format={FORMATS.LLL} />
          ) : (
            <Text as="span" textStyle="hint" whiteSpace="nowrap">
              <FormattedMessage
                id="generic.no-deadline"
                defaultMessage="No deadline"
              />
            </Text>
          ),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "petition-accesses.status-header",
          defaultMessage: "Status",
        }),
        align: "center",
        CellContent: ({ row: { petition } }) =>
          petition ? (
            <Flex alignItems="center">
              <PetitionProgressBar
                status={petition.status}
                {...petition.progress}
                flex="1"
                minWidth="80px"
              />
              <PetitionStatusIcon status={petition.status} marginLeft={2} />
            </Flex>
          ) : null,
      },
    ],
    [intl.locale]
  );
}

Contact.fragments = {
  Contact: gql`
    fragment Contact_Contact on Contact {
      id
      email
      fullName
      firstName
      lastName
      accesses(limit: 100) {
        items {
          ...Contact_PetitionAccess
        }
      }
    }
    fragment Contact_PetitionAccess on PetitionAccess {
      id
      petition {
        id
        name
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
  `,
  User: gql`
    fragment Contact_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};

Contact.mutations = [
  gql`
    mutation Contact_updateContact($id: GID!, $data: UpdateContactInput!) {
      updateContact(id: $id, data: $data) {
        ...Contact_Contact
      }
    }
    ${Contact.fragments.Contact}
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
    <Text paddingLeft={4} height="40px" lineHeight="40px" textStyle="hint">
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

Contact.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<ContactQuery, ContactQueryVariables>(
      gql`
        query Contact($id: GID!) {
          contact(id: $id) {
            ...Contact_Contact
          }
        }
        ${Contact.fragments.Contact}
      `,
      {
        variables: { id: query.contactId as string },
      }
    ),
    fetchQuery<ContactUserQuery>(gql`
      query ContactUser {
        me {
          ...Contact_User
        }
      }
      ${Contact.fragments.User}
    `),
  ]);
  return {
    contactId: query.contactId as string,
  };
};
export default compose(
  withOnboarding({
    key: "CONTACT_DETAILS",
    steps: [
      {
        title: (
          <FormattedMessage
            id="tour.contact-details.page"
            defaultMessage="Contact details"
          />
        ),
        content: (
          <FormattedMessage
            id="tour.contact-details.info"
            defaultMessage="You can find all the information regarding a contact stored in Parallel on this page."
          />
        ),
        placement: "center",
        target: "#__next",
      },
      {
        title: (
          <FormattedMessage
            id="tour.contact-details.personal-information"
            defaultMessage="Personal information"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.contact-details.essential"
                defaultMessage="All the essential information of your contact will be displayed here: email, first name, and last name."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.contact-details.name"
                defaultMessage="Parallel will use the first name shown here for any messages you send to your contact. Make sure it is correct."
              />
            </Text>
          </>
        ),
        placement: "right",
        target: "#contact-details",
      },
      {
        title: (
          <FormattedMessage
            id="tour.contact-details.petitions"
            defaultMessage="Petitions sent to your contact"
          />
        ),
        content: (
          <FormattedMessage
            id="tour.contact-details.petitions-list"
            defaultMessage="Here is a list of all the petitions you sent to your contact to help you find them faster."
          />
        ),
        placement: "right",
        target: "#contact-petitions",
      },
    ],
  }),
  withApolloData
)(Contact);
