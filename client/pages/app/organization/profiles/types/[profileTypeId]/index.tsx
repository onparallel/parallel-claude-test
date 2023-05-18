import { gql, useMutation } from "@apollo/client";
import {
  ButtonProps,
  Flex,
  Heading,
  HStack,
  MenuDivider,
  MenuItem,
  MenuList,
  useToast,
} from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, EditSimpleIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { WhenOrgRole } from "@parallel/components/common/WhenOrgRole";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { useCreateOrUpdateProfileTypeDialog } from "@parallel/components/organization/profiles/dialogs/CreateOrUpdateProfileTypeDialog";
import {
  OrganizationProfileType_cloneProfileTypeDocument,
  OrganizationProfileType_deleteProfileTypeFieldDocument,
  OrganizationProfileType_profileTypeDocument,
  OrganizationProfileType_ProfileTypeFieldFragment,
  OrganizationProfileType_updateProfileTypeDocument,
  OrganizationProfileType_updateProfileTypeFieldDocument,
  OrganizationProfileType_updateProfileTypeFieldPositionsDocument,
  OrganizationProfileType_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useDeleteProfileType } from "@parallel/utils/mutations/useDeleteProfileType";
import { UnwrapPromise } from "@parallel/utils/types";
import { FormattedMessage, useIntl } from "react-intl";

