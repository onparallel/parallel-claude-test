import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionHeader,
  PetitionHeaderProps
} from "@parallel/components/layout/PetitionHeader";
import { PetitionLayout_UserFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { ReactNode } from "react";
import { Box } from "@chakra-ui/core";

export type PetitionLayoutProps = PetitionHeaderProps & {
  user: PetitionLayout_UserFragment;
  children: ReactNode;
};

export function PetitionLayout({
  user,
  petition,
  state,
  section,
  onUpdatePetition,
  children
}: PetitionLayoutProps) {
  return (
    <AppLayout user={user}>
      <PetitionHeader
        petition={petition}
        onUpdatePetition={onUpdatePetition}
        section={section}
        state={state}
      />
      <Box flex="1" overflow="auto">
        {children}
      </Box>
    </AppLayout>
  );
}

PetitionLayout.fragments = {
  petition: gql`
    fragment PetitionLayout_Petition on Petition {
      id
      ...PetitionHeader_Petition
    }
    ${PetitionHeader.fragments.petition}
  `,
  user: gql`
    fragment PetitionLayout_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.user}
  `
};
