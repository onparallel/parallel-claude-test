import { gql } from "@apollo/client";
import { Heading, Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { DocumentThemeEditor } from "@parallel/components/organization/branding/DocumentThemeEditor";
import { DocumentThemePreview } from "@parallel/components/organization/branding/DocumentThemePreview";
import { BrandingGeneralForm } from "@parallel/components/organization/branding/BrandingGeneralForm";
import { BrandingGeneralPreview } from "@parallel/components/organization/branding/BrandingGeneralPreview";
import { OrganizationBranding_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useQueryState, useQueryStateSlice, values } from "@parallel/utils/queryState";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";
import { isAdmin } from "@parallel/utils/roles";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";

const styles = ["general", "document"] as ("general" | "document")[];
const QUERY_STATE = {
  style: values(styles).orDefault("general"),
};

function OrganizationBranding() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationBranding_userDocument);
  const hasAdminRole = isAdmin(me.role);

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
            <Stack
              padding={6}
              flexDirection={{ base: "column", xl: "row" }}
              gridGap={{ base: 8, xl: 16 }}
              paddingBottom={16}
            >
              <BrandingGeneralForm user={me} />
              <BrandingGeneralPreview user={me} />
            </Stack>
          </TabPanel>
          <TabPanel padding={0}>
            <Stack
              padding={6}
              flexDirection={{ base: "column", xl: "row" }}
              gridGap={{ base: 8, xl: 16 }}
              paddingBottom={16}
            >
              <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.2xs" }} width="100%">
                {!hasAdminRole ? <OnlyAdminsAlert /> : null}
                <DocumentThemeEditor organization={me.organization} isDisabled={!hasAdminRole} />
              </Stack>
              <DocumentThemePreview organization={me.organization} />
            </Stack>
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
        id
        fullName
        role
        organization {
          id
          logoUrl(options: { resize: { width: 600 } })
          ...DocumentThemePreview_Organization
          ...DocumentThemeEditor_Organization
        }
        ...BrandingGeneralForm_User
        ...BrandingGeneralPreview_User
      }
    }
    ${SettingsLayout.fragments.Query}
    ${DocumentThemePreview.fragments.Organization}
    ${DocumentThemeEditor.fragments.Organization}
    ${BrandingGeneralForm.fragments.User}
    ${BrandingGeneralPreview.fragments.User}
  `,
];

OrganizationBranding.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationBranding_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationBranding);
