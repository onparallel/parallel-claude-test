import { gql } from "@apollo/client";
import { BoxProps, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import {
  PetitionTemplateComposeMessageEditor_PetitionFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { MessageClosingEmailEditor } from "../petition-common/MessageClosingEmailEditor";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";

export interface PetitionTemplateComposeMessageEditorProps extends BoxProps {
  petition: PetitionTemplateComposeMessageEditor_PetitionFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
}

export function PetitionTemplateComposeMessageEditor({
  petition,
  onUpdatePetition,
  ...props
}: PetitionTemplateComposeMessageEditorProps) {
  const [subject, setSubject] = useState(petition.emailSubject ?? "");
  const [body, setBody] = useState<RichTextEditorValue>(petition.emailBody ?? emptyRTEValue());
  const [closingEmailBody, setClosingEmailBody] = useState<RichTextEditorValue>(
    petition.closingEmailBody ?? emptyRTEValue()
  );

  const updatePetition = useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]);

  const isPublicTemplate = petition?.__typename === "PetitionTemplate" && petition.isPublic;

  const handleSubjectChange = useCallback(
    (value: string) => {
      if (value === subject) return;
      setSubject(value);
      updatePetition({ emailSubject: value || null });
    },
    [updatePetition]
  );

  const handleBodyChange = useCallback(
    (value: RichTextEditorValue) => {
      setBody(value);
      updatePetition({ emailBody: isEmptyRTEValue(value) ? null : value });
    },
    [updatePetition]
  );

  const handleclosingEmailBodyChange = useCallback(
    (value: RichTextEditorValue) => {
      setClosingEmailBody(value);
      updatePetition({ closingEmailBody: isEmptyRTEValue(value) ? null : value });
    },
    [updatePetition]
  );

  return (
    <Card id="petition-template-message-compose" {...props}>
      <Tabs isLazy variant="enclosed">
        <TabList marginX="-1px" marginTop="-1px">
          <Tab padding={4} lineHeight={5} fontWeight="bold">
            <FormattedMessage
              id="component.petition-template-compose-message-editor.email-message"
              defaultMessage="Email message"
            />
          </Tab>
          <Tab padding={4} lineHeight={5} fontWeight="bold">
            <FormattedMessage
              id="component.petition-template-compose-message-editor.closing-message"
              defaultMessage="Closing message"
            />
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel padding={4}>
            <MessageEmailEditor
              id={petition.id}
              showErrors={false}
              subject={subject}
              body={body}
              onSubjectChange={handleSubjectChange}
              onBodyChange={handleBodyChange}
              isReadOnly={petition.isRestricted || isPublicTemplate}
            />
          </TabPanel>
          <TabPanel padding={4}>
            <MessageClosingEmailEditor
              id={petition.id}
              showErrors={false}
              body={closingEmailBody}
              onBodyChange={handleclosingEmailBodyChange}
              isReadOnly={petition.isRestricted || isPublicTemplate}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Card>
  );
}

PetitionTemplateComposeMessageEditor.fragments = {
  Petition: gql`
    fragment PetitionTemplateComposeMessageEditor_Petition on PetitionTemplate {
      id
      emailSubject
      emailBody
      closingEmailBody
      description
      isRestricted
      isPublic
    }
  `,
};
