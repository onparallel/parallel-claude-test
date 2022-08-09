import { gql } from "@apollo/client";
import { Center, Stack } from "@chakra-ui/react";
import { PetitionStatusCellContent_PetitionFragment } from "@parallel/graphql/__types";
import { PetitionProgressBar } from "./PetitionProgressBar";
import { PetitionStatusIcon } from "./PetitionStatusIcon";

export function PetitionStatusCellContent({
  petition,
}: {
  petition: PetitionStatusCellContent_PetitionFragment;
}) {
  return (
    <Stack direction="row" alignItems="center">
      <PetitionProgressBar petition={petition} flex="1" width="80px" />
      <Center width={6}>
        <PetitionStatusIcon status={petition.status} />
      </Center>
    </Stack>
  );
}

PetitionStatusCellContent.fragments = {
  Petition: gql`
    fragment PetitionStatusCellContent_Petition on Petition {
      ...PetitionProgressBar_Petition
      status
    }
    ${PetitionProgressBar.fragments.Petition}
  `,
};
