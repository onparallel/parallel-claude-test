import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AdminSettingsLayout } from "@parallel/components/layout/AdminSettingsLayout";
import { Admin_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useIntl } from "react-intl";

function Admin() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Admin_userDocument);

  return (
    <AdminSettingsLayout
      title={intl.formatMessage({
        id: "admin.title",
        defaultMessage: "Admin panel",
      })}
      isBase
      me={me}
      realMe={realMe}
    />
  );
}

Admin.queries = [
  gql`
    query Admin_user {
      ...AdminSettingsLayout_Query
    }
    ${AdminSettingsLayout.fragments.Query}
  `,
];

Admin.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Admin_userDocument);
};

export default compose(withSuperAdminAccess, withApolloData)(Admin);
