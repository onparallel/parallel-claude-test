import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { FolderIcon, FolderOpenIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Spacer } from "@parallel/components/common/Spacer";
import { useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { FormattedMessage } from "react-intl";

const folder = {
  name: "",
  children: [
    {
      name: "Todas",
      path: "/",
      children: [
        {
          name: "KYC",
          children: [
            { name: "KYC-a", children: [{ name: "A" }] },
            { name: "KYC-b", children: [{ name: "B", children: [{ name: "C" }] }] },
          ],
        },
        {
          name: "Fiscal",
          children: [
            {
              name: "Palantillas en español",
              children: [{ name: "Español latino" }],
            },
            { name: "Plantillas en inglés", children: [{ name: "British" }] },
          ],
        },
        {
          name: "ABC",
        },
        {
          name: "Legal",
        },
        {
          name: "Otros",
        },
      ],
    },
  ],
};

type TreeNode = {
  id: number | null;
  name: string;
  children: number[];
  parent: number;
  path?: string;
};

function buildPath(array: TreeNode[], element: TreeNode, path?: string): string {
  if (element.parent !== null) {
    return buildPath(
      array,
      array.find((e) => e.id === element.parent)!,
      element.name + "/" + (path ?? "")
    );
  } else {
    return "/" + (path ?? "");
  }
}

const data = flattenTree(folder) as TreeNode[];

const dataWithPath = data.map((element, _, array) => ({
  ...element,
  path: buildPath(array, element),
})) as TreeNode[];

interface MoveToFolderDialogProps {
  currentPath: string | null;
  petitionOrPetitionFolderIds: string[];
}

interface MoveToFolderDialogData {
  folderName: string;
  path: string;
}

function MoveToFolderDialog({
  currentPath,
  petitionOrPetitionFolderIds,
  ...props
}: DialogProps<MoveToFolderDialogProps, MoveToFolderDialogData>) {
  console.log("Current path: ", currentPath);
  console.log("data: ", data);
  console.log("dataWithPath: ", dataWithPath);

  const [treeData, setTreeData] = useState(dataWithPath);

  const [selectedFolderName, setSelectedFolderName] = useState("");

  const currentFolderName = "Todas";

  const handleCreateNewFolder = () => {};
  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      content={
        {
          as: "form",
          onSubmit: () => {},
        } as any
      }
      {...props}
      header={
        <FormattedMessage id="component.move-folder-dialog.header" defaultMessage="Move to..." />
      }
      body={
        <Box
          sx={{
            ".tree,.tree-node,.tree-node-group": {
              listStyle: "none",
            },
            ".tree-node:hover": {
              backgroundColor: "gray.100",
              borderRadius: "md",
            },

            ".tree .tree-node--selected": {
              backgroundColor: "blue.500",
              borderRadius: "md",
              color: "white",
            },
            ".tree .tree-node--focused": {
              backgroundColor: "blue.600",
              borderRadius: "md",
              color: "white",
            },
          }}
        >
          <Text marginBottom={2}>
            {currentFolderName && selectedFolderName && currentFolderName !== selectedFolderName ? (
              <FormattedMessage
                id="component.move-folder-dialog.will-move-from"
                defaultMessage="Will move from <b>{source}</b> to <b>{destination}</b>"
                values={{
                  source: currentFolderName,
                  destination: selectedFolderName,
                }}
              />
            ) : (
              <FormattedMessage
                id="component.move-folder-dialog.currently-in"
                defaultMessage="Currently in <b>{folder}</b>"
                values={{
                  folder: currentFolderName,
                }}
              />
            )}
          </Text>
          <TreeView
            data={treeData}
            aria-label="directory tree"
            defaultSelectedIds={[currentPath]}
            onBlur={({ treeState, dispatch }) => {
              // dispatch({
              //   type: "DESELECT",
              //   id: Array.from(treeState.selectedIds)[0],
              // });
            }}
            nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => {
              if (isSelected) setSelectedFolderName(element.name);
              console.log("element path: ", element.path);
              return (
                <HStack
                  {...getNodeProps()}
                  style={{
                    paddingLeft: 18 * (level - 1),
                    paddingRight: 8,
                    borderRadius: "md",
                    cursor: "pointer",
                  }}
                  paddingY={1}
                >
                  <HStack paddingX={2}>
                    {isExpanded || isSelected ? <FolderOpenIcon /> : <FolderIcon />}
                    <Text as="span">{element.name}</Text>
                  </HStack>
                </HStack>
              );
            }}
          />
        </Box>
      }
      alternative={
        <>
          <Button onClick={handleCreateNewFolder} isDisabled={!selectedFolderName}>
            <FormattedMessage
              id="component.move-folder-dialog.create-folder"
              defaultMessage="Create folder"
            />
          </Button>
          <Spacer />
        </>
      }
      confirm={
        <Button colorScheme="primary" isDisabled={false} type="submit">
          <FormattedMessage id="component.move-folder-dialog.move" defaultMessage="Move" />
        </Button>
      }
    />
  );
}

export function useMoveToFolderDialog() {
  return useDialog(MoveToFolderDialog);
}
