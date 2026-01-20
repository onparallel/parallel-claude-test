import { gql } from "@apollo/client";
import { SidebarLayout, SidebarLayoutProps } from "@parallel/components/layout/SidebarLayout";
import { useReportsSections } from "@parallel/utils/useReportsSections";
import { FormattedMessage } from "react-intl";

export interface ReportsSidebarLayoutProps
  extends Omit<SidebarLayoutProps, "basePath" | "sectionsHeader" | "sections"> {
  basePath?: string;
}

export function ReportsSidebarLayout({ children, basePath, ...props }: ReportsSidebarLayoutProps) {
  const sections = useReportsSections();

  return (
    <SidebarLayout
      {...props}
      basePath={basePath ?? "/app/reports"}
      sectionsHeader={<FormattedMessage id="page.reports.title" defaultMessage="Reports" />}
      sections={sections}
    >
      {children}
    </SidebarLayout>
  );
}

const _fragments = {
  Query: gql`
    fragment ReportsSidebarLayout_Query on Query {
      ...SidebarLayout_Query
    }
  `,
};
