import { gql, useApolloClient, useMutation } from "@apollo/client";
import { mergeDeep } from "@apollo/client/utilities";
import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { BrandingGeneral } from "@parallel/components/organization/branding/BrandingGeneral";
import { useConfirmDeleteThemeDialog } from "@parallel/components/organization/branding/ConfirmDeleteThemeDialog";
import { useCreateOrUpdateDocumentThemeDialog } from "@parallel/components/organization/branding/CreateOrUpdateDocumentThemeDialog";
import { DocumentThemeEditor } from "@parallel/components/organization/branding/DocumentThemeEditor";
import { DocumentThemePreview } from "@parallel/components/organization/branding/DocumentThemePreview";
import { DocumentThemeSelect } from "@parallel/components/organization/branding/DocumentThemeSelect";
import {
  DocumentThemePreview_OrganizationThemeFragmentDoc,
  OrganizationBranding_createOrganizationPdfDocumentThemeDocument,
  OrganizationBranding_deleteOrganizationPdfDocumentThemeDocument,
  OrganizationBranding_restoreDefaultOrganizationPdfDocumentThemeFontsDocument,
  OrganizationBranding_updateOrganizationPdfDocumentThemeDocument,
  OrganizationBranding_userDocument,
  OrganizationDocumentThemeInput,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { withError } from "@parallel/utils/promises/withError";
import { useQueryState, useQueryStateSlice, values } from "@parallel/utils/queryState";
import { isAdmin } from "@parallel/utils/roles";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";

const styles = ["general", "document"] as ("general" | "document")[];
const QUERY_STATE = {
  style: values(styles).orDefault("general"),
};

function OrganizationBranding() {
  const intl = useIntl();
  const apollo = useApolloClient();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationBranding_userDocument);
  const hasAdminRole = isAdmin(me.role);

  const sections = useOrganizationSections(me);
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [style, setStyle] = useQueryStateSlice(state, setQueryState, "style");

  const themeOptions = me.organization.themes.pdfDocument;

  const [selectedThemeId, setSelectedThemeId] = useState(themeOptions.find((t) => t.isDefault)!.id);
  const selectedTheme = themeOptions.find((t) => t.id === selectedThemeId)!;

  const showCreateOrUpdateDocumentThemeDialog = useCreateOrUpdateDocumentThemeDialog();

  const [createOrganizationPdfDocumentTheme] = useMutation(
    OrganizationBranding_createOrganizationPdfDocumentThemeDocument
  );
  const [updateOrganizationPdfDocumentTheme] = useMutation(
    OrganizationBranding_updateOrganizationPdfDocumentThemeDocument
  );
  const [deleteOrganizationPdfDocumentTheme] = useMutation(
    OrganizationBranding_deleteOrganizationPdfDocumentThemeDocument
  );
  const [restoreDefaultOrganizationPdfDocumentThemeFonts] = useMutation(
    OrganizationBranding_restoreDefaultOrganizationPdfDocumentThemeFontsDocument
  );

  async function handleCreateNewDocumentTheme() {
    const [, data] = await withError(showCreateOrUpdateDocumentThemeDialog({ theme: null }));
    if (data) {
      await createOrganizationPdfDocumentTheme({
        variables: { name: data.name!, isDefault: data.isDefault! },
        onCompleted({ createOrganizationPdfDocumentTheme }) {
          setSelectedThemeId(
            createOrganizationPdfDocumentTheme.themes.pdfDocument.find((t) => t.isDefault)!.id
          );
        },
      });
    }
  }

  async function handleEditDocumentTheme() {
    const [, data] = await withError(
      showCreateOrUpdateDocumentThemeDialog({ theme: selectedTheme })
    );
    if (data) {
      await updateOrganizationPdfDocumentTheme({
        variables: {
          orgThemeId: selectedTheme.id,
          data: { name: data.name!, isDefault: data.isDefault! },
        },
      });
    }
  }
  const debouncedUpdateOrganizationPdfDocumentTheme = useDebouncedAsync(
    async (theme: OrganizationDocumentThemeInput) => {
      await updateOrganizationPdfDocumentTheme({
        variables: {
          orgThemeId: selectedTheme.id,
          data: { theme },
        },
      });
    },
    500,
    [selectedThemeId]
  );

  async function handleUpdateDocumentThemeProps(theme: OrganizationDocumentThemeInput) {
    // update cache so that the preview is more responsive
    updateFragment(apollo.cache, {
      fragment: DocumentThemePreview_OrganizationThemeFragmentDoc,
      id: selectedTheme.id,
      data: (cached) => {
        return {
          ...cached!,
          data: mergeDeep(cached!.data, theme),
        };
      },
    });
    try {
      await debouncedUpdateOrganizationPdfDocumentTheme(theme);
    } catch (error) {
      if (error !== "DEBOUNCED") {
        throw error;
      }
    }
  }

  const showConfirmDeleteThemeDialog = useConfirmDeleteThemeDialog();
  async function handleDeleteDocumentTheme() {
    try {
      await showConfirmDeleteThemeDialog({});
      await await deleteOrganizationPdfDocumentTheme({
        variables: { orgThemeId: selectedTheme.id },
        onCompleted({ deleteOrganizationPdfDocumentTheme }) {
          setSelectedThemeId(
            deleteOrganizationPdfDocumentTheme.themes.pdfDocument.find((t) => t.isDefault)!.id
          );
        },
      });
    } catch {}
  }

  async function handleResetThemeFonts() {
    await restoreDefaultOrganizationPdfDocumentThemeFonts({
      variables: { orgThemeId: selectedTheme.id },
    });
  }

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
            <Grid
              templateColumns="1fr auto"
              gridGap={16}
              rowGap={8}
              padding={6}
              flexDirection={{ base: "column", xl: "row" }}
            >
              <GridItem
                maxWidth={{ base: "100%", xl: "container.2xs" }}
                width="100%"
                display="flex"
                gridGap={2}
                alignItems="baseline"
              >
                <Heading as="h4" size="md" fontWeight="semibold">
                  <FormattedMessage id="branding.themes-header" defaultMessage="Themes:" />
                </Heading>
                <Box width="100%">
                  <DocumentThemeSelect
                    onCreateNewTheme={handleCreateNewDocumentTheme}
                    onChange={(t) => setSelectedThemeId(t!.id)}
                    value={pick(selectedTheme!, ["id", "name"])}
                    options={themeOptions.filter((t) => t.id !== selectedThemeId)}
                  />
                </Box>
                <IconButtonWithTooltip
                  icon={<EditIcon />}
                  label={intl.formatMessage({
                    id: "branding.edit-theme-tooltip",
                    defaultMessage: "Edit theme",
                  })}
                  onClick={handleEditDocumentTheme}
                />
                <IconButtonWithTooltip
                  icon={<DeleteIcon />}
                  variant="outline"
                  label={intl.formatMessage({
                    id: "branding.delete-theme-tooltip",
                    defaultMessage: "Delete theme",
                  })}
                  isDisabled={selectedTheme?.isDefault}
                  onClick={handleDeleteDocumentTheme}
                />
              </GridItem>
              <GridItem justifyContent="flex-end" display="flex">
                <Button variant="solid" colorScheme="purple" onClick={handleCreateNewDocumentTheme}>
                  <FormattedMessage id="branding.new-theme-button" defaultMessage="New theme" />
                </Button>
              </GridItem>

              <GridItem
                maxWidth={{ base: "100%", xl: "container.2xs" }}
                width="100%"
                colSpan={{ base: 2, xl: 1 }}
              >
                <Stack spacing={8}>
                  {!hasAdminRole ? <OnlyAdminsAlert /> : null}
                  {selectedTheme ? (
                    <DocumentThemeEditor
                      theme={selectedTheme}
                      onChange={handleUpdateDocumentThemeProps}
                      onResetFonts={handleResetThemeFonts}
                      isDisabled={!hasAdminRole}
                    />
                  ) : null}
                </Stack>
              </GridItem>
              <GridItem colSpan={{ base: 2, xl: 1 }}>
                {selectedTheme ? (
                  <DocumentThemePreview organization={me.organization} theme={selectedTheme} />
                ) : null}
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SettingsLayout>
  );
}

