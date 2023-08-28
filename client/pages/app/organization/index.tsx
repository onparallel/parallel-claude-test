import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { OrganizationSettings_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useIntl } from "react-intl";

function OrganizationSettings() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationSettings_userDocument);

  return (
    <OrganizationSettingsLayout
      title={intl.formatMessage({
        id: "page.organization.title",
        defaultMessage: "Organization",
      })}
      isBase
      me={me}
      realMe={realMe}
    />
  );
}

OrganizationSettings.queries = [
  gql`
    query OrganizationSettings_user {
      ...OrganizationSettingsLayout_Query
    }
    ${OrganizationSettingsLayout.fragments.Query}
  `,
];

OrganizationSettings.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationSettings_userDocument);
};

export default compose(withApolloData)(OrganizationSettings);
