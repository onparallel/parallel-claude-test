import { gql, useMutation } from "@apollo/client";
import { Box, Button, Grid, Heading, HStack, Stack } from "@chakra-ui/react";
import { EditIcon, SaveIcon } from "@parallel/chakra/icons";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import {
  DocumentThemeEditor,
  DocumentThemeEditorData,
} from "@parallel/components/organization/branding/DocumentThemeEditor";
import { DocumentThemePreview } from "@parallel/components/organization/branding/DocumentThemePreview";
import { DocumentThemeSelect } from "@parallel/components/organization/branding/DocumentThemeSelect";
import { useConfirmDeleteThemeDialog } from "@parallel/components/organization/dialogs/ConfirmDeleteThemeDialog";
import { useCreateOrUpdateDocumentThemeDialog } from "@parallel/components/organization/dialogs/CreateOrUpdateDocumentThemeDialog";
import {
  BrandingDocumentTheme_createOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_deleteOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_OrganizationThemeFragment,
  BrandingDocumentTheme_updateOrganizationPdfDocumentThemeDocument,
  BrandingDocumentTheme_UserFragment,
} from "@parallel/graphql/__types";
import { isAdmin } from "@parallel/utils/roles";
import Router from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, noop, zip } from "remeda";
import { useConfirmDiscardChangesDialog } from "../dialogs/ConfirmDiscardChangesDialog";

interface BrandingDocumentThemeProps {
  user: BrandingDocumentTheme_UserFragment;
}

