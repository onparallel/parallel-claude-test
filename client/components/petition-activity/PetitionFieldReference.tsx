import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { PetitionFieldReference_PetitionFieldFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";
import { ellipsis } from "@parallel/utils/ellipsis";

export function PetitionFieldReference({
  field,
}: {
  field?: Maybe<PetitionFieldReference_PetitionFieldFragment>;
}) {
  return (
    <Text as="span" display="inline" marginX="2px">
      {field ? (
        field.title ? (
          <Text as="strong">{ellipsis(field.title, 50)}</Text>
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
            id="timeline.reply-created-deleted-field"
            defaultMessage="Deleted field"
          />
        </Text>
      )}
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
