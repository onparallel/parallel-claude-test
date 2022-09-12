import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionBaseType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { NakedLink } from "./Link";

interface PathBreadcrumbsProps {
  path: string;
  type: PetitionBaseType;
  pathUrl: (path: string) => string;
}

export const PathBreadcrumbs = chakraForwardRef<"nav", PathBreadcrumbsProps>(
  function PathBreadcrumbs({ path, type, pathUrl, ...props }, ref) {
    const intl = useIntl();
    const breadcrumbs = useMemo(() => {
      const breadcrumbs = [
        {
          text:
            type === "PETITION"
              ? intl.formatMessage({ id: "generic.root-petitions", defaultMessage: "Parallels" })
              : intl.formatMessage({ id: "generic.root-templates", defaultMessage: "Templates" }),
          getUrl: () => pathUrl("/"),
          isCurrent: path === "/",
        },
      ];
      if (path !== "/") {
        breadcrumbs.push(
          ...path
            .slice(1, -1)
            .split("/")
            .map((part, i, parts) => {
              const p = "/" + parts.slice(0, i + 1).join("/") + "/";
              return {
                text: part,
                getUrl: () => pathUrl(p),
                isCurrent: path === p,
              };
            })
        );
      }
      return breadcrumbs;
    }, [path, type, intl.locale]);
    return (
      <Breadcrumb ref={ref} height={8} display="flex" alignItems="center" {...props}>
        {breadcrumbs.map(({ text, getUrl, isCurrent }, i) => (
          <BreadcrumbItem key={i}>
            <NakedLink href={getUrl()}>
              <BreadcrumbLink
                isCurrentPage={isCurrent}
                color="primary.600"
                fontWeight="medium"
                _activeLink={{
                  color: "inherit",
                  fontWeight: "inherit",
                  cursor: "default",
                  _hover: { textDecoration: "none" },
                }}
              >
                {text}
              </BreadcrumbLink>
            </NakedLink>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    );
  }
);
