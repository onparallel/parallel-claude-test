import { gql } from "@apollo/client";
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
import { RecipientSelectGroups_PetitionFragment } from "@parallel/graphql/__types";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { useUpdateContact } from "@parallel/utils/mutations/useUpdateContact";
import { untranslated } from "@parallel/utils/untranslated";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useSearchContactsByEmail } from "@parallel/utils/useSearchContactsByEmail";
import { isValidEmail } from "@parallel/utils/validation";
import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { differenceWith, isNonNullish, unique, uniqueBy, zip } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import {
  RecipientSuggestion,
  RecipientSuggestionProps,
} from "../petition-common/RecipientSuggestion";
import { CloseableAlert } from "./CloseableAlert";
import {
  ContactSelect,
  ContactSelectInstance,
  ContactSelectProps,
  ContactSelectSelection,
} from "./ContactSelect";
import { HelpPopover } from "./HelpPopover";
import { Link } from "./Link";
import { SuggestionsButton } from "./SuggestionsButton";
import { ConfirmDialog } from "./dialogs/ConfirmDialog";
import { DialogProps, isDialogError, useDialog } from "./dialogs/DialogProvider";
import { useErrorDialog } from "./dialogs/ErrorDialog";

interface RecipientSelectGroupsProps {
  showErrors?: boolean;
  petition: RecipientSelectGroups_PetitionFragment;
  recipientGroups: ContactSelectSelection[][];
  onChangeRecipientGroups: (groups: ContactSelectSelection[][]) => void;
  onSearchContacts: ContactSelectProps["onSearchContacts"];
  onCreateContact: ContactSelectProps["onCreateContact"];
  canAddRecipientGroups?: boolean;
  maxGroups: number;
}
export function RecipientSelectGroups({
  showErrors,
  petition,
  recipientGroups,
  canAddRecipientGroups,
  maxGroups,
  onChangeRecipientGroups,
  onSearchContacts,
  onCreateContact,
}: RecipientSelectGroupsProps) {
  const intl = useIntl();
  const recipientGroupSelectRef = useMultipleRefs<ContactSelectInstance<true>>();
  const recipientGroupFormControlRef = useMultipleRefs<HTMLDivElement>();

  const [showSuggestionGroup, setShowSuggestionGroup] = useState<boolean[]>(
    recipientGroups.map((group) => group.length === 0),
  );

  const handleSearchContactsByEmail = useSearchContactsByEmail();

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
    const contacts = await handleSearchContactsByEmail(allEmails);

    const unknownEmails = unique(
      zip(contacts, allEmails)
        .map(([contact, email]) => (!contact ? email : null))
        .filter(isNonNullish),
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
        newRecipientGroups[i + groupNumber] = uniqueBy(
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
    setShowSuggestionGroup([...showSuggestionGroup, true]);
  }

  function deleteRecipientGroup(index: number) {
    onChangeRecipientGroups(recipientGroups.filter((_, i) => i !== index));
    setShowSuggestionGroup(showSuggestionGroup.filter((_, i) => i !== index));
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

  async function handleCreateContact(
    groupNumber: number,
    data: { email?: string; firstName?: string; lastName?: string },
  ) {
    const contact = await onCreateContact(data);
    setTimeout(() => recipientGroupSelectRef[groupNumber].current?.focus());
    return contact;
  }

  const bouncedEmailRecipients = recipientGroups.flatMap((group) =>
    group.filter((contact) => contact.hasBouncedEmail),
  );

  const toggleSuggestionGroup = (index: number, forceState?: boolean) => {
    setShowSuggestionGroup((prev) => {
      const newShowSuggestionGroup = [...prev];
      newShowSuggestionGroup[index] = forceState ?? !prev[index];
      return newShowSuggestionGroup;
    });
  };

  const updateContact = useUpdateContact();

  const handleSuggestionClick = async (
    groupNumber: number,
    suggestion: RecipientSuggestionProps,
  ) => {
    try {
      const { email, firstName, lastName } = suggestion;
      const [contact] = await handleSearchContactsByEmail([email]);
      const addNewContact = handleRecipientsChange(groupNumber);

      if (!contact) {
        const newContact = await handleCreateContact(groupNumber, {
          email,
          firstName,
          lastName,
        });
        if (isNonNullish(newContact)) {
          addNewContact([...recipientGroups[groupNumber], newContact]);
        }
      } else {
        const contactNeedsUpdate =
          (isNonNullish(firstName) && firstName.length && contact.firstName !== firstName) ||
          (isNonNullish(lastName) && lastName.length && contact.lastName !== lastName);

        const updatedContact = contactNeedsUpdate
          ? await updateContact({ id: contact.id, firstName, lastName })
          : contact;

        if (isNonNullish(updatedContact)) {
          addNewContact([...recipientGroups[groupNumber], updatedContact]);
        }
      }
      toggleSuggestionGroup(groupNumber, false);
    } catch {}
  };

  const fieldLogic = useFieldLogic(petition);
  const allFieldsWithIndices = useFieldsWithIndices(petition);
  // filter visible fields
  const fieldsWithIndices = zip(allFieldsWithIndices, fieldLogic)
    .filter(([[field], { isVisible }]) => isVisible && isNonNullish(field))
    .map(([[field, fieldIndex, childrenFieldIndices], { groupChildrenLogic }]) => {
      return [
        field.type === "FIELD_GROUP"
          ? {
              ...field,
              replies: field.replies.map((r, groupIndex) => ({
                ...r,
                children: r.children?.filter(
                  (_, childReplyIndex) =>
                    groupChildrenLogic?.[groupIndex][childReplyIndex].isVisible ?? false,
                ),
              })),
            }
          : field,
        fieldIndex,
        childrenFieldIndices,
      ] as const;
    });

  const hasLinkedFieldGroupReplied = fieldsWithIndices.some(
    ([f]) =>
      f.type === "FIELD_GROUP" &&
      f.isLinkedToProfileType &&
      f.replies.some((r) =>
        r.children?.some((c) => c.replies.some((cr) => isNonNullish(cr.content))),
      ),
  );

  const fieldsWithIndicesRepliedWithEmail = useMemo(
    () =>
      fieldsWithIndices.filter(([field]) => {
        if (field.type === "SHORT_TEXT") {
          return (
            (field.alias?.includes("email") || field.options.format === "EMAIL") &&
            field.replies.some((r) => isValidEmail(r.content?.value ?? ""))
          );
        } else if (field.type === "FIELD_GROUP") {
          return field.replies.some((r) =>
            r.children?.some(
              (c) =>
                (c.field.alias?.toLowerCase().includes("email") ||
                  (c.field.isLinkedToProfileTypeField &&
                    c.field.profileTypeField?.alias?.toLowerCase().includes("email")) ||
                  c.field.options.format === "EMAIL") &&
                c.replies.some((cr) => isNonNullish(cr.content)),
            ),
          );
        }
        return false;
      }),
    [fieldsWithIndices],
  );

  const suggestions = useMemo(
    () =>
      fieldsWithIndicesRepliedWithEmail.flatMap(([field, index]) => {
        if (field.type === "SHORT_TEXT") {
          return field.replies
            .map((r) => {
              if (isValidEmail(r.content?.value ?? "")) {
                return {
                  email: r.content.value,
                  petitionField: field,
                  petitionFieldIndex: index,
                };
              }
              return null;
            })
            .filter(isNonNullish);
        } else if (field.type === "FIELD_GROUP") {
          return field.replies
            .map((r, i) => {
              const suggestion = {
                petitionField: field,
                petitionFieldIndex: index,
                groupName: field.options?.groupName
                  ? `${field.options?.groupName} ${field.replies.length > 1 ? i + 1 : ""}`.trim()
                  : undefined,
              } as any;

              r.children?.map(({ field, replies }) => {
                const value = replies[0]?.content?.value;
                const profileTypeFieldAlias = field.profileTypeField?.alias;

                if (field.type === "SHORT_TEXT" && isNonNullish(value)) {
                  if (
                    field.options?.format === "EMAIL" ||
                    field.alias?.toLowerCase().includes("email") ||
                    profileTypeFieldAlias?.toLowerCase().includes("email")
                  ) {
                    suggestion.email = value;
                  } else if (
                    /^(?!.*last).*name/i.test(field.alias ?? profileTypeFieldAlias ?? "")
                  ) {
                    suggestion.firstName = value;
                  } else if (/last[_\s-]*name/i.test(field.alias ?? profileTypeFieldAlias ?? "")) {
                    suggestion.lastName = value;
                  }
                }
              });

              return suggestion;
            })
            .filter((s) => isNonNullish(s.email));
        }
      }),
    [fieldsWithIndicesRepliedWithEmail],
  );

  return (
    <Stack>
      <Stack margin={-1} padding={1} overflow="auto" maxHeight="240px">
        {recipientGroups.map((recipients, index) => {
          const filteredSuggestions = differenceWith(
            suggestions,
            recipients,
            (s, r) => s.email === r.email,
          );
          return (
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
                {!hasLinkedFieldGroupReplied && canAddRecipientGroups && index === 0 ? (
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
                            src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/multiple-recipient-group.svg`}
                          />
                        </HStack>
                        <HStack>
                          <Text>{untranslated("Parallel 2:")}</Text>
                          <Image
                            src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/individual-recipient-group.svg`}
                          />
                        </HStack>
                      </Stack>
                    </Stack>
                  </HelpPopover>
                ) : null}
              </FormLabel>
              <HStack>
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
                      !hasLinkedFieldGroupReplied && canAddRecipientGroups
                        ? (emails: string[][]) => handlePasteEmails(index, emails)
                        : undefined
                    }
                  />
                </Box>
                {index > 0 ? (
                  <IconButton
                    variant="ghost"
                    aria-label={intl.formatMessage({
                      id: "component.recipient-select-groups.delete-group-label",
                      defaultMessage: "Delete recipient group",
                    })}
                    onClick={() => deleteRecipientGroup(index)}
                    icon={<DeleteIcon />}
                  />
                ) : null}
                {filteredSuggestions.length ? (
                  <SuggestionsButton
                    areSuggestionsVisible={showSuggestionGroup[index]}
                    onClick={() => {
                      toggleSuggestionGroup(index);
                    }}
                    size="md"
                  />
                ) : null}
              </HStack>
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
              {showSuggestionGroup[index] && filteredSuggestions.length ? (
                <HStack wrap="wrap" paddingTop={1}>
                  {filteredSuggestions.map((suggestion, i) => {
                    return (
                      <RecipientSuggestion
                        key={i}
                        {...suggestion}
                        onClick={() => handleSuggestionClick(index, suggestion)}
                      />
                    );
                  })}
                </HStack>
              ) : null}
            </FormControl>
          );
        })}
      </Stack>
      {recipientGroups.length === 1 &&
      validRecipients(0).length >= 2 &&
      invalidRecipients(0).length === 0 ? (
        <CloseableAlert status="info" marginTop={2} rounded="md">
          <AlertIcon />
          <AlertDescription>
            <Text>
              <FormattedMessage
                id="component.recipient-select-groups.same-petition-warning"
                defaultMessage="Recipients will receive <b>a single parallel</b>. Add another parallel to send them separate forms."
              />
            </Text>
          </AlertDescription>
        </CloseableAlert>
      ) : null}
      {!hasLinkedFieldGroupReplied && canAddRecipientGroups ? (
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
          <AlertIcon />
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
            <UnorderedList paddingStart={2}>
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
      content={{
        containerProps: { as: "form", onSubmit: () => props.onResolve(action) },
      }}
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

RecipientSelectGroups.fragments = {
  PetitionField: gql`
    fragment RecipientSelectGroups_PetitionField on PetitionField {
      id
      ...RecipientSuggestion_PetitionField
    }
    ${RecipientSuggestion.fragments.PetitionField}
  `,
  Petition: gql`
    fragment RecipientSelectGroups_Petition on Petition {
      id
      fields {
        ...RecipientSelectGroups_PetitionField
        id
        alias
        options
        isLinkedToProfileType
        isLinkedToProfileTypeField
        profileTypeField {
          id
          alias
        }
        replies {
          id
          content
          children {
            field {
              id
              alias
              type
              title
              options
              isLinkedToProfileTypeField
              profileTypeField {
                id
                alias
              }
            }
            replies {
              id
              content
            }
          }
        }
      }
      ...useFieldsWithIndices_PetitionBase
      ...useFieldLogic_PetitionBase
    }
    ${useFieldsWithIndices.fragments.PetitionBase}
    ${useFieldLogic.fragments.PetitionBase}
  `,
};
