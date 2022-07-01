import { gql, useApolloClient, useMutation } from "@apollo/client";
import { mergeDeep } from "@apollo/client/utilities";
import { Box, Button, Grid, GridItem, Heading, Stack } from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import { useConfirmDeleteThemeDialog } from "@parallel/components/organization/branding/ConfirmDeleteThemeDialog";
import { useCreateOrUpdateDocumentThemeDialog } from "@parallel/components/organization/branding/CreateOrUpdateDocumentThemeDialog";
import { DocumentThemeEditor } from "@parallel/components/organization/branding/DocumentThemeEditor";
import { DocumentThemePreview } from "@parallel/components/organization/branding/DocumentThemePreview";
import { DocumentThemeSelect } from "@parallel/components/organization/branding/DocumentThemeSelect";
import {
  BrandingDocumentTheme_createOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_deleteOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_restoreDefaultOrganizationPdfDocumentThemeFontsDocument,
  BrandingDocumentTheme_updateOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_UserFragment,
  DocumentThemePreview_OrganizationThemeFragmentDoc,
  OrganizationDocumentThemeInput,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { withError } from "@parallel/utils/promises/withError";
import { isAdmin } from "@parallel/utils/roles";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";

interface BrandingDocumentThemeProps {
  user: BrandingDocumentTheme_UserFragment;
}

export function BrandingDocumentTheme({ user }: BrandingDocumentThemeProps) {
  const intl = useIntl();
  const apollo = useApolloClient();

  const hasAdminRole = isAdmin(user.role);

  const documentThemes = user.organization.themes.pdfDocument;

  const [selectedThemeId, setSelectedThemeId] = useState(
    documentThemes.find((t) => t.isDefault)!.id
  );
  const selectedTheme = documentThemes.find((t) => t.id === selectedThemeId)!;

  const showCreateOrUpdateDocumentThemeDialog = useCreateOrUpdateDocumentThemeDialog();

  const [createOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_createOrganizationPdfDocumentThemeDocument
  );
  const [updateOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_updateOrganizationPdfDocumentThemeDocument
  );
  const [deleteOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_deleteOrganizationPdfDocumentThemeDocument
  );
  const [restoreDefaultOrganizationPdfDocumentThemeFonts] = useMutation(
    BrandingDocumentTheme_restoreDefaultOrganizationPdfDocumentThemeFontsDocument
  );

  async function handleCreateNewDocumentTheme() {
    const [, data] = await withError(showCreateOrUpdateDocumentThemeDialog({ theme: null }));
    if (data) {
      await createOrganizationPdfDocumentTheme({
        variables: { name: data.name!, isDefault: data.isDefault! },
        onCompleted({ createOrganizationPdfDocumentTheme }) {
          setSelectedThemeId(createOrganizationPdfDocumentTheme.themes.pdfDocument[0]!.id);
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
    [selectedThemeId, user.organization.themes.pdfDocument.length]
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
            options={documentThemes.filter((t) => t.id !== selectedThemeId)}
            isCreateNewThemeDisabled={!hasAdminRole}
          />
        </Box>
        <IconButtonWithTooltip
          icon={<EditIcon />}
          label={intl.formatMessage({
            id: "branding.edit-theme-tooltip",
            defaultMessage: "Edit theme",
          })}
          isDisabled={!hasAdminRole}
          onClick={handleEditDocumentTheme}
        />
        <IconButtonWithTooltip
          icon={<DeleteIcon />}
          variant="outline"
          label={intl.formatMessage({
            id: "branding.delete-theme-tooltip",
            defaultMessage: "Delete theme",
          })}
          isDisabled={selectedTheme?.isDefault || !hasAdminRole}
          onClick={handleDeleteDocumentTheme}
        />
      </GridItem>
      <GridItem justifyContent="flex-end" display="flex">
        <Button
          variant="solid"
          colorScheme="purple"
          onClick={handleCreateNewDocumentTheme}
          isDisabled={!hasAdminRole}
        >
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
          <DocumentThemePreview organization={user.organization} theme={selectedTheme} />
        ) : null}
      </GridItem>
    </Grid>
  );
}

BrandingDocumentTheme.fragments = {
  get User() {
    return gql`
      fragment BrandingDocumentTheme_User on User {
        role
        organization {
          ...DocumentThemePreview_Organization
          themes {
            ...BrandingDocumentTheme_OrganizationThemeList
            pdfDocument {
              ...DocumentThemeEditor_OrganizationTheme
              ...DocumentThemePreview_OrganizationTheme
            }
          }
        }
      }
      ${DocumentThemePreview.fragments.Organization}
      ${this.OrganizationThemeList}
      ${DocumentThemeEditor.fragments.OrganizationTheme}
      ${DocumentThemePreview.fragments.OrganizationTheme}
    `;
  },
  get OrganizationThemeList() {
    return gql`
      fragment BrandingDocumentTheme_OrganizationThemeList on OrganizationThemeList {
        pdfDocument {
          id
          name
          isDefault
          ...DocumentThemePreview_OrganizationTheme
        }
      }
      ${DocumentThemePreview.fragments.OrganizationTheme}
    `;
  },
};

const _mutations = [
  gql`
    mutation BrandingDocumentTheme_createOrganizationPdfDocumentTheme(
      $name: String!
      $isDefault: Boolean!
    ) {
      createOrganizationPdfDocumentTheme(name: $name, isDefault: $isDefault) {
        id
        themes {
          ...BrandingDocumentTheme_OrganizationThemeList
        }
      }
    }
    ${BrandingDocumentTheme.fragments.OrganizationThemeList}
  `,
  gql`
    mutation BrandingDocumentTheme_updateOrganizationPdfDocumentTheme(
      $orgThemeId: GID!
      $data: UpdateOrganizationPdfDocumentThemeInput!
    ) {
      updateOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId, data: $data) {
        id
        themes {
          ...BrandingDocumentTheme_OrganizationThemeList
          pdfDocument {
            isDirty
          }
        }
      }
    }
    ${BrandingDocumentTheme.fragments.OrganizationThemeList}
  `,
  gql`
    mutation BrandingDocumentTheme_deleteOrganizationPdfDocumentTheme($orgThemeId: GID!) {
      deleteOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId) {
        id
        themes {
          ...BrandingDocumentTheme_OrganizationThemeList
        }
      }
    }
    ${BrandingDocumentTheme.fragments.OrganizationThemeList}
  `,
  gql`
    mutation BrandingDocumentTheme_restoreDefaultOrganizationPdfDocumentThemeFonts(
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
