import { Flex, Box, BoxProps } from "@chakra-ui/core";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionHeader,
  PetitionHeaderProps,
} from "@parallel/components/layout/PetitionHeader";
import { PetitionLayout_UserFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { ReactNode } from "react";

export type PetitionLayoutProps = BoxProps &
  PetitionHeaderProps & {
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
  ...props
}: PetitionLayoutProps) {
  return (
    <AppLayout user={user}>
      <PetitionHeader
        petition={petition}
        onUpdatePetition={onUpdatePetition}
        section={section}
        state={state}
      />
      <Box flex="1" overflow="auto" {...props}>
        {children}
      </Box>
    </AppLayout>
  );
}

PetitionLayout.fragments = {
  Petition: gql`
    fragment PetitionLayout_Petition on Petition {
      id
      ...PetitionHeader_Petition
    }
    ${PetitionHeader.fragments.Petition}
  `,
  User: gql`
    fragment PetitionLayout_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};
