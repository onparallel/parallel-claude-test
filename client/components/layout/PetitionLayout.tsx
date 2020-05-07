import { Flex } from "@chakra-ui/core";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionHeader,
  PetitionHeaderProps,
} from "@parallel/components/layout/PetitionHeader";
import { PetitionLayout_UserFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { ReactNode } from "react";

export type PetitionLayoutProps = PetitionHeaderProps & {
  scrollBody: boolean;
  user: PetitionLayout_UserFragment;
  children: ReactNode;
};

export function PetitionLayout({
  user,
  petition,
  scrollBody,
  state,
  section,
  onUpdatePetition,
  children,
}: PetitionLayoutProps) {
  return (
    <AppLayout user={user}>
      <PetitionHeader
        petition={petition}
        onUpdatePetition={onUpdatePetition}
        section={section}
        state={state}
      />
      <Flex
        flexDirection="column"
        flex="1"
        minHeight={0}
        overflow={scrollBody ? "auto" : "visible"}
      >
        {children}
      </Flex>
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
  `,
};
