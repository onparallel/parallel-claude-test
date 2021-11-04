import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePublicMenu() {
  const intl = useIntl();
  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({
          id: "public.product-link",
          defaultMessage: "Product",
        }),
        path: "/product",
        children: [
          {
            title: intl.formatMessage({
              id: "public.product.request-information-link",
              defaultMessage: "Request information",
            }),
            path: "/product/request-information",
          },
          {
            title: intl.formatMessage({
              id: "public.product.monitor-link",
              defaultMessage: "Monitor progress",
            }),
            path: "/product/monitor-progress",
          },
          {
            title: intl.formatMessage({
              id: "public.product.review-files-link",
              defaultMessage: "Review your files",
            }),
            path: "/product/review-files",
          },
          {
            title: intl.formatMessage({
              id: "public.product.team-collaboration-link",
              defaultMessage: "Collaborate with your team",
            }),
            path: "/product/team-collaboration",
          },
          {
            title: intl.formatMessage({
              id: "public.product.security-link",
              defaultMessage: "A secure environment",
            }),
            path: "/security",
          },
        ],
      },
      {
        title: intl.formatMessage({
          id: "public.solutions-link",
          defaultMessage: "Solutions",
        }),
        path: "/solutions",
        children: [
          {
            title: intl.formatMessage({
              id: "public.solutions.law-firms-link",
              defaultMessage: "Law firms",
            }),
            path: "/solutions/law-firms",
          },
          {
            title: intl.formatMessage({
              id: "public.solutions.consultancy-link",
              defaultMessage: "Consultancy",
            }),
            path: "/solutions/consultancy",
          },
          {
            title: intl.formatMessage({
              id: "public.solutions.accounting-link",
              defaultMessage: "BPO and accounting",
            }),
            path: "/solutions/accounting",
          },
          {
            title: intl.formatMessage({
              id: "public.solutions.real-estate-link",
              defaultMessage: "Real Estate",
            }),
            path: "/solutions/real-estate",
          },
        ],
      },
      {
        title: intl.formatMessage({
          id: "public.templates-link",
          defaultMessage: "Templates",
        }),
        path: "/templates",
        children: null,
      },
      {
        title: intl.formatMessage({
          id: "public.pricing-link",
          defaultMessage: "Pricing",
        }),
        path: "/pricing",
        children: null,
      },
    ];
  }, [intl.locale]);
}
