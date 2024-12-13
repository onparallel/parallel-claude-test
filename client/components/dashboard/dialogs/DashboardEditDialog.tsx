import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  List,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Select } from "@parallel/chakra/components";
import { DeleteIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import {
  CreatePetitionButtonDashboardModuleSettingsInput,
  DashboardEditDialog_adminCreateDashboardDocument,
  DashboardEditDialog_createCreatePetitionButtonDashboardModuleDocument,
  DashboardEditDialog_createPetitionsNumberDashboardModuleDocument,
  DashboardEditDialog_createPetitionsPieChartDashboardModuleDocument,
  DashboardEditDialog_createPetitionsRatioDashboardModuleDocument,
  DashboardEditDialog_createProfilesNumberDashboardModuleDocument,
  DashboardEditDialog_createProfilesPieChartDashboardModuleDocument,
  DashboardEditDialog_createProfilesRatioDashboardModuleDocument,
  DashboardEditDialog_dashboardDocument,
  DashboardEditDialog_DashboardFragment,
  DashboardEditDialog_deleteDashboardModuleDocument,
  DashboardEditDialog_petitionListViewsDocument,
  DashboardEditDialog_profileListViewsDocument,
  DashboardEditDialog_profileTypeDocument,
  DashboardEditDialog_updateDashboardModulePositionsDocument,
  DashboardModuleSize,
  PetitionsNumberDashboardModuleSettingsInput,
  PetitionsPieChartDashboardModuleSettingsInput,
  PetitionsRatioDashboardModuleSettingsInput,
  ProfilesNumberDashboardModuleSettingsInput,
  ProfilesPieChartDashboardModuleSettingsInput,
  ProfilesRatioDashboardModuleSettingsInput,
} from "@parallel/graphql/__types";
import { untranslated } from "@parallel/utils/untranslated";
import { Reorder } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { isNonNullish, isNullish, omit } from "remeda";
import { DashboardModule } from "../DashboardModule";

export function DashboardEditDialog({
  dashboardId,
  orgId,
  ...props
}: DialogProps<{ dashboardId: string; orgId: string }>) {
  const {
    handleSubmit,
    register,

    formState: { errors },
  } = useForm<{ name: string }>({
    mode: "onSubmit",
    defaultValues: {
      name: "",
    },
  });

  const [selectedDashboardId, setSelectedDashboardId] = useState(dashboardId);

  const { data, refetch } = useQuery(DashboardEditDialog_dashboardDocument, {
    variables: { id: selectedDashboardId },
  });

  const [createDashboard] = useMutation(DashboardEditDialog_adminCreateDashboardDocument);

  return (
    <ConfirmDialog
      hasCloseButton
      size="full"
      header={<Text>{untranslated(`Edit dashboard: ${data?.dashboard.name}`)}</Text>}
      body={
        <Stack>
          <HStack
            as="form"
            onSubmit={handleSubmit(async (data) => {
              const { data: newDashboardData } = await createDashboard({
                variables: { orgId, name: data.name },
              });
              if (newDashboardData) {
                setSelectedDashboardId(newDashboardData!.adminCreateDashboard.id);
              }
            })}
          >
            <FormControl id="name" isInvalid={!!errors.name} isRequired>
              <FormLabel>{untranslated("New dashboard name")}</FormLabel>
              <Input flex="1" {...register("name", { required: true })} />
            </FormControl>
            <Box alignSelf="end">
              <Button colorScheme="primary" type="submit">
                {untranslated("Create new dashboard")}
              </Button>
            </Box>
          </HStack>
          <Tabs>
            <TabList>
              <Tab>{untranslated("Reorder modules")}</Tab>
              <Tab>{untranslated("Add module")}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {isNonNullish(data?.dashboard) ? (
                  <ReorderModules dashboard={data.dashboard} />
                ) : null}
              </TabPanel>
              <TabPanel>
                {isNonNullish(data?.dashboard) ? (
                  <AddModule dashboard={data.dashboard} onRefetch={() => refetch()} />
                ) : null}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Stack>
      }
      confirm={<></>}
      {...props}
    />
  );
}

export function useDashboardEditDialog() {
  return useDialog(DashboardEditDialog);
}
const _fragments = {
  get Dashboard() {
    return gql`
      fragment DashboardEditDialog_Dashboard on Dashboard {
        id
        isRefreshing
        lastRefreshAt
        name
        modules {
          id
          title
          size
          ...DashboardModule_DashboardModule
        }
      }
      ${DashboardModule.fragments.DashboardModule}
    `;
  },
};

const _queries = [
  gql`
    query DashboardEditDialog_dashboard($id: GID!) {
      dashboard(id: $id) {
        id
        ...DashboardEditDialog_Dashboard
      }
    }
    ${_fragments.Dashboard}
  `,
  gql`
    query DashboardEditDialog_petitionListViews {
      me {
        id
        petitionListViews {
          id
          name
          data {
            status
            sharedWith {
              operator
              filters {
                value
                operator
              }
            }
            tags: tagsFilters {
              operator
              filters {
                value
                operator
              }
            }
            signature
            fromTemplateId
            path
          }
        }
      }
    }
  `,
  gql`
    query DashboardEditDialog_profileListViews($profileTypeId: GID!) {
      me {
        profileListViews(profileTypeId: $profileTypeId) {
          id
          name
          data {
            search
            status
            values
          }
        }
      }
    }
  `,
  gql`
    query DashboardEditDialog_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        id
        name
        fields {
          id
          ...ProfileTypeFieldSelect_ProfileTypeField
        }
      }
    }
    ${ProfileTypeFieldSelect.fragments.ProfileTypeField}
  `,
];

const _mutations = [
  gql`
    mutation DashboardEditDialog_adminCreateDashboard($orgId: GID!, $name: String!) {
      adminCreateDashboard(orgId: $orgId, name: $name) {
        id
        name
        modules {
          id
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_createCreatePetitionButtonDashboardModule(
      $dashboardId: GID!
      $size: DashboardModuleSize!
      $settings: CreatePetitionButtonDashboardModuleSettingsInput!
      $title: String
    ) {
      createCreatePetitionButtonDashboardModule(
        dashboardId: $dashboardId
        size: $size
        settings: $settings
        title: $title
      ) {
        id
        modules {
          id
          title
          size
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_createPetitionsNumberDashboardModule(
      $dashboardId: GID!
      $size: DashboardModuleSize!
      $settings: PetitionsNumberDashboardModuleSettingsInput!
      $title: String
    ) {
      createPetitionsNumberDashboardModule(
        dashboardId: $dashboardId
        size: $size
        settings: $settings
        title: $title
      ) {
        id
        modules {
          id
          title
          size
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_createPetitionsRatioDashboardModule(
      $dashboardId: GID!
      $size: DashboardModuleSize!
      $settings: PetitionsRatioDashboardModuleSettingsInput!
      $title: String
    ) {
      createPetitionsRatioDashboardModule(
        dashboardId: $dashboardId
        size: $size
        settings: $settings
        title: $title
      ) {
        id
        modules {
          id
          size
          title
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_createPetitionsPieChartDashboardModule(
      $dashboardId: GID!
      $size: DashboardModuleSize!
      $settings: PetitionsPieChartDashboardModuleSettingsInput!
      $title: String
    ) {
      createPetitionsPieChartDashboardModule(
        dashboardId: $dashboardId
        size: $size
        settings: $settings
        title: $title
      ) {
        id
        modules {
          id
          size
          title
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_createProfilesNumberDashboardModule(
      $dashboardId: GID!
      $size: DashboardModuleSize!
      $settings: ProfilesNumberDashboardModuleSettingsInput!
      $title: String
    ) {
      createProfilesNumberDashboardModule(
        dashboardId: $dashboardId
        size: $size
        settings: $settings
        title: $title
      ) {
        id
        modules {
          id
          size
          title
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_createProfilesPieChartDashboardModule(
      $dashboardId: GID!
      $size: DashboardModuleSize!
      $settings: ProfilesPieChartDashboardModuleSettingsInput!
      $title: String
    ) {
      createProfilesPieChartDashboardModule(
        dashboardId: $dashboardId
        size: $size
        settings: $settings
        title: $title
      ) {
        id
        modules {
          id
          size
          title
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_createProfilesRatioDashboardModule(
      $dashboardId: GID!
      $size: DashboardModuleSize!
      $settings: ProfilesRatioDashboardModuleSettingsInput!
      $title: String
    ) {
      createProfilesRatioDashboardModule(
        dashboardId: $dashboardId
        size: $size
        settings: $settings
        title: $title
      ) {
        id
        modules {
          id
          size
          title
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_deleteDashboardModule($dashboardId: GID!, $moduleId: GID!) {
      deleteDashboardModule(dashboardId: $dashboardId, moduleId: $moduleId) {
        id
        modules {
          id
          size
          title
        }
      }
    }
  `,
  gql`
    mutation DashboardEditDialog_updateDashboardModulePositions(
      $dashboardId: GID!
      $moduleIds: [GID!]!
    ) {
      updateDashboardModulePositions(dashboardId: $dashboardId, moduleIds: $moduleIds) {
        id
        modules {
          id
          size
          title
        }
      }
    }
  `,
];

function ReorderModules({ dashboard }: { dashboard: DashboardEditDialog_DashboardFragment }) {
  const [items, setItems] = useState(dashboard.modules);
  const [hasChanged, setHasChanged] = useState(false);
  const showToast = useToast();
  useEffect(() => {
    setItems(dashboard.modules);
    setHasChanged(false);
  }, [dashboard]);

  const [deleteModule] = useMutation(DashboardEditDialog_deleteDashboardModuleDocument);
  const [reorderModules] = useMutation(DashboardEditDialog_updateDashboardModulePositionsDocument);

  const handleReorder = useCallback((newOrder: typeof items) => {
    setItems(newOrder);
    setHasChanged(true);
  }, []);

  const handleSave = useCallback(async () => {
    const moduleIds = items.map((item) => item.id);
    await reorderModules({
      variables: { dashboardId: dashboard.id, moduleIds },
    });
    showToast({
      title: `Modules order saved`,
      status: "success",
    });
    setHasChanged(false);
  }, [items]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteModule({
      variables: { dashboardId: dashboard.id, moduleId: id },
    });

    const module = items.find((item) => item.id === id);

    showToast({
      title: `Module "${module?.title ?? id}" deleted `,
      status: "success",
    });

    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  return (
    <Box margin="auto" padding={4}>
      <List
        as={Reorder.Group}
        axis="y"
        values={items}
        onReorder={handleReorder as any}
        listStyleType="none"
      >
        <VStack spacing={2} align="stretch">
          {items.map((item, index) => (
            <Reorder.Item key={item.id} value={item}>
              <Flex
                padding={3}
                bg="gray.100"
                borderRadius="md"
                cursor="grab"
                _hover={{ bg: "gray.200" }}
                alignItems="center"
              >
                <Box
                  minWidth="24px"
                  height="24px"
                  borderRadius="full"
                  bg="blue.500"
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  marginEnd={3}
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {index + 1}
                </Box>
                <Text flex={1}>
                  {`${item.size} - ${item.title} - `}
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => {
                      // eslint-disable-next-line no-console
                      console.log(item);
                    }}
                  >
                    {untranslated("console.log")}
                  </Button>
                </Text>
                <IconButton
                  icon={<DeleteIcon />}
                  aria-label=""
                  size="sm"
                  colorScheme="red"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(item.id);
                  }}
                />
              </Flex>
            </Reorder.Item>
          ))}
        </VStack>
      </List>
      <Button mt={4} colorScheme="blue" onClick={handleSave} isDisabled={!hasChanged}>
        {untranslated("Save New Order")}
      </Button>
    </Box>
  );
}

