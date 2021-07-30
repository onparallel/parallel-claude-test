import { useMemo } from "react";
import { useIntl } from "react-intl";

export type CategoryType = {
  id: string;
  href: string;
  label: string;
};

export function useCategories(): CategoryType[] {
  const intl = useIntl();

  return useMemo(
    () => [
      {
        id: "ALL",
        href: "/templates",
        label: intl.formatMessage({
          id: "global.categories.all-templates",
          defaultMessage: "All templates",
        }),
      },
      {
        id: "ADMINISTRATION",
        href: "/templates/category/administration",
        label: intl.formatMessage({
          id: "global.categories.administration",
          defaultMessage: "Administration",
        }),
      },
      {
        id: "BUSINESS_DEVELOPMENT",
        href: "/templates/category/business-development",
        label: intl.formatMessage({
          id: "global.categories.business-development",
          defaultMessage: "Business development",
        }),
      },
      {
        id: "COMPLIANCE",
        href: "/templates/category/compliance",
        label: intl.formatMessage({
          id: "global.categories.compliance",
          defaultMessage: "Compliance",
        }),
      },
      {
        id: "CUSTOMER_SERVICE",
        href: "/templates/category/customer-service",
        label: intl.formatMessage({
          id: "global.categories.customer-service",
          defaultMessage: "Customer service",
        }),
      },
      {
        id: "ENGINEERING",
        href: "/templates/category/engineering",
        label: intl.formatMessage({
          id: "global.categories.engineering",
          defaultMessage: "Engineering",
        }),
      },
      {
        id: "FINANCE",
        href: "/templates/category/finance",
        label: intl.formatMessage({
          id: "global.categories.finance",
          defaultMessage: "Finance",
        }),
      },
      {
        id: "GENERAL_MANAGEMENT",
        href: "/templates/category/general-management",
        label: intl.formatMessage({
          id: "global.categories.general-management",
          defaultMessage: "General Management",
        }),
      },
      {
        id: "IT",
        href: "/templates/category/information-technology",
        label: intl.formatMessage({
          id: "global.categories.it",
          defaultMessage: "IT",
        }),
      },
      {
        id: "HR",
        href: "/templates/category/human-resources",
        label: intl.formatMessage({
          id: "global.categories.hr",
          defaultMessage: "HR",
        }),
      },
      {
        id: "LEGAL",
        href: "/templates/category/legal",
        label: intl.formatMessage({
          id: "global.categories.legal",
          defaultMessage: "Legal",
        }),
      },
      {
        id: "MARKETING",
        href: "/templates/category/marketing",
        label: intl.formatMessage({
          id: "global.categories.marketing",
          defaultMessage: "Marketing",
        }),
      },
      {
        id: "OPERATIONS",
        href: "/templates/category/operations",
        label: intl.formatMessage({
          id: "global.categories.operations",
          defaultMessage: "Operations",
        }),
      },
      {
        id: "PROCUREMENT",
        href: "/templates/category/procurement",
        label: intl.formatMessage({
          id: "global.categories.procurement",
          defaultMessage: "Procurement",
        }),
      },
      {
        id: "PRODUCT",
        href: "/templates/category/product",
        label: intl.formatMessage({
          id: "global.categories.product",
          defaultMessage: "Product",
        }),
      },
      {
        id: "SALES",
        href: "/templates/category/sales",
        label: intl.formatMessage({
          id: "global.categories.sales",
          defaultMessage: "Sales",
        }),
      },
      {
        id: "OTHER",
        href: "/templates/category/other",
        label: intl.formatMessage({
          id: "global.categories.other",
          defaultMessage: "Other",
        }),
      },
    ],
    [intl.locale]
  );
}
