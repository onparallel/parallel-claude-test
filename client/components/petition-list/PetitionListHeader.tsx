import {
  Box,
  Button,
  chakra,
  Circle,
  Flex,
  HStack,
  Menu,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Tooltip,
  useBreakpointValue,
  useMenuButton,
} from "@chakra-ui/react";
import { ChevronDownIcon, RepeatIcon, SaveIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { QueryStateOf, SetQueryState, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { equals, pick } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PathBreadcrumbs } from "../common/PathBreadcrumbs";
import { SearchAllOrCurrentFolder } from "../common/SearchAllOrCurrentFolder";
import { SearchInput } from "../common/SearchInput";
import { useAskViewNameDialog } from "./AskViewNameDialog";

interface View {
  id: string;
  name: string;
  filters: Partial<
    Pick<
      PetitionsQueryState,
      | "status"
      | "tags"
      | "sharedWith"
      | "signature"
      | "fromTemplateId"
      | "search"
      | "searchIn"
      | "path"
    >
  >;
  sortBy: PetitionsQueryState["sort"];
}

export interface PetitionListHeaderProps {
  shape: QueryStateOf<PetitionsQueryState>;
  state: PetitionsQueryState;
  onStateChange: SetQueryState<Partial<PetitionsQueryState>>;
  onReload: () => void;
  views: View[];
}

export function PetitionListHeader({
  shape,
  state,
  onStateChange,
  onReload,
  views,
}: PetitionListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(state.search ?? "");
  const debouncedOnSearchChange = useDebouncedCallback(
    (search) =>
      onStateChange(({ searchIn, ...current }) => ({
        ...current,
        search,
        searchIn: search ? searchIn : "EVERYWHERE",
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

  const handleSearchInChange = (value: string) => {
    onStateChange((current) => ({
      ...current,
      searchIn: value as PetitionsQueryState["searchIn"],
      page: 1,
    }));
  };

  const isViewDirty = useMemo(() => {
    if (state.type === "TEMPLATE") {
      return false;
    }
    const currentView = state.view === "ALL" ? null : views.find((v) => v.id === state.view)!;
    return !equals(
      state.view === "ALL"
        ? {
            sortBy: { field: "sentAt", direction: "DESC" },
            filters: {
              status: null,
              tags: null,
              sharedWith: null,
              signature: null,
              fromTemplateId: null,
              search: null,
              searchIn: "EVERYWHERE",
              path: "/",
            },
          }
        : pick(currentView!, ["sortBy", "filters"]),
      {
        sortBy: state.sort,
        filters: pick(state, [
          "status",
          "tags",
          "sharedWith",
          "signature",
          "fromTemplateId",
          "search",
          "searchIn",
          "path",
        ]),
      }
    );
  }, [state, views]);

  const showAskViewNameDialog = useAskViewNameDialog();
  const handleSaveAsNewViewClick = async () => {
    try {
      const currentView = state.view === "ALL" ? null : views.find((v) => v.id === state.view)!;
      await showAskViewNameDialog({
        name: currentView?.name,
        header: (
          <FormattedMessage
            id="component.petition-list-header.save-as-new-view-header"
            defaultMessage="Create new view"
          />
        ),
        confirm: (
          <FormattedMessage
            id="component.petition-list-header.save-as-new-view-confirm-button"
            defaultMessage="Create view"
          />
        ),
      });
    } catch {}
  };

  return (
    <Stack padding={2}>
      <HStack>
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
        <Box flex="0 1 400px">
          <SearchInput value={search ?? ""} onChange={handleSearchChange} />
        </Box>
        {state.type === "PETITION" ? (
          <Flex flex={1} justifyContent="flex-end">
            <Box>
              <Menu placement="bottom-end">
                <SaveViewMenuButton isDirty={isViewDirty} />
                <Portal>
                  <MenuList minWidth="160px">
                    <MenuItem isDisabled={state.view === "ALL"}>
                      <FormattedMessage
                        id="component.petition-list-header.save-current-view"
                        defaultMessage="Save current view"
                      />
                    </MenuItem>
                    <MenuItem onClick={handleSaveAsNewViewClick}>
                      <FormattedMessage
                        id="component.petition-list-header.save-as-new-view"
                        defaultMessage="Save as new view"
                      />
                    </MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
            </Box>
          </Flex>
        ) : null}
      </HStack>
      {state.search ? (
        <SearchAllOrCurrentFolder
          onChange={handleSearchInChange}
          value={state.searchIn}
          path={state.path}
          type={state.type}
        />
      ) : state.path !== "/" ? (
        <PathBreadcrumbs
          path={state.path}
          type={state.type}
          pathUrl={(path) => buildUrl((current) => ({ ...current, path, page: 1 }))}
        />
      ) : null}
    </Stack>
  );
}

const SaveViewMenuButton = chakraForwardRef<"button", { isDirty?: boolean }>(
  function SaveViewMenuButton({ isDirty }, ref) {
    const buttonProps = useMenuButton({}, ref);
    const isSmallScreen = useBreakpointValue({ base: true, md: false });
    const intl = useIntl();
    return (
      <Tooltip
        label={intl.formatMessage({
          id: "component.petition-list-header.save-view-button",
          defaultMessage: "Save view",
        })}
        isDisabled={!isSmallScreen}
      >
        <Button
          {...buttonProps}
          paddingX={{ base: 2, md: 3 }}
          aria-label={
            isSmallScreen
              ? intl.formatMessage({
                  id: "component.petition-list-header.save-view-button",
                  defaultMessage: "Save view",
                })
              : undefined
          }
        >
          <chakra.span display="inline-flex" flex="1" pointerEvents="none" alignItems="center">
            {isDirty ? (
              <chakra.span marginRight={2}>
                <Circle size={2} backgroundColor="primary.500" />
              </chakra.span>
            ) : null}
            <chakra.span>
              <SaveIcon aria-hidden focusable={false} />
            </chakra.span>
            <chakra.span marginLeft={2} display={{ base: "none", md: "inline" }}>
              {intl.formatMessage({
                id: "component.petition-list-header.save-view-button",
                defaultMessage: "Save view",
              })}
            </chakra.span>
            <chakra.span marginLeft={2} display={{ base: "none", md: "inline" }}>
              <ChevronDownIcon aria-hidden focusable={false} />
            </chakra.span>
          </chakra.span>
        </Button>
      </Tooltip>
    );
  }
);
