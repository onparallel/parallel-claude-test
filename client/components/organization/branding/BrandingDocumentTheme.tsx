import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Box, Grid, Heading, HStack, Stack } from "@chakra-ui/react";
import { EditIcon, SaveIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { RestrictedFeatureAlert } from "@parallel/components/common/RestrictedFeatureAlert";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import {
  DocumentThemeEditor,
  DocumentThemeEditorData,
} from "@parallel/components/organization/branding/DocumentThemeEditor";
import { DocumentThemePreview } from "@parallel/components/organization/branding/DocumentThemePreview";
import { DocumentThemeSelect } from "@parallel/components/organization/branding/DocumentThemeSelect";
import { useConfirmDeleteThemeDialog } from "@parallel/components/organization/dialogs/ConfirmDeleteThemeDialog";
import { useCreateOrUpdateDocumentThemeDialog } from "@parallel/components/organization/dialogs/CreateOrUpdateDocumentThemeDialog";
import { Button } from "@parallel/components/ui";
import {
  BrandingDocumentTheme_createOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_deleteOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_OrganizationThemeFragment,
  BrandingDocumentTheme_updateOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_UserFragment,
} from "@parallel/graphql/__types";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  useAutoConfirmDiscardChangesDialog,
  useConfirmDiscardChangesDialog,
} from "../dialogs/ConfirmDiscardChangesDialog";

interface BrandingDocumentThemeProps {
  user: BrandingDocumentTheme_UserFragment;
}

export function BrandingDocumentTheme({ user }: BrandingDocumentThemeProps) {
  const intl = useIntl();

  const userHasPermission = useHasPermission("ORG_SETTINGS");
  const documentThemes = user.organization.pdfDocumentThemes;

  const [selectedTheme, setSelectedTheme] = useState(documentThemes.find((t) => t.isDefault)!);

  const form = useForm<DocumentThemeEditorData>({
    mode: "onChange",
    defaultValues: {
      doubleColumn: false,
      columnGap: 10,
      ...selectedTheme.data,
    },
  });
  const {
    handleSubmit,
    formState: { isDirty, isValid },
    reset,
    watch,
  } = form;
  const data = watch();

  useAutoConfirmDiscardChangesDialog(isDirty);

  const [deleteOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_deleteOrganizationPdfDocumentThemeDocument,
  );

  const showCreateOrUpdateDocumentThemeDialog = useCreateOrUpdateDocumentThemeDialog();
  const [createOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_createOrganizationPdfDocumentThemeDocument,
  );
  async function handleCreateNewDocumentTheme() {
    try {
      const { name, isDefault } = await showCreateOrUpdateDocumentThemeDialog({ theme: null });
      const { data } = await createOrganizationPdfDocumentTheme({
        variables: { name, isDefault },
      });
      if (isNonNullish(data)) {
        const theme = data.createOrganizationPdfDocumentTheme.pdfDocumentThemes[0];
        reset(theme.data);
        setSelectedTheme(theme);
      }
    } catch {}
  }

  const [updateOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_updateOrganizationPdfDocumentThemeDocument,
  );
  const showConfirmDeleteThemeDialog = useConfirmDeleteThemeDialog();
  async function handleEditDocumentTheme() {
    try {
      const { name, isDefault } = await showCreateOrUpdateDocumentThemeDialog({
        theme: selectedTheme,
      });
      const { data } = await updateOrganizationPdfDocumentTheme({
        variables: { orgThemeId: selectedTheme.id, name, isDefault },
      });
      if (isNonNullish(data)) {
        const theme = data.updateOrganizationPdfDocumentTheme.pdfDocumentThemes.find(
          (t) => t.id === selectedTheme.id,
        )!;
        reset(theme.data);
        setSelectedTheme(theme);
      }
    } catch (e) {
      if (isDialogError(e) && e.reason === "DELETE_THEME") {
        try {
          await showConfirmDeleteThemeDialog();
          const { data } = await deleteOrganizationPdfDocumentTheme({
            variables: { orgThemeId: selectedTheme.id },
          });
          if (isNonNullish(data)) {
            setSelectedTheme(
              data.deleteOrganizationPdfDocumentTheme.pdfDocumentThemes.find((t) => t.isDefault)!,
            );
          }
        } catch {}
      }
    }
  }

  const showConfirmDiscardChangesDialog = useConfirmDiscardChangesDialog();
  async function handleThemeChange(theme: BrandingDocumentTheme_OrganizationThemeFragment) {
    if (isDirty) {
      try {
        await showConfirmDiscardChangesDialog();
        reset(theme.data);
        setSelectedTheme(theme);
      } catch {}
    } else {
      reset(theme.data);
      setSelectedTheme(theme);
    }
  }

  return (
    <Grid
      as="form"
      autoComplete="off"
      onSubmit={handleSubmit(async (value) => {
        try {
          const { data } = await updateOrganizationPdfDocumentTheme({
            variables: {
              orgThemeId: selectedTheme.id,
              data: value,
            },
          });
          if (isNonNullish(data)) {
            const theme = data.updateOrganizationPdfDocumentTheme.pdfDocumentThemes.find(
              (t) => t.id === selectedTheme.id,
            )!;
            reset(theme.data);
          }
        } catch {}
      })}
      padding={6}
      gridColumnGap={{ base: 8, xl: 16 }}
      gridRowGap={{ base: 4, xl: 6 }}
      gridTemplateColumns={{ base: "1fr", xl: "fit-content(420px) 1fr" }}
      gridTemplateAreas={{ base: `"a" "c" "d"`, xl: `"a b" "c d"` }}
    >
      <Stack minWidth="0">
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage
            id="component.branding-document-theme.themes-header"
            defaultMessage="Themes"
          />
        </Heading>
        <HStack width="100%">
          <Box flex="1" minWidth="0">
            <DocumentThemeSelect
              onCreateNewTheme={handleCreateNewDocumentTheme}
              onChange={(t) => handleThemeChange(t!)}
              value={selectedTheme}
              options={documentThemes.filter((t) => t.id !== selectedTheme.id)}
              isCreateNewThemeDisabled={!userHasPermission}
            />
          </Box>
          <ResponsiveButtonIcon
            type="submit"
            breakpoint="lg"
            icon={<SaveIcon />}
            hideIconOnDesktop
            colorScheme="primary"
            label={intl.formatMessage({
              id: "generic.save",
              defaultMessage: "Save",
            })}
            disabled={!isDirty || !isValid || !userHasPermission}
          />
          <IconButtonWithTooltip
            icon={<EditIcon />}
            label={intl.formatMessage({
              id: "component.branding-document-theme.edit-theme-tooltip",
              defaultMessage: "Edit theme",
            })}
            disabled={!userHasPermission}
            onClick={handleEditDocumentTheme}
          />
          <Box display={{ base: "block", xl: "none" }}>
            <Button
              variant="solid"
              colorPalette="primary"
              onClick={handleCreateNewDocumentTheme}
              disabled={!userHasPermission}
              width="full"
            >
              <FormattedMessage
                id="component.branding-document-theme.new-theme-button"
                defaultMessage="New theme"
              />
            </Button>
          </Box>
        </HStack>
      </Stack>
      <Box display={{ base: "none", xl: "flex" }} alignSelf="flex-end" justifySelf="flex-end">
        <Button
          variant="solid"
          colorPalette="primary"
          onClick={handleCreateNewDocumentTheme}
          disabled={!userHasPermission}
          width="full"
        >
          <FormattedMessage
            id="component.branding-document-theme.new-theme-button"
            defaultMessage="New theme"
          />
        </Button>
      </Box>
      <Stack spacing={8} gridArea="c">
        {!userHasPermission ? <RestrictedFeatureAlert /> : null}
        <FormProvider {...form}>
          <DocumentThemeEditor
            user={user}
            themeId={selectedTheme.id}
            isDisabled={!userHasPermission}
          />
        </FormProvider>
      </Stack>
      <Stack alignItems="center" width="100%" gridArea="d">
        {selectedTheme ? (
          <DocumentThemePreview organization={user.organization} theme={data} />
        ) : null}
      </Stack>
    </Grid>
  );
}

