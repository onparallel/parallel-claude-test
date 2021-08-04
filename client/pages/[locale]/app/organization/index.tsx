import { gql } from "@apollo/client";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
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
  const sections = useOrganizationSections(
    ["OWNER", "ADMIN"].includes(me.role)
  );

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "view.organization.title",
        defaultMessage: "Organization",
      })}
      isBase
      basePath="/app/organization"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage
          id="view.organization.title"
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
        ...SettingsLayout_User
      }
    }
    ${SettingsLayout.fragments.User}
  `);
};

export default compose(withApolloData)(OrganizationSettings);
