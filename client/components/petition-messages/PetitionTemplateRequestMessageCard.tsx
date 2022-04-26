import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { EmailIcon } from "@parallel/chakra/icons";
import {
  PetitionTemplateRequestMessageCard_PetitionTemplateFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Card, CardHeader, CardProps } from "../common/Card";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";

interface PetitionTemplateRequestMessageCardProps extends CardProps {
  petition: PetitionTemplateRequestMessageCard_PetitionTemplateFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
}

export function PetitionTemplateRequestMessageCard({
  petition,
  onUpdatePetition,
  ...props
}: PetitionTemplateRequestMessageCardProps) {
  const [messages, setMessages] = useState({
    emailSubject: petition.emailSubject ?? "",
    emailBody: petition.emailBody ?? emptyRTEValue(),
  });

  const handleMessagesEmailSubjectChange = (emailSubject: string) => {
    if (emailSubject === messages.emailSubject) return;
    setMessages({ ...messages, emailSubject });
    onUpdatePetition({ emailSubject });
  };

  const handleMessagesEmailBodyChange = (emailBody: RichTextEditorValue) => {
    setMessages({ ...messages, emailBody });
    onUpdatePetition({ emailBody: isEmptyRTEValue(emailBody) ? null : emailBody });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <EmailIcon marginRight={2} />
        <FormattedMessage
          id="component.petition-template-request-message.card-header"
          defaultMessage="Petition message"
        />
      </CardHeader>
      <Box padding={4}>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.petition-template-request-message.card-explainer"
            defaultMessage="This message will be used <b>when sending</b> the petition to the recipients."
          />
        </Text>
        <MessageEmailEditor
          id={`request-message-${petition.id}`}
          showErrors={false}
          subject={messages.emailSubject}
          body={messages.emailBody}
          onSubjectChange={handleMessagesEmailSubjectChange}
          onBodyChange={handleMessagesEmailBodyChange}
          isReadOnly={petition.isRestricted || petition.isPublic}
        />
      </Box>
    </Card>
  );
}

PetitionTemplateRequestMessageCard.fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateRequestMessageCard_PetitionTemplate on PetitionTemplate {
      id
      emailSubject
      emailBody
      isRestricted
      isPublic
    }
  `,
};
