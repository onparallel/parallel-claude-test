import { Box, Heading, Stack, Textarea } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { UpdatePetitionInput, Maybe } from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useState, ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export type PetitionTemplateDescriptionEditProps = ExtendChakra<{
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  description?: Maybe<string>;
}>;

export function PetitionTemplateDescriptionEdit({
  onUpdatePetition,
  description,
  ...props
}: PetitionTemplateDescriptionEditProps) {
  const intl = useIntl();
  const updatePetition = useDebouncedCallback(onUpdatePetition, 500, []);
  const [templateDescription, setDescription] = useState(description ?? "");
  const handleUpdateDescription = useCallback((value: string) => {
    setDescription(value);
    updatePetition({ description: value || null });
  }, []);

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
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            handleUpdateDescription(event.target.value)
          }
          placeholder={intl.formatMessage({
            id: "template.description-edit.placeholder",
            defaultMessage: "Write a short description of this template.",
          })}
        />
      </Stack>
    </Card>
  );
}
