import { gql } from "@apollo/client";
import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { BrandingDocumentTheme } from "@parallel/components/organization/branding/BrandingDocumentTheme";
import { BrandingGeneral } from "@parallel/components/organization/branding/BrandingGeneral";
import { DocumentThemeEditor } from "@parallel/components/organization/branding/DocumentThemeEditor";
import { DocumentThemePreview } from "@parallel/components/organization/branding/DocumentThemePreview";
import { OrganizationBranding_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useQueryState, useQueryStateSlice, values } from "@parallel/utils/queryState";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";

const styles = ["general", "document"] as ("general" | "document")[];
const QUERY_STATE = {
  style: values(styles).orDefault("general"),
};

function OrganizationBranding() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationBranding_userDocument);

  const sections = useOrganizationSections(me);
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [style, setStyle] = useQueryStateSlice(state, setQueryState, "style");

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.branding.title",
        defaultMessage: "Branding",
      })}
      basePath="/app/organization"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.branding.title" defaultMessage="Branding" />
        </Heading>
      }
    >
      <Tabs
        variant="enclosed"
        defaultIndex={styles.indexOf(style)}
        onChange={(index) => setStyle(styles[index])}
      >
        <TabList paddingLeft={6} background="white" paddingTop={2}>
          <Tab
            fontWeight="500"
            _selected={{
              backgroundColor: "gray.50",
              borderColor: "gray.200",
              borderBottom: "1px solid",
              borderBottomColor: "transparent",
              color: "blue.600",
            }}
          >
            <FormattedMessage id="organization.branding.general.tab" defaultMessage="General" />
          </Tab>
          <Tab
            fontWeight="500"
            _selected={{
              backgroundColor: "gray.50",
              borderColor: "gray.200",
              borderBottom: "1px solid",
              borderBottomColor: "transparent",
              color: "blue.600",
            }}
          >
            <FormattedMessage id="organization.branding.documents.tab" defaultMessage="Documents" />
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel padding={0}>
            <BrandingGeneral user={me} />
          </TabPanel>
          <TabPanel padding={0}>
            <BrandingDocumentTheme user={me} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SettingsLayout>
  );
}

OrganizationBranding.queries = [
  gql`
    query OrganizationBranding_user {
      ...SettingsLayout_Query
      me {
        ...BrandingGeneral_User
        ...BrandingDocumentTheme_User
      }
    }
    ${SettingsLayout.fragments.Query}
    ${BrandingGeneral.fragments.User}
    ${BrandingDocumentTheme.fragments.User}
  `,
];

OrganizationBranding.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationBranding_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationBranding);
