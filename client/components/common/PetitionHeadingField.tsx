import { Stack, Text, Heading } from "@chakra-ui/core";
import { BreakLines } from "./BreakLines";
import { Maybe } from "@parallel/graphql/__types";

export type PetitionHeadingFieldProps = {
  id: string;
  title?: Maybe<string>;
  description?: Maybe<string>;
};

export function PetitionHeadingField({
  id,
  title,
  description,
}: PetitionHeadingFieldProps) {
  return (
    <Stack spacing={1} id={`field-${id}`} key={id}>
      {title ? (
        <Heading size="md">{title || "Untitled heading"}</Heading>
      ) : null}
      {description ? (
        <Text
          color="gray.600"
          height="1rem"
          fontSize="sm"
          fontStyle="italic"
          overflowWrap="anywhere"
        >
          <BreakLines text={description} />
        </Text>
      ) : null}
    </Stack>
  );
}
