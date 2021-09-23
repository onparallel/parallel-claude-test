import { useMemo } from "react";
import { useIntl } from "react-intl";

export type PublicTemplateCategory = {
  label: string;
  slug: string;
};

export function usePublicTemplateCategories(): PublicTemplateCategory[] {
  const intl = useIntl();
  return useMemo<PublicTemplateCategory[]>(
    () => [
      {
        label: intl.formatMessage({
          id: "public-templates.categories.administration",
          defaultMessage: "Administration",
        }),
        slug: "administration",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.business-development",
          defaultMessage: "Business development",
        }),
        slug: "business-development",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.compliance",
          defaultMessage: "Compliance",
        }),
        slug: "compliance",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.customer-service",
          defaultMessage: "Customer service",
        }),
        slug: "customer-service",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.engineering",
          defaultMessage: "Engineering",
        }),
        slug: "engineering",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.finance",
          defaultMessage: "Finance",
        }),
        slug: "finance",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.general-management",
          defaultMessage: "General Management",
        }),
        slug: "general-management",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.it",
          defaultMessage: "IT",
        }),
        slug: "it",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.hr",
          defaultMessage: "HR",
        }),
        slug: "hr",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.legal",
          defaultMessage: "Legal",
        }),
        slug: "legal",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.marketing",
          defaultMessage: "Marketing",
        }),
        slug: "marketing",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.operations",
          defaultMessage: "Operations",
        }),
        slug: "operations",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.procurement",
          defaultMessage: "Procurement",
        }),
        slug: "procurement",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.product",
          defaultMessage: "Product",
        }),
        slug: "product",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.real-estate",
          defaultMessage: "Real Estate",
        }),
        slug: "real-estate",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.sales",
          defaultMessage: "Sales",
        }),
        slug: "sales",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.other",
          defaultMessage: "Other",
        }),
        slug: "other",
      },
    ],
    [intl.locale]
  );
}
