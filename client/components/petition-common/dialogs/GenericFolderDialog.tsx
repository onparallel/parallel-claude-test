import { gql, useQuery } from "@apollo/client";
import { Box, Button, Center, FormControl, FormLabel, Input, Spinner } from "@chakra-ui/react";
import { FolderIcon, FolderOpenIcon } from "@parallel/chakra/icons";
import {
  ConfirmDialog,
  ConfirmDialogProps,
} from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { GenericFolderDialog_foldersDocument, PetitionBaseType } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { ComponentType, createElement, useEffect, useMemo, useRef, useState } from "react";
import TreeView, { INode } from "react-accessible-treeview";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick } from "remeda";
import { PathName } from "../../common/PathName";

interface PathNode extends INode {
  path: string;
}

type GenericFolderDialogComponentProps = DialogProps<
  {
    type: PetitionBaseType;
    currentPath: string;
    selectedPath: string;
    disabledPaths: string[];
  },
  string
>;

export interface GenericFolderDialogProps
  extends Omit<ConfirmDialogProps<string>, "header" | "body" | "alternative" | "confirm"> {
  header: ComponentType<GenericFolderDialogComponentProps>;
  body: ComponentType<GenericFolderDialogComponentProps>;
  confirm: ComponentType<GenericFolderDialogComponentProps>;
  type: PetitionBaseType;
  currentPath: string;
  disabledPaths?: string[];
}

export function GenericFolderDialog({
  header,
  body,
  confirm,
  type,
  currentPath,
  disabledPaths,
  ...props
}: DialogProps<GenericFolderDialogProps, string>) {
  const intl = useIntl();
  const { data } = useQuery(GenericFolderDialog_foldersDocument, {
    variables: { type, currentPath },
    fetchPolicy: "network-only",
  });
  const [selectedPath, setSelectedPath] = useState(currentPath);
  const [treeViewData, setTreeViewData] = useState<PathNode[] | null>(null);
  useEffect(() => {
    if (isDefined(data)) {
      const nodes: PathNode[] = [
        { id: 0, name: "", parent: null, children: [1], path: "" },
        { id: 1, name: "", parent: 0, children: [], path: "/" },
      ];
      const pathToId: Record<string, number> = { "/": 1 };
      let counter = 2;
      const filteredPaths = data.petitionFolders.filter(
        (p) => !(disabledPaths ?? []).some((dp) => p.startsWith(dp) && p.length > dp.length)
      );
      for (const path of filteredPaths) {
        const parts = path.replace(/^\//, "").replace(/\/$/, "").split("/");
        const parentPath = parts.length > 1 ? `/${parts.slice(0, -1).join("/")}/` : "/";
        const parent = nodes[pathToId[parentPath]];
        const id = counter++;
        pathToId[path] = id;
        parent.children.push(id);
        nodes.push({ id, name: "", parent: parent.id, children: [], path });
      }
      setTreeViewData(nodes);
    }
  }, [isDefined(data)]);

  const treeViewProps = useMemo(() => {
    if (isDefined(treeViewData)) {
      return {
        defaultSelectedIds: [treeViewData.find((n) => n.path === currentPath)!.id],
        defaultExpandedIds: treeViewData
          .filter((n) => currentPath.startsWith(n.path))
          .map((n) => n.id),
        defaultDisabledIds: treeViewData
          .filter((n) => (disabledPaths ?? []).some((dp) => n.path === dp))
          .map((n) => n.id),
      };
    } else {
      return null;
    }
  }, [treeViewData]);

  useEffect(() => {
    void clickPathItem(currentPath).then();
  }, []);

  async function clickPathItem(path: string) {
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        document.querySelector<HTMLElement>(`[data-folder-path="${path}"]`)?.click();
        resolve();
      })
    );
  }

  function dblClickPathItem(path: string) {
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        document.querySelector<HTMLElement>(`[data-folder-path="${path}"]`)?.dispatchEvent(
          new MouseEvent("dblclick", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
        resolve();
      })
    );
  }

  const initialFocusRef = useRef({
    // avoid focusing cancel
    focus() {},
  });

  const showNewFolderNameDialog = useNewFolderNameDialog();
  async function handleCreateNewFolder() {
    try {
      const name = await showNewFolderNameDialog({});
      const path = selectedPath + name + "/";
      const id = treeViewData!.length;
      const parent = treeViewData!.find((n) => n.path === selectedPath)!;
      if (
        // if new folder name already exists as children on the selectedPath, skip
        !parent.children.some(
          (childrenId) => treeViewData!.find((n) => n.id === childrenId)!.path === path
        )
      ) {
        setTreeViewData([
          ...treeViewData!.map((n) =>
            n.id === parent.id ? { ...n, children: [...n.children, id] } : n
          ),
          {
            id: treeViewData!.length,
            name: "",
            parent: parent.id,
            path: path,
            children: [],
          },
        ]);
      }
      const node = document.querySelector<HTMLElement>(`[data-folder-path="${selectedPath}"]`);
      const isExpanded = node?.parentElement?.getAttribute("aria-expanded") === "true";
      if (!isExpanded) {
        await dblClickPathItem(selectedPath);
      }
      await clickPathItem(path);
    } catch {}
  }

  const componentProps = {
    currentPath,
    selectedPath,
    type,
    disabledPaths: disabledPaths ?? [],
    ...pick(props, ["onResolve", "onReject"]),
  };

  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={initialFocusRef}
      {...props}
      header={createElement(header, componentProps)}
      body={
        <Box
          sx={{
            ".tree, .tree-node-group": {
              listStyle: "none",
            },
            ".tree-branch-wrapper,.tree-node__leaf": {
              outline: "none",
            },
            ".tree-leaf-list-item,.tree-branch-wrapper": {
              marginTop: 1,
            },
            ".tree-node": {
              "&--focused": {
                boxShadow: "outline",
              },
              "&--selected": {
                color: "white",
                backgroundColor: "blue.500",
                "&:hover": {
                  backgroundColor: "blue.600",
                },
              },
            },
          }}
        >
          {isDefined(treeViewData) ? (
            <>
              {createElement(body, componentProps)}
              <TreeView
                data={treeViewData!}
                aria-label={intl.formatMessage({
                  id: "generic.folder-directory",
                  defaultMessage: "Folder directory",
                })}
                clickAction="EXCLUSIVE_SELECT"
                {...treeViewProps!}
                onSelect={({ element, isSelected }) =>
                  isSelected && setSelectedPath((element as any).path)
                }
                expandOnKeyboardSelect
                nodeRenderer={({
                  element,
                  isExpanded,
                  handleExpand,
                  handleSelect,
                  isDisabled,
                  getNodeProps,
                  level,
                }) => {
                  const { path } = element as any;
                  const { onClick: _, ...nodeProps } = getNodeProps() as any;
                  return (
                    <Button
                      as="div"
                      data-folder-path={path}
                      variant="ghost"
                      colorScheme="gray"
                      width="full"
                      size="sm"
                      isDisabled={isDisabled}
                      _focus={{ _disabled: { boxShadow: "outline" } }}
                      leftIcon={isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
                      justifyContent="flex-start"
                      paddingInlineStart={`${0.75 + (level - 1) * 1}rem`}
                      onClick={handleSelect}
                      onDoubleClick={handleExpand}
                      tabIndex={0}
                      {...nodeProps}
                    >
                      <OverflownText flex={1} minWidth={0}>
                        <PathName type={type} path={path} disableTooltip />
                      </OverflownText>
                    </Button>
                  );
                }}
              />
            </>
          ) : (
            <Center minHeight={64}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="primary.500"
                size="xl"
              />
            </Center>
          )}
        </Box>
      }
      alternative={
        <Button onClick={handleCreateNewFolder}>
          <FormattedMessage id="generic.create-folder" defaultMessage="Create folder" />
        </Button>
      }
      confirm={createElement(confirm, componentProps)}
    />
  );
}