import { Box, BoxProps, Button, Center, Checkbox, Divider, Stack, Text } from "@chakra-ui/react";
import { AddIcon, DragHandleIcon, EditIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { useCreateOrUpdateProfileTypeFieldDialog } from "@parallel/components/organization/profiles/dialogs/CreateOrUpdateProfileTypeFieldDialog";
import { useProfileTypeFieldsInPatternDialog } from "@parallel/components/organization/profiles/dialogs/ProfileTypeFieldsInPatternDialog";
import { useUpdateProfileTypeFieldDialog } from "@parallel/components/organization/profiles/dialogs/UpdateProfileTypeFieldDialog";
import { ProfileTypeFieldTypeIndicator } from "@parallel/components/organization/profiles/ProfileTypeFieldTypeIndicator";
import { ProfileTypeSettings } from "@parallel/components/organization/profiles/ProfileTypeSettings";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { getKey, KeyProp } from "@parallel/utils/keyProp";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useSelection, useSelectionState } from "@parallel/utils/useSelectionState";
import { Reorder, useDragControls } from "framer-motion";
import { useRouter } from "next/router";
import {
  Fragment,
  Key,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { identity, noop } from "remeda";
import { expirationToDuration } from "@parallel/utils/useExpirationOptions";

type OrganizationProfileTypeProps = UnwrapPromise<
  ReturnType<typeof OrganizationProfileType.getInitialProps>
>;

function OrganizationProfileType({ profileTypeId }: OrganizationProfileTypeProps) {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();
  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationProfileType_userDocument);

  const {
    data: { profileType },
    refetch,
  } = useAssertQuery(OrganizationProfileType_profileTypeDocument, {
    variables: {
      profileTypeId,
    },
  });

  const { selectedIds, onChangeSelectedIds } = useSelection(profileType.fields, "id");

  const showError = useGenericErrorToast();
  const [updateProfileType] = useMutation(OrganizationProfileType_updateProfileTypeDocument);
  const handleChangeProfileTypePattern = useCallback(
    async (profileNamePattern: string) => {
      try {
        await updateProfileType({
          variables: {
            profileTypeId,
            profileNamePattern,
          },
        });

        toast({
          title: intl.formatMessage({
            id: "page.organization-profile-type.changes-saved",
            defaultMessage: "Changes saved",
          }),
          description: intl.formatMessage({
            id: "page.organization-profile-type.changes-saved-body",
            defaultMessage: 'The "Name of each profile" changes have been saved.',
          }),
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (e) {
        if (isApolloError(e, "INVALID_PROFILE_NAME_PATTERN")) {
          // throw to ProfileTypeSettings to handle error inside the form
          throw e;
        }
        showError();
      }
    },
    [profileTypeId]
  );

  const showCreateOrUpdateProfileTypeDialog = useCreateOrUpdateProfileTypeDialog();
  const handleChangeProfileTypeName = async () => {
    try {
      const { name } = await showCreateOrUpdateProfileTypeDialog({
        isEditing: true,
        name: profileType.name,
      });
      await updateProfileType({
        variables: {
          profileTypeId,
          name,
        },
      });
    } catch {}
  };

  const [cloneProfileType] = useMutation(OrganizationProfileType_cloneProfileTypeDocument);
  const handleCloneProfileType = async () => {
    try {
      const { name } = await showCreateOrUpdateProfileTypeDialog({
        isEditing: false,
        name: profileType.name,
      });
      const res = await cloneProfileType({
        variables: {
          profileTypeId,
          name,
        },
      });
      router.push(`/app/organization/profiles/types/${res.data?.cloneProfileType.id}`);
    } catch {}
  };

  const deleteProfileType = useDeleteProfileType();
  const handleDeleteProfileType = async () => {
    try {
      const res = await deleteProfileType({
        profileTypes: [profileType],
      });
      if (res === "SUCCESS") {
        router.push("/app/organization/profiles/types/");
      }
    } catch {}
  };

  const showUpdateProfileTypeFieldDialog = useUpdateProfileTypeFieldDialog();
  const showCreateOrUpdateProfileTypeFieldDialog = useCreateOrUpdateProfileTypeFieldDialog();
  const handleAddNewProperty = async () => {
    try {
      await showCreateOrUpdateProfileTypeFieldDialog({
        profileTypeId,
      });
      refetch();
    } catch {}
  };

  const [deleteProfileTypeField] = useMutation(
    OrganizationProfileType_deleteProfileTypeFieldDocument
  );
  const showUsedInPattern = useProfileTypeFieldsInPatternDialog();
  const handleDeleteProperty = async (profileTypeFieldIds: string[]) => {
    try {
      await deleteProfileTypeField({
        variables: {
          profileTypeId,
          profileTypeFieldIds,
        },
      });
    } catch (e) {
      if (isApolloError(e, "FIELD_USED_IN_PATTERN")) {
        try {
          await showUsedInPattern({
            numberOfProfileTypeFields: profileTypeFieldIds.length,
            profileTypeName: localizableUserTextRender({
              value: profileType.name,
              intl,
              default: intl.formatMessage({
                id: "generic.unnamed-profile-type",
                defaultMessage: "Unnamed profile type",
              }),
            }),
          });
        } catch {}
      }
    }
  };

  const [updateProfileTypeField] = useMutation(
    OrganizationProfileType_updateProfileTypeFieldDocument
  );
  const handleConfigureVisibility = async (
    rows: OrganizationProfileType_ProfileTypeFieldFragment[]
  ) => {
    try {
      const data = {};
      await updateProfileTypeField({
        variables: {
          profileTypeId,
          profileTypeFieldId: rows[0].id,
          data,
        },
      });
    } catch {}
  };

  const handleEditProperty = async (fields: OrganizationProfileType_ProfileTypeFieldFragment[]) => {
    try {
      if (fields.length > 1) {
        const { isExpirable, expiryAlertAheadTime } = await showUpdateProfileTypeFieldDialog({
          fields,
        });
        for (const field of fields) {
          await updateProfileTypeField({
            variables: {
              profileTypeId,
              profileTypeFieldId: field.id,
              data: {
                isExpirable,
                expiryAlertAheadTime: isExpirable
                  ? expiryAlertAheadTime === "DO_NOT_REMEMBER"
                    ? null
                    : expirationToDuration(expiryAlertAheadTime)
                  : undefined,
              },
            },
          });
        }
      } else {
        await showCreateOrUpdateProfileTypeFieldDialog({
          profileTypeId,
          profileTypeField: fields[0],
        });
      }
    } catch {}
  };

  const [updateProfileTypeFieldPositions] = useMutation(
    OrganizationProfileType_updateProfileTypeFieldPositionsDocument
  );
  const handleReorderProperties = useCallback(
    async (profileTypeFieldIds: string[]) => {
      try {
        await updateProfileTypeFieldPositions({
          variables: {
            profileTypeId,
            profileTypeFieldIds,
          },
        });
      } catch {}
    },
    [profileTypeId]
  );

  const actions = useProfileTypeFieldsActions({
    onDeleteClick: () => handleDeleteProperty(selectedIds),
    onConfigureVisibilityClick: () =>
      handleConfigureVisibility(profileType.fields.filter((f) => selectedIds.includes(f.id))),
    onEditClick: () =>
      handleEditProperty(profileType.fields.filter((f) => selectedIds.includes(f.id))),
  });

  return (
    <OrganizationSettingsLayout
      title={localizableUserTextRender({
        value: profileType.name,
        intl,
        default: intl.formatMessage({
          id: "generic.unnamed-profile-type",
          defaultMessage: "Unnamed profile type",
        }),
      })}
      basePath="/app/organization/profiles/types"
      me={me}
      realMe={realMe}
      header={
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          <HStack paddingRight={2}>
            <Heading as="h3" size="md" noOfLines={1} wordBreak="break-all">
              <LocalizableUserTextRender
                value={profileType.name}
                default={intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                })}
              />
            </Heading>
            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "generic.edit-name",
                defaultMessage: "Edit name",
              })}
              size="sm"
              variant="ghost"
              icon={<EditSimpleIcon />}
              onClick={handleChangeProfileTypeName}
            />
          </HStack>
          <WhenOrgRole role="ADMIN">
            <MoreOptionsMenuButton
              variant="outline"
              options={
                <MenuList>
                  <MenuItem
                    onClick={handleCloneProfileType}
                    icon={<CopyIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.profile-type-header.clone-label"
                      defaultMessage="Clone profile type"
                    />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    color="red.500"
                    onClick={handleDeleteProfileType}
                    icon={<DeleteIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.profile-type-header.delete-label"
                      defaultMessage="Delete profile type"
                    />
                  </MenuItem>
                </MenuList>
              }
            />
          </WhenOrgRole>
        </Flex>
      }
      showBackButton={true}
    >
      <Box padding={4}>
        <Stack spacing={6} maxWidth="container.lg">
          <ProfileTypeSettings
            key={`${profileType.id}-settings`}
            profileType={profileType}
            onSave={handleChangeProfileTypePattern}
          />
          <DraggableList
            key={profileType.id}
            width="full"
            rows={profileType.fields}
            rowKeyProp="id"
            actions={actions}
            onEdit={(profileTypeField) => handleEditProperty([profileTypeField])}
            onConfigureVisibility={(profileTypeField) =>
              handleConfigureVisibility([profileTypeField])
            }
            onDelete={(profileTypeField) => handleDeleteProperty([profileTypeField.id])}
            onSelectionChange={onChangeSelectedIds}
            onReorder={handleReorderProperties}
          />
          <Center>
            <Button colorScheme="primary" leftIcon={<AddIcon />} onClick={handleAddNewProperty}>
              <FormattedMessage
                id="page.organization-profile-type.add-profile-type-field"
                defaultMessage="Add property"
              />
            </Button>
          </Center>
        </Stack>
      </Box>
    </OrganizationSettingsLayout>
  );
}

