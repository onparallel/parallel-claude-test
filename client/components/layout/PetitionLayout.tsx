import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { PetitionHeader, PetitionHeaderProps } from "@parallel/components/layout/PetitionHeader";
import {
  PetitionLayout_PetitionBaseFragment,
  PetitionLayout_QueryFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { PetitionTemplateHeader } from "./PetitionTemplateHeader";

export interface PetitionLayoutProps extends PetitionLayout_QueryFragment {
  petition: PetitionLayout_PetitionBaseFragment;
  onNextClick?: () => void;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: "compose" | "preview" | "replies" | "activity";
  scrollBody: boolean;
  headerActions?: ReactNode;
  subHeader?: ReactNode;
}

export const PetitionLayout = Object.assign(
  chakraForwardRef<"div", PetitionLayoutProps>(function PetitionLayout(
    {
      me,
      realMe,
      petition,
      scrollBody,
      section,
      onUpdatePetition,
      headerActions,
      children,
      subHeader,
      ...props
    },
    ref
  ) {
    const intl = useIntl();
    const title = useMemo(
      () =>
        petition.__typename === "Petition"
          ? (
              {
                compose: intl.formatMessage({
                  id: "petition.header.compose-tab",
                  defaultMessage: "Compose",
                }),
                preview: intl.formatMessage({
                  id: "petition.header.preview-tab",
                  defaultMessage: "Input",
                }),
                replies: intl.formatMessage({
                  id: "petition.header.replies-tab",
                  defaultMessage: "Review",
                }),
                activity: intl.formatMessage({
                  id: "petition.header.activity-tab",
                  defaultMessage: "Activity",
                }),
              } as Record<PetitionHeaderProps["section"], string>
            )[section!]
          : intl.formatMessage({
              id: "generic.template",
              defaultMessage: "Template",
            }),
      [section, intl.locale]
    );

    return (
      <AppLayout
        ref={ref}
        title={`${
          petition!.name ||
          (petition.__typename === "Petition"
            ? intl.formatMessage({
                id: "generic.unnamed-petition",
                defaultMessage: "Unnamed petition",
              })
            : intl.formatMessage({
                id: "generic.unnamed-template",
                defaultMessage: "Unnamed template",
              }))
        } - ${title}`}
        me={me}
        realMe={realMe}
      >
        {petition.__typename === "Petition" ? (
          <PetitionHeader
            petition={petition}
            me={me}
            onUpdatePetition={onUpdatePetition}
            section={section!}
            actions={headerActions}
          />
        ) : petition.__typename === "PetitionTemplate" ? (
          <PetitionTemplateHeader
            petition={petition}
            me={me}
            section={section!}
            onUpdatePetition={onUpdatePetition}
          />
        ) : null}
        {subHeader ? <Box>{subHeader}</Box> : null}
        <Box flex="1" overflow="auto" {...props} id="petition-layout-body">
          {children}
        </Box>
      </AppLayout>
    );
  }),
  {
    fragments: {
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
      Query: gql`
        fragment PetitionLayout_Query on Query {
          ...AppLayout_Query
          ...PetitionHeader_Query
        }
        ${AppLayout.fragments.Query}
        ${PetitionHeader.fragments.Query}
      `,
    },
  }
);
