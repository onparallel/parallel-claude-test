import { PublicTemplateCard_LandingTemplateFragment } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export type CategoryType = {
  id: string;
  href: string;
  label: string;
  slug: string;
  templates: PublicTemplateCard_LandingTemplateFragment[];
  title: string;
  description: string;
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
        slug: "all",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "ADMINISTRATION",
        href: "/templates/category/administration",
        label: intl.formatMessage({
          id: "global.categories.administration",
          defaultMessage: "Administration",
        }),
        slug: "administration",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "BUSINESS_DEVELOPMENT",
        href: "/templates/category/business-development",
        label: intl.formatMessage({
          id: "global.categories.business-development",
          defaultMessage: "Business development",
        }),
        slug: "business-development",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "COMPLIANCE",
        href: "/templates/category/compliance",
        label: intl.formatMessage({
          id: "global.categories.compliance",
          defaultMessage: "Compliance",
        }),
        slug: "compliance",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "CUSTOMER_SERVICE",
        href: "/templates/category/customer-service",
        label: intl.formatMessage({
          id: "global.categories.customer-service",
          defaultMessage: "Customer service",
        }),
        slug: "customer-service",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "ENGINEERING",
        href: "/templates/category/engineering",
        label: intl.formatMessage({
          id: "global.categories.engineering",
          defaultMessage: "Engineering",
        }),
        slug: "engineering",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "FINANCE",
        href: "/templates/category/finance",
        label: intl.formatMessage({
          id: "global.categories.finance",
          defaultMessage: "Finance",
        }),
        slug: "finance",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "GENERAL_MANAGEMENT",
        href: "/templates/category/general-management",
        label: intl.formatMessage({
          id: "global.categories.general-management",
          defaultMessage: "General Management",
        }),
        slug: "general-management",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "IT",
        href: "/templates/category/information-technology",
        label: intl.formatMessage({
          id: "global.categories.it",
          defaultMessage: "IT",
        }),
        slug: "information-technology",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "HR",
        href: "/templates/category/human-resources",
        label: intl.formatMessage({
          id: "global.categories.hr",
          defaultMessage: "HR",
        }),
        slug: "human-resources",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "LEGAL",
        href: "/templates/category/legal",
        label: intl.formatMessage({
          id: "global.categories.legal",
          defaultMessage: "Legal",
        }),
        slug: "legal",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "MARKETING",
        href: "/templates/category/marketing",
        label: intl.formatMessage({
          id: "global.categories.marketing",
          defaultMessage: "Marketing",
        }),
        slug: "marketing",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "OPERATIONS",
        href: "/templates/category/operations",
        label: intl.formatMessage({
          id: "global.categories.operations",
          defaultMessage: "Operations",
        }),
        slug: "operations",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "PROCUREMENT",
        href: "/templates/category/procurement",
        label: intl.formatMessage({
          id: "global.categories.procurement",
          defaultMessage: "Procurement",
        }),
        slug: "procurement",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "PRODUCT",
        href: "/templates/category/product",
        label: intl.formatMessage({
          id: "global.categories.product",
          defaultMessage: "Product",
        }),
        slug: "product",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "SALES",
        href: "/templates/category/sales",
        label: intl.formatMessage({
          id: "global.categories.sales",
          defaultMessage: "Sales",
        }),
        slug: "",
        templates: [],
        title: "",
        description: "",
      },
      {
        id: "OTHER",
        href: "/templates/category/other",
        label: intl.formatMessage({
          id: "global.categories.other",
          defaultMessage: "Other",
        }),
        slug: "",
        templates: [],
        title: "",
        description: "",
      },
    ],
    [intl.locale]
  );
}
