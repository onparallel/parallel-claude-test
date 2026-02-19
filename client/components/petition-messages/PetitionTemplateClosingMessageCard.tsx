import { gql } from "@apollo/client";

import { EmailIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import {
  PetitionLocale,
  PetitionTemplateClosingMessageCard_PetitionTemplateFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/textWithPlaceholder";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/usePetitionMessagePlaceholderOptions";
import { outdent } from "outdent";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { MessageClosingEmailEditor } from "../petition-common/MessageClosingEmailEditor";
import { Box, Text } from "@parallel/components/ui";

interface PetitionTemplateClosingMessageCardProps {
  petition: PetitionTemplateClosingMessageCard_PetitionTemplateFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  isDisabled: boolean;
}

export const PETITION_CLOSING_DEFAULT_MESSAGE: Record<PetitionLocale, string> = {
  ca: outdent`
    Estimat/da {{contact-first-name}},

    Us comuniquem que hem revisat tota la informació que us vam requerir i us confirmem que està tot correcte.

    Quedem a la vostra completa disposició per aclarir o comentar qualsevol aspecte que considereu oportú.

    Rebeu una cordial salutació.
 `,
  en: outdent`
    Dear {{contact-first-name}},

    We have reviewed all the information that we requested, and we can confirm that everything is correct.

    Let us know if you have any questions or comments.

    Best regards.
  `,
  es: outdent`
    Apreciado/a {{contact-first-name}},

    Le comunicamos que hemos revisado toda la información que le requerimos y le confirmamos que está todo correcto.

    Quedamos a su entera disposición para aclarar o comentar cualquier aspecto que considere oportuno.

    Reciba un cordial saludo.
  `,
  it: outdent`
    Gentile {{contact-first-name}},

    La informiamo che abbiamo esaminato tutte le informazioni che le abbiamo richiesto e le confermiamo che è tutto corretto.

    Siamo a sua completa disposizione per chiarire o commentare qualsiasi aspetto che ritenga opportuno.

    Cordiali saluti.
  `,
  pt: outdent`
    Caro(a) {{contact-first-name}},

    Informamos que revimos todas as informações que lhe solicitamos e confirmamos que está tudo correto.

    Estamos à sua inteira disposição para esclarecer ou comentar qualquer aspeto que considere oportuno.

    Com os melhores cumprimentos.
  `,
};

export const PetitionTemplateClosingMessageCard = chakraComponent<
  "section",
  PetitionTemplateClosingMessageCardProps
>(function PetitionTemplateClosingMessageCard({
  ref,
  petition,
  onUpdatePetition,
  isDisabled,
  ...props
}) {
  const placeholders = usePetitionMessagePlaceholderOptions({ petition });
  const [closingEmailBody, setClosingEmailBody] = useState<RichTextEditorValue>(
    petition.closingEmailBody ??
      textWithPlaceholderToSlateNodes(
        PETITION_CLOSING_DEFAULT_MESSAGE[petition.locale],
        placeholders,
      ),
  );

  const handleclosingEmailBodyChange = (value: RichTextEditorValue) => {
    setClosingEmailBody(value);
    onUpdatePetition({ closingEmailBody: isEmptyRTEValue(value) ? null : value });
  };

  return (
    <Card ref={ref} {...props}>
      <CardHeader leftIcon={<EmailIcon marginEnd={2} role="presentation" />}>
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
          petition={petition}
          isReadOnly={isDisabled}
        />
      </Box>
    </Card>
  );
});

const _fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateClosingMessageCard_PetitionTemplate on PetitionTemplate {
      id
      closingEmailBody
      locale
      ...usePetitionMessagePlaceholderOptions_PetitionBase
    }
  `,
};
