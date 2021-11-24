import {
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Circle,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@parallel/chakra/icons";
import { withError } from "@parallel/utils/promises/withError";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, uniq, uniqBy, zip } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { CloseableAlert } from "./CloseableAlert";
import {
  ContactSelect,
  ContactSelectInstance,
  ContactSelectProps,
  ContactSelectSelection,
} from "./ContactSelect";
import { ConfirmDialog } from "./dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "./dialogs/DialogProvider";
import { useErrorDialog } from "./dialogs/ErrorDialog";
import { Link } from "./Link";

interface RecipientSelectGroupsProps {
  showErrors?: boolean;
  recipientGroups: ContactSelectSelection[][];
  onChangeRecipientGroups: (groups: ContactSelectSelection[][]) => void;
  onSearchContactsByEmail: (emails: string[]) => Promise<(ContactSelectSelection | null)[]>;
  onSearchContacts: ContactSelectProps["onSearchContacts"];
  onCreateContact: ContactSelectProps["onCreateContact"];
  canAddRecipientGroups?: boolean;
}
export function RecipientSelectGroups({
  showErrors,
  recipientGroups,
  canAddRecipientGroups,
  onChangeRecipientGroups,
  onSearchContacts,
  onSearchContactsByEmail,
  onCreateContact,
}: RecipientSelectGroupsProps) {
  const intl = useIntl();
  const recipientGroupSelectRef = useMultipleRefs<ContactSelectInstance>();
  const recipientGroupFormControlRef = useMultipleRefs<HTMLDivElement>();

  function handleRecipientsChange(groupNumber: number) {
    return (recipients: ContactSelectSelection[]) => {
      if (!recipientGroups[groupNumber]) return;
      const newGroups = Array.from(recipientGroups);
      newGroups.splice(groupNumber, 1, recipients);
      onChangeRecipientGroups(newGroups);
    };
  }

  const showErrorDialog = useErrorDialog();
  const showMultipleEmailsDialog = useDialog(MultipleEmailsPastedDialog);
  async function handlePasteEmails(groupNumber: number, emails: string[]) {
    const contacts = await onSearchContactsByEmail(emails);

    const unknownEmails = uniq(
      zip(contacts, emails)
        .map(([contact, email]) => (!contact ? email : null))
        .filter(isDefined)
    );

    if (unknownEmails.length > 0) {
      await withError(
        showErrorDialog({
          header: (
            <FormattedMessage
              id="component.recipient-select-groups.unknown-contacts-header"
              defaultMessage="Unknown contacts"
            />
          ),
          message: (
            <Stack>
              <Text>
                <FormattedMessage
                  id="component.recipient-select-groups.unknown-contacts-message-1"
                  defaultMessage="We couldn't find the following {count, plural, =1{contact} other{contacts}}:"
                  values={{ count: unknownEmails.length }}
                />
              </Text>

              <Stack as="ul" paddingX={6} spacing={0}>
                {unknownEmails.map((email, i) => (
                  <Text as="li" key={i}>
                    {email}
                  </Text>
                ))}
              </Stack>

              <Text>
                <FormattedMessage
                  id="component.recipient-select-groups.unknown-contacts-message-2"
                  defaultMessage="Import {count, plural, =1{it} other{them}} first in the <a>contacts page</a>, or add {count, plural, =1{it} other{them}} individually here with {count, plural, =1{its} other{their}} contact email."
                  values={{
                    a: (chunks: any) => (
                      <Link href="/app/contacts" target="_blank">
                        {chunks}
                      </Link>
                    ),
                    count: unknownEmails.length,
                  }}
                />
              </Text>
            </Stack>
          ),
        })
      );
      return;
    }
    const [, result] = await withError(showMultipleEmailsDialog({}));
    if (result === "SEPARATE_GROUPS") {
      onChangeRecipientGroups([
        ...recipientGroups.slice(0, groupNumber),
        ...recipientGroups.slice(groupNumber, groupNumber + contacts.length).map((group, index) => {
          const contact = contacts[index]!;
          return group.some((c) => c.id === contact.id) ? group : [...group, contact];
        }),
        ...(recipientGroups.length > groupNumber + contacts.length
          ? recipientGroups.slice(groupNumber + contacts.length)
          : contacts.slice(recipientGroups.length - groupNumber).map((contact) => [contact!])),
      ]);
      focusRecipientGroup(groupNumber + contacts.length - 1);
    } else if (result === "SAME_GROUP") {
      onChangeRecipientGroups(
        recipientGroups.map((group, index) =>
          index === groupNumber
            ? uniqBy([...group, ...(contacts as ContactSelectSelection[])], (c) => c.id)
            : group
        )
      );
    }
  }

  function addRecipientGroup() {
    onChangeRecipientGroups([...recipientGroups, []]);
    focusRecipientGroup(recipientGroups.length);
  }

  function deleteRecipientGroup(index: number) {
    onChangeRecipientGroups(recipientGroups.filter((_, i) => i !== index));
  }

  function validRecipients(index: number) {
    return recipientGroups[index].filter((r) => !r.isInvalid);
  }

  function invalidRecipients(index: number) {
    return recipientGroups[index].filter((r) => r.isInvalid);
  }

  function focusRecipientGroup(index: number) {
    setTimeout(() => {
      if (recipientGroupSelectRef[index].current) {
        recipientGroupSelectRef[index].current?.focus();
        scrollIntoView(recipientGroupFormControlRef[index].current!, {
          duration: 0,
          scrollMode: "if-needed",
          block: "start",
        });
      }
    });
  }

  async function handleCreateContact(groupNumber: number, data: { defaultEmail?: string }) {
    const contact = await onCreateContact(data);
    setTimeout(() => recipientGroupSelectRef[groupNumber].current?.focus());
    return contact;
  }

  const bouncedEmailRecipients = recipientGroups.flatMap((group) =>
    group.filter((contact) => contact.hasBouncedEmail)
  );

  return (
    <>
      <Stack
        margin={-1}
        padding={1}
        overflow="auto"
        maxHeight="240px"
        _after={{
          content: "''",
          display: "block",
          paddingBottom: "1px",
        }}
      >
        {recipientGroups.map((recipients, index) => (
          <FormControl
            key={index}
            id={`petition-recipients-${index}`}
            ref={recipientGroupFormControlRef[index]}
            isInvalid={
              showErrors && (recipients.length === 0 || invalidRecipients(index).length > 0)
            }
          >
            <FormLabel display="flex" alignItems="center">
              <FormattedMessage
                id="component.recipient-select-groups.recipients-label"
                defaultMessage="Recipients"
              />
              {index > 0 ? (
                <>
                  {" "}
                  <FormattedMessage
                    id="component.recipient-select-groups.recipients-nth-group"
                    defaultMessage="({number, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} petition)"
                    values={{ number: index + 1 }}
                  />
                </>
              ) : null}
            </FormLabel>
            <Flex>
              <Box flex="1">
                <ContactSelect
                  ref={recipientGroupSelectRef[index]}
                  placeholder={intl.formatMessage({
                    id: "component.recipient-select-groups.recipients-placeholder",
                    defaultMessage: "Enter recipients...",
                  })}
                  value={recipients}
                  onChange={handleRecipientsChange(index)}
                  onCreateContact={async (data: any) => await handleCreateContact(index, data)}
                  onSearchContacts={onSearchContacts}
                  onPasteEmails={
                    canAddRecipientGroups
                      ? (emails: string[]) => handlePasteEmails(index, emails)
                      : undefined
                  }
                />
              </Box>
              {index > 0 ? (
                <IconButton
                  marginLeft={2}
                  variant="ghost"
                  aria-label={intl.formatMessage({
                    id: "component.recipient-select-groups.delete-group.label",
                    defaultMessage: "Delete recipient group",
                  })}
                  onClick={() => deleteRecipientGroup(index)}
                  icon={<DeleteIcon />}
                />
              ) : null}
            </Flex>
            <FormErrorMessage>
              {invalidRecipients(index).length === 0 ? (
                index === 0 ? (
                  <FormattedMessage
                    id="component.recipient-select-groups.required-recipients-group-1-error"
                    defaultMessage="Please specify at least one recipient"
                  />
                ) : (
                  <FormattedMessage
                    id="component.recipient-select-groups.required-recipients-group-n-error"
                    defaultMessage="Please specify at least one recipient or delete the groups you don't need"
                  />
                )
              ) : (
                <FormattedMessage
                  id="component.recipient-select-groups.unknown-recipients"
                  defaultMessage="We couldn't find {count, plural, =1 {{email}} other {some of the emails}} in your contacts list."
                  values={{
                    count: invalidRecipients(index).length,
                    email: invalidRecipients(index)[0].email,
                  }}
                />
              )}
            </FormErrorMessage>
          </FormControl>
        ))}
      </Stack>

      {canAddRecipientGroups ? (
        <Flex justifyContent="flex-start" alignItems="center" marginTop={4}>
          <Button
            variant="link"
            color="gray.900"
            fontWeight="normal"
            leftIcon={
              <Circle backgroundColor="purple.500" boxSize={5}>
                <AddIcon color="white" fontSize="xs" />
              </Circle>
            }
            onClick={addRecipientGroup}
          >
            <FormattedMessage
              id="component.recipient-select-groups.add-recipient-group"
              defaultMessage="Add recipient group"
            />
          </Button>
        </Flex>
      ) : null}
      {bouncedEmailRecipients.length ? (
        <CloseableAlert
          status="warning"
          backgroundColor="orange.100"
          borderRadius="base"
          marginTop={4}
        >
          <AlertIcon color="yellow.500" />
          <AlertDescription>
            <Text>
              <FormattedMessage
                id="component.recipient-select-groups.emails-bounced-warning"
                defaultMessage="The following {count, plural, =1{email has} other{emails have}} bounced previously. Please, make sure the email addresses are valid."
                values={{
                  count: bouncedEmailRecipients.length,
                }}
              />
            </Text>
            <UnorderedList paddingLeft={2}>
              {bouncedEmailRecipients.map((recipient, index) => (
                <ListItem key={index}>{`${recipient.fullName} <${recipient.email}>`}</ListItem>
              ))}
            </UnorderedList>
          </AlertDescription>
        </CloseableAlert>
      ) : null}

      {recipientGroups.length === 1 &&
      validRecipients(0).length >= 2 &&
      invalidRecipients(0).length === 0 ? (
        <CloseableAlert status="info" marginTop={4} borderRadius="base">
          <AlertIcon />
          <Text display="block">
            <FormattedMessage
              id="component.recipient-select-groups.same-petition-warning"
              defaultMessage="All {recipientCount} recipients will receive a link to the same petition so they can fill it out collaboratively. Add a <b>recipient group</b> to send different petitions to each group."
              values={{
                recipientCount: validRecipients(0).length,
              }}
            />
          </Text>
        </CloseableAlert>
      ) : null}
    </>
  );
}

