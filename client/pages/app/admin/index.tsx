import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { Admin_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { FormattedMessage, useIntl } from "react-intl";

function Admin() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Admin_userDocument);
  const sections = useAdminSections();

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "admin.title",
        defaultMessage: "Admin panel",
      })}
      isBase
      basePath="/app/Admin"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="admin.title" defaultMessage="Admin panel" />}
    />
  );
}

Admin.queries = [
  gql`
    query Admin_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

Admin.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Admin_userDocument);
};

export default compose(withSuperAdminAccess, withApolloData)(Admin);