export function BrandingDocumentTheme({ user }: BrandingDocumentThemeProps) {
  const intl = useIntl();

  const hasAdminRole = isAdmin(user.role);
  const documentThemes = user.organization.pdfDocumentThemes;

  const [selectedTheme, setSelectedTheme] = useState(documentThemes.find((t) => t.isDefault)!);

  const form = useForm<DocumentThemeEditorData>({
    mode: "onChange",
    defaultValues: selectedTheme.data,
  });
  const {
    handleSubmit,
    watch,
    formState: { isDirty, isValid },
    reset,
    setValue,
  } = form;

  useEffect(() => {
    reset(selectedTheme.data);
  }, [selectedTheme.id]);

  const showConfirmDiscardChangesDialog = useConfirmDiscardChangesDialog();
  useEffect(() => {
    let omitNextRouteChange = false;
    async function confirmRouteChange(path: string) {
      try {
        await showConfirmDiscardChangesDialog({});
        omitNextRouteChange = true;
        Router.push(path);
      } catch {}
    }
    function handleRouteChangeStart(path: string) {
      if (omitNextRouteChange) {
        return;
      }
      if (form.formState.isDirty) {
        confirmRouteChange(path).then(noop);
        Router.events.emit("routeChangeError");
        throw "CANCEL_ROUTE_CHANGE";
      }
    }
    Router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      Router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, []);

  const fontProperties = (["title1", "title2", "text"] as const).flatMap((k) =>
    (["FontFamily", "FontSize", "Color"] as const).map((p) => `${k}${p}` as const)
  );
  const data = watch();
  const defaultFontValues = [16, 14, 12].flatMap((s) => ["IBM Plex Sans", s, "#000000"]);
  const canRestoreFonts = zip(
    fontProperties.map((p) => data[p]),
    defaultFontValues
  ).some(([a, b]) => a !== b);
  async function handleRestoreFonts() {
    for (const [prop, value] of zip(fontProperties, defaultFontValues)) {
      setValue(prop, value, { shouldDirty: true });
    }
  }

  const [deleteOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_deleteOrganizationPdfDocumentThemeDocument
  );

  const showCreateOrUpdateDocumentThemeDialog = useCreateOrUpdateDocumentThemeDialog();
  const [createOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_createOrganizationPdfDocumentThemeDocument
  );
  async function handleCreateNewDocumentTheme() {
    try {
      const { name, isDefault } = await showCreateOrUpdateDocumentThemeDialog({ theme: null });
      const { data } = await createOrganizationPdfDocumentTheme({
        variables: { name, isDefault },
      });
      if (isDefined(data)) {
        const theme = data.createOrganizationPdfDocumentTheme.pdfDocumentThemes[0];
        setSelectedTheme(theme);
      }
    } catch {}
  }

  const [updateOrganizationPdfDocumentTheme] = useMutation(
    BrandingDocumentTheme_updateOrganizationPdfDocumentThemeDocument
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
      if (isDefined(data)) {
        const theme = data.updateOrganizationPdfDocumentTheme.pdfDocumentThemes.find(
          (t) => t.id === selectedTheme.id
        )!;
        setSelectedTheme(theme);
      }
    } catch (e) {
      if (isDialogError(e) && e.reason === "DELETE_THEME") {
        try {
          await showConfirmDeleteThemeDialog({});
          const { data } = await deleteOrganizationPdfDocumentTheme({
            variables: { orgThemeId: selectedTheme.id },
          });
          if (isDefined(data)) {
            setSelectedTheme(
              data.deleteOrganizationPdfDocumentTheme.pdfDocumentThemes.find((t) => t.isDefault)!
            );
          }
        } catch {}
      }
    }
  }

  async function handleThemeChange(theme: BrandingDocumentTheme_OrganizationThemeFragment) {
    if (isDirty) {
      try {
        await showConfirmDiscardChangesDialog({});
        setSelectedTheme(theme);
      } catch {}
    } else {
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
          if (isDefined(data)) {
            const theme = data.updateOrganizationPdfDocumentTheme.pdfDocumentThemes.find(
              (t) => t.id === selectedTheme.id
            )!;
            reset(theme.data);
          }
        } catch {}
      })}
      padding={6}
      gridColumnGap={{ base: 8, xl: 16 }}
      gridRowGap={{ base: 6, xl: 8 }}
      gridTemplateColumns={{ base: "1fr", xl: "fit-content(420px) 1fr" }}
      gridTemplateAreas={{ base: `"a" "c" "d"`, xl: `"a b" "c d"` }}
    >
      <Stack>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage id="branding.themes-header" defaultMessage="Themes" />
        </Heading>
        <HStack width="100%">
          <Box flex="1">
            <DocumentThemeSelect
              onCreateNewTheme={handleCreateNewDocumentTheme}
              onChange={(t) => handleThemeChange(t!)}
              value={selectedTheme}
              options={documentThemes.filter((t) => t.id !== selectedTheme.id)}
              isCreateNewThemeDisabled={!hasAdminRole}
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
            isDisabled={!isDirty || !isValid}
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
          <Box display={{ base: "block", xl: "none" }}>
            <Button
              variant="solid"
              colorScheme="primary"
              onClick={handleCreateNewDocumentTheme}
              isDisabled={!hasAdminRole}
              width="full"
            >
              <FormattedMessage id="branding.new-theme-button" defaultMessage="New theme" />
            </Button>
          </Box>
        </HStack>
      </Stack>
      <Box display={{ base: "none", xl: "flex" }} alignSelf="flex-end" justifySelf="flex-end">
        <Button
          variant="solid"
          colorScheme="primary"
          onClick={handleCreateNewDocumentTheme}
          isDisabled={!hasAdminRole}
          width="full"
        >
          <FormattedMessage id="branding.new-theme-button" defaultMessage="New theme" />
        </Button>
      </Box>
      <Stack spacing={8} gridArea="c">
        {!hasAdminRole ? <OnlyAdminsAlert /> : null}
        <FormProvider {...form}>
          <DocumentThemeEditor
            key={selectedTheme.id}
            canRestoreFonts={canRestoreFonts}
            onRestoreFonts={handleRestoreFonts}
            isDisabled={!hasAdminRole}
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

BrandingDocumentTheme.fragments = {
  get User() {
    return gql`
      fragment BrandingDocumentTheme_User on User {
        role
        organization {
          ...DocumentThemePreview_Organization
          pdfDocumentThemes {
            ...BrandingDocumentTheme_OrganizationTheme
          }
        }
      }
      ${DocumentThemePreview.fragments.Organization}
      ${this.OrganizationTheme}
    `;
  },

  get OrganizationTheme() {
    return gql`
      fragment BrandingDocumentTheme_OrganizationTheme on OrganizationTheme {
        id
        name
        data
        isDefault
      }
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
        pdfDocumentThemes {
          ...BrandingDocumentTheme_OrganizationTheme
        }
      }
    }
    ${BrandingDocumentTheme.fragments.OrganizationTheme}
  `,
  gql`
    mutation BrandingDocumentTheme_updateOrganizationPdfDocumentTheme(
      $orgThemeId: GID!
      $name: String
      $isDefault: Boolean
      $data: OrganizationPdfDocumentThemeInput
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
    ${BrandingDocumentTheme.fragments.OrganizationTheme}
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
    ${BrandingDocumentTheme.fragments.OrganizationTheme}
  `,
];