interface DraggableListProps extends BoxProps {
  rows: OrganizationProfileType_ProfileTypeFieldFragment[];
  rowKeyProp: KeyProp<OrganizationProfileType_ProfileTypeFieldFragment>;
  actions?: (ButtonProps & { key: Key; wrap?: (node: ReactNode) => ReactNode })[];
  onEdit: (row: OrganizationProfileType_ProfileTypeFieldFragment) => void;
  onConfigureVisibility: (row: OrganizationProfileType_ProfileTypeFieldFragment) => void;
  onDelete: (row: OrganizationProfileType_ProfileTypeFieldFragment) => void;
  onSelectionChange: (selected: string[]) => void;
  onReorder: (ids: string[]) => void;
}

function DraggableList({
  rows,
  rowKeyProp,
  actions,
  onEdit,
  onConfigureVisibility,
  onDelete,
  onSelectionChange,
  onReorder,
  ...props
}: DraggableListProps) {
  const [list, setList] = useState(rows);

  useEffect(() => {
    setList(rows);
  }, [rows]);

  const selectedCount = useRef(0);

  const { selection, allSelected, anySelected, toggle, toggleAll } = useSelectionState(
    rows ?? [],
    rowKeyProp
  );

  useEffect(() => {
    const selected = Object.entries(selection)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    onSelectionChange?.(selected);
    selectedCount.current = selected.length;
  }, [selection]);

  return (
    <Card overflow="hidden" paddingBottom={2} {...props}>
      <HStack>
        <Center
          padding={5}
          borderRight="1px"
          cursor="pointer"
          borderColor="gray.200"
          onClick={toggleAll}
        >
          <Checkbox
            isChecked={anySelected && allSelected}
            isIndeterminate={anySelected && !allSelected}
            onChange={noop}
            colorScheme="primary"
          />
        </Center>
        {selectedCount.current > 0 ? (
          <Box fontWeight="normal">
            <HStack height="38px" paddingX={3} position="relative" top="1px">
              <Box fontSize="sm">
                <FormattedMessage
                  id="component.table-page.n-selected"
                  defaultMessage="{count} selected"
                  values={{ count: selectedCount.current }}
                />
              </Box>
              {actions?.map(({ key, wrap = identity, ...props }) => (
                <Fragment key={key}>
                  {wrap(<Button variant="ghost" size="sm" fontWeight="normal" {...props} />)}
                </Fragment>
              ))}
            </HStack>
          </Box>
        ) : (
          <Heading size="md" padding={4}>
            <FormattedMessage id="component.draggable-list.heading" defaultMessage="Properties" />
          </Heading>
        )}
      </HStack>
      <Divider borderColor="gray.200" />
      <Stack
        listStyleType="none"
        as={Reorder.Group}
        axis="y"
        values={list}
        onReorder={setList}
        spacing={0}
        borderBottom="1px"
        borderColor="gray.200"
      >
        {list.map((item, i) => {
          const key = getKey(item, rowKeyProp);
          return (
            <ProfileTypeField
              key={key}
              item={item}
              index={i}
              onEdit={() => onEdit(item)}
              onConfigureVisibility={() => onConfigureVisibility(item)}
              onDelete={() => onDelete(item)}
              onDragEnd={() => onReorder(list.map((i) => i.id))}
              onToggle={(event) => toggle(key, event)}
              isSelected={selection[key]}
            />
          );
        })}
      </Stack>
    </Card>
  );
}

