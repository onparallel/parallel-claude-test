import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Center,
  Checkbox,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  Heading,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  AddIcon,
  ArchiveIcon,
  CopyIcon,
  DeleteIcon,
  DragHandleIcon,
  EditIcon,
  EditSimpleIcon,
  EyeIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { WhenPermission } from "@parallel/components/common/WhenPermission";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { withPermission } from "@parallel/components/common/withPermission";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { ProfileTypeFieldStandardType } from "@parallel/components/organization/profiles/ProfileTypeFieldStandardType";
import { ProfileTypeFieldTypeIndicator } from "@parallel/components/organization/profiles/ProfileTypeFieldTypeIndicator";
import { ProfileTypeIconSelect } from "@parallel/components/organization/profiles/ProfileTypeIconSelect";
import { ProfileTypeSettings } from "@parallel/components/organization/profiles/ProfileTypeSettings";
import { useCreateOrUpdateProfileTypeDialog } from "@parallel/components/organization/profiles/dialogs/CreateOrUpdateProfileTypeDialog";
import { useCreateOrUpdateProfileTypeFieldDialog } from "@parallel/components/organization/profiles/dialogs/CreateOrUpdateProfileTypeFieldDialog";
import { useProfileTypeFieldPermissionDialog } from "@parallel/components/organization/profiles/dialogs/ProfileTypeFieldPermissionDialog";
import { useProfileTypeFieldsInPatternDialog } from "@parallel/components/organization/profiles/dialogs/ProfileTypeFieldsInPatternDialog";
import { useUpdateProfileTypeFieldDialog } from "@parallel/components/organization/profiles/dialogs/UpdateProfileTypeFieldDialog";
import { useProfileTypeFieldReferencedMonitoringDialog } from "@parallel/components/profiles/dialogs/ProfileTypeFieldReferencedMonitoringDialog";
import {
  OrganizationProfileType_ProfileTypeFieldFragment,
  OrganizationProfileType_cloneProfileTypeDocument,
  OrganizationProfileType_deleteProfileTypeFieldDocument,
  OrganizationProfileType_profileTypeDocument,
  OrganizationProfileType_updateProfileTypeDocument,
  OrganizationProfileType_updateProfileTypeFieldDocument,
  OrganizationProfileType_updateProfileTypeFieldPermissionDocument,
  OrganizationProfileType_updateProfileTypeFieldPositionsDocument,
  OrganizationProfileType_userDocument,
  ProfileTypeIcon,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { getReferencedInBackgroundCheck } from "@parallel/utils/getFieldsReferencedInBackgroundCheck";
import { KeyProp, getKey } from "@parallel/utils/keyProp";
import { useArchiveProfileType } from "@parallel/utils/mutations/useArchiveProfileType";
import { useDeleteProfileType } from "@parallel/utils/mutations/useDeleteProfileType";
import { useUnarchiveProfileType } from "@parallel/utils/mutations/useUnarchiveProfileType";
import { Focusable, UnwrapPromise } from "@parallel/utils/types";
import { expirationToDuration } from "@parallel/utils/useExpirationOptions";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useSelection, useSelectionState } from "@parallel/utils/useSelectionState";
import { MotionConfig, Reorder, useDragControls } from "framer-motion";
import { useRouter } from "next/router";
import {
  Fragment,
  Key,
  MouseEvent,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { doNothing, identity, isNonNullish } from "remeda";

type OrganizationProfileTypeProps = UnwrapPromise<
  ReturnType<typeof OrganizationProfileType.getInitialProps>
>;

function OrganizationProfileType({ profileTypeId }: OrganizationProfileTypeProps) {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();
  const { data: queryObject } = useAssertQuery(OrganizationProfileType_userDocument);
  const { me } = queryObject;
  const {
    data: { profileType },
    refetch,
  } = useAssertQuery(OrganizationProfileType_profileTypeDocument, {
    variables: {
      profileTypeId,
    },
  });

  const { selectedIds, selectedRows, onChangeSelectedIds } = useSelection(profileType.fields, "id");

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
    [profileTypeId],
  );

  const handleChangeIcon = useCallback(
    async (icon: ProfileTypeIcon) => {
      try {
        await updateProfileType({
          variables: {
            profileTypeId,
            icon,
          },
        });
      } catch {
        showError();
      }
    },
    [profileTypeId],
  );

  const showCreateOrUpdateProfileTypeDialog = useCreateOrUpdateProfileTypeDialog();
  const handleChangeProfileTypeName = async () => {
    try {
      const { name, pluralName } = await showCreateOrUpdateProfileTypeDialog({
        isEditing: true,
        name: profileType.name,
        pluralName: profileType.pluralName,
      });
      await updateProfileType({
        variables: {
          profileTypeId,
          name,
          pluralName,
        },
      });
    } catch {}
  };

  const headerMoreOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const [cloneProfileType] = useMutation(OrganizationProfileType_cloneProfileTypeDocument);
  const handleCloneProfileType = async () => {
    try {
      const { name, pluralName } = await showCreateOrUpdateProfileTypeDialog({
        isEditing: false,
        name: profileType.name,
        pluralName: profileType.pluralName,
        modalProps: { finalFocusRef: headerMoreOptionsButtonRef },
      });
      const res = await cloneProfileType({
        variables: {
          profileTypeId,
          name,
          pluralName,
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

  const archiveProfileType = useArchiveProfileType();
  const handleArchiveProfileType = async () => {
    try {
      await archiveProfileType({ profileTypes: [profileType] });
      await refetch();
    } catch {}
  };

  const unarchiveProfileType = useUnarchiveProfileType();
  const handleUnarchiveProfileType = async () => {
    try {
      await unarchiveProfileType({ profileTypes: [profileType] });
      await refetch();
    } catch {}
  };

  const showUpdateProfileTypeFieldDialog = useUpdateProfileTypeFieldDialog();
  const showCreateOrUpdateProfileTypeFieldDialog = useCreateOrUpdateProfileTypeFieldDialog();
  const handleAddNewProperty = async () => {
    try {
      await showCreateOrUpdateProfileTypeFieldDialog({
        profileType,
      });
      refetch();
    } catch {}
  };

  const [deleteProfileTypeField] = useMutation(
    OrganizationProfileType_deleteProfileTypeFieldDocument,
  );
  const showUsedInPattern = useProfileTypeFieldsInPatternDialog();
  const showConfirmDeleteProfileTypeFieldDialog = useConfirmDeleteProfileTypeFieldDialog();
  const showProfileTypeFieldReferencedMonitoringDialog =
    useProfileTypeFieldReferencedMonitoringDialog();
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
      } else if (isApolloError(e, "FIELD_HAS_VALUE_OR_FILES")) {
        try {
          await showConfirmDeleteProfileTypeFieldDialog({
            profileCount: e.graphQLErrors[0]?.extensions?.profileCount as number,
            profileFieldsCount: profileTypeFieldIds.length,
          });
          await deleteProfileTypeField({
            variables: {
              profileTypeId,
              profileTypeFieldIds,
              force: true,
            },
          });
        } catch {}
      } else if (isApolloError(e, "FIELD_USED_IN_BACKGROUND_CHECK_MONITORING_RULE")) {
        try {
          const properties = getReferencedInBackgroundCheck({
            profileTypeFields: profileType.fields,
            profileTypeFieldId: profileTypeFieldIds[0],
          });
          await showProfileTypeFieldReferencedMonitoringDialog({
            properties,
            profileTypeFieldIds,
          });
        } catch {}
      }
    }
  };

  const showProfileTypeFieldPermissionDialog = useProfileTypeFieldPermissionDialog();
  const [updateProfileTypeFieldPermission] = useMutation(
    OrganizationProfileType_updateProfileTypeFieldPermissionDocument,
  );
  const handleConfigureVisibility = async (
    rows: OrganizationProfileType_ProfileTypeFieldFragment[],
    finalFocusRef?: RefObject<Focusable>,
  ) => {
    try {
      const { defaultPermission, permissions: data } = await showProfileTypeFieldPermissionDialog({
        profileTypeField: rows[0],
        userId: me.id,
        modalProps: { finalFocusRef },
      });

      await updateProfileTypeFieldPermission({
        variables: {
          profileTypeId,
          profileTypeFieldId: rows[0].id,
          defaultPermission,
          data,
        },
      });
    } catch {}
  };

  const [updateProfileTypeField] = useMutation(
    OrganizationProfileType_updateProfileTypeFieldDocument,
  );

  const handleEditProperty = async (
    fields: OrganizationProfileType_ProfileTypeFieldFragment[],
    finalFocusRef?: RefObject<Focusable>,
  ) => {
    try {
      if (fields.length > 1) {
        const { isExpirable, expiryAlertAheadTime } = await showUpdateProfileTypeFieldDialog({
          fields,
          modalProps: { finalFocusRef },
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
          profileType,
          profileTypeField: fields[0],
        });
      }
      if (fields.length === 1 && fields[0].type === "BACKGROUND_CHECK") {
        refetch();
      }
    } catch {}
  };

  const [updateProfileTypeFieldPositions] = useMutation(
    OrganizationProfileType_updateProfileTypeFieldPositionsDocument,
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
    [profileTypeId],
  );

  const actions = useProfileTypeFieldsActions({
    onDeleteClick: () => handleDeleteProperty(selectedIds),
    onConfigureVisibilityClick: () =>
      handleConfigureVisibility(profileType.fields.filter((f) => selectedIds.includes(f.id))),
    onEditClick: () =>
      handleEditProperty(profileType.fields.filter((f) => selectedIds.includes(f.id))),
    visibilityIsDisabled: selectedIds.length !== 1,
    hideDeleteButton: selectedRows.every((row) => row.isStandard),
    disableDeleteButton: selectedRows.some((row) => row.isStandard),
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
      queryObject={queryObject}
      subHeader={
        profileType.isStandard ? (
          <Alert status="info">
            <AlertIcon />
            <AlertDescription>
              <FormattedMessage
                id="page.organization-profile-type.standard-profile-type-alert-description"
                defaultMessage="This profile type is provided by Parallel, and only some of the options can be modified."
              />
            </AlertDescription>
          </Alert>
        ) : profileType.archivedAt ? (
          <Alert status="info">
            <AlertIcon />
            <AlertDescription>
              <FormattedMessage
                id="page.organization-profile-type.archived-profile-type-alert-description"
                defaultMessage="This profile type is archived and cannot be used to create new profiles. If you want, you can <a>retrieve</a> it to continue using it."
                values={{
                  a: (chunks: ReactNode) => (
                    <Button
                      variant="link"
                      colorScheme="primary"
                      onClick={handleUnarchiveProfileType}
                    >
                      {chunks}
                    </Button>
                  ),
                }}
              />
            </AlertDescription>
          </Alert>
        ) : null
      }
      header={
        <HStack width="100%" justifyContent="space-between" alignItems="center">
          <HStack spacing={3}>
            <ProfileTypeIconSelect value={profileType.icon} onChange={handleChangeIcon} />
            <HStack alignItems="baseline">
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
              {isNonNullish(profileType.standardType) ? (
                <Box minWidth={0} color="gray.500">
                  <OverflownText>
                    <ProfileTypeFieldStandardType as="span" type={profileType.standardType} />
                  </OverflownText>
                </Box>
              ) : null}
            </HStack>
          </HStack>
          <Flex flex={1} justifyContent="end">
            <WhenPermission permission="PROFILE_TYPES:CRUD_PROFILE_TYPES">
              <MoreOptionsMenuButton
                ref={headerMoreOptionsButtonRef}
                variant="outline"
                options={
                  <MenuList>
                    {profileType.archivedAt ? (
                      <MenuItem
                        onClick={handleUnarchiveProfileType}
                        icon={<ArchiveIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="component.profile-type-header.unarchive-label"
                          defaultMessage="Unarchive profile type"
                        />
                      </MenuItem>
                    ) : (
                      <MenuItem
                        onClick={handleCloneProfileType}
                        icon={<CopyIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="component.profile-type-header.clone-label"
                          defaultMessage="Clone profile type"
                        />
                      </MenuItem>
                    )}
                    {!profileType.isStandard ? (
                      <>
                        <MenuDivider />
                        {profileType.archivedAt ? (
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
                        ) : (
                          <MenuItem
                            color="red.500"
                            onClick={handleArchiveProfileType}
                            icon={<ArchiveIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage
                              id="component.profile-type-header.archive-label"
                              defaultMessage="Archive profile type"
                            />
                          </MenuItem>
                        )}
                      </>
                    ) : null}
                  </MenuList>
                }
              />
            </WhenPermission>
          </Flex>
        </HStack>
      }
      showBackButton={true}
    >
      <Box padding={4}>
        <Grid
          gap={4}
          maxWidth="container.xl"
          templateColumns={{
            base: "1fr",
            xl: "repeat(auto-fit, minmax(380px, 1fr))",
          }}
        >
          <GridItem order={{ base: 1, xl: 2 }}>
            <ProfileTypeSettings
              key={`${profileType.id}-settings`}
              profileType={profileType}
              onSave={handleChangeProfileTypePattern}
            />
          </GridItem>
          <GridItem order={{ base: 2, xl: 1 }}>
            <Stack spacing={6}>
              <DraggableList
                key={profileType.id}
                width="full"
                rows={profileType.fields}
                rowKeyProp="id"
                actions={actions}
                onEdit={(profileTypeField, finalFocusRef) =>
                  handleEditProperty([profileTypeField], finalFocusRef)
                }
                onConfigureVisibility={(profileTypeField, finalFocusRef) =>
                  handleConfigureVisibility([profileTypeField], finalFocusRef)
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
          </GridItem>
        </Grid>
      </Box>
    </OrganizationSettingsLayout>
  );
}

interface DraggableListProps extends BoxProps {
  rows: OrganizationProfileType_ProfileTypeFieldFragment[];
  rowKeyProp: KeyProp<OrganizationProfileType_ProfileTypeFieldFragment>;
  actions?: (ButtonProps & { key: Key; wrap?: (node: ReactNode) => ReactNode })[];
  onEdit: (
    row: OrganizationProfileType_ProfileTypeFieldFragment,
    finalFocusRef?: RefObject<Focusable>,
  ) => void;
  onConfigureVisibility: (
    row: OrganizationProfileType_ProfileTypeFieldFragment,
    finalFocusRef?: RefObject<Focusable>,
  ) => void;
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
    rowKeyProp,
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
          borderEnd="1px"
          cursor="pointer"
          borderColor="gray.200"
          onClick={toggleAll}
        >
          <Checkbox
            isChecked={anySelected && allSelected}
            isIndeterminate={anySelected && !allSelected}
            onChange={doNothing}
          />
        </Center>
        {selectedCount.current > 0 ? (
          <Box fontWeight="normal">
            <HStack height="38px" paddingX={3} position="relative" top="1px">
              <Box fontSize="sm" whiteSpace="nowrap">
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
      <MotionConfig reducedMotion="always">
        <Stack
          listStyleType="none"
          as={Reorder.Group}
          axis="y"
          values={list}
          onReorder={setList as any}
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
                onEdit={(buttonRef) => onEdit(item, buttonRef)}
                onConfigureVisibility={(buttonRef) => onConfigureVisibility(item, buttonRef)}
                onDelete={() => onDelete(item)}
                onDragEnd={() => onReorder(list.map((i) => i.id))}
                onToggle={(event) => toggle(key, event)}
                isSelected={selection[key]}
              />
            );
          })}
        </Stack>
      </MotionConfig>
    </Card>
  );
}

interface ProfileTypeFieldProps {
  item: any;
  index: number;
  isSelected: boolean;
  onEdit: (finalFocusRef?: RefObject<Focusable>) => void;
  onConfigureVisibility: (finalFocusRef?: RefObject<Focusable>) => void;
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
  ref,
) {
  const intl = useIntl();
  const dragControls = useDragControls();

  const propertyMoreOptionsRef = useRef<HTMLButtonElement>(null);

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
        <Center cursor="pointer" padding={3} paddingStart={1} onClick={onToggle}>
          <Checkbox isChecked={isSelected} />
        </Center>
        <HStack flex="1" userSelect="none">
          <Box
            className="drag-handle"
            position="absolute"
            insetStart={1}
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
          <Text as="span" flex="1" noOfLines={1}>
            <LocalizableUserTextRender
              value={item.name}
              default={intl.formatMessage({
                id: "generic.unnamed-profile-type-field",
                defaultMessage: "Unnamed property",
              })}
            />
          </Text>
          <MoreOptionsMenuButton
            ref={propertyMoreOptionsRef}
            className="more-opetions-button"
            alignSelf="center"
            size="sm"
            options={
              <MenuList minWidth="160px">
                <MenuItem
                  icon={<EditIcon display="block" boxSize={4} />}
                  onClick={() => onEdit(propertyMoreOptionsRef)}
                >
                  <FormattedMessage
                    id="component.draggable-list.edit-property"
                    defaultMessage="Edit property"
                  />
                </MenuItem>
                <MenuItem
                  icon={<EyeIcon display="block" boxSize={4} />}
                  onClick={() => onConfigureVisibility(propertyMoreOptionsRef)}
                >
                  <FormattedMessage
                    id="component.draggable-list.configure-visiblity"
                    defaultMessage="Configure visibility"
                  />
                </MenuItem>
                {item.isStandard ? null : (
                  <>
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
                  </>
                )}
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
  visibilityIsDisabled,
  hideDeleteButton,
  disableDeleteButton,
}: {
  onEditClick: () => void;
  onConfigureVisibilityClick: () => void;
  onDeleteClick: () => void;
  visibilityIsDisabled: boolean;
  hideDeleteButton: boolean;
  disableDeleteButton: boolean;
}) {
  return [
    {
      key: "edit",
      onClick: onEditClick,
      leftIcon: <EditIcon />,
      children: <FormattedMessage id="generic.edit" defaultMessage="Edit" />,
    },
    {
      key: "visibility",
      onClick: onConfigureVisibilityClick,
      leftIcon: <EyeIcon />,
      children: (
        <FormattedMessage id="component.draggable-list.visiblity" defaultMessage="Visibility" />
      ),
      isDisabled: visibilityIsDisabled,
    },
    ...(hideDeleteButton
      ? []
      : [
          {
            key: "delete",
            onClick: onDeleteClick,
            leftIcon: <DeleteIcon />,
            children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
            colorScheme: "red",
            isDisabled: disableDeleteButton,
          },
        ]),
  ];
}

function useConfirmDeleteProfileTypeFieldDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(
    async ({
      profileCount,
      profileFieldsCount,
    }: {
      profileCount: number;
      profileFieldsCount: number;
    }) => {
      return await showDialog({
        size: "lg",
        header: (
          <FormattedMessage
            id="component.use-confirm-delete-profile-type-field-dialog.header"
            defaultMessage="Delete {count, plural, =1 {property} other {# properties}}"
            values={{
              count: profileFieldsCount,
            }}
          />
        ),
        description: (
          <Text>
            <FormattedMessage
              id="component.use-confirm-delete-profile-type-field-dialog.description"
              defaultMessage="You are about to delete {count, plural, =1 {this property} other {# properties}}. Please note that there {profileCount, plural, =1{is # profile that has} other{are # profiles that have}} an answer on {count, plural, =1 {this property} other {one of these properties}}, and if you continue, these answers will be deleted permanently."
              values={{
                profileCount,
                count: profileFieldsCount,
              }}
            />
          </Text>
        ),
      });
    },
    [],
  );
}

const _fragments = {
  get ProfileTypeField() {
    return gql`
      fragment OrganizationProfileType_ProfileTypeField on ProfileTypeField {
        id
        name
        type
        isStandard
        ...useProfileTypeFieldPermissionDialog_ProfileTypeField
        ...useUpdateProfileTypeFieldDialog_ProfileTypeField
        ...useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField
        ...ProfileTypeSettings_ProfileTypeField
        ...useProfileTypeFieldReferencedMonitoringDialog_ProfileTypeField
        ...getReferencedInBackgroundCheck_ProfileTypeField
      }
      ${useProfileTypeFieldPermissionDialog.fragments.ProfileTypeField}
      ${useUpdateProfileTypeFieldDialog.fragments.ProfileTypeField}
      ${useCreateOrUpdateProfileTypeFieldDialog.fragments.ProfileTypeField}
      ${ProfileTypeSettings.fragments.ProfileTypeField}
      ${useProfileTypeFieldReferencedMonitoringDialog.fragments.ProfileTypeField}
      ${getReferencedInBackgroundCheck.fragments.ProfileTypeField}
    `;
  },
  get ProfileType() {
    return gql`
      fragment OrganizationProfileType_ProfileType on ProfileType {
        id
        name
        pluralName
        icon
        isStandard
        standardType
        fields {
          ...OrganizationProfileType_ProfileTypeField
        }
        profileNamePattern
        createdAt
        archivedAt
        ...ProfileTypeSettings_ProfileType
        ...useArchiveProfileType_ProfileType
        ...useUnarchiveProfileType_ProfileType
      }
      ${this.ProfileTypeField}
      ${ProfileTypeSettings.fragments.ProfileType}
      ${useArchiveProfileType.fragments.ProfileType}
      ${useUnarchiveProfileType.fragments.ProfileType}
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
    mutation OrganizationProfileType_updateProfileTypeFieldPermission(
      $profileTypeId: GID!
      $profileTypeFieldId: GID!
      $defaultPermission: ProfileTypeFieldPermissionType
      $data: [UpdateProfileTypeFieldPermissionInput!]!
    ) {
      updateProfileTypeFieldPermission(
        profileTypeId: $profileTypeId
        profileTypeFieldId: $profileTypeFieldId
        defaultPermission: $defaultPermission
        data: $data
      ) {
        ...useProfileTypeFieldPermissionDialog_ProfileTypeField
      }
    }
    ${useProfileTypeFieldPermissionDialog.fragments.ProfileTypeField}
  `,
  gql`
    mutation OrganizationProfileType_updateProfileType(
      $profileTypeId: GID!
      $name: LocalizableUserText
      $pluralName: LocalizableUserText
      $profileNamePattern: String
      $icon: ProfileTypeIcon
    ) {
      updateProfileType(
        profileTypeId: $profileTypeId
        name: $name
        pluralName: $pluralName
        profileNamePattern: $profileNamePattern
        icon: $icon
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
      $pluralName: LocalizableUserText
    ) {
      cloneProfileType(profileTypeId: $profileTypeId, name: $name, pluralName: $pluralName) {
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
      $force: Boolean
    ) {
      deleteProfileTypeField(
        profileTypeId: $profileTypeId
        profileTypeFieldIds: $profileTypeFieldIds
        force: $force
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
  withPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES", { orPath: "/app/organization" }),
  withFeatureFlag("PROFILES", "/app/organization"),
  withApolloData,
)(OrganizationProfileType);
