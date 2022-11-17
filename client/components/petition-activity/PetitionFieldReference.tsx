import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldReference_PetitionFieldFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";

interface PetitionFieldReferenceProps {
  field: Maybe<PetitionFieldReference_PetitionFieldFragment> | undefined;
}

export const PetitionFieldReference = Object.assign(
  chakraForwardRef<"span", PetitionFieldReferenceProps>(function PetitionFieldReference(
    { field },
    ref
  ) {
    return field ? (
      field.title ? (
        <Text ref={ref as any} as="strong">
          {field.title}
        </Text>
      ) : (
        <Text ref={ref as any} as="span" textStyle="hint">
          <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
        </Text>
      )
    ) : (
      <Text ref={ref as any} as="span" textStyle="hint">
        <FormattedMessage id="generic.deleted-field" defaultMessage="Deleted field" />
      </Text>
    );
  }),
  {
    fragments: {
      PetitionField: gql`
        fragment PetitionFieldReference_PetitionField on PetitionField {
          id
          title
        }
      `,
    },
  }
);
