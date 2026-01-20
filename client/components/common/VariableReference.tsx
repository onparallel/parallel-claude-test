import { gql } from "@apollo/client";
import { Badge } from "@chakra-ui/react";
import { VariableReference_PetitionVariableFragment } from "@parallel/graphql/__types";
import { OverflownText } from "./OverflownText";

export function VariableReference({
  variable,
}: {
  variable: VariableReference_PetitionVariableFragment;
}) {
  return (
    <OverflownText
      as={Badge}
      colorScheme={variable.type === "ENUM" ? "green" : "blue"}
      textTransform="inherit"
      fontSize="md"
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      minWidth="0"
    >
      {variable.name}
    </OverflownText>
  );
}

const _fragments = {
  PetitionVariable: gql`
    fragment VariableReference_PetitionVariable on PetitionVariable {
      name
      type
    }
  `,
};
