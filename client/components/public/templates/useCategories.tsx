import { useMemo } from "react";
import { useIntl } from "react-intl";

export type CategoryType = {
  href: string;
  label: string;
  img: string;
  bgColor: string;
};

export type CategoriesType = {
  [key: string]: CategoryType;
};

export function useCategories(): CategoriesType {
  const intl = useIntl();

  return useMemo(
    () => ({
      ALL: {
        href: "/templates",
        label: intl.formatMessage({
          id: "global.categories.all-templates",
          defaultMessage: "All templates",
        }),
        img: "",
        bgColor: "",
      },
      ADMINISTRATION: {
        href: "/templates/category/administration",
        label: intl.formatMessage({
          id: "global.categories.administration",
          defaultMessage: "Administration",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      BUSINESS_DEVELOPMENT: {
        href: "/templates/category/business-development",
        label: intl.formatMessage({
          id: "global.categories.business-development",
          defaultMessage: "Business development",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      COMPLIANCE: {
        href: "/templates/category/compliance",
        label: intl.formatMessage({
          id: "global.categories.compliance",
          defaultMessage: "Compliance",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      CUSTOMER_SERVICE: {
        href: "/templates/category/customer-service",
        label: intl.formatMessage({
          id: "global.categories.customer-service",
          defaultMessage: "Customer service",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      ENGINEERING: {
        href: "/templates/category/engineering",
        label: intl.formatMessage({
          id: "global.categories.engineering",
          defaultMessage: "Engineering",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      FINANCE: {
        href: "/templates/category/finance",
        label: intl.formatMessage({
          id: "global.categories.finance",
          defaultMessage: "Finance",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      GENERAL_MANAGEMENT: {
        href: "/templates/category/general-management",
        label: intl.formatMessage({
          id: "global.categories.general-management",
          defaultMessage: "General Management",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      IT: {
        href: "/templates/category/information-technology",
        label: intl.formatMessage({
          id: "global.categories.it",
          defaultMessage: "IT",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      HR: {
        href: "/templates/category/human-resources",
        label: intl.formatMessage({
          id: "global.categories.hr",
          defaultMessage: "HR",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      LEGAL: {
        href: "/templates/category/legal",
        label: intl.formatMessage({
          id: "global.categories.legal",
          defaultMessage: "Legal",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      MARKETING: {
        href: "/templates/category/marketing",
        label: intl.formatMessage({
          id: "global.categories.marketing",
          defaultMessage: "Marketing",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      OPERATIONS: {
        href: "/templates/category/operations",
        label: intl.formatMessage({
          id: "global.categories.operations",
          defaultMessage: "Operations",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      PROCUREMENT: {
        href: "/templates/category/procurement",
        label: intl.formatMessage({
          id: "global.categories.procurement",
          defaultMessage: "Procurement",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      PRODUCT: {
        href: "/templates/category/product",
        label: intl.formatMessage({
          id: "global.categories.product",
          defaultMessage: "Product",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      SALES: {
        href: "/templates/category/sales",
        label: intl.formatMessage({
          id: "global.categories.sales",
          defaultMessage: "Sales",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
      OTHER: {
        href: "/templates/category/other",
        label: intl.formatMessage({
          id: "global.categories.other",
          defaultMessage: "Other",
        }),
        img: "input_radio.png",
        bgColor: "blue.50",
      },
    }),
    [intl.locale]
  );
}
