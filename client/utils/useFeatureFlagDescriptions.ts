import { FeatureFlag } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

type FeatureFlagDescription = {
  [feature in FeatureFlag]?: {
    name?: string;
    description?: string;
    articleId?: number;
  };
};

export function useFeatureFlagDescriptions(): FeatureFlagDescription {
  const intl = useIntl();
  return useMemo(
    () => ({
      AUTO_ANONYMIZE: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.auto-anonymize-name",
          defaultMessage: "Compliance feature",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.auto-anonymize-description",
          defaultMessage:
            "Allows to include a period for the prallels to be automatically anonymized after x days of its closing.",
        }),
      },
      CUSTOM_HOST_UI: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.custom-host-ui-name",
          defaultMessage: "Subdomain feature (UI)",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.custom-host-ui-description",
          defaultMessage:
            "Remove the enterprise banners around the button to request a subdomain change.",
        }),
      },
      DEVELOPER_ACCESS: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.developer-access-name",
          defaultMessage: "Developer access",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.developer-access-description",
          defaultMessage: "Gives access to the developers view.",
        }),
      },
      ES_TAX_DOCUMENTS_FIELD: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.es-tax-documents-field-name",
          defaultMessage: "Tax documents field (ESP)",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.es-tax-documents-field-description",
          defaultMessage: "Gives access to the Bankflip field.",
        }),
      },
      EXPORT_CUATRECASAS: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.export-cuatrecasas-name",
          defaultMessage: "Export Cuatrecasas",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.export-cuatrecasas-description",
          defaultMessage: "Allows Cuatrecasas to export the contents to its LocalAPI",
        }),
      },
      GHOST_LOGIN: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.ghost-login-name",
          defaultMessage: '"Access as" feature ',
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.ghost-login-description",
          defaultMessage:
            "Allows the organization's admin to login as users of your org (ghost login).",
        }),
      },
      HIDE_RECIPIENT_VIEW_CONTENTS: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.hide-recipient-view-contents-name",
          defaultMessage: "Hide recipient view contents",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.hide-recipient-view-contents-description",
          defaultMessage:
            "Activate the setting to hide the table of contents in the recipient view.",
        }),
      },
      ON_BEHALF_OF: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.on-behalf-of-name",
          defaultMessage: '"Send as" feature',
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.on-behalf-of-description",
          defaultMessage: "Add the option to send parallels on behalf of other user.",
        }),
      },
      PETITION_ACCESS_RECIPIENT_URL_FIELD: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-access-recipient-url-field-name",
          defaultMessage: "API access to the recipient's URL",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-access-recipient-url-field-description",
          defaultMessage:
            "Allows to obtain the url of the recipient view through the API. Only for Paymefy type applications that validate the user's identity.",
        }),
      },
      PETITION_PDF_EXPORT: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-pdf-export-name",
          defaultMessage: "PDF export",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-pdf-export-description",
          defaultMessage: "Allows exporting the parallel to PDF.",
        }),
      },
      PETITION_SIGNATURE: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-signature-name",
          defaultMessage: "Signaturit Integration",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.petition-signature-description",
          defaultMessage:
            "Activates the Signaturit integration section so that the TOKEN API can be entered.",
        }),
      },
      PUBLIC_PETITION_LINK_PREFILL_SECRET_UI: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.prefill-public-links-name",
          defaultMessage: "Pre-fill public links (UI)",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.prefill-public-links-description",
          defaultMessage: "Allows you to pre-fill public links.",
        }),
        articleId: 6261913,
      },
      REMOVE_PARALLEL_BRANDING: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.remove-parallel-branding-name",
          defaultMessage: "Remove Parallel branding",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.remove-parallel-branding-description",
          defaultMessage:
            'Eliminates all Parallel branding from recipient and mailing view (including "Why we use Parallel")',
        }),
      },
      REMOVE_WHY_WE_USE_PARALLEL: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.remove-why-we-use-parallel-name",
          defaultMessage: 'Remove "Why do we use Parallel?"',
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.remove-why-we-use-parallel-description",
          defaultMessage: 'Removes the "Why we use Parallel" block in mails to recipients',
        }),
      },
      SKIP_FORWARD_SECURITY: {
        name: intl.formatMessage({
          id: "component.feature-flag-descriptions.skip-forward-security-name",
          defaultMessage: "Feature Disable forwarding protection",
        }),
        description: intl.formatMessage({
          id: "component.feature-flag-descriptions.skip-forward-security-description",
          defaultMessage:
            "Enables the setting for the request to skip recipient verification (forward security).",
        }),
      },
    }),
    [intl.locale]
  );
}
