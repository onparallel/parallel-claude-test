import { gql } from "@apollo/client";
import { Center, Stack } from "@chakra-ui/react";
import { PetitionStatusCellContent_PetitionFragment } from "@parallel/graphql/__types";
import { omit } from "remeda";
import { PetitionProgressBar } from "./PetitionProgressBar";
import { PetitionStatusIcon } from "./PetitionStatusIcon";

export function PetitionStatusCellContent({
  petition: { status, progress },
}: {
  petition: PetitionStatusCellContent_PetitionFragment;
}) {
  return (
    <Stack direction="row" alignItems="center">
      <PetitionProgressBar
        status={status}
        {...omit(progress, ["__typename"])}
        flex="1"
        width="80px"
      />
      <Center width={6}>
        <PetitionStatusIcon status={status} />
      </Center>
    </Stack>
  );
}

PetitionStatusCellContent.fragments = {
  Petition: gql`
    fragment PetitionStatusCellContent_Petition on Petition {
      status
      progress {
        external {
          validated
          replied
          optional
          total
        }
        internal {
          validated
          replied
          optional
          total
        }
      }
    }
  `,
};
