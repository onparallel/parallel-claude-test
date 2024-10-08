import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { SettingsTabsInnerLayout } from "@parallel/components/layout/SettingsTabsInnerLayout";
import { BrandingDocumentTheme } from "@parallel/components/organization/branding/BrandingDocumentTheme";
import { BrandingGeneral } from "@parallel/components/organization/branding/BrandingGeneral";
import { OrganizationBranding_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useBuildStateUrl, useQueryState, values } from "@parallel/utils/queryState";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const styles = ["general", "document"] as ("general" | "document")[];
const QUERY_STATE = {
  style: values(styles).orDefault("general"),
};

function OrganizationBranding() {
  const intl = useIntl();
  const router = useRouter();

  const { data: queryObject } = useAssertQueryOrPreviousData(OrganizationBranding_userDocument);
  const { me } = queryObject;
  const [{ style }] = useQueryState(QUERY_STATE);
  const buildStateUrl = useBuildStateUrl(QUERY_STATE);
  const tabs = useMemo(
    () => [
      {
        key: "general" as const,
        title: intl.formatMessage({
          id: "organization.branding.general.tab",
          defaultMessage: "General",
        }),
        href: buildStateUrl({ style: "general" as const }),
      },
      {
        key: "document" as const,
        title: intl.formatMessage({
          id: "organization.branding.documents.tab",
          defaultMessage: "Documents",
        }),
        href: buildStateUrl({ style: "document" as const }),
      },
    ],
    [intl.locale, router.pathname, router.query],
  );

  return (
    <OrganizationSettingsLayout
      title={intl.formatMessage({
        id: "organization.branding.title",
        defaultMessage: "Branding",
      })}
      queryObject={queryObject}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.branding.title" defaultMessage="Branding" />
        </Heading>
      }
    >
      <SettingsTabsInnerLayout tabs={tabs} currentTabKey={style}>
        {style === "general" ? <BrandingGeneral user={me} /> : <BrandingDocumentTheme user={me} />}
      </SettingsTabsInnerLayout>
    </OrganizationSettingsLayout>
  );
}

OrganizationBranding.queries = [
  gql`
    query OrganizationBranding_user {
      ...OrganizationSettingsLayout_Query
      me {
        id
        ...BrandingGeneral_User
        ...BrandingDocumentTheme_User
      }
    }
    ${OrganizationSettingsLayout.fragments.Query}
    ${BrandingGeneral.fragments.User}
    ${BrandingDocumentTheme.fragments.User}
  `,
];

OrganizationBranding.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationBranding_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationBranding);
