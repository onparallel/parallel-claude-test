import {
  Image,
  Flex,
  FormControl,
  FormLabel,
  Box,
  IconButton,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Text,
  CloseButton,
  Stack,
} from "@chakra-ui/react";
import { DeleteIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ContactSelect,
  ContactSelectProps,
  ContactSelectSelection,
} from "./ContactSelect";
import { HelpPopover } from "./HelpPopover";

interface RecipientSelectGroupsProps {
  showErrors?: boolean;
  recipientGroups: ContactSelectSelection[][];
  setRecipientGroups: (groups: ContactSelectSelection[][]) => void;
  onSearchContacts: ContactSelectProps["onSearchContacts"];
  onCreateContact: ContactSelectProps["onCreateContact"];
  maxGroups?: number;
}
export function RecipientSelectGroups({
  showErrors,
  recipientGroups,
  maxGroups = Number.MAX_SAFE_INTEGER,
  setRecipientGroups,
  onSearchContacts,
  onCreateContact,
}: RecipientSelectGroupsProps) {
  const intl = useIntl();
  const recipientsStackRef = useRef<HTMLDivElement>(null);

  const [isAlertVisible, setAlertVisible] = useState(true);

  const setRecipients = useCallback(
    (groupNumber: number) => (recipients: ContactSelectSelection[]) => {
      if (!recipientGroups[groupNumber]) return;
      const newGroups = Array.from(recipientGroups);
      newGroups.splice(groupNumber, 1, recipients);
      setRecipientGroups(newGroups);
    },
    [recipientGroups]
  );

  const addRecipientGroup = useCallback(() => {
    setRecipientGroups([...recipientGroups, []]);
    setTimeout(() => {
      recipientsStackRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
    }, 0);
  }, [recipientGroups]);

  const deleteRecipientGroup = useCallback(
    (index: number) =>
      setRecipientGroups(recipientGroups.filter((_, i) => i !== index)),
    [recipientGroups]
  );

  const validRecipients = useCallback(
    (index: number) => recipientGroups[index].filter((r) => !r.isInvalid),
    [recipientGroups]
  );

  const invalidRecipients = useCallback(
    (index: number) => recipientGroups[index].filter((r) => r.isInvalid),
    [recipientGroups]
  );

  return (
    <>
      <Stack
        margin={-1}
        padding={1}
        overflowY="auto"
        maxHeight="240px"
        ref={recipientsStackRef}
      >
        {recipientGroups.map((recipients, index) => (
          <FormControl
            key={index}
            id={`petition-recipients-${index}`}
            isInvalid={
              showErrors &&
              (recipients.length === 0 || invalidRecipients(index).length > 0)
            }
          >
            <FormLabel display="flex" alignItems="center">
              <FormattedMessage
                id="component.recipient-select-groups.recipients-label"
                defaultMessage="Recipients"
              />
              {index === 0 ? (
                <HelpPopover marginLeft={2} placement="right">
                  <Flex fontSize="14px">
                    <Image
                      marginRight={2}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/send-petition-collaboration.svg`}
                    />
                    <FormattedMessage
                      id="component.recipient-select-groups.recipients.collaborative-label"
                      defaultMessage="Recipients will reply to the same petition."
                    ></FormattedMessage>
                  </Flex>
                </HelpPopover>
              ) : (
                <>
                  &nbsp;
                  <FormattedMessage
                    id="component.recipient-select-groups.recipients-nth-group"
                    defaultMessage="({number, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} petition)"
                    values={{ number: index + 1 }}
                  />
                </>
              )}
            </FormLabel>

            <Flex>
              <Box flex="1">
                <ContactSelect
                  placeholder={intl.formatMessage({
                    id:
                      "component.recipient-select-groups.recipients-placeholder",
                    defaultMessage: "Enter recipients...",
                  })}
                  onCreateContact={onCreateContact}
                  onSearchContacts={onSearchContacts}
                  value={recipients}
                  onChange={setRecipients(index)}
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
      {recipientGroups.length < maxGroups ? (
        <Flex alignItems="center" marginTop={4}>
          <Flex as="button" alignItems="center" onClick={addRecipientGroup}>
            <PlusCircleFilledIcon marginRight={2} fontSize="lg" />
            <FormattedMessage
              id="component.recipient-select-groups.add-recipient-group"
              defaultMessage="Add recipient group"
            />
          </Flex>
          <HelpPopover marginLeft={2} placement="right">
            <Flex fontSize="14px">
              <Image
                marginRight={2}
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/send-petition-groups.svg`}
              />
              <FormattedMessage
                id="component.recipient-select-groups.recipients.groups-label"
                defaultMessage="Add groups for recipients to reply to different petitions."
              ></FormattedMessage>
            </Flex>
          </HelpPopover>
        </Flex>
      ) : null}
      {isAlertVisible &&
      recipientGroups.length === 1 &&
      validRecipients(0).length >= 2 &&
      invalidRecipients(0).length === 0 ? (
        <Alert status="info" marginTop={4}>
          <AlertIcon />
          <Text display="block">
            <FormattedMessage
              id="component.recipient-select-groups.same-petition-warning"
              defaultMessage="All {recipientCount} recipients will receive a link to the same petition so they can fill it out collaboratively. Add a <b>recipient group</b> to send different petitions to each group."
              values={{
                recipientCount: validRecipients(0).length,
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
          <CloseButton fontSize="xs" onClick={() => setAlertVisible(false)} />
        </Alert>
      ) : null}
    </>
  );
}
