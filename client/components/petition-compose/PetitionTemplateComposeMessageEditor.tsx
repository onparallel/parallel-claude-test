import { gql } from "@apollo/client";
import { Box, Heading, Stack } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { RichTextEditorContent } from "@parallel/components/common/RichTextEditor";
import {
  PetitionTemplateComposeMessageEditor_PetitionFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isEmptyContent } from "@parallel/utils/slate/isEmptyContent";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";

export type PetitionTemplateComposeMessageEditorProps = ExtendChakra<{
  petition: PetitionTemplateComposeMessageEditor_PetitionFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
}>;

export function PetitionTemplateComposeMessageEditor({
  petition,
  onUpdatePetition,
  ...props
}: PetitionTemplateComposeMessageEditorProps) {
  const [subject, setSubject] = useState(petition.emailSubject ?? "");
  const [body, setBody] = useState<RichTextEditorContent>(
    petition.emailBody ?? [{ children: [{ text: "" }] }]
  );

  const updatePetition = useDebouncedCallback(onUpdatePetition, 500, []);

  const handleSubjectChange = useCallback((value: string) => {
    setSubject(value);
    updatePetition({ emailSubject: value || null });
  }, []);

  const handleBodyChange = useCallback((value: RichTextEditorContent) => {
    setBody(value);
    updatePetition({ emailBody: isEmptyContent(value) ? null : value });
  }, []);

  return (
    <Card id="petition-template-message-compose" {...props}>
      <Box padding={4} borderBottom="1px solid" borderBottomColor="gray.200">
        <Heading as="h2" size="sm">
          <FormattedMessage
            id="petition.message-settings.header"
            defaultMessage="Who do you want to send it to?"
          />
        </Heading>
      </Box>
      <Stack spacing={2} padding={4}>
        <MessageEmailEditor
          showErrors={false}
          subject={subject}
          body={body}
          onSubjectChange={handleSubjectChange}
          onBodyChange={handleBodyChange}
        />
      </Stack>
    </Card>
  );
}

PetitionTemplateComposeMessageEditor.fragments = {
  Petition: gql`
    fragment PetitionTemplateComposeMessageEditor_Petition on PetitionTemplate {
      id
      emailSubject
      emailBody
      description
    }
  `,
};
