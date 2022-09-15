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
      const breadcrumbs: (
        | { type: "ellipsis" }
        | { type: "path"; text: string; getUrl: () => string; isCurrent: boolean }
      )[] = [
        {
          type: "path",
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
                type: "path" as const,
                text: part,
                getUrl: () => pathUrl(p),
                isCurrent: path === p,
              };
            })
        );
      }
      if (breadcrumbs.length > 4) {
        breadcrumbs.splice(1, breadcrumbs.length - 4, { type: "ellipsis" });
      }
      return breadcrumbs;
    }, [path, type, intl.locale]);
    return (
      <Breadcrumb ref={ref} paddingY={1} display="flex" alignItems="center" {...props}>
        {breadcrumbs.map((part, i) =>
          part.type === "path" ? (
            <BreadcrumbItem key={i}>
              <NakedLink href={part.getUrl()}>
                <BreadcrumbLink
                  isCurrentPage={part.isCurrent}
                  color="primary.600"
                  fontWeight="medium"
                  _activeLink={{
                    color: "inherit",
                    fontWeight: "inherit",
                    cursor: "default",
                    _hover: { textDecoration: "none" },
                  }}
                >
                  {part.text}
                </BreadcrumbLink>
              </NakedLink>
            </BreadcrumbItem>
          ) : (
            <BreadcrumbItem key={i}>
              <BreadcrumbLink
                as="span"
                sx={{
                  color: "inherit",
                  fontWeight: "inherit",
                  cursor: "default",
                  _hover: { textDecoration: "none" },
                }}
              >
                ...
              </BreadcrumbLink>
            </BreadcrumbItem>
          )
        )}
      </Breadcrumb>
    );
  }
);
