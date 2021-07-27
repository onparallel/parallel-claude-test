import { Box, BoxProps } from "@chakra-ui/react";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { UpdatePetitionInput } from "@parallel/graphql/__types";
import { emptyRTEValue } from "@parallel/utils/slate/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/isEmptyRTEValue";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { RichTextEditor, RichTextEditorValue } from "../common/RichTextEditor";

export interface PetitionTemplateDescriptionEditProps extends BoxProps {
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  description: RichTextEditorValue;
  isReadOnly?: boolean;
}

export function PetitionTemplateDescriptionEdit({
  onUpdatePetition,
  description,
  isReadOnly,
  ...props
}: PetitionTemplateDescriptionEditProps) {
  const intl = useIntl();
  const updatePetition = useDebouncedCallback(onUpdatePetition, 500, [
    onUpdatePetition,
  ]);
  const [templateDescription, setDescription] = useState(
    description ?? emptyRTEValue()
  );
  const handleUpdateDescription = useCallback(
    (value: RichTextEditorValue) => {
      setDescription(value);
      updatePetition({ description: isEmptyRTEValue(value) ? null : value });
    },
    [updatePetition]
  );

  return (
    <Card id="petition-template-description-edit" {...props}>
      <CardHeader>
        <FormattedMessage
          id="template.description-edit.header"
          defaultMessage="A description of this template"
        />
      </CardHeader>
      <Box padding={4}>
        <RichTextEditor
          id="template-description"
          value={templateDescription}
          onChange={handleUpdateDescription}
          placeholder={intl.formatMessage({
            id: "template.description-edit.placeholder",
            defaultMessage: "Write a short description of this template.",
          })}
          isDisabled={isReadOnly}
        />
      </Box>
    </Card>
  );
}
