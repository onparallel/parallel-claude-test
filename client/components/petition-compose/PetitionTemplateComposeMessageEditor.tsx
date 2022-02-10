import { gql } from "@apollo/client";
import { Box, BoxProps, Heading, Stack } from "@chakra-ui/react";
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

  const updatePetition = useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]);

  const isPublicTemplate = petition?.__typename === "PetitionTemplate" && petition.isPublic;

  const handleSubjectChange = useCallback(
    (value: string) => {
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

  return (
    <Card id="petition-template-message-compose" {...props}>
      <Box padding={4} borderBottom="1px solid" borderBottomColor="gray.200">
        <Heading as="h2" size="sm">
          <FormattedMessage
            id="template.message-settings.header"
            defaultMessage="Email to send with the template"
          />
        </Heading>
      </Box>
      <Stack spacing={2} padding={4}>
        <MessageEmailEditor
          id={petition.id}
          showErrors={false}
          subject={subject}
          body={body}
          onSubjectChange={handleSubjectChange}
          onBodyChange={handleBodyChange}
          isReadOnly={petition.isRestricted || isPublicTemplate}
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
      isRestricted
      isPublic
    }
  `,
};
