import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { PetitionFieldReference_PetitionFieldFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";
import { OverflownText } from "../common/OverflownText";

export function PetitionFieldReference({
  field,
}: {
  field?: Maybe<PetitionFieldReference_PetitionFieldFragment>;
}) {
  return field ? (
    field.title ? (
      <OverflownText
        as="strong"
        display="inline-block"
        maxWidth="30rem"
        verticalAlign="bottom"
      >
        {field.title}
      </OverflownText>
    ) : (
      <Text as="span" textStyle="hint">
        <FormattedMessage
          id="generic.untitled-field"
          defaultMessage="Untitled field"
        />
      </Text>
    )
  ) : (
    <Text as="span" textStyle="hint">
      <FormattedMessage
        id="generic.deleted-field"
        defaultMessage="Deleted field"
      />
    </Text>
  );
}

PetitionFieldReference.fragments = {
  PetitionField: gql`
    fragment PetitionFieldReference_PetitionField on PetitionField {
      title
    }
  `,
};