const _fragments = {
  User: gql`
    fragment BrandingDocumentTheme_User on User {
      id
      organization {
        ...DocumentThemePreview_Organization
        pdfDocumentThemes {
          ...BrandingDocumentTheme_OrganizationTheme
        }
      }
      ...DocumentThemeEditor_User
    }
  `,

  OrganizationTheme: gql`
    fragment BrandingDocumentTheme_OrganizationTheme on OrganizationTheme {
      id
      name
      data
      isDefault
    }
  `,
};

const _mutations = [
  gql`
    mutation BrandingDocumentTheme_createOrganizationPdfDocumentTheme(
      $name: String!
      $isDefault: Boolean!
    ) {
      createOrganizationPdfDocumentTheme(name: $name, isDefault: $isDefault) {
        id
        pdfDocumentThemes {
          ...BrandingDocumentTheme_OrganizationTheme
        }
      }
    }
  `,
  gql`
    mutation BrandingDocumentTheme_updateOrganizationPdfDocumentTheme(
      $orgThemeId: GID!
      $name: String
      $isDefault: Boolean
      $data: JSONObject
    ) {
      updateOrganizationPdfDocumentTheme(
        orgThemeId: $orgThemeId
        name: $name
        isDefault: $isDefault
        data: $data
      ) {
        id
        pdfDocumentThemes {
          ...BrandingDocumentTheme_OrganizationTheme
        }
      }
    }
  `,
  gql`
    mutation BrandingDocumentTheme_deleteOrganizationPdfDocumentTheme($orgThemeId: GID!) {
      deleteOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId) {
        id
        pdfDocumentThemes {
          ...BrandingDocumentTheme_OrganizationTheme
        }
      }
    }
  `,
];
