import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  RadioProps,
  Stack,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { QueryStateOf, SetQueryState, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { SearchInput } from "../common/SearchInput";

export interface PetitionListHeaderProps {
  shape: QueryStateOf<PetitionsQueryState>;
  state: PetitionsQueryState;
  onStateChange: SetQueryState<Partial<PetitionsQueryState>>;
  onReload: () => void;
}

export function PetitionListHeader({
  shape,
  state,
  onStateChange,
  onReload,
}: PetitionListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(state.search ?? "");
  const debouncedOnSearchChange = useDebouncedCallback(
    (search) =>
      onStateChange(({ searchIn, current }) => ({
        ...current,
        search,
        page: 1,
      })),
    300,
    [onStateChange]
  );
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
        text:
          state.type === "PETITION"
            ? intl.formatMessage({ id: "generic.root-petitions", defaultMessage: "Parallels" })
            : intl.formatMessage({ id: "generic.root-templates", defaultMessage: "Templates" }),
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

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "categories",
    value: state.searchIn,
    onChange: (value: string) =>
      onStateChange((current) => ({
        ...current,
        searchIn: value as PetitionsQueryState["searchIn"],
        page: 1,
      })),
  });

  return (
    <Stack padding={2}>
      <HStack>
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
      {state.search ? (
        <HStack>
          <Box id="search-in-label">
            <FormattedMessage
              id="component.petition-list-header.search-in"
              defaultMessage="Search in:"
            />
          </Box>
          <ButtonGroup
            size="sm"
            isAttached
            variant="outline"
            aria-labelledby="#search-in-label"
            {...getRootProps()}
          >
            <SearchInButton {...getRadioProps({ value: "EVERYWHERE" })}>
              <FormattedMessage id="generic.everywhere" defaultMessage="Everywhere" />
            </SearchInButton>
            <SearchInButton {...getRadioProps({ value: "CURRENT_FOLDER" })}>
              {'"'}
              {breadcrumbs.at(-1)!.text}
              {'"'}
            </SearchInButton>
          </ButtonGroup>
        </HStack>
      ) : state.path !== "/" ? (
        <Box>
          <Breadcrumb height={8} display="flex" alignItems="center">
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
    </Stack>
  );
}

function SearchInButton(props: RadioProps) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();

  return (
    <Button
      fontWeight="normal"
      as="label"
      htmlFor={input.id}
      cursor="pointer"
      _checked={{
        backgroundColor: "blue.500",
        borderColor: "blue.500",
        color: "white",
        _hover: {
          backgroundColor: "blue.600",
          borderColor: "blue.600",
        },
      }}
      {...getCheckboxProps()}
    >
      <input {...getInputProps()} />
      {props.children}
    </Button>
  );
}
