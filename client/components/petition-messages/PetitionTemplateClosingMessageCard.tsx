import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { EmailIcon } from "@parallel/chakra/icons";
import {
  PetitionTemplateClosingMessageCard_PetitionTemplateFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Card, CardHeader, CardProps } from "../common/Card";
import { MessageClosingEmailEditor } from "../petition-common/MessageClosingEmailEditor";

interface PetitionTemplateClosingMessageCardProps extends CardProps {
  petition: PetitionTemplateClosingMessageCard_PetitionTemplateFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
}

export function PetitionTemplateClosingMessageCard({
  petition,
  onUpdatePetition,
  ...props
}: PetitionTemplateClosingMessageCardProps) {
  const [closingEmailBody, setClosingEmailBody] = useState<RichTextEditorValue>(
    petition.closingEmailBody ?? emptyRTEValue()
  );

  const handleclosingEmailBodyChange = (value: RichTextEditorValue) => {
    setClosingEmailBody(value);
    onUpdatePetition({ closingEmailBody: isEmptyRTEValue(value) ? null : value });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <EmailIcon marginRight={2} />
        <FormattedMessage
          id="component.petition-template-closing-message.card-header"
          defaultMessage="Closing message"
        />
      </CardHeader>
      <Box padding={4}>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.petition-template-closing-message.card-explainer"
            defaultMessage="This message will be used when selecting the option <b>notify recipients</b> to notify that it has been reviewed and closed."
          />
        </Text>
        <MessageClosingEmailEditor
          id={`completing-message-${petition.id}`}
          showErrors={false}
          body={closingEmailBody}
          onBodyChange={handleclosingEmailBodyChange}
          isReadOnly={petition.isRestricted || petition.isPublic}
        />
      </Box>
    </Card>
  );
}

PetitionTemplateClosingMessageCard.fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateClosingMessageCard_PetitionTemplate on PetitionTemplate {
      id
      closingEmailBody
      isRestricted
      isPublic
    }
  `,
};
