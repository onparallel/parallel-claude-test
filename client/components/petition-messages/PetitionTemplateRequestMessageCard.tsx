import { gql } from "@apollo/client";
import { FormControl, FormLabel } from "@chakra-ui/react";
import { EmailIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { Box, HStack, Stack, Text } from "@parallel/components/ui";
import {
  PetitionTemplateRequestMessageCard_PetitionTemplateFragment,
  PetitionTemplateRequestMessageCard_UserFragment,
  UpdatePetitionInput,
  UserSelect_UserFragment,
} from "@parallel/graphql/__types";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { HelpPopover } from "../common/HelpPopover";
import { UserSelect } from "../common/UserSelect";
import { MessageEmailBodyFormControl } from "../petition-common/MessageEmailBodyFormControl";
import { MessageEmailSubjectFormControl } from "../petition-common/MessageEmailSubjectFormControl";

interface PetitionTemplateRequestMessageCardProps {
  petition: PetitionTemplateRequestMessageCard_PetitionTemplateFragment;
  user: PetitionTemplateRequestMessageCard_UserFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  isDisabled: boolean;
}

export const PetitionTemplateRequestMessageCard = chakraComponent<
  "section",
  PetitionTemplateRequestMessageCardProps
>(function PetitionTemplateRequestMessageCard({
  ref,
  petition,
  user,
  onUpdatePetition,
  isDisabled,
  ...props
}) {
  const [messages, setMessages] = useState({
    emailSubject: petition.emailSubject ?? "",
    emailBody: petition.emailBody ?? emptyRTEValue(),
  });

  const [onBehalf, setOnBehalf] = useState<UserSelect_UserFragment | null>(
    petition.defaultOnBehalf ?? null,
  );

  const handleMessagesEmailSubjectChange = (emailSubject: string) => {
    if (emailSubject === messages.emailSubject) return;
    setMessages({ ...messages, emailSubject });
    onUpdatePetition({ emailSubject });
  };

  const handleMessagesEmailBodyChange = (emailBody: RichTextEditorValue) => {
    setMessages({ ...messages, emailBody });
    onUpdatePetition({ emailBody: isEmptyRTEValue(emailBody) ? null : emailBody });
  };

  const _handleSearchUsers = useSearchUsers();

  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeIds: [...excludeUsers],
      });
    },
    [_handleSearchUsers],
  );

  const handleDefaultOnBehalf = (user: UserSelect_UserFragment | null) => {
    setOnBehalf(user);
    onUpdatePetition({ defaultOnBehalfId: user?.id ?? null });
  };

  return (
    <Card ref={ref} {...props}>
      <CardHeader leftIcon={<EmailIcon marginEnd={2} role="presentation" />}>
        <FormattedMessage
          id="component.petition-template-request-message.card-header"
          defaultMessage="Parallel message"
        />
      </CardHeader>

      <Stack padding={4} gap={3}>
        <Text>
          <FormattedMessage
            id="component.petition-template-request-message.card-explainer"
            defaultMessage="This message will be used <b>when sending</b> the parallel to the recipients."
          />
        </Text>
        {user.hasOnBehalfOf ? (
          <FormControl isDisabled={isDisabled}>
            <HStack marginBottom={2}>
              <FormLabel fontWeight="normal" margin={0}>
                <FormattedMessage
                  id="component.petition-template-request-message.send-as"
                  defaultMessage="Send as..."
                />
              </FormLabel>
              <HelpPopover>
                <Text>
                  <FormattedMessage
                    id="component.petition-template-request-message.send-as-help"
                    defaultMessage="Default option. If the user cannot send on behalf of the chosen user, the user's own email would be used by default."
                  />
                </Text>
              </HelpPopover>
            </HStack>
            <UserSelect
              onSearch={handleSearchUsers}
              value={onBehalf}
              onChange={handleDefaultOnBehalf}
              isClearable
            />
          </FormControl>
        ) : null}
        <Box>
          <MessageEmailSubjectFormControl
            id={`request-message-${petition.id}-subject`}
            value={messages.emailSubject}
            onChange={handleMessagesEmailSubjectChange}
            petition={petition}
            isDisabled={isDisabled}
          />

          <MessageEmailBodyFormControl
            id={`request-message-${petition.id}-body`}
            marginTop={4}
            value={messages.emailBody}
            onChange={handleMessagesEmailBodyChange}
            petition={petition}
            isDisabled={isDisabled}
          />
        </Box>
      </Stack>
    </Card>
  );
});

const _fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateRequestMessageCard_PetitionTemplate on PetitionTemplate {
      id
      emailSubject
      emailBody
      defaultOnBehalf {
        ...UserSelect_User
      }

      ...MessageEmailSubjectFormControl_PetitionBase
      ...MessageEmailBodyFormControl_PetitionBase
    }
  `,
  User: gql`
    fragment PetitionTemplateRequestMessageCard_User on User {
      id
      hasOnBehalfOf: hasFeatureFlag(featureFlag: ON_BEHALF_OF)
    }
  `,
};