interface ProfileTypeFieldProps {
  item: any;
  index: number;
  isSelected: boolean;
  onEdit: () => void;
  onConfigureVisibility: () => void;
  onDelete: () => void;
  onDragEnd: () => void;
  onToggle: (event: MouseEvent) => void;
}

const ProfileTypeField = chakraForwardRef<"div", ProfileTypeFieldProps>(function ProfileTypeField(
  {
    item,
    index,
    isSelected,
    onEdit,
    onConfigureVisibility,
    onDelete,
    onDragEnd,
    onToggle,
    ...props
  },
  ref
) {
  const intl = useIntl();
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={item.id}
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
    >
      <HStack
        background="white"
        sx={{
          ".more-opetions-button": {
            display: "none",
            "&[data-active]": {
              display: "flex",
            },
          },
          "&:hover, &:focus, &:focus-within": {
            ".more-opetions-button,.drag-handle": {
              display: "flex",
              opacity: 1,
            },
          },
          ".drag-handle": {
            opacity: 0,
            transition: "opacity 150ms",
          },
        }}
        position="relative"
        outline="1px solid"
        outlineColor="gray.200"
        ref={ref}
        {...props}
        paddingX={4}
      >
        <Center cursor="pointer" padding={3} paddingLeft={1} onClick={onToggle}>
          <Checkbox isChecked={isSelected} colorScheme="primary" />
        </Center>
        <HStack flex="1" userSelect="none">
          <Box
            className="drag-handle"
            position="absolute"
            left={1}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            cursor={"grab"}
            color="gray.400"
            _hover={{
              color: "gray.700",
            }}
            aria-label={intl.formatMessage({
              id: "component.draggable-list.drag-to-sort-label",
              defaultMessage: "Drag to sort this property",
            })}
            onPointerDown={(event) => dragControls.start(event)}
          >
            <DragHandleIcon role="presentation" boxSize={3} />
          </Box>
          <ProfileTypeFieldTypeIndicator type={item.type} fieldIndex={index + 1} />
          <Text as="span" flex="1">
            <LocalizableUserTextRender
              value={item.name}
              default={intl.formatMessage({
                id: "generic.unnamed-profile-type-field",
                defaultMessage: "Unnamed property",
              })}
            />
          </Text>
          <MoreOptionsMenuButton
            className="more-opetions-button"
            alignSelf="end"
            size="sm"
            options={
              <MenuList minWidth="160px">
                <MenuItem icon={<EditIcon display="block" boxSize={4} />} onClick={onEdit}>
                  <FormattedMessage
                    id="component.draggable-list.edit-property"
                    defaultMessage="Edit property"
                  />
                </MenuItem>
                {/* <MenuItem
                  icon={<EyeIcon display="block" boxSize={4} />}
                  onClick={onConfigureVisibility}
                >
                  <FormattedMessage
                    id="component.draggable-list.configure-visiblity"
                    defaultMessage="Configure visibility"
                  />
                </MenuItem> */}
                <MenuDivider />
                <MenuItem
                  icon={<DeleteIcon display="block" boxSize={4} />}
                  onClick={onDelete}
                  color="red.500"
                >
                  <FormattedMessage
                    id="component.draggable-list.delete-property"
                    defaultMessage="Delete property"
                  />
                </MenuItem>
              </MenuList>
            }
          />
        </HStack>
      </HStack>
    </Reorder.Item>
  );
});

