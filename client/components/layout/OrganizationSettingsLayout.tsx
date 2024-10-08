import { gql } from "@apollo/client";
import { SidebarLayout, SidebarLayoutProps } from "@parallel/components/layout/SidebarLayout";
import { OrganizationSettingsLayout_QueryFragment } from "@parallel/graphql/__types";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage } from "react-intl";

export interface OrganizationSettingsLayoutProps
  extends Omit<SidebarLayoutProps, "basePath" | "sectionsHeader" | "sections"> {
  queryObject: OrganizationSettingsLayout_QueryFragment;
  basePath?: string;
}

export function OrganizationSettingsLayout({
  queryObject,
  children,
  basePath,
  ...props
}: OrganizationSettingsLayoutProps) {
  const sections = useOrganizationSections(queryObject.me);

  return (
    <SidebarLayout
      {...props}
      basePath={basePath ?? "/app/organization"}
      sectionsHeader={
        <FormattedMessage id="page.organization.title" defaultMessage="Organization" />
      }
      sections={sections}
      queryObject={queryObject}
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
