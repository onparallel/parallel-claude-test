import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/core";
import { PetitionFieldReference_PetitionFieldFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";

export function PetitionFieldReference({
  field,
}: {
  field?: Maybe<PetitionFieldReference_PetitionFieldFragment>;
}) {
  return (
    <Text as="span" display="inline" marginX="2px">
      {field ? (
        field.title ? (
          <Text as="strong">{field.title}</Text>
        ) : (
          <Text as="span" color="gray.400" fontStyle="italic">
            <FormattedMessage
              id="generic.untitled-field"
              defaultMessage="Untitled field"
            />
          </Text>
        )
      ) : (
        <Text as="span" color="gray.400" fontStyle="italic">
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