function useProfileTypeFieldsActions({
  onEditClick,
  onConfigureVisibilityClick,
  onDeleteClick,
}: {
  onEditClick: () => void;
  onConfigureVisibilityClick: () => void;
  onDeleteClick: () => void;
}) {
  return [
    {
      key: "edit",
      onClick: onEditClick,
      leftIcon: <EditIcon />,
      children: (
        <FormattedMessage
          id="component.draggable-list.edit-property"
          defaultMessage="Edit property"
        />
      ),
    },
    {
      key: "delete",
      onClick: onDeleteClick,
      leftIcon: <DeleteIcon />,
      children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
      colorScheme: "red",
    },
  ];
}

const _fragments = {
  get ProfileTypeField() {
    return gql`
      fragment OrganizationProfileType_ProfileTypeField on ProfileTypeField {
        id
        name
        type
        ...useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField
        ...ProfileTypeSettings_ProfileTypeField
      }
      ${useUpdateProfileTypeFieldDialog.fragments.ProfileTypeField}
      ${useCreateOrUpdateProfileTypeFieldDialog.fragments.ProfileTypeField}
      ${ProfileTypeSettings.fragments.ProfileTypeField}
    `;
  },
  get ProfileType() {
    return gql`
      fragment OrganizationProfileType_ProfileType on ProfileType {
        id
        name
        fields {
          ...OrganizationProfileType_ProfileTypeField
        }
        profileNamePattern
        createdAt
        ...ProfileTypeSettings_ProfileType
      }
      ${this.ProfileTypeField}
      ${ProfileTypeSettings.fragments.ProfileType}
    `;
  },
};

const _queries = [
  gql`
    query OrganizationProfileType_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        ...OrganizationProfileType_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
  gql`
    query OrganizationProfileType_user {
      ...OrganizationSettingsLayout_Query
    }
    ${OrganizationSettingsLayout.fragments.Query}
  `,
];

const _mutations = [
  gql`
    mutation OrganizationProfileType_updateProfileType(
      $profileTypeId: GID!
      $name: LocalizableUserText
      $profileNamePattern: String
    ) {
      updateProfileType(
        profileTypeId: $profileTypeId
        name: $name
        profileNamePattern: $profileNamePattern
      ) {
        ...OrganizationProfileType_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
  gql`
    mutation OrganizationProfileType_cloneProfileType(
      $profileTypeId: GID!
      $name: LocalizableUserText
    ) {
      cloneProfileType(profileTypeId: $profileTypeId, name: $name) {
        ...OrganizationProfileType_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
  gql`
    mutation OrganizationProfileType_updateProfileTypeFieldPositions(
      $profileTypeId: GID!
      $profileTypeFieldIds: [GID!]!
    ) {
      updateProfileTypeFieldPositions(
        profileTypeId: $profileTypeId
        profileTypeFieldIds: $profileTypeFieldIds
      ) {
        ...OrganizationProfileType_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
  gql`
    mutation OrganizationProfileType_updateProfileTypeField(
      $profileTypeId: GID!
      $profileTypeFieldId: GID!
      $data: UpdateProfileTypeFieldInput!
      $force: Boolean
    ) {
      updateProfileTypeField(
        profileTypeId: $profileTypeId
        profileTypeFieldId: $profileTypeFieldId
        data: $data
        force: $force
      ) {
        ...OrganizationProfileType_ProfileTypeField
      }
    }
    ${_fragments.ProfileTypeField}
  `,
  gql`
    mutation OrganizationProfileType_deleteProfileTypeField(
      $profileTypeId: GID!
      $profileTypeFieldIds: [GID!]!
    ) {
      deleteProfileTypeField(
        profileTypeId: $profileTypeId
        profileTypeFieldIds: $profileTypeFieldIds
      ) {
        ...OrganizationProfileType_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
];

OrganizationProfileType.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const profileTypeId = query.profileTypeId as string;
  await Promise.all([
    fetchQuery(OrganizationProfileType_profileTypeDocument, { variables: { profileTypeId } }),
    fetchQuery(OrganizationProfileType_userDocument),
  ]);
  return { profileTypeId };
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/organization"),
  withApolloData
)(OrganizationProfileType);
