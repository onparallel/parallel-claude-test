import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { BreakLines } from "@parallel/components/common/BreakLines";
import { Linkify } from "@parallel/components/common/Linkify";
import { RecipientViewPetitionFieldCard_PublicPetitionFieldFragment } from "@parallel/graphql/__types";
import { RecipientViewFieldAttachment } from "./RecipientViewFieldAttachment";

export interface RecipientViewPetitionFieldHeadingProps {
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  onDownloadAttachment: (attachmentId: string) => void;
}

export function RecipientViewPetitionFieldHeading({
  field,
  onDownloadAttachment,
}: RecipientViewPetitionFieldHeadingProps) {
  return (
    <Stack as="header" id={`field-${field.id}`} spacing={1} paddingX={2} paddingY={2}>
      {field.title ? <Heading size="md">{field.title}</Heading> : null}
      {field.description ? (
        <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
          <Linkify>
            <BreakLines>{field.description}</BreakLines>
          </Linkify>
        </Text>
      ) : null}
      {field.attachments.length ? (
        <Box>
          <Flex flexWrap="wrap" margin={-1}>
            {field.attachments.map((attachment) => (
              <RecipientViewFieldAttachment
                key={attachment.id}
                attachment={attachment}
                margin={1}
                onClick={() => onDownloadAttachment(attachment.id)}
              />
            ))}
          </Flex>
        </Box>
      ) : null}
    </Stack>
  );
}
