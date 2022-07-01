import { useMemo } from "react";
import { useIntl } from "react-intl";

export type PricingListFeatures = {
  label: string;
  plan: "FREE" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE" | "ON_DEMAND";
};

export type PricingListCategory = {
  category: string;
  features: PricingListFeatures[];
};

export function usePricingList(): PricingListCategory[] {
  const intl = useIntl();

  return useMemo<PricingListCategory[]>(
    () => [
      {
        category: intl.formatMessage({
          id: "page.pricing.core-features",
          defaultMessage: "Core features",
        }),
        features: [
          {
            label: intl.formatMessage({
              id: "page.pricing.unlimited-templates",
              defaultMessage: "Unlimited templates",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.unlimited-contacts",
              defaultMessage: "Unlimited contacts",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.pdf-export",
              defaultMessage: "PDF export",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.automatic-reminders",
              defaultMessage: "Automatic reminders",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.activity-log",
              defaultMessage: "Activity log",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.bulk-parallels",
              defaultMessage: "Bulk parallels",
            }),
            plan: "BASIC",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.user-groups",
              defaultMessage: "Teams",
            }),
            plan: "PROFESSIONAL",
          },

          {
            label: intl.formatMessage({
              id: "page.pricing.reporting",
              defaultMessage: "Reporting",
            }),
            plan: "PROFESSIONAL",
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.pricing.customization",
          defaultMessage: "Customization",
        }),
        features: [
          {
            label: intl.formatMessage({
              id: "page.pricing.custom-logo",
              defaultMessage: "Custom logo",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.custom-subdomain",
              defaultMessage: "Custom subdomain",
            }),
            plan: "BASIC",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.remove-branding",
              defaultMessage: "Remove Parallel branding",
            }),
            plan: "PROFESSIONAL",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.custom-domain",
              defaultMessage: "Custom domain",
            }),
            plan: "ENTERPRISE",
          },
        ],
      },
      {
        category: intl.formatMessage({ id: "page.pricing.security", defaultMessage: "Security" }),
        features: [
          {
            label: intl.formatMessage({
              id: "page.pricing.forward-security",
              defaultMessage: "Forward security",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.encrypted-storage",
              defaultMessage: "Encrypted storage",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.ssl-connection",
              defaultMessage: "SSL connection",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.sso-login",
              defaultMessage: "SSO login",
            }),
            plan: "ENTERPRISE",
          },
          {
            label: intl.formatMessage({ id: "page.pricing.scim", defaultMessage: "SCIM" }),
            plan: "ENTERPRISE",
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.pricing.integrations",
          defaultMessage: "Integrations",
        }),
        features: [
          {
            label: intl.formatMessage({
              id: "page.pricing.zapier-integration",
              defaultMessage: "Zapier integration",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.api-access",
              defaultMessage: "API access",
            }),
            plan: "BASIC",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.esignature",
              defaultMessage: "eSignature (Signaturit)",
            }),
            plan: "ON_DEMAND",
          },
        ],
      },
      {
        category: intl.formatMessage({ id: "page.pricing.support", defaultMessage: "Support" }),
        features: [
          {
            label: intl.formatMessage({
              id: "page.pricing.standard-support",
              defaultMessage: "Standard support",
            }),
            plan: "FREE",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.priority-support",
              defaultMessage: "Priority support",
            }),
            plan: "PROFESSIONAL",
          },
          {
            label: intl.formatMessage({
              id: "page.pricing.live-chat",
              defaultMessage: "Live chat",
            }),
            plan: "PROFESSIONAL",
          },
        ],
      },
      {
        category: intl.formatMessage({ id: "page.pricing.custom", defaultMessage: "Custom" }),
        features: [
          {
            label: intl.formatMessage({
              id: "page.pricing.custom-solutions",
              defaultMessage: "Custom solutions",
            }),
            plan: "ENTERPRISE",
          },
        ],
      },
    ],
    [intl.locale]
  );
}
