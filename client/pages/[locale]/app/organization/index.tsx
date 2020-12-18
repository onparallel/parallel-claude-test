import { gql } from "@apollo/client";
import {
  redirect,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  useOrganizationSettingsQuery,
  OrganizationSettingsQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
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
  const { data } = await fetchQuery<OrganizationSettingsQuery>(gql`
    query OrganizationSettings {
      me {
        id
        ...AppLayout_User
      }
    }
    ${AppLayout.fragments.User}
  `);

  if (data.me.role !== "ADMIN") {
    return redirect(context, `/${context.query.locale}/app`);
  }
};

export default withApolloData(OrganizationSettings);
