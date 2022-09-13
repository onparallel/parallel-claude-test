import { gql, useMutation } from "@apollo/client";
import { Box, Button, HStack, MenuItem, MenuList, Stack } from "@chakra-ui/react";
import { AddIcon, RepeatIcon } from "@parallel/chakra/icons";
import { PetitionListHeader_movePetitionsDocument } from "@parallel/graphql/__types";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { QueryStateOf, SetQueryState, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { PathBreadcrumbs } from "../common/PathBreadcrumbs";
import { SearchAllOrCurrentFolder } from "../common/SearchAllOrCurrentFolder";
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

  const handleSearchInChange = (value: string) => {
    onStateChange((current) => ({
      ...current,
      searchIn: value as PetitionsQueryState["searchIn"],
      page: 1,
    }));
  };

  const showCreateFolderDialog = useCreateFolderDialog();
  const [movePetitions] = useMutation(PetitionListHeader_movePetitionsDocument);
  const handleCreateFolder = async () => {
    try {
      const data = await showCreateFolderDialog({
        isTemplate: state.type === "TEMPLATE",
        currentPath: state.path,
      });
      await movePetitions({
        variables: {
          ids: data.petitions.map((p) => p.id),
          source: state.path,
          destination: `${state.path}${data.name}/`,
          type: state.type,
        },
        onCompleted: () => {
          onReload();
        },
      });
    } catch {}
  };

  const createPetition = useCreatePetition();
  const goToPetition = useGoToPetition();
  const clonePetitions = useClonePetitions();
  const showNewTemplateDialog = useNewTemplateDialog();

  const handleCreateTemplate = useCallback(async () => {
    try {
      const id = await createPetition({ type: "TEMPLATE", path: state.path });
      goToPetition(id, "compose", { query: { new: "true" } });
    } catch {}
  }, [goToPetition, createPetition, state.path]);

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
            path: state.path,
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

const _mutations = [
  gql`
    mutation PetitionListHeader_movePetitions(
      $ids: [GID!]
      $folderIds: [ID!]
      $source: String!
      $destination: String!
      $type: PetitionBaseType!
    ) {
      movePetitions(
        ids: $ids
        folderIds: $folderIds
        source: $source
        destination: $destination
        type: $type
      )
    }
  `,
];
