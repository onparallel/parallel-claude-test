import { FeatureFlag } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useSupportedPetitionLocales } from "./locales";

interface FeatureFlagCategorized {
  category: string;
  featureFlags: FeatureFlagInformation[];
}

interface FeatureFlagInformation {
  name: FeatureFlag;
  title: string;
  description: string;
  articleId?: number;
  disabled?: boolean;
}

export function useFeatureFlags() {
  const intl = useIntl();
  const locales = useSupportedPetitionLocales();
  return useMemo<FeatureFlagCategorized[]>(
    () => [
      {
        category: intl.formatMessage({
          id: "component.feature-flag-descriptions.enterprise",
          defaultMessage: "Enterprise",
        }),
        featureFlags: [
          {
            name: "AUTO_ANONYMIZE",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.auto-anonymize-name",
              defaultMessage: "Compliance feature",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.auto-anonymize-description",
              defaultMessage:
                "Allows setting up a period of time for the parallels to be automatically anonymized after x days of their closing.",
            }),
          },
          {
            name: "GHOST_LOGIN",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.ghost-login-name",
              defaultMessage: '"Ghost login" feature',
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.ghost-login-description",
              defaultMessage: "Allows the admins to login as users from their organization.",
            }),
          },
          {
            name: "ON_BEHALF_OF",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.on-behalf-of-name",
              defaultMessage: '"Send as" feature',
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.on-behalf-of-description",
              defaultMessage:
                "Add the option to send parallels on behalf of another user from their organization.",
            }),
          },
          {
            name: "CLIENT_PORTAL",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.client-portal-name",
              defaultMessage: "Client portal",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.client-portal-description",
              defaultMessage: "Allows recipients to access the client portal.",
            }),
          },
          {
            name: "PERMISSION_MANAGEMENT",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.permission-management-name",
              defaultMessage: "Permissions management",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.permission-management-description",
              defaultMessage: "Allows users to manage user permissions on teams.",
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "component.feature-flag-descriptions.branding",
          defaultMessage: "Branding",
        }),
        featureFlags: [
          {
            name: "CUSTOM_HOST_UI",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.custom-host-ui-name",
              defaultMessage: "Subdomain feature (UI)",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.custom-host-ui-description",
              defaultMessage:
                "Remove the enterprise banners around the button to request a subdomain change.",
            }),
          },
          {
            name: "REMOVE_PARALLEL_BRANDING",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.remove-parallel-branding-name",
              defaultMessage: "Remove Parallel branding",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.remove-parallel-branding-description",
              defaultMessage:
                'Eliminates all Parallel branding from recipient and mailing view (including "Why we use Parallel?")',
            }),
          },
          {
            name: "REMOVE_WHY_WE_USE_PARALLEL",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.remove-why-we-use-parallel-name",
              defaultMessage: 'Remove "Why do we use Parallel?"',
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.remove-why-we-use-parallel-description",
              defaultMessage: 'Removes the "Why we use Parallel?" block in mails to recipients',
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "component.feature-flag-descriptions.integrations",
          defaultMessage: "Integrations",
        }),
        featureFlags: [
          {
            name: "ES_TAX_DOCUMENTS_FIELD",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.es-tax-documents-field-name",
              defaultMessage: "Tax documents field (ESP)",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.es-tax-documents-field-description",
              defaultMessage: "Gives access to the Bankflip field.",
            }),
          },
          {
            name: "PETITION_SIGNATURE",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.petition-signature-name",
              defaultMessage: "Signature Integration",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.petition-signature-description",
              defaultMessage:
                "Activates the signature integrations section so that the signature providers can be created and used.",
            }),
          },
          {
            name: "DOW_JONES_KYC",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.dow-jones-kyc-name",
              defaultMessage: "Dow Jones Field",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.dow-jones-kyc-description",
              defaultMessage: "Enables the Dow Jones petition field on the organization.",
            }),
          },
          {
            name: "DOCUSIGN_SANDBOX_PROVIDER",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.docusign-sandbox-provider-name",
              defaultMessage: "DocuSign Sandbox Provider",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.docusign-sandbox-provider-description",
              defaultMessage:
                "Enables the setting to create a DocuSign Sandbox integration on the organization.",
            }),
          },
          {
            name: "PETITION_SUMMARY",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.petition-summary-name",
              defaultMessage: "Petition Summary",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.petition-summary-description",
              defaultMessage:
                "Enables the creation of an AI Summary on the organization petitions.",
            }),
          },
          {
            name: "BACKGROUND_CHECK",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.background-check-name",
              defaultMessage: "Background check",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.background-check-description",
              defaultMessage: "Enables the Background check petition field on the organization.",
            }),
          },
          {
            name: "DOCUMENT_PROCESSING",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.document-processing-name",
              defaultMessage: "AI document processing",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.document-processing-description",
              defaultMessage: "Enables the AI document processing feature on file fields.",
            }),
          },
          {
            name: "ADVERSE_MEDIA_SEARCH",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.adverse-media-search-name",
              defaultMessage: "Adverse media search",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.adverse-media-search-description",
              defaultMessage:
                "Enables the Adverse media search petition field on the organization.",
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "component.feature-flag-descriptions.custom-solutions",
          defaultMessage: "Custom solutions",
        }),
        featureFlags: [
          {
            name: "EXPORT_CUATRECASAS",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.export-cuatrecasas-name",
              defaultMessage: "Export Cuatrecasas",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.export-cuatrecasas-description",
              defaultMessage: "Allows Cuatrecasas to export the contents to its LocalAPI",
            }),
          },
          {
            name: "HIDE_RECIPIENT_VIEW_CONTENTS",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.hide-recipient-view-contents-name",
              defaultMessage: "Hide recipient view contents",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.hide-recipient-view-contents-description",
              defaultMessage:
                "Activate the setting to hide the table of contents in the recipient view.",
            }),
          },
          {
            name: "SKIP_FORWARD_SECURITY",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.skip-forward-security-name",
              defaultMessage: "Feature Disable forwarding protection",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.skip-forward-security-description",
              defaultMessage:
                "Enables the setting for the request to skip recipient verification (forward security).",
            }),
          },
          {
            name: "TEMPLATE_REPLIES_PREVIEW_URL",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.template-replies-preview-url-name",
              defaultMessage: "Template Replies Excel Preview URL",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.template-replies-preview-url-description",
              defaultMessage:
                "Adds a column on the template replies Excel report with petition preview URL",
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "component.feature-flag-descriptions.developers-solutions",
          defaultMessage: "Developers solutions",
        }),
        featureFlags: [
          {
            name: "PETITION_ACCESS_RECIPIENT_URL_FIELD",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.petition-access-recipient-url-field-name",
              defaultMessage: "API access to the recipient's URL",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.petition-access-recipient-url-field-description",
              defaultMessage:
                "Allows obtaining the url of the recipient view through the API. Only for Paymefy type applications that validate the user's identity.",
            }),
            articleId: 8837461,
          },

          {
            name: "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.prefill-secret-public-links-name",
              defaultMessage: "Pre-fill public links with JWT query",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.prefill-secret-public-links-description",
              defaultMessage:
                "Allows you to pre-fill public links with a JWT payload in the query.",
            }),
            articleId: 6261913,
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "component.feature-flag-descriptions.others",
          defaultMessage: "Others",
        }),
        featureFlags: [
          {
            name: "REMOVE_PREVIEW_FILES",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.remove-preview-files-name",
              defaultMessage: "Remove preview files",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.remove-preview-files-description",
              defaultMessage: "Removes the option to open images and pdf files in the browser.",
            }),
          },
          {
            name: "PETITION_APPROVAL_FLOW",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.petition-approval-flow-name",
              defaultMessage: "Approval steps",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.petition-approval-flow-description",
              defaultMessage: "Allows setting up approval steps for petitions",
            }),
          },
          {
            name: "PUBLIC_PETITION_LINK_PREFILL_DATA",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.prefill-data-public-links-name",
              defaultMessage: "Pre-fill data in public links",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.prefill-data-public-links-description",
              defaultMessage:
                "Allows you to pre-fill public links with data from the preview page.",
            }),
          },
          {
            name: "PROFILES",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.profiles-name",
              defaultMessage: "Profiles",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.profiles-description",
              defaultMessage: "Grants access to profiles",
            }),
          },
          {
            name: "PROFILE_SEARCH_FIELD",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.profile-search-field-name",
              defaultMessage: "Profile search field",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.profile-search-field-description",
              defaultMessage: "Grants access to the profile search field",
            }),
          },
          {
            name: "CREATE_PROFILE_TYPE",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.create-profile-type-name",
              defaultMessage: "Create profile types",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.create-profile-type-description",
              defaultMessage: "Grants access to create profile types",
            }),
          },
          {
            name: "CUSTOM_PROPERTIES",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.custom-properties-name",
              defaultMessage: "Petition custom properties",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.custom-properties-description",
              defaultMessage:
                "Grants access to the API endpoint for modifying petition custom properties",
            }),
          },
          {
            name: "SETTING_DELEGATE_ACCESS",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.delegate-access-name",
              defaultMessage: 'Setting "Invite collaborator"',
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.delegate-access-description",
              defaultMessage: 'Allows turning off "Invite collaborator" on the recipient view',
            }),
          },
          {
            name: "PDF_EXPORT_V2",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.pdf-export-v2-name",
              defaultMessage: "PDF Export V2",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.pdf-export-v2-description",
              defaultMessage: 'Enables the new PDF engine "Typst"',
            }),
          },
          {
            name: "DASHBOARDS",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.dashboards-name",
              defaultMessage: "Dashboards",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.dashboards-description",
              defaultMessage: "Grants access to dashboards",
            }),
          },
          {
            name: "SHOW_CONTACTS_BUTTON",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.show-contacts-button-name",
              defaultMessage: "Show contacts button",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.show-contacts-button-description",
              defaultMessage: "Shows the contacts button in nav bar",
            }),
          },
          {
            name: "SIGN_WITH_DIGITAL_CERTIFICATE",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.sign-with-digital-certificate-name",
              defaultMessage: "Sign with digital certificate",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.sign-with-digital-certificate-description",
              defaultMessage:
                "Allows each signer on a petition to sign with a previously uploaded digital certificate",
            }),
          },
          {
            name: "SIGN_WITH_EMBEDDED_IMAGE",
            title: intl.formatMessage({
              id: "component.feature-flag-descriptions.sign-with-image-name",
              defaultMessage: "Sign with embedded image",
            }),
            description: intl.formatMessage({
              id: "component.feature-flag-descriptions.sign-with-image-description",
              defaultMessage: "Allows each signer on a petition to sign using an embedded PNG",
            }),
          },
          ...(["ca", "it", "pt"] as const).map((locale) => {
            const lang = locales.find((l) => l.key === locale)!.localizedLabel;
            return {
              name: `RECIPIENT_LANG_${locale.toUpperCase() as Uppercase<typeof locale>}` as const,
              title: intl.formatMessage(
                {
                  id: "component.feature-flag-descriptions.recipient-lang-generic",
                  defaultMessage: "Recipient language: {lang}",
                },
                { lang },
              ),
              description: intl.formatMessage(
                {
                  id: "component.feature-flag-descriptions.recipient-lang-generic-description",
                  defaultMessage: "Allows selecting {lang} as the recipient language",
                },
                { lang },
              ),
            };
          }),
        ],
      },
    ],
    [intl.locale],
  );
}
