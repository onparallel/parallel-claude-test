import { gql } from "@apollo/client";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  OrganizationSettingsQuery,
  useOrganizationSettingsQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationSettings() {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(useOrganizationSettingsQuery());
  const sections = useOrganizationSections();

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.title",
        defaultMessage: "Organization",
      })}
      isBase
      basePath="/app/organization"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage
          id="organization.title"
          defaultMessage="Organization"
        />
      }
    />
  );
}

OrganizationSettings.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  await fetchQuery<OrganizationSettingsQuery>(gql`
    query OrganizationSettings {
      me {
        id
        ...AppLayout_User
      }
    }
    ${AppLayout.fragments.User}
  `);
};

export default compose(
  withAdminOrganizationRole,
  withApolloData
)(OrganizationSettings);
