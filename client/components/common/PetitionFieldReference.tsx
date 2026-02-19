import { gql } from "@apollo/client";

import { chakraComponent } from "@parallel/chakra/utils";
import { PetitionFieldReference_PetitionFieldFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

interface PetitionFieldReferenceProps {
  field: Maybe<PetitionFieldReference_PetitionFieldFragment> | undefined;
}

export const PetitionFieldReference = chakraComponent<"span", PetitionFieldReferenceProps>(
  function PetitionFieldReference({ ref, field, ...props }) {
    return field ? (
      field.title ? (
        <Text ref={ref as any} as="strong" {...props}>
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
  },
);

const _fragments = {
  PetitionField: gql`
    fragment PetitionFieldReference_PetitionField on PetitionField {
      id
      title
    }
  `,
};
