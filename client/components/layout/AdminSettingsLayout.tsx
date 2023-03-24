import { gql } from "@apollo/client";
import { SidebarLayout, SidebarLayoutProps } from "@parallel/components/layout/SidebarLayout";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { FormattedMessage } from "react-intl";

export interface AdminSettingsLayoutProps
  extends Omit<SidebarLayoutProps, "basePath" | "sectionsHeader" | "sections"> {
  basePath?: string;
}

export function AdminSettingsLayout({ children, basePath, ...props }: AdminSettingsLayoutProps) {
  const sections = useAdminSections();

  return (
    <SidebarLayout
      {...props}
      basePath={basePath ?? "/app/admin"}
      sectionsHeader={<FormattedMessage id="admin.title" defaultMessage="Admin panel" />}
      sections={sections}
    >
      {children}
    </SidebarLayout>
  );
}

AdminSettingsLayout.fragments = {
  Query: gql`
    fragment AdminSettingsLayout_Query on Query {
      ...SidebarLayout_Query
    }
    ${SidebarLayout.fragments.Query}
  `,
};
