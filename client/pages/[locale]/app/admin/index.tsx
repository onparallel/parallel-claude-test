import { gql } from "@apollo/client";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useAdminQuery, AdminQuery } from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { FormattedMessage, useIntl } from "react-intl";

function Admin() {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(useAdminQuery());
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
      user={me}
      sectionsHeader={
        <FormattedMessage id="admin.title" defaultMessage="Admin panel" />
      }
    />
  );
}

Admin.fragments = {
  User: gql`
    fragment Admin_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};

Admin.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery<AdminQuery>(gql`
    query Admin {
      me {
        id
        ...Admin_User
      }
    }
    ${Admin.fragments.User}
  `);
};

export default compose(withSuperAdminAccess, withApolloData)(Admin);
