import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionHeader,
  PetitionHeaderProps,
} from "@parallel/components/layout/PetitionHeader";
import {
  PetitionLayout_PetitionBaseFragment,
  PetitionLayout_UserFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { PetitionTemplateHeader } from "./PetitionTemplateHeader";

export type PetitionLayoutProps = ExtendChakra<{
  petition: PetitionLayout_PetitionBaseFragment;
  user: PetitionLayout_UserFragment;
  onNextClick?: () => void;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  onSuggestEventRefetch?: () => void;
  section: "compose" | "replies" | "activity";
  state: "SAVED" | "SAVING" | "ERROR";
  scrollBody: boolean;
  headerActions?: ReactNode;
}>;

export function PetitionLayout({
  user,
  petition,
  scrollBody,
  state,
  section,
  onUpdatePetition,
  onSuggestEventRefetch,
  headerActions,
  children,
  ...props
}: PetitionLayoutProps) {
  const intl = useIntl();
  const title = useMemo(
    () =>
      petition.__typename === "Petition"
        ? ({
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
          } as Record<PetitionHeaderProps["section"], string>)[section!]
        : intl.formatMessage({
            id: "generic.template",
            defaultMessage: "Template",
          }),
    [section, intl.locale]
  );

  return (
    <AppLayout
      title={`${
        petition!.name ||
        (petition.__typename === "Petition"
          ? intl.formatMessage({
              id: "generic.untitled-petition",
              defaultMessage: "Untitled petition",
            })
          : intl.formatMessage({
              id: "generic.untitled-template",
              defaultMessage: "Untitled template",
            }))
      } - ${title}`}
      user={user}
    >
      {petition.__typename === "Petition" ? (
        <PetitionHeader
          petition={petition}
          user={user}
          onUpdatePetition={onUpdatePetition}
          onSuggestEventRefetch={onSuggestEventRefetch}
          section={section!}
          state={state}
          actions={headerActions}
        />
      ) : petition.__typename === "PetitionTemplate" ? (
        <PetitionTemplateHeader
          petition={petition}
          user={user}
          onUpdatePetition={onUpdatePetition}
          state={state}
        />
      ) : null}
      <Box flex="1" overflow="auto" {...props}>
        {children}
      </Box>
    </AppLayout>
  );
}

PetitionLayout.fragments = {
  PetitionBase: gql`
    fragment PetitionLayout_PetitionBase on PetitionBase {
      id
      name
      ... on Petition {
        ...PetitionHeader_Petition
      }
      ... on PetitionTemplate {
        ...PetitionTemplateHeader_PetitionTemplate
      }
    }
    ${PetitionHeader.fragments.Petition}
    ${PetitionTemplateHeader.fragments.PetitionTemplate}
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
