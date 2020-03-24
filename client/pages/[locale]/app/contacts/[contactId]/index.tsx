import { useMutation } from "@apollo/react-hooks";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputProps,
  Stack,
  Divider,
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  ContactQuery,
  ContactQueryVariables,
  ContactsUserQuery,
  ContactUserQuery,
  Contact_updateContactMutation,
  Contact_updateContactMutationVariables,
} from "@parallel/graphql/__types";
import { UnwrapPromise } from "@parallel/utils/types";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import { forwardRef, ReactNode, Ref, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type ContactProps = UnwrapPromise<ReturnType<typeof Contact.getInitialProps>>;

type ContactDetailsFormData = {
  firstName: string | null;
  lastName: string | null;
};

function Contact({ contactId }: ContactProps) {
  const intl = useIntl();
  const { me } = useQueryData<ContactsUserQuery>(GET_CONTACT_USER_DATA);
  const { contact } = useQueryData<ContactQuery, ContactQueryVariables>(
    GET_CONTACT_DATA,
    { variables: { id: contactId } }
  );
  const [isEditing, setIsEditing] = useState(false);
  const [updateContact, { loading }] = useUpdateContact();
  const { register, handleSubmit, reset } = useForm<ContactDetailsFormData>({
    defaultValues: {
      firstName: contact!.firstName ?? "",
      lastName: contact!.lastName ?? "",
    },
  });

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
  return (
    <>
      <AppLayout user={me}>
        <Flex flex="1" overflow="auto">
          <Box padding={4} flex="2">
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
            <Card backgroundColor="white" marginTop={4} padding={4}>
              Contact petitions goes here in a new component
            </Card>
          </Box>
          <Spacer flex="1" display={{ base: "none", md: "block" }} />
        </Flex>
      </AppLayout>
    </>
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
    }
  `,
  user: gql`
    fragment Contact_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.user}
  `,
};

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

function useUpdateContact() {
  return useMutation<
    Contact_updateContactMutation,
    Contact_updateContactMutationVariables
  >(gql`
    mutation Contact_updateContact($id: ID!, $data: UpdateContactInput!) {
      updateContact(id: $id, data: $data) {
        ...Contact_Contact
      }
    }
    ${Contact.fragments.contact}
  `);
}

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
