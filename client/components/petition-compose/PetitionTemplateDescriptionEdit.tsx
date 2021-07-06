import { Box, BoxProps, Heading, Stack, Textarea } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { UpdatePetitionInput } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export interface PetitionTemplateDescriptionEditProps extends BoxProps {
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  description?: Maybe<string>;
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
  const [templateDescription, setDescription] = useState(description ?? "");
  const handleUpdateDescription = useCallback(
    (value: string) => {
      setDescription(value);
      updatePetition({ description: value || null });
    },
    [updatePetition]
  );

  return (
    <Card id="petition-template-description-edit" {...props}>
      <Box padding={4} borderBottom="1px solid" borderBottomColor="gray.200">
        <Heading as="h2" size="sm">
          <FormattedMessage
            id="template.description-edit.header"
            defaultMessage="A description of this template"
          />
        </Heading>
      </Box>
      <Stack spacing={2} padding={4}>
        <Textarea
          value={templateDescription}
          maxLength={1000}
          onChange={(event) => handleUpdateDescription(event.target.value)}
          onBlur={() => setDescription(templateDescription.trim())}
          placeholder={intl.formatMessage({
            id: "template.description-edit.placeholder",
            defaultMessage: "Write a short description of this template.",
          })}
          isDisabled={isReadOnly}
        />
      </Stack>
    </Card>
  );
}
