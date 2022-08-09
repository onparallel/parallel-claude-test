import { FeatureFlag } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

interface FeatureFlagInformation {
  name: FeatureFlag;
  title: string;
  description: string;
  articleId?: number;
}

export function useFeatureFlags() {
  const intl = useIntl();
  return useMemo<FeatureFlagInformation[]>(
    () => [
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
        name: "DEVELOPER_ACCESS",
        title: intl.formatMessage({
          id: "component.feature-flag-descriptions.developer-access-name",
          defaultMessage: "Developer access",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.developer-access-description",
          defaultMessage: "Gives access to the developers view.",
        }),
      },
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
      },
      {
        name: "PETITION_PDF_EXPORT",
        title: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-pdf-export-name",
          defaultMessage: "PDF export",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-pdf-export-description",
          defaultMessage: "Allows exporting the parallel to PDF.",
        }),
      },
      {
        name: "PETITION_SIGNATURE",
        title: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-signature-name",
          defaultMessage: "Signaturit Integration",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-signature-description",
          defaultMessage:
            "Activates the Signaturit integration section so that the TOKEN API can be entered.",
        }),
      },
      {
        name: "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI",
        title: intl.formatMessage({
          id: "component.feature-flag-descriptions.prefill-public-links-name",
          defaultMessage: "Pre-fill public links (UI)",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.prefill-public-links-description",
          defaultMessage: "Allows you to pre-fill public links.",
        }),
        articleId: 6261913,
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
            'Eliminates all Parallel branding from recipient and mailing view (including "Why we use Parallel")',
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
          defaultMessage: 'Removes the "Why we use Parallel" block in mails to recipients',
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
        name: "TEMPLATE_REPLIES_RECIPIENT_URL",
        title: intl.formatMessage({
          id: "component.feature-flag-descriptions.template-replies-recipient-url-name",
          defaultMessage: "Template Replies Excel Recipient URL",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.template-replies-recipient-url-description",
          defaultMessage: "Adds a column on the template replies Excel report with recipient URL",
        }),
      },
    ],
    [intl.locale]
  );
}
