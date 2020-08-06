import { Stack, Text, Heading } from "@chakra-ui/core";
import { PetitionRepliesField_PetitionFieldFragment } from "@parallel/graphql/__types";
import { BreakLines } from "../common/BreakLines";

export type PetitionRepliesHeadingFieldProps = {
  field: PetitionRepliesField_PetitionFieldFragment;
};

export function PetitionRepliesHeadingField({
  field,
}: PetitionRepliesHeadingFieldProps) {
  return (
    <Stack spacing={1} id={`field-${field.id}`} key={field.id}>
      {field.title ? (
        <Heading size="md">{field.title || "Untitled heading"}</Heading>
      ) : null}
      {field.description ? (
        <Text
          color="gray.600"
          height="1rem"
          fontSize="sm"
          fontStyle="italic"
          overflowWrap="anywhere"
        >
          <BreakLines text={field.description} />
        </Text>
      ) : null}
    </Stack>
  );
}