OrganizationBranding.fragments = {
  OrganizationThemeList: gql`
    fragment OrganizationBranding_OrganizationThemeList on OrganizationThemeList {
      pdfDocument {
        id
        name
        isDefault
        ...DocumentThemePreview_OrganizationTheme
      }
    }
    ${DocumentThemePreview.fragments.OrganizationTheme}
  `,
};

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
          themes {
            ...OrganizationBranding_OrganizationThemeList
            pdfDocument {
              ...DocumentThemeEditor_OrganizationTheme
              ...DocumentThemePreview_OrganizationTheme
            }
          }
        }
        ...BrandingGeneral_User
      }
    }
    ${SettingsLayout.fragments.Query}
    ${DocumentThemePreview.fragments.Organization}
    ${BrandingGeneral.fragments.User}
    ${OrganizationBranding.fragments.OrganizationThemeList}
    ${DocumentThemeEditor.fragments.OrganizationTheme}
    ${DocumentThemePreview.fragments.OrganizationTheme}
  `,
];

const _mutations = [
  gql`
    mutation OrganizationBranding_createOrganizationPdfDocumentTheme(
      $name: String!
      $isDefault: Boolean!
    ) {
      createOrganizationPdfDocumentTheme(name: $name, isDefault: $isDefault) {
        id
        themes {
          ...OrganizationBranding_OrganizationThemeList
        }
      }
    }
    ${OrganizationBranding.fragments.OrganizationThemeList}
  `,
  gql`
    mutation OrganizationBranding_updateOrganizationPdfDocumentTheme(
      $orgThemeId: GID!
      $data: UpdateOrganizationPdfDocumentThemeInput!
    ) {
      updateOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId, data: $data) {
        id
        themes {
          ...OrganizationBranding_OrganizationThemeList
          pdfDocument {
            isDirty
          }
        }
      }
    }
    ${OrganizationBranding.fragments.OrganizationThemeList}
  `,
  gql`
    mutation OrganizationBranding_deleteOrganizationPdfDocumentTheme($orgThemeId: GID!) {
      deleteOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId) {
        id
        themes {
          ...OrganizationBranding_OrganizationThemeList
        }
      }
    }
    ${OrganizationBranding.fragments.OrganizationThemeList}
  `,
  gql`
    mutation OrganizationBranding_restoreDefaultOrganizationPdfDocumentThemeFonts(
      $orgThemeId: GID!
    ) {
      restoreDefaultOrganizationPdfDocumentThemeFonts(orgThemeId: $orgThemeId) {
        ...DocumentThemePreview_OrganizationTheme
        isDirty
      }
    }
    ${DocumentThemePreview.fragments.OrganizationTheme}
  `,
];

OrganizationBranding.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationBranding_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationBranding);
