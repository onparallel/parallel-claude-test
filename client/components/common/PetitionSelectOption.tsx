import { gql } from "@apollo/client";

import { PetitionSelectOption_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { HighlightText } from "./HighlightText";
import { Box, Text } from "@parallel/components/ui";

interface PetitionSelectOptionProps {
  data: PetitionSelectOption_PetitionBaseFragment;
  highlight?: string;
  isDisabled?: boolean;
  noOfLines?: number;
}

export function PetitionSelectOption({
  data,
  highlight,
  noOfLines = 1,
  isDisabled,
}: PetitionSelectOptionProps) {
  return (
    <Box
      verticalAlign="baseline"
      noOfLines={noOfLines}
      wordBreak={noOfLines > 1 ? "break-word" : "break-all"}
    >
      {data.name ? (
        <HighlightText search={highlight} as="span">
          {data.name}
        </HighlightText>
      ) : data.__typename === "Petition" ? (
        <Text as="span" textStyle="hint">
          <FormattedMessage id="generic.unnamed-parallel" defaultMessage="Unnamed parallel" />
        </Text>
      ) : data.__typename === "PetitionTemplate" ? (
        <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
      ) : null}
    </Box>
  );
}

const _fragments = {
  PetitionBase: gql`
    fragment PetitionSelectOption_PetitionBase on PetitionBase {
      id
      name
    }
  `,
};
