import { useMemo } from "react";
import { useIntl } from "react-intl";

export type PublicTemplateCategory = {
  label: string;
  slug: string;
  description: string;
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
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.business-development",
          defaultMessage: "Business development",
        }),
        slug: "business-development",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.compliance",
          defaultMessage: "Compliance",
        }),
        slug: "compliance",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.customer-service",
          defaultMessage: "Customer service",
        }),
        slug: "customer-service",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.engineering",
          defaultMessage: "Engineering",
        }),
        slug: "engineering",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.finance",
          defaultMessage: "Finance",
        }),
        slug: "finance",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.general-management",
          defaultMessage: "General Management",
        }),
        slug: "general-management",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.it",
          defaultMessage: "IT",
        }),
        slug: "it",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.hr",
          defaultMessage: "HR",
        }),
        slug: "hr",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.legal",
          defaultMessage: "Legal",
        }),
        slug: "legal",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.marketing",
          defaultMessage: "Marketing",
        }),
        slug: "marketing",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.operations",
          defaultMessage: "Operations",
        }),
        slug: "operations",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.procurement",
          defaultMessage: "Procurement",
        }),
        slug: "procurement",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.product",
          defaultMessage: "Product",
        }),
        slug: "product",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.sales",
          defaultMessage: "Sales",
        }),
        slug: "sales",
        description: "",
      },
      {
        label: intl.formatMessage({
          id: "public-templates.categories.other",
          defaultMessage: "Other",
        }),
        slug: "other",
        description: "",
      },
    ],
    [intl.locale]
  );
}
