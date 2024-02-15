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
  HStack,
  IconButton,
  Image,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@parallel/chakra/icons";
import { untranslated } from "@parallel/utils/untranslated";
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
import { HelpPopover } from "./HelpPopover";
import { Link } from "./Link";
import { ConfirmDialog } from "./dialogs/ConfirmDialog";
import { DialogProps, isDialogError, useDialog } from "./dialogs/DialogProvider";
import { useErrorDialog } from "./dialogs/ErrorDialog";

interface RecipientSelectGroupsProps {
  showErrors?: boolean;
  recipientGroups: ContactSelectSelection[][];
  onChangeRecipientGroups: (groups: ContactSelectSelection[][]) => void;
  onSearchContactsByEmail: (emails: string[]) => Promise<(ContactSelectSelection | null)[]>;
  onSearchContacts: ContactSelectProps["onSearchContacts"];
  onCreateContact: ContactSelectProps["onCreateContact"];
  canAddRecipientGroups?: boolean;
  maxGroups: number;
}
export function RecipientSelectGroups({
  showErrors,
  recipientGroups,
  canAddRecipientGroups,
  maxGroups,
  onChangeRecipientGroups,
  onSearchContacts,
  onSearchContactsByEmail,
  onCreateContact,
}: RecipientSelectGroupsProps) {
  const intl = useIntl();
  const recipientGroupSelectRef = useMultipleRefs<ContactSelectInstance<true>>();
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
  async function handlePasteEmails(groupNumber: number, emails: string[][]) {
    const allEmails = emails.flat();
    const contacts = await onSearchContactsByEmail(allEmails);

    const unknownEmails = uniq(
      zip(contacts, allEmails)
        .map(([contact, email]) => (!contact ? email : null))
        .filter(isDefined),
    );
    try {
      if (unknownEmails.length > 0) {
        return await showErrorDialog({
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
                  defaultMessage="We couldn't find the following {count, plural, =1{contact} other{# contacts}}:"
                  values={{ count: unknownEmails.length }}
                />
              </Text>
              <Stack as="ul" paddingX={6} spacing={0}>
                {unknownEmails.slice(0, 10).map((email, i) => (
                  <Text as="li" key={i}>
                    {email}
                  </Text>
                ))}
                {unknownEmails.length > 10 ? (
                  <Text as="li" fontStyle="italic">
                    <FormattedMessage
                      id="generic.n-more"
                      defaultMessage="{count} more"
                      values={{ count: unknownEmails.length - 3 }}
                    />
                  </Text>
                ) : null}
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
        });
      }
      const contactByEmail = Object.fromEntries(
        zip(contacts, allEmails).map(([c, email]) => [email, c!]),
      );
      const result =
        emails.length === 1 || emails.every((row) => row.length === 1)
          ? await showMultipleEmailsDialog()
          : "SEPARATE_GROUPS";
      if (result === "SEPARATE_GROUPS") {
        // if all emails in one row, make one email per row
        emails = emails.length === 1 ? emails[0].map((e) => [e]) : emails;
      } else if (result === "SAME_GROUP") {
        // if one email per row, make all emails in a single row
        emails = [emails.flat()];
      }
      const newRecipientGroups = [...recipientGroups];
      for (let i = 0; i < emails.length; ++i) {
        newRecipientGroups[i + groupNumber] = uniqBy(
          [
            ...(newRecipientGroups[i + groupNumber] ?? []),
            ...emails[i].map((e) => contactByEmail[e]),
          ],
          (c) => c.id,
        );
      }
      onChangeRecipientGroups(newRecipientGroups);
      focusRecipientGroup(groupNumber + contacts.length - 1);
    } catch (e) {
      if (isDialogError(e)) {
        return;
      } else {
        throw e;
      }
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
    group.filter((contact) => contact.hasBouncedEmail),
  );

  return (
    <Stack>
      <Stack margin={-1} padding={1} overflow="auto" maxHeight="240px">
        {recipientGroups.map((recipients, index) => (
          <FormControl
            key={index}
            id={`petition-recipients-${index}`}
            ref={recipientGroupFormControlRef[index]}
            isInvalid={
              showErrors && (recipients.length === 0 || invalidRecipients(index).length > 0)
            }
          >
            <FormLabel display="flex" alignItems="center" fontWeight="normal">
              <FormattedMessage
                id="component.recipient-select-groups.for-label"
                defaultMessage="{total, plural, =1{For:} other{(Parallel {number}) For:}}"
                values={{ total: recipientGroups.length, number: index + 1 }}
              />
              {canAddRecipientGroups && index === 0 ? (
                <HelpPopover>
                  <Stack>
                    <Text fontSize="sm">
                      <FormattedMessage
                        id="component.recipient-select-groups.recipients-description"
                        defaultMessage="The recipients of each parallel will answer the same form."
                      />
                    </Text>
                    <Stack spacing={0.5}>
                      <HStack>
                        <Text>{untranslated("Parallel 1:")}</Text>
                        <Image
                          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/multiple-recipient-group.svg`}
                        />
                      </HStack>
                      <HStack>
                        <Text>{untranslated("Parallel 2:")}</Text>
                        <Image
                          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/individual-recipient-group.svg`}
                        />
                      </HStack>
                    </Stack>
                  </Stack>
                </HelpPopover>
              ) : null}
            </FormLabel>
            <Flex>
              <Box flex="1" minWidth={0} data-section="recipient-select">
                <ContactSelect
                  ref={recipientGroupSelectRef[index]}
                  data-testid="petition-recipient-select"
                  isMulti
                  placeholder={intl.formatMessage({
                    id: "component.recipient-select-groups.recipients-placeholder",
                    defaultMessage: "Enter recipients...",
                  })}
                  isDisabled={maxGroups < 1}
                  value={recipients}
                  onChange={handleRecipientsChange(index)}
                  onCreateContact={async (data: any) => await handleCreateContact(index, data)}
                  onSearchContacts={onSearchContacts}
                  onPasteEmails={
                    canAddRecipientGroups
                      ? (emails: string[][]) => handlePasteEmails(index, emails)
                      : undefined
                  }
                />
              </Box>
              {index > 0 ? (
                <IconButton
                  marginLeft={2}
                  variant="ghost"
                  aria-label={intl.formatMessage({
                    id: "component.recipient-select-groups.delete-group-label",
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
      {recipientGroups.length === 1 &&
      validRecipients(0).length >= 2 &&
      invalidRecipients(0).length === 0 ? (
        <CloseableAlert status="info" marginTop={2} borderRadius="base">
          <AlertIcon />
          <Text display="block">
            <FormattedMessage
              id="component.recipient-select-groups.same-petition-warning"
              defaultMessage="Recipients will receive <b>a single parallel</b>. Add another parallel to send them separate forms."
            />
          </Text>
        </CloseableAlert>
      ) : null}
      {canAddRecipientGroups ? (
        <Flex justifyContent="flex-start" alignItems="center">
          <Button
            data-testid="petition-add-recipient-group-button"
            variant="outline"
            color="gray.900"
            fontWeight={500}
            size="sm"
            fontSize="md"
            isDisabled={maxGroups <= recipientGroups.length}
            leftIcon={
              <Circle backgroundColor="primary.500" size={4}>
                <AddIcon color="white" fontSize="2xs" aria-hidden="true" />
              </Circle>
            }
            onClick={addRecipientGroup}
          >
            <FormattedMessage
              id="component.recipient-select-groups.add-another-parallel"
              defaultMessage="Add another parallel"
            />
          </Button>
        </Flex>
      ) : null}
      {bouncedEmailRecipients.length ? (
        <CloseableAlert
          status="warning"
          backgroundColor="orange.100"
          borderRadius="base"
          marginTop={2}
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
    </Stack>
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
          id="component.multiple-emails-pasted-dialog.header"
          defaultMessage="Multiple emails"
        />
      }
      body={
        <>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.multiple-emails-pasted-dialog.message-1"
                defaultMessage="You have pasted multiple emails from the clipboard."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.multiple-emails-pasted-dialog.message-2"
                defaultMessage="Do you want to create separate parallels so that each person can reply individually, or do you prefer that they complete the same parallel collaboratively?"
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
                id="component.multiple-emails-pasted-dialog.separate-parallels"
                defaultMessage="Create separate parallels"
              />
            </Radio>
            <Radio value="SAME_GROUP">
              <FormattedMessage
                id="component.multiple-emails-pasted-dialog.same-parallel"
                defaultMessage="Send the same to everyone"
              />
            </Radio>
          </RadioGroup>
        </>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}
