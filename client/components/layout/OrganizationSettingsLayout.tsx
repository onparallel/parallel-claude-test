import { gql } from "@apollo/client";
import { SidebarLayout, SidebarLayoutProps } from "@parallel/components/layout/SidebarLayout";
import { OrganizationSettingsLayout_QueryFragment } from "@parallel/graphql/__types";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage } from "react-intl";

export interface OrganizationSettingsLayoutProps
  extends Omit<SidebarLayoutProps, "basePath" | "sectionsHeader" | "sections"> {
  me: OrganizationSettingsLayout_QueryFragment["me"];
  basePath?: string;
}

export function OrganizationSettingsLayout({
  me,
  children,
  basePath,
  ...props
}: OrganizationSettingsLayoutProps) {
  const sections = useOrganizationSections(me);

  return (
    <SidebarLayout
      {...props}
      basePath={basePath ?? "/app/organization"}
      sectionsHeader={
        <FormattedMessage id="page.organization.title" defaultMessage="Organization" />
      }
      sections={sections}
      me={me}
    >
      {children}
    </SidebarLayout>
  );
}

OrganizationSettingsLayout.fragments = {
  Query: gql`
    fragment OrganizationSettingsLayout_Query on Query {
      ...SidebarLayout_Query
      me {
        id
        ...useOrganizationSections_User
      }
    }
    ${SidebarLayout.fragments.Query}
    ${useOrganizationSections.fragments.User}
  `,
};