type MultipleEmailsPastedAction = "SAME_GROUP" | "SEPARATE_GROUPS";

function MultipleEmailsPastedDialog(props: DialogProps<{}, MultipleEmailsPastedAction>) {
  const [action, setAction] = useState<MultipleEmailsPastedAction>("SEPARATE_GROUPS");
  const initialFocusRef = useRef<HTMLElement>(null);
  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={initialFocusRef}
      size="xl"
      content={{ as: "form", onSubmit: () => props.onResolve(action) }}
      header={
        <FormattedMessage
          id="components.multiple-emails-pasted-dialog.header"
          defaultMessage="Multiple emails"
        />
      }
      body={
        <>
          <Stack>
            <Text>
              <FormattedMessage
                id="components.multiple-emails-pasted-dialog.message-1"
                defaultMessage="You have pasted multiple emails from the clipboard."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="components.multiple-emails-pasted-dialog.message-2"
                defaultMessage="Do you want to add them to <b>separate groups</b> (they will fill different petitions) or <b>group them in the same petition</b>?"
              />
            </Text>
          </Stack>
          <RadioGroup
            marginTop={4}
            as={Stack}
            onChange={(value) => setAction(value as MultipleEmailsPastedAction)}
            value={action}
          >
            <Radio value="SEPARATE_GROUPS" ref={initialFocusRef as any}>
              <FormattedMessage
                id="components.multiple-emails-pasted-dialog.separate-groups"
                defaultMessage="Add to separate groups"
              />
            </Radio>
            <Radio value="SAME_GROUP">
              <FormattedMessage
                id="components.multiple-emails-pasted-dialog.same-group"
                defaultMessage="All in the same petition"
              />
            </Radio>
          </RadioGroup>
        </>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}
