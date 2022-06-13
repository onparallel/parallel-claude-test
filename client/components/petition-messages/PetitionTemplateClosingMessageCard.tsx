import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { EmailIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionLocale,
  PetitionTemplateClosingMessageCard_PetitionTemplateFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/placeholders/textWithPlaceholderToSlateNodes";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/slate/placeholders/usePetitionMessagePlaceholderOptions";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { outdent } from "outdent";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { MessageClosingEmailEditor } from "../petition-common/MessageClosingEmailEditor";

interface PetitionTemplateClosingMessageCardProps {
  petition: PetitionTemplateClosingMessageCard_PetitionTemplateFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
}

const messages: Record<PetitionLocale, string> = {
  en: outdent`
    Dear #contact-first-name#,

    We have reviewed all the information that we requested, and we can confirm that everything is correct.

    Let us know if you have any questions or comments.
    
    Best regards.
  `,
  es: outdent`
    Apreciado/a #contact-first-name#,

    Le comunicamos que hemos revisado toda la información que le requerimos y le confirmamos que está todo correcto.
    
    Quedamos a su entera disposición para aclarar o comentar cualquier aspecto que considere oportuno.
    
    Reciba un cordial saludo.
  `,
};

export const PetitionTemplateClosingMessageCard = Object.assign(
  chakraForwardRef<"section", PetitionTemplateClosingMessageCardProps>(
    function PetitionTemplateClosingMessageCard({ petition, onUpdatePetition, ...props }, ref) {
      const placeholders = usePetitionMessagePlaceholderOptions();
      const [closingEmailBody, setClosingEmailBody] = useState<RichTextEditorValue>(
        petition.closingEmailBody ??
          textWithPlaceholderToSlateNodes(messages[petition.locale], placeholders)
      );

      const handleclosingEmailBodyChange = (value: RichTextEditorValue) => {
        setClosingEmailBody(value);
        onUpdatePetition({ closingEmailBody: isEmptyRTEValue(value) ? null : value });
      };

      const permissionType = petition.myEffectivePermission?.permissionType ?? "READ";

      return (
        <Card ref={ref} {...props}>
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
              isReadOnly={petition.isRestricted || petition.isPublic || permissionType === "READ"}
            />
          </Box>
        </Card>
      );
    }
  ),
  {
    fragments: {
      PetitionTemplate: gql`
        fragment PetitionTemplateClosingMessageCard_PetitionTemplate on PetitionTemplate {
          id
          closingEmailBody
          isRestricted
          isPublic
          locale
          myEffectivePermission {
            permissionType
          }
        }
      `,
    },
  }
);