interface AddModuleData {
  title: string;
  settings:
    | PetitionsPieChartDashboardModuleSettingsInput
    | PetitionsRatioDashboardModuleSettingsInput
    | PetitionsNumberDashboardModuleSettingsInput
    | CreatePetitionButtonDashboardModuleSettingsInput
    | ProfilesNumberDashboardModuleSettingsInput
    | ProfilesRatioDashboardModuleSettingsInput
    | ProfilesPieChartDashboardModuleSettingsInput;
  type: string;
  size: DashboardModuleSize;
}

function AddModule({
  dashboard,
  onRefetch,
}: {
  dashboard: DashboardEditDialog_DashboardFragment;
  onRefetch: () => void;
}) {
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    watch,
  } = useForm<AddModuleData>({
    mode: "onSubmit",
    defaultValues: {
      title: "",
      settings: {},
      type: "PROFILES_NUMBER_DASHBOARD_MODULE",
      size: "SMALL",
    },
  });

  const showToast = useToast();

  const types = [
    [
      "PROFILES_NUMBER_DASHBOARD_MODULE",
      DashboardEditDialog_createProfilesNumberDashboardModuleDocument,
    ],
    [
      "PROFILES_RATIO_DASHBOARD_MODULE",
      DashboardEditDialog_createProfilesRatioDashboardModuleDocument,
    ],
    [
      "PROFILES_CHART_DASHBOARD_MODULE",
      DashboardEditDialog_createProfilesPieChartDashboardModuleDocument,
    ],
    [
      "PETITIONS_NUMBER_DASHBOARD_MODULE",
      DashboardEditDialog_createPetitionsNumberDashboardModuleDocument,
    ],
    [
      "PETITIONS_RATIO_DASHBOARD_MODULE",
      DashboardEditDialog_createPetitionsRatioDashboardModuleDocument,
    ],
    [
      "PETITIONS_CHART_DASHBOARD_MODULE",
      DashboardEditDialog_createPetitionsPieChartDashboardModuleDocument,
    ],
    [
      "PETITION_BUTTON_DASHBOARD_MODULE",
      DashboardEditDialog_createCreatePetitionButtonDashboardModuleDocument,
    ],
  ];
  const type = watch("type");

  const [createModule] = useMutation(types.find(([t, _]) => t === type)![1] as any);

  // Para los charts
  const { fields, append, remove } = useFieldArray({
    control,
    name: "settings.items",
  });

  // Para los ratios
  const {
    fields: filtersFields,
    append: appendFilter,
    remove: removeFilter,
  } = useFieldArray({
    control,
    name: "settings.filters",
    rules: {
      required:
        type === "PETITIONS_RATIO_DASHBOARD_MODULE" || type === "PROFILES_RATIO_DASHBOARD_MODULE",
      minLength:
        type === "PETITIONS_RATIO_DASHBOARD_MODULE" || type === "PROFILES_RATIO_DASHBOARD_MODULE"
          ? 2
          : undefined,
    },
    shouldUnregister: true,
  });

  const settingProfileTypeId = watch("settings.profileTypeId");

  const { data } = useQuery(DashboardEditDialog_profileTypeDocument, {
    variables: { profileTypeId: settingProfileTypeId },
    skip: isNullish(settingProfileTypeId),
    fetchPolicy: "no-cache",
  });

  const { data: petitionListViewsData } = useQuery(DashboardEditDialog_petitionListViewsDocument);

  const { data: profileListViewsData } = useQuery(DashboardEditDialog_profileListViewsDocument, {
    variables: { profileTypeId: settingProfileTypeId },
    skip: isNullish(settingProfileTypeId),
  });

  const profileTypeFields = data?.profileType?.fields ?? [];

  return (
    <Stack
      as="form"
      onSubmit={handleSubmit(async (data) => {
        let settings: any;
        const dataSettings = data.settings as any;
        if (type === "PROFILES_NUMBER_DASHBOARD_MODULE") {
          settings = {
            profileTypeId: dataSettings.profileTypeId,
            type: dataSettings.type,
            aggregate: dataSettings.aggregate,
            profileTypeFieldId: dataSettings.profileTypeFieldId,
            filter: omit(
              profileListViewsData!.me.profileListViews.find(
                (view) => view.id === dataSettings.filter,
              )?.data ?? {},
              ["search", "__typename"],
            ),
          } as ProfilesNumberDashboardModuleSettingsInput;
        } else if (type === "PROFILES_RATIO_DASHBOARD_MODULE") {
          settings = {
            profileTypeId: dataSettings.profileTypeId,
            type: dataSettings.type,
            aggregate: dataSettings.aggregate,
            profileTypeFieldId: dataSettings.profileTypeFieldId,
            graphicType: dataSettings.graphicType,
            filters: dataSettings.filters.map((id: string) =>
              omit(
                profileListViewsData!.me.profileListViews.find((view) => view.id === id)?.data ??
                  {},
                ["search", "__typename"],
              ),
            ),
          } as ProfilesRatioDashboardModuleSettingsInput;
        } else if (type === "PROFILES_CHART_DASHBOARD_MODULE") {
          settings = {
            profileTypeId: dataSettings.profileTypeId,
            type: dataSettings.type,
            aggregate: dataSettings.aggregate,
            profileTypeFieldId: dataSettings.profileTypeFieldId,
            graphicType: dataSettings.graphicType,
            items: dataSettings.items.map((item: any) => ({
              ...item,
              filter: omit(
                profileListViewsData!.me.profileListViews.find((view) => view.id === item.filter)
                  ?.data ?? {},
                ["search", "__typename"],
              ),
            })),
          } as ProfilesPieChartDashboardModuleSettingsInput;
        } else if (type === "PETITIONS_CHART_DASHBOARD_MODULE") {
          settings = {
            graphicType: dataSettings.graphicType,
            items: dataSettings.items.map((item: any) => {
              const data = petitionListViewsData!.me.petitionListViews.find(
                (view) => view.id === item.filter,
              )?.data ?? { __typename: "" };
              return {
                ...item,
                filter: omit(data, ["__typename"]),
              };
            }),
          } as PetitionsPieChartDashboardModuleSettingsInput;
        } else if (type === "PETITIONS_RATIO_DASHBOARD_MODULE") {
          settings = {
            graphicType: dataSettings.graphicType,
            filters: dataSettings.filters.map((id: string) =>
              omit(
                petitionListViewsData!.me.petitionListViews.find((view) => view.id === id)
                  ?.data ?? { __typename: "" },
                ["__typename"],
              ),
            ),
          } as PetitionsRatioDashboardModuleSettingsInput;
        } else if (type === "PETITION_BUTTON_DASHBOARD_MODULE") {
          settings = {
            buttonLabel: dataSettings.buttonLabel,
            templateId: dataSettings.templateId,
          } as CreatePetitionButtonDashboardModuleSettingsInput;
        } else if (type === "PETITIONS_NUMBER_DASHBOARD_MODULE") {
          settings = {
            filters: omit(
              petitionListViewsData!.me.petitionListViews.find(
                (view) => view.id === dataSettings.filters,
              )?.data ?? { __typename: "" },
              ["__typename"],
            ),
          } as PetitionsNumberDashboardModuleSettingsInput;
        }

        await createModule({
          variables: { dashboardId: dashboard.id, title: data.title, size: data.size, settings },
        });

        showToast({
          title: "Module added",
          status: "success",
        });
        onRefetch();
      })}
    >
      <FormControl id="type" isInvalid={!!errors.type} isRequired>
        <FormLabel>{untranslated("Type")}</FormLabel>
        <Select {...register("type", { required: true })}>
          {(types as [string, any][]).map(([type, _]) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl id="title" isInvalid={!!errors.title} isRequired>
        <FormLabel>{untranslated("Title")}</FormLabel>
        <Input {...register("title", { required: true })} />
      </FormControl>
      <FormControl id="size" isInvalid={!!errors.size} isRequired>
        <FormLabel>{untranslated("Size")}</FormLabel>
        <Select {...register("size", { required: true })}>
          {["LARGE", "MEDIUM", "SMALL"].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </FormControl>
      <>
        {type.includes("PROFILES") ? (
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{untranslated("Result Type")}</FormLabel>
              <Select {...register("settings.type", { required: true, shouldUnregister: true })}>
                <option value="COUNT">{untranslated("COUNT")}</option>
                <option value="AGGREGATE">{untranslated("AGGREGATE")}</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{untranslated("Profile Type ID")}</FormLabel>
              <Controller
                name="settings.profileTypeId"
                control={control}
                rules={{
                  required: true,
                }}
                shouldUnregister={true}
                render={({ field: { value, onChange } }) => (
                  <ProfileTypeSelect
                    defaultOptions
                    value={value}
                    onChange={(v) => onChange(v?.id ?? "")}
                  />
                )}
              />
            </FormControl>
            {isNonNullish(settingProfileTypeId) && watch("settings.type") === "AGGREGATE" && (
              <>
                <FormControl isRequired>
                  <FormLabel>{untranslated("Aggregate Function")}</FormLabel>
                  <Select
                    {...register("settings.aggregate", { required: true, shouldUnregister: true })}
                  >
                    <option value="AVG">{untranslated("AVG - Average")}</option>
                    <option value="MAX">{untranslated("MAX - Maximum")}</option>
                    <option value="MIN">{untranslated("MIN - Minimum")}</option>
                    <option value="SUM">{untranslated("SUM - Sum")}</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{untranslated("Field to Aggregate")}</FormLabel>

                  <Controller
                    name="settings.profileTypeFieldId"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <ProfileTypeFieldSelect
                        value={profileTypeFields.find((f) => f.id === value) as any}
                        fields={profileTypeFields}
                        onChange={(v) => onChange(v?.id)}
                      />
                    )}
                  />
                </FormControl>
              </>
            )}

            {type === "PROFILES_NUMBER_DASHBOARD_MODULE" ? (
              isNonNullish(settingProfileTypeId) && isNonNullish(profileListViewsData) ? (
                <FormControl isRequired>
                  <FormLabel>{untranslated("Filter")}</FormLabel>
                  <Select
                    {...register("settings.filter", { required: true, shouldUnregister: true })}
                  >
                    {profileListViewsData.me.profileListViews.map((view) => {
                      return (
                        <option key={view.id} value={view.id}>
                          {view.name}
                        </option>
                      );
                    })}
                  </Select>
                </FormControl>
              ) : null
            ) : null}

            {type === "PROFILES_RATIO_DASHBOARD_MODULE" ? (
              <>
                {isNonNullish(settingProfileTypeId) && isNonNullish(profileListViewsData) ? (
                  <FormControl isRequired>
                    <FormLabel>{untranslated("Filters (min. 2)")}</FormLabel>
                    <Stack spacing={3}>
                      {filtersFields.map((_, index) => (
                        <FormControl key={index} isRequired>
                          <Flex alignItems="end">
                            <Box flex="1">
                              <FormLabel>{untranslated(`Filter ${index + 1}`)}</FormLabel>
                              <Select {...register(`settings.filters.${index}`)}>
                                {profileListViewsData.me.profileListViews.map((view) => (
                                  <option key={view.id} value={view.id}>
                                    {view.name}
                                  </option>
                                ))}
                              </Select>
                            </Box>
                            <IconButton
                              ml={2}
                              icon={<DeleteIcon />}
                              aria-label=""
                              size="sm"
                              colorScheme="red"
                              onClick={() => removeFilter(index)}
                            />
                          </Flex>
                        </FormControl>
                      ))}
                      <Button
                        onClick={() =>
                          appendFilter(profileListViewsData.me.profileListViews[0].id as any)
                        }
                      >
                        {untranslated("Add Filter")}
                      </Button>
                    </Stack>
                  </FormControl>
                ) : null}
              </>
            ) : null}

            {type === "PROFILES_CHART_DASHBOARD_MODULE" ? (
              <>
                <FormControl isRequired>
                  <FormLabel>{untranslated("Chart Type")}</FormLabel>
                  <Select
                    {...register("settings.graphicType", {
                      required: true,
                      shouldUnregister: true,
                    })}
                  >
                    <option value="PIE">{untranslated("Pie")}</option>
                    <option value="DONUT">{untranslated("Donut")}</option>
                  </Select>
                </FormControl>

                {isNonNullish(settingProfileTypeId) && isNonNullish(profileListViewsData) ? (
                  <FormControl isRequired>
                    <FormLabel>{untranslated("Chart Items")}</FormLabel>
                    <Stack spacing={3}>
                      {fields.map((field, index) => (
                        <Stack key={field.id} spacing={2}>
                          <Flex justifyContent="space-between" alignItems="center">
                            <Text fontWeight="bold">{untranslated(`Item ${index + 1}`)}</Text>
                            <IconButton
                              icon={<DeleteIcon />}
                              aria-label=""
                              size="sm"
                              colorScheme="red"
                              onClick={() => remove(index)}
                            />
                          </Flex>
                          <FormControl isRequired>
                            <FormLabel>{untranslated("Label")}</FormLabel>
                            <Input {...register(`settings.items.${index}.label`)} />
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel>{untranslated("Color")}</FormLabel>
                            <Input type="color" {...register(`settings.items.${index}.color`)} />
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel>{untranslated("Filter")}</FormLabel>
                            <Select {...register(`settings.items.${index}.filter`)}>
                              {profileListViewsData.me.profileListViews.map((view) => (
                                <option key={view.id} value={view.id}>
                                  {view.name}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      ))}
                      <Button
                        onClick={() =>
                          append({
                            label: "",
                            color: "#000000",
                            filter: profileListViewsData.me.profileListViews[0].id as any,
                          })
                        }
                      >
                        {untranslated("Add Item")}
                      </Button>
                    </Stack>
                  </FormControl>
                ) : null}
              </>
            ) : null}
          </Stack>
        ) : null}

        {type === "PETITIONS_NUMBER_DASHBOARD_MODULE" ? (
          <FormControl isRequired>
            <FormLabel>{untranslated("Filter")}</FormLabel>
            {isNonNullish(petitionListViewsData) ? (
              <Select {...register("settings.filter", { required: true, shouldUnregister: true })}>
                {petitionListViewsData.me.petitionListViews.map((view) => {
                  return (
                    <option key={view.id} value={view.id}>
                      {view.name}
                    </option>
                  );
                })}
              </Select>
            ) : null}
          </FormControl>
        ) : null}

        {type === "PETITIONS_CHART_DASHBOARD_MODULE" ? (
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{untranslated("Chart Type")}</FormLabel>
              <Select
                {...register("settings.graphicType", { required: true, shouldUnregister: true })}
              >
                <option value="PIE">{untranslated("Pie")}</option>
                <option value="DONUT">{untranslated("Donut")}</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{untranslated("Chart Items")}</FormLabel>

              <Stack spacing={3}>
                {fields.map((field, index) => (
                  <Stack key={field.id} spacing={2}>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold">{untranslated(`Item ${index + 1}`)}</Text>
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label=""
                        size="sm"
                        colorScheme="red"
                        onClick={() => remove(index)}
                      />
                    </Flex>
                    <FormControl isRequired>
                      <FormLabel>{untranslated("Label")}</FormLabel>
                      <Input {...register(`settings.items.${index}.label`)} />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>{untranslated("Color")}</FormLabel>
                      <Input type="color" {...register(`settings.items.${index}.color`)} />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>{untranslated("Filter")}</FormLabel>
                      <Select {...register(`settings.items.${index}.filter`)}>
                        {isNonNullish(petitionListViewsData)
                          ? petitionListViewsData.me.petitionListViews.map((view) => {
                              return (
                                <option key={view.id} value={view.id}>
                                  {view.name}
                                </option>
                              );
                            })
                          : null}
                      </Select>
                    </FormControl>
                  </Stack>
                ))}
                <Button
                  isDisabled={isNullish(petitionListViewsData)}
                  onClick={() =>
                    append({
                      label: "",
                      color: "#000000",
                      filter: petitionListViewsData!.me.petitionListViews[0].id as any,
                    })
                  }
                >
                  {untranslated("Add Item")}
                </Button>
              </Stack>
            </FormControl>
          </Stack>
        ) : null}

        {type === "PETITIONS_RATIO_DASHBOARD_MODULE" ? (
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{untranslated("Graphic Type")}</FormLabel>
              <Select
                {...register("settings.graphicType", { required: true, shouldUnregister: true })}
              >
                <option value="PERCENTAGE">{untranslated("Percentage")}</option>
                <option value="RATIO">{untranslated("Ratio")}</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{untranslated("Filters (min. 2)")}</FormLabel>
              <Stack spacing={3}>
                {filtersFields.map((_, index) => (
                  <FormControl key={index} isRequired>
                    <Flex alignItems="end">
                      <Box flex="1">
                        <FormLabel>{untranslated(`Filter ${index + 1}`)}</FormLabel>
                        {isNonNullish(petitionListViewsData) ? (
                          <Select {...register(`settings.filters.${index}`)}>
                            {petitionListViewsData.me.petitionListViews.map((view) => {
                              return (
                                <option key={view.id} value={view.id}>
                                  {view.name}
                                </option>
                              );
                            })}
                          </Select>
                        ) : null}
                      </Box>
                      <IconButton
                        ml={2}
                        icon={<DeleteIcon />}
                        aria-label=""
                        size="sm"
                        colorScheme="red"
                        onClick={() => removeFilter(index)}
                      />
                    </Flex>
                  </FormControl>
                ))}
                <Button
                  isDisabled={isNullish(petitionListViewsData)}
                  onClick={() =>
                    appendFilter(petitionListViewsData!.me.petitionListViews[0].id as any)
                  }
                >
                  {untranslated("Add Filter")}
                </Button>
              </Stack>
            </FormControl>
          </Stack>
        ) : null}

        {type === "PETITION_BUTTON_DASHBOARD_MODULE" ? (
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{untranslated("Button Label")}</FormLabel>
              <Input
                {...register("settings.buttonLabel", { required: true, shouldUnregister: true })}
                placeholder={untranslated("Enter button text")}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{untranslated("Template ID")}</FormLabel>

              <Controller
                name="settings.templateId"
                control={control}
                rules={{ required: true }}
                shouldUnregister={true}
                render={({ field: { value, onChange } }) => (
                  <PetitionSelect
                    defaultOptions
                    type="TEMPLATE"
                    value={value ?? ""}
                    excludePublicTemplates
                    onChange={(v) => {
                      onChange(v?.id);
                    }}
                  />
                )}
              />
            </FormControl>
          </Stack>
        ) : null}
      </>

      <Button marginTop={10} colorScheme="primary" type="submit">
        {untranslated("Add Module")}
      </Button>
    </Stack>
  );
}
