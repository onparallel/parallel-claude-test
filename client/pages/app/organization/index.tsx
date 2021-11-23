import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { OrganizationSettings_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationSettings() {
  const intl = useIntl();
  const {
    data: { me },
  } = useAssertQuery(OrganizationSettings_userDocument);
  const sections = useOrganizationSections(me);

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
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
    />
  );
}

OrganizationSettings.queries = [
  gql`
    query OrganizationSettings_user {
      me {
        id
        ...SettingsLayout_User
      }
    }
    ${SettingsLayout.fragments.User}
  `,
];

OrganizationSettings.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationSettings_userDocument);
};

export default compose(withApolloData)(OrganizationSettings);
