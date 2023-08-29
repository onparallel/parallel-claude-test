import { useMemo } from "react";
import { useIntl } from "react-intl";

export interface PublicTemplateCategory {
  label: string;
  slug: string;
}

export function usePublicTemplateCategories(): PublicTemplateCategory[] {
  const intl = useIntl();
  return useMemo<PublicTemplateCategory[]>(
    () => [
      {
        label: intl.formatMessage({
          id: "generic.template-category-administration",
          defaultMessage: "Administration",
        }),
        slug: "administration",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-business-development",
          defaultMessage: "Business development",
        }),
        slug: "business-development",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-compliance",
          defaultMessage: "Compliance",
        }),
        slug: "compliance",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-customer-service",
          defaultMessage: "Customer service",
        }),
        slug: "customer-service",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-engineering",
          defaultMessage: "Engineering",
        }),
        slug: "engineering",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-finance",
          defaultMessage: "Finance",
        }),
        slug: "finance",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-general-management",
          defaultMessage: "General Management",
        }),
        slug: "general-management",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-it",
          defaultMessage: "IT",
        }),
        slug: "it",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-hr",
          defaultMessage: "HR",
        }),
        slug: "hr",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-legal",
          defaultMessage: "Legal",
        }),
        slug: "legal",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-marketing",
          defaultMessage: "Marketing",
        }),
        slug: "marketing",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-operations",
          defaultMessage: "Operations",
        }),
        slug: "operations",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-procurement",
          defaultMessage: "Procurement",
        }),
        slug: "procurement",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-product",
          defaultMessage: "Product",
        }),
        slug: "product",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-real-estate",
          defaultMessage: "Real Estate",
        }),
        slug: "real-estate",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-sales",
          defaultMessage: "Sales",
        }),
        slug: "sales",
      },
      {
        label: intl.formatMessage({
          id: "generic.template-category-other",
          defaultMessage: "Other",
        }),
        slug: "other",
      },
    ],
    [intl.locale],
  );
}
