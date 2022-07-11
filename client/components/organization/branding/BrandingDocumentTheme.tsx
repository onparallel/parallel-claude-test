import { gql, useMutation } from "@apollo/client";
import { mergeDeep } from "@apollo/client/utilities";
import { Box, Button, Heading, HStack, Stack } from "@chakra-ui/react";
import { DeleteIcon, EditIcon, SaveIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
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
  OrganizationDocumentThemeInput,
} from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { isAdmin } from "@parallel/utils/roles";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { equals, isDefined, omit, pick } from "remeda";
import { useConfirmResetThemeDialog } from "../dialogs/ConfirmResetThemeDialog";

interface BrandingDocumentThemeProps {
  user: BrandingDocumentTheme_UserFragment;
}

export function BrandingDocumentTheme({ user }: BrandingDocumentThemeProps) {
  const intl = useIntl();

  const hasAdminRole = isAdmin(user.role);
  const documentThemes = user.organization.themes.pdfDocument;

  const [selectedTheme, setSelectedTheme] = useState(documentThemes.find((t) => t.isDefault)!);
  const originalTheme = useRef(documentThemes.find((t) => t.isDefault)!);

  const [isDirty, setIsDirty] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    originalTheme.current = selectedTheme;
    setIsDirty(false);
    setIsInvalid(false);
  }, [selectedTheme.id]);

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
  async function handleSaveCurrentTheme() {
    try {
      const { data } = await updateOrganizationPdfDocumentTheme({
        variables: {
          orgThemeId: selectedTheme.id,
          data: { theme: omit(selectedTheme!.data, ["paginationPosition", "logoPosition"]) },
        },
      });
      if (isDefined(data)) {
        setSelectedTheme(
          data.updateOrganizationPdfDocumentTheme.themes.pdfDocument.find(
            (theme) => theme.id === selectedTheme.id
          )!
        );
        setIsDirty(false);
        setIsInvalid(false);
        originalTheme.current = selectedTheme;
      }
    } catch {}
  }

  async function handleCreateNewDocumentTheme() {
    const [, data] = await withError(showCreateOrUpdateDocumentThemeDialog({ theme: null }));
    if (data) {
      await createOrganizationPdfDocumentTheme({
        variables: { name: data.name!, isDefault: data.isDefault! },
        onCompleted({ createOrganizationPdfDocumentTheme }) {
          setSelectedTheme(createOrganizationPdfDocumentTheme.themes.pdfDocument[0]!);
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

  async function handleUpdateDocumentThemeProps(theme: OrganizationDocumentThemeInput) {
    if (
      equals(originalTheme.current.data, {
        ...originalTheme.current.data,
        ...theme,
        legalText: {
          ...originalTheme.current.data.legalText,
          ...theme.legalText,
        },
      })
    ) {
      setIsDirty(false);
    } else {
      setIsDirty(true);
    }
    setSelectedTheme((currentTheme) => ({
      ...currentTheme,
      data: mergeDeep(currentTheme!.data, theme),
    }));
  }

  const showConfirmDeleteThemeDialog = useConfirmDeleteThemeDialog();
  async function handleDeleteDocumentTheme() {
    try {
      await showConfirmDeleteThemeDialog({});
      await await deleteOrganizationPdfDocumentTheme({
        variables: { orgThemeId: selectedTheme.id },
        onCompleted({ deleteOrganizationPdfDocumentTheme }) {
          setSelectedTheme(
            deleteOrganizationPdfDocumentTheme.themes.pdfDocument.find((t) => t.isDefault)!
          );
        },
      });
    } catch {}
  }

  const showConfirmResetThemeDialog = useConfirmResetThemeDialog();
  async function handleResetThemeFonts() {
    try {
      await showConfirmResetThemeDialog({});

      const { data } = await restoreDefaultOrganizationPdfDocumentThemeFonts({
        variables: { orgThemeId: selectedTheme.id },
      });

      if (isDefined(data)) {
        const restoredTheme = {
          ...selectedTheme,
          ...data.restoreDefaultOrganizationPdfDocumentThemeFonts,
          data: {
            ...selectedTheme.data,
            ...pick(data.restoreDefaultOrganizationPdfDocumentThemeFonts.data, [
              "textColor",
              "textFontFamily",
              "textFontSize",
              "title1Color",
              "title1FontFamily",
              "title1FontSize",
              "title2Color",
              "title2FontFamily",
              "title2FontSize",
            ]),
          },
        };

        setSelectedTheme(restoredTheme);
        originalTheme.current = restoredTheme;
      }
    } catch {}
  }

  return (
    <Stack padding={6} gridGap={{ base: 6, xl: 8 }}>
      <HStack
        flexDirection={{ base: "column", md: "row" }}
        gridGap={{ base: 4, md: 2 }}
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <HStack
          width="full"
          maxWidth={{ base: "100%", xl: "container.sm" }}
          flexDirection={{ base: "column", lg: "row" }}
          alignItems={{ base: "flex-start", lg: "center" }}
          spacing={0}
          gridGap={2}
        >
          <Heading as="h4" size="md" fontWeight="semibold">
            <FormattedMessage id="branding.themes-header" defaultMessage="Themes:" />
          </Heading>
          <HStack width="100%">
            <Box flex="1">
              <DocumentThemeSelect
                onCreateNewTheme={handleCreateNewDocumentTheme}
                onChange={(t) =>
                  setSelectedTheme(documentThemes.find((theme) => theme.id === t!.id)!)
                }
                value={pick(selectedTheme!, ["id", "name"])}
                options={documentThemes.filter((t) => t.id !== selectedTheme.id)}
                isCreateNewThemeDisabled={!hasAdminRole}
              />
            </Box>
            <ResponsiveButtonIcon
              display="block"
              breakpoint="lg"
              icon={<SaveIcon />}
              hideIconOnDesktop
              colorScheme="primary"
              onClick={handleSaveCurrentTheme}
              label={intl.formatMessage({
                id: "generic.save",
                defaultMessage: "Save",
              })}
              isDisabled={!isDirty || isInvalid}
            />
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
          </HStack>
        </HStack>
        <Box width={{ base: "full", md: "fit-content" }}>
          <Button
            variant="solid"
            colorScheme="purple"
            onClick={handleCreateNewDocumentTheme}
            isDisabled={!hasAdminRole}
            width="full"
          >
            <FormattedMessage id="branding.new-theme-button" defaultMessage="New theme" />
          </Button>
        </Box>
      </HStack>
      <Stack
        flexDirection={{ base: "column", xl: "row" }}
        gridGap={{ base: 8, xl: 16 }}
        paddingBottom={16}
      >
        <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.sm" }} width="100%">
          {!hasAdminRole ? <OnlyAdminsAlert /> : null}
          {selectedTheme ? (
            <DocumentThemeEditor
              theme={selectedTheme}
              onChange={handleUpdateDocumentThemeProps}
              onResetFonts={handleResetThemeFonts}
              onInvalid={(value) => {
                if (isInvalid !== value) {
                  setIsInvalid(value);
                }
              }}
              isDisabled={!hasAdminRole}
            />
          ) : null}
        </Stack>
        <Stack alignItems="center" width="100%">
          {selectedTheme ? (
            <DocumentThemePreview organization={user.organization} theme={selectedTheme} />
          ) : null}
        </Stack>
      </Stack>
    </Stack>
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
          isCustomized
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
            isCustomized
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
        isCustomized
      }
    }
    ${DocumentThemePreview.fragments.OrganizationTheme}
  `,
];