const _queries = [
  gql`
    query GenericFolderDialog_folders($type: PetitionBaseType!, $currentPath: String) {
      petitionFolders(type: $type, currentPath: $currentPath)
    }
  `,
];

function NewFolderNameDialog(props: DialogProps<{}, string>) {
  const intl = useIntl();
  const { register, handleSubmit, formState } = useForm({ defaultValues: { name: "" } });
  const inputRef = useRef<HTMLInputElement>(null);
  const inputProps = useRegisterWithRef(inputRef, register, "name", { required: true });
  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={inputRef}
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      content={
        {
          as: "form",
          onSubmit: handleSubmit((data) => {
            props.onResolve(data.name);
          }),
        } as any
      }
      header={
        <FormattedMessage id="component.new-folder-dialog.header" defaultMessage="New folder" />
      }
      body={
        <FormControl>
          <FormLabel>
            <FormattedMessage
              id="component.new-folder-dialog.folder-name-label"
              defaultMessage="Folder name"
            />
          </FormLabel>
          <Input
            placeholder={intl.formatMessage({
              id: "component.new-folder-dialog.folder-name-label",
              defaultMessage: "Folder name",
            })}
            {...inputProps}
          />
        </FormControl>
      }
      confirm={
        <Button colorScheme="primary" type="submit" isDisabled={!!formState.errors.name}>
          <FormattedMessage id="generic.create-folder" defaultMessage="Create folder" />
        </Button>
      }
    />
  );
}

function useNewFolderNameDialog() {
  return useDialog(NewFolderNameDialog);
}
