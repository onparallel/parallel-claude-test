import { gql } from "@apollo/client";
import { Box, BoxProps } from "@chakra-ui/core";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionHeader,
  PetitionHeaderProps,
} from "@parallel/components/layout/PetitionHeader";
import { PetitionLayout_UserFragment } from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";

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
  const intl = useIntl();
  const title = useMemo(
    () =>
      (({
        compose: intl.formatMessage({
          id: "petition.header.compose-tab",
          defaultMessage: "Compose",
        }),
        replies: intl.formatMessage({
          id: "petition.header.replies-tab",
          defaultMessage: "Replies",
        }),
        activity: intl.formatMessage({
          id: "petition.header.activity-tab",
          defaultMessage: "Activity",
        }),
      } as Record<PetitionHeaderProps["section"], string>)[section]),
    [section, intl.locale]
  );
  return (
    <AppLayout
      title={`${
        petition!.name ||
        intl.formatMessage({
          id: "generic.untitled-petition",
          defaultMessage: "Untitled petition",
        })
      } - ${title}`}
      user={user}
    >
      <PetitionHeader
        petition={petition}
        user={user}
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
      name
      ...PetitionHeader_Petition
    }
    ${PetitionHeader.fragments.Petition}
  `,
  User: gql`
    fragment PetitionLayout_User on User {
      ...AppLayout_User
      ...PetitionHeader_User
    }
    ${AppLayout.fragments.User}
    ${PetitionHeader.fragments.User}
  `,
};
