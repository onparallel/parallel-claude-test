import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/react";
import { EmailIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
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
import { UserSelect } from "../common/UserSelect";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";

interface PetitionTemplateRequestMessageCardProps {
  petition: PetitionTemplateRequestMessageCard_PetitionTemplateFragment;
  user: PetitionTemplateRequestMessageCard_UserFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
}

export const PetitionTemplateRequestMessageCard = Object.assign(
  chakraForwardRef<"section", PetitionTemplateRequestMessageCardProps>(
    function PetitionTemplateRequestMessageCard(
      { petition, user, onUpdatePetition, ...props },
      ref
    ) {
      const [messages, setMessages] = useState({
        emailSubject: petition.emailSubject ?? "",
        emailBody: petition.emailBody ?? emptyRTEValue(),
      });

      const [onBehalf, setOnBehalf] = useState<UserSelect_UserFragment | null>(null);

      const handleMessagesEmailSubjectChange = (emailSubject: string) => {
        if (emailSubject === messages.emailSubject) return;
        setMessages({ ...messages, emailSubject });
        onUpdatePetition({ emailSubject });
      };

      const handleMessagesEmailBodyChange = (emailBody: RichTextEditorValue) => {
        setMessages({ ...messages, emailBody });
        onUpdatePetition({ emailBody: isEmptyRTEValue(emailBody) ? null : emailBody });
      };

      const myEffectivePermission = petition.myEffectivePermission!.permissionType;

      const _handleSearchUsers = useSearchUsers();

      const handleSearchUsers = useCallback(
        async (search: string, excludeUsers: string[]) => {
          return await _handleSearchUsers(search, {
            excludeUsers: [...excludeUsers],
          });
        },
        [_handleSearchUsers]
      );

      const handleDefaultOnBehalf = (user: UserSelect_UserFragment | null) => {
        setOnBehalf(user);
        onUpdatePetition({ defaultOnBehalfId: user?.id ?? null });
      };

      return (
        <Card ref={ref} {...props}>
          <CardHeader leftIcon={<EmailIcon marginRight={2} role="presentation" />}>
            <FormattedMessage
              id="component.petition-template-request-message.card-header"
              defaultMessage="Parallel message"
            />
          </CardHeader>

          <Stack padding={4} spacing={3}>
            <Text>
              <FormattedMessage
                id="component.petition-template-request-message.card-explainer"
                defaultMessage="This message will be used <b>when sending</b> the parallel to the recipients."
              />
            </Text>
            {user.hasOnBehalfOf ? (
              <>
                <Text fontWeight={500}>
                  <FormattedMessage
                    id="component.petition-template-request-message.send-as"
                    defaultMessage="Send as..."
                  />
                </Text>
                <UserSelect
                  onSearch={handleSearchUsers}
                  value={onBehalf}
                  onChange={handleDefaultOnBehalf}
                  isClearable
                />
              </>
            ) : null}

            <MessageEmailEditor
              id={`request-message-${petition.id}`}
              showErrors={false}
              subject={messages.emailSubject}
              body={messages.emailBody}
              onSubjectChange={handleMessagesEmailSubjectChange}
              onBodyChange={handleMessagesEmailBodyChange}
              isReadOnly={
                petition.isRestricted || petition.isPublic || myEffectivePermission === "READ"
              }
            />
          </Stack>
        </Card>
      );
    }
  ),
  {
    fragments: {
      PetitionTemplate: gql`
        fragment PetitionTemplateRequestMessageCard_PetitionTemplate on PetitionTemplate {
          id
          emailSubject
          emailBody
          isRestricted
          isPublic
          myEffectivePermission {
            permissionType
          }
        }
      `,
      User: gql`
        fragment PetitionTemplateRequestMessageCard_User on User {
          id
          hasOnBehalfOf: hasFeatureFlag(featureFlag: ON_BEHALF_OF)
        }
      `,
    },
  }
);
