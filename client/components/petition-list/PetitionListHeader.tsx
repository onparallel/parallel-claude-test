import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, HStack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { QueryStateOf, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { SearchInput } from "../common/SearchInput";

export interface PetitionListHeaderProps {
  shape: QueryStateOf<PetitionsQueryState>;
  state: PetitionsQueryState;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
}

export function PetitionListHeader({
  shape,
  state,
  onSearchChange,
  onReload,
}: PetitionListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(state.search ?? "");
  const debouncedOnSearchChange = useDebouncedCallback(onSearchChange, 300, [onSearchChange]);
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );

  const buildUrl = useBuildStateUrl(shape);
  const breadcrumbs = useMemo(() => {
    const breadcrumbs = [
      {
        text: intl.formatMessage({ id: "generic.path-root", defaultMessage: "All" }),
        url: buildUrl((current) => ({ ...current, page: 1, path: "/" })),
        isCurrent: state.path === "/",
      },
    ];
    if (state.path !== "/") {
      breadcrumbs.push(
        ...state.path
          .slice(1, -1)
          .split("/")
          .map((part, i, parts) => {
            const path = "/" + parts.slice(0, i + 1).join("/") + "/";
            return {
              text: part,
              url: buildUrl((current) => ({ ...current, page: 1, path })),
              isCurrent: path === state.path,
            };
          })
      );
    }
    return breadcrumbs;
  }, [state.path]);

  return (
    <Flex direction="column">
      <HStack padding={2}>
        <Box flex="0 1 400px">
          <SearchInput value={search ?? ""} onChange={handleSearchChange} />
        </Box>
        <IconButtonWithTooltip
          onClick={() => onReload()}
          icon={<RepeatIcon />}
          placement="bottom"
          variant="outline"
          label={intl.formatMessage({
            id: "generic.reload-data",
            defaultMessage: "Reload",
          })}
        />
      </HStack>
      {state.path !== "/" ? (
        <Box paddingY={1} paddingX={2}>
          <Breadcrumb>
            {breadcrumbs.map(({ text, url, isCurrent }, i) => (
              <BreadcrumbItem key={i}>
                <NakedLink href={url}>
                  <BreadcrumbLink
                    isCurrentPage={isCurrent}
                    color="primary.600"
                    fontWeight="medium"
                    _activeLink={{ color: "inherit", fontWeight: "inherit" }}
                  >
                    {text}
                  </BreadcrumbLink>
                </NakedLink>
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </Box>
      ) : null}
    </Flex>
  );
}
