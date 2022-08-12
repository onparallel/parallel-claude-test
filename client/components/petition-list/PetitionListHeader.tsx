import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  ButtonGroup,
  HStack,
  MenuItem,
  MenuList,
  RadioProps,
  Stack,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import { AddIcon, RepeatIcon } from "@parallel/chakra/icons";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { QueryStateOf, SetQueryState, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { useCreateFolderDialog } from "../petition-common/dialogs/CreateFolderDialog";
import { useNewTemplateDialog } from "../petition-new/dialogs/NewTemplateDialog";

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

  const showCreateFolderDialog = useCreateFolderDialog();
  const handleCreateFolder = async () => {
    try {
      const data = await showCreateFolderDialog({ isTemplate: state.type === "TEMPLATE" });
      console.log("name: ", data.name);
      console.log("petition / template ID's: ", data.ids);
    } catch {}
  };

  const createPetition = useCreatePetition();
  const goToPetition = useGoToPetition();
  const clonePetitions = useClonePetitions();
  const showNewTemplateDialog = useNewTemplateDialog();

  const handleCreateTemplate = useCallback(async () => {
    try {
      const id = await createPetition({ type: "TEMPLATE" });
      goToPetition(id, "compose", { query: { new: "true" } });
    } catch {}
  }, [goToPetition, createPetition]);

  const navigate = useHandleNavigation();
  const handleCreateNewParallelOrTemplate = async () => {
    try {
      if (state.type === "PETITION") {
        navigate(`/app/petitions/new`);
      } else {
        const templateId = await showNewTemplateDialog({});
        if (!templateId) {
          handleCreateTemplate();
        } else {
          const petitionIds = await clonePetitions({
            petitionIds: [templateId],
            keepTitle: true,
          });
          goToPetition(petitionIds[0], "compose", { query: { new: "true" } });
        }
      }
    } catch {}
  };

  const newParallelOrTemplateLiteral =
    state.type === "PETITION" ? (
      <FormattedMessage id="generic.new-petition" defaultMessage="New parallel" />
    ) : (
      <FormattedMessage
        id="component.petition-list-header.new-template"
        defaultMessage="New template"
      />
    );

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
        <Spacer />
        <Button display={{ base: "none", lg: "block" }} onClick={handleCreateFolder}>
          <FormattedMessage
            id="component.petition-list-header.create-folder"
            defaultMessage="Create folder"
          />
        </Button>
        <Button
          display={{ base: "none", lg: "block" }}
          colorScheme="primary"
          onClick={handleCreateNewParallelOrTemplate}
        >
          {newParallelOrTemplateLiteral}
        </Button>

        <MoreOptionsMenuButton
          display={{ base: "block", lg: "none" }}
          colorScheme="primary"
          icon={<AddIcon />}
          options={
            <MenuList minWidth="fit-content">
              <MenuItem onClick={handleCreateFolder}>
                <FormattedMessage
                  id="component.petition-list-header.create-folder"
                  defaultMessage="Create folder"
                />
              </MenuItem>
              <MenuItem onClick={handleCreateNewParallelOrTemplate}>
                {newParallelOrTemplateLiteral}
              </MenuItem>
            </MenuList>
          }
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
