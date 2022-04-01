import { gql, useMutation } from "@apollo/client";
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
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionSignatureCellContent } from "@parallel/components/common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "@parallel/components/common/PetitionStatusCellContent";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  Contact_contactDocument,
  Contact_PetitionAccessFragment,
  Contact_updateContactDocument,
  Contact_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useDeleteContacts } from "@parallel/utils/mutations/useDeleteContacts";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { UnwrapPromise } from "@parallel/utils/types";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type ContactProps = UnwrapPromise<ReturnType<typeof Contact.getInitialProps>>;

type ContactDetailsFormData = {
  firstName: string | null;
  lastName: string | null;
};

function Contact({ contactId }: ContactProps) {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(Contact_userDocument);
  const {
    data: { contact },
  } = useAssertQuery(Contact_contactDocument, {
    variables: { id: contactId },
  });
  const [isEditing, setIsEditing] = useState(false);
  const [updateContact, { loading }] = useMutation(Contact_updateContactDocument);
  const { register, handleSubmit, reset } = useForm<ContactDetailsFormData>({
    defaultValues: {
      firstName: contact!.firstName ?? "",
      lastName: contact!.lastName ?? "",
    },
  });

  const goToPetition = useGoToPetition();
  function handleRowClick(row: PetitionAccessSelection, event: MouseEvent) {
    goToPetition(
      row.petition!.id,
      (
        {
          DRAFT: "compose",
          PENDING: "replies",
          COMPLETED: "replies",
          CLOSED: "replies",
        } as const
      )[row.petition!.status],
      { event }
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
  const context = useMemo(() => ({ user: me }), [me]);

  const deleteContact = useDeleteContacts();
  const navigate = useHandleNavigation();
  const handleDeleteClick = async () => {
    try {
      await deleteContact([contact!]);
      navigate("/app/contacts");
    } catch {}
  };

  return (
    <AppLayout title={contact!.fullName ?? contact!.email} me={me} realMe={realMe}>
      <Flex flex="1" padding={4}>
        <Box flex="2">
          <Card
            as={isEditing ? "form" : "div"}
            onSubmit={isEditing ? handleContactSaveSubmit : undefined}
            id="contact-details"
          >
            <CardHeader as="h2" size="md">
              <Flex alignItems="center">
                {`${contact!.fullName ?? ""} <${contact!.email}>`}
                <Spacer />
                <IconButtonWithTooltip
                  icon={<DeleteIcon />}
                  variant="outline"
                  label={intl.formatMessage({
                    id: "generic.delete",
                    defaultMessage: "Delete",
                  })}
                  onClick={handleDeleteClick}
                />
              </Flex>
            </CardHeader>
            <Stack padding={4}>
              <FormControl id="contact-first-name">
                <FormLabel fontWeight="bold">
                  <FormattedMessage
                    id="generic.forms.first-name-label"
                    defaultMessage="First name"
                  />
                </FormLabel>
                <ToggleInput {...register("firstName")} isEditing={isEditing} isDisabled={loading}>
                  {contact!.firstName}
                </ToggleInput>
              </FormControl>
              <FormControl id="contact-last-name">
                <FormLabel fontWeight="bold">
                  <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
                </FormLabel>
                <ToggleInput {...register("lastName")} isEditing={isEditing} isDisabled={loading}>
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
                    <FormattedMessage id="generic.cancel-save-changes" defaultMessage="Cancel" />
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
                    <FormattedMessage id="generic.save-changes" defaultMessage="Save" />
                  </Button>
                </>
              ) : (
                <Button
                  leftIcon={<EditIcon />}
                  colorScheme="gray"
                  onClick={() => setIsEditing(true)}
                >
                  <FormattedMessage id="contact.edit-details-button" defaultMessage="Edit" />
                </Button>
              )}
            </Flex>
          </Card>
          <Card marginTop={4} id="contact-petitions">
            <CardHeader omitDivider>
              <FormattedMessage
                id="contact.petitions-header"
                defaultMessage="Petitions sent{name, select, null {} other { to {name}}}"
                values={{ name: contact!.firstName }}
              />
            </CardHeader>
            {contact!.accesses.items.length ? (
              <Table
                columns={columns}
                context={context}
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

function useContactPetitionAccessesColumns() {
  const intl = useIntl();

  return useMemo(
    () =>
      [
        {
          key: "name",
          header: intl.formatMessage({
            id: "petitions.header.name",
            defaultMessage: "Petition name",
          }),
          headerProps: {
            width: "30%",
            minWidth: "240px",
          },
          cellProps: {
            maxWidth: 0,
          },
          CellContent: ({ row }) => (
            <OverflownText textStyle={row.petition?.name ? undefined : "hint"}>
              {row.petition?.name
                ? row.petition.name
                : intl.formatMessage({
                    id: "generic.unnamed-petition",
                    defaultMessage: "Unnamed petition",
                  })}
            </OverflownText>
          ),
        },
        {
          key: "status",
          header: intl.formatMessage({
            id: "petitions.header.status",
            defaultMessage: "Status",
          }),
          align: "center",
          CellContent: ({ row: { petition } }) => (
            <PetitionStatusCellContent petition={petition!} />
          ),
        },
        {
          key: "signature",
          align: "center",
          headerProps: { padding: 0, width: 8 },
          cellProps: { padding: 0 },
          CellContent: ({ row: { petition } }) => (
            <Flex alignItems="center" paddingRight="2">
              <PetitionSignatureCellContent petition={petition!} />
            </Flex>
          ),
        },
        {
          key: "sharedWith",
          header: intl.formatMessage({
            id: "petitions.header.shared-with",
            defaultMessage: "Shared with",
          }),
          align: "center",
          cellProps: { width: "1%" },
          CellContent: ({ row: { petition }, column }) => (
            <Flex justifyContent={column.align}>
              <UserAvatarList
                usersOrGroups={petition!.permissions.map((p) =>
                  p.__typename === "PetitionUserPermission"
                    ? p.user
                    : p.__typename === "PetitionUserGroupPermission"
                    ? p.group
                    : (null as never)
                )}
              />
            </Flex>
          ),
        },
        {
          key: "sentAt",
          header: intl.formatMessage({
            id: "generic.sent-at",
            defaultMessage: "Sent at",
          }),
          cellProps: { width: "1%" },
          CellContent: ({ row: { petition } }) => (
            <DateTime
              fontSize="sm"
              value={petition!.sentAt!}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ),
        },
      ] as TableColumn<PetitionAccessSelection>[],
    [intl.locale]
  );
}

Contact.fragments = {
  get Contact() {
    return gql`
      fragment Contact_Contact on Contact {
        id
        ...Contact_Contact_Profile
        ...useDeleteContacts_Contact
        accesses(limit: 100) {
          items {
            ...Contact_PetitionAccess
          }
        }
      }
      ${this.Contact_Profile}
      ${useDeleteContacts.fragments.Contact}
      ${this.PetitionAccess}
    `;
  },
  get Contact_Profile() {
    return gql`
      fragment Contact_Contact_Profile on Contact {
        id
        email
        fullName
        firstName
        lastName
      }
    `;
  },
  get PetitionAccess() {
    return gql`
      fragment Contact_PetitionAccess on PetitionAccess {
        id
        petition {
          ...Contact_Petition
        }
      }
      ${this.Petition}
    `;
  },
  Petition: gql`
    fragment Contact_Petition on Petition {
      id
      name
      sentAt
      permissions {
        permissionType
        ... on PetitionUserPermission {
          user {
            ...UserAvatarList_User
          }
        }
        ... on PetitionUserGroupPermission {
          group {
            ...UserAvatarList_UserGroup
          }
        }
      }
      ...PetitionStatusCellContent_Petition
      ...PetitionSignatureCellContent_Petition
    }
    ${UserAvatarList.fragments.User}
    ${UserAvatarList.fragments.UserGroup}
    ${PetitionStatusCellContent.fragments.Petition}
    ${PetitionSignatureCellContent.fragments.Petition}
  `,
};

Contact.mutations = [
  gql`
    mutation Contact_updateContact($id: GID!, $data: UpdateContactInput!) {
      updateContact(id: $id, data: $data) {
        ...Contact_Contact_Profile
      }
    }
    ${Contact.fragments.Contact_Profile}
  `,
];

Contact.queries = [
  gql`
    query Contact_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
  gql`
    query Contact_contact($id: GID!) {
      contact(id: $id) {
        ...Contact_Contact
      }
    }
    ${Contact.fragments.Contact}
  `,
];

interface ToggleInputProps extends InputProps {
  isEditing: boolean;
}

const ToggleInput = chakraForwardRef<"input", ToggleInputProps>(function ToggleInput(
  { isEditing, children, ...props },
  ref
) {
  return isEditing ? (
    <Input ref={ref} {...props} />
  ) : children === null ? (
    <Text paddingLeft={4} height="40px" lineHeight="40px" textStyle="hint">
      <FormattedMessage id="generic.not-specified" defaultMessage="Not specified" />
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

Contact.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery(Contact_userDocument),
    fetchQuery(Contact_contactDocument, {
      variables: { id: query.contactId as string },
    }),
  ]);
  return {
    contactId: query.contactId as string,
  };
};
export default compose(withDialogs, withApolloData)(Contact);
