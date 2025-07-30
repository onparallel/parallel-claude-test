import { gql, useMutation } from "@apollo/client";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Icon,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { ArrowBackIcon, PaperPlaneIcon, ProfilesIcon, SettingsIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import {
  CreatePetitionButtonDashboardModuleSettingsInput,
  DashboardModuleDrawer_createCreatePetitionButtonDashboardModuleDocument,
  DashboardModuleDrawer_createPetitionsNumberDashboardModuleDocument,
  DashboardModuleDrawer_createPetitionsPieChartDashboardModuleDocument,
  DashboardModuleDrawer_createPetitionsRatioDashboardModuleDocument,
  DashboardModuleDrawer_createProfilesNumberDashboardModuleDocument,
  DashboardModuleDrawer_createProfilesPieChartDashboardModuleDocument,
  DashboardModuleDrawer_createProfilesRatioDashboardModuleDocument,
  DashboardModuleDrawer_DashboardModuleFragment,
  DashboardModuleDrawer_updateCreatePetitionButtonDashboardModuleDocument,
  DashboardModuleDrawer_updatePetitionsNumberDashboardModuleDocument,
  DashboardModuleDrawer_updatePetitionsPieChartDashboardModuleDocument,
  DashboardModuleDrawer_updatePetitionsRatioDashboardModuleDocument,
  DashboardModuleDrawer_updateProfilesNumberDashboardModuleDocument,
  DashboardModuleDrawer_updateProfilesPieChartDashboardModuleDocument,
  DashboardModuleDrawer_updateProfilesRatioDashboardModuleDocument,
  DashboardModuleSize,
  DashboardPieChartModuleSettingsType,
  DashboardRatioModuleSettingsType,
  ModuleResultAggregateType,
  PetitionFilter,
  PetitionsNumberDashboardModuleSettingsInput,
  PetitionsPieChartDashboardModuleSettingsInput,
  PetitionsPieChartDashboardModuleSettingsItemInput,
  PetitionsRatioDashboardModuleSettingsInput,
  ProfilesNumberDashboardModuleSettingsInput,
  ProfilesPieChartDashboardModuleSettingsInput,
  ProfilesRatioDashboardModuleSettingsInput,
} from "@parallel/graphql/__types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { RefObject, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNull, isNonNullish, isNullish } from "remeda";
import { DashboardModuleTypeCard } from "./components/DashboardModuleTypeCard";
import { DashboardModuleForm, minSizeByCategory } from "./DashboardModuleForm";
import { useParallelModules } from "./hooks/useParallelModules";
import { useProfileModules } from "./hooks/useProfileModules";
import {
  filterEmptyFilters,
  fullDashboardModuleProfileFilter,
  getDefaultFilters,
  getDefaultValuesFromModule,
} from "./utils/moduleUtils";

interface DashboardModuleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  finalFocusRef: RefObject<HTMLElement>;
  dashboardId: string;
  module: DashboardModuleDrawer_DashboardModuleFragment | null;
}

export type ModuleType =
  | "DashboardProfilesNumberModule"
  | "DashboardProfilesRatioModule"
  | "DashboardProfilesPieChartModule"
  | "DashboardPetitionsNumberModule"
  | "DashboardPetitionsRatioModule"
  | "DashboardPetitionsPieChartModule"
  | "DashboardCreatePetitionButtonModule";

export type ModuleCategory = "NUMBER" | "RATIO" | "CHART" | "BUTTON";
export type ChartItem = {
  label: string;
  filters: Record<string, any>[];
  color: string;
};

export interface ModuleDefinition {
  id: string | null;
  name: string;
  type: ModuleType;
  category: ModuleCategory;
  tabTitle: string;
}

export interface DashboardModuleDrawerFormData {
  name: string | null;
  selectedModule: ModuleDefinition | null;
  size: DashboardModuleSize;
  settings: {
    buttonLabel?: string;
    templateId?: string;
    items?: ChartItem[];
    profileTypeId?: string;
    profileTypeFieldId?: string;
    type?: ModuleResultAggregateType | "COUNT" | null;
    ratioGraphicType?: DashboardRatioModuleSettingsType;
    chartGraphicType?: DashboardPieChartModuleSettingsType;
    groupByProfileTypeFieldId?: string;
    filters?: Record<string, any>[];
  };
}

export function DashboardModuleDrawer({
  isOpen,
  onClose,
  finalFocusRef,
  dashboardId,
  module,
}: DashboardModuleDrawerProps) {
  const intl = useIntl();
  const [tabIndex, setTabIndex] = useState(0);

  const parallelModules = useParallelModules();
  const profileModules = useProfileModules();

  const showGenericErrorToast = useGenericErrorToast();

  const tabs = useMemo(
    () => [
      {
        id: "parallels",
        title: intl.formatMessage({ id: "generic.root-petitions", defaultMessage: "Parallels" }),
        modules: parallelModules,
        icon: PaperPlaneIcon,
      },
      {
        id: "profiles",
        title: intl.formatMessage({ id: "generic.profiles", defaultMessage: "Profiles" }),
        modules: profileModules,
        icon: ProfilesIcon,
      },
    ],
    [intl.locale],
  );

  const defaultValues = useMemo(() => getDefaultValuesFromModule(module, tabs), [module, tabs]);

  const form = useForm<DashboardModuleDrawerFormData>({
    mode: "onSubmit",
    defaultValues,
  });

  const { handleSubmit, watch, reset, setValue } = form;

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, setValue, reset]);

  const selectedModule = watch("selectedModule");

  const handleCancel = () => {
    reset(getDefaultValuesFromModule(null, tabs));
    if (selectedModule?.id) {
      onClose();
    }
  };

  const handleClose = () => {
    reset(getDefaultValuesFromModule(null, tabs));
    onClose();
  };

  const [createProfilesNumberDashboardModule] = useMutation(
    DashboardModuleDrawer_createProfilesNumberDashboardModuleDocument,
  );
  const [updateProfilesNumberDashboardModule] = useMutation(
    DashboardModuleDrawer_updateProfilesNumberDashboardModuleDocument,
  );

  const [createProfilesRatioDashboardModule] = useMutation(
    DashboardModuleDrawer_createProfilesRatioDashboardModuleDocument,
  );
  const [updateProfilesRatioDashboardModule] = useMutation(
    DashboardModuleDrawer_updateProfilesRatioDashboardModuleDocument,
  );

  const [createProfilesChartDashboardModule] = useMutation(
    DashboardModuleDrawer_createProfilesPieChartDashboardModuleDocument,
  );
  const [updateProfilesChartDashboardModule] = useMutation(
    DashboardModuleDrawer_updateProfilesPieChartDashboardModuleDocument,
  );

  const [createCreatePetitionButtonDashboardModule] = useMutation(
    DashboardModuleDrawer_createCreatePetitionButtonDashboardModuleDocument,
  );
  const [updateCreatePetitionButtonDashboardModule] = useMutation(
    DashboardModuleDrawer_updateCreatePetitionButtonDashboardModuleDocument,
  );

  const [createPetitionsNumberDashboardModule] = useMutation(
    DashboardModuleDrawer_createPetitionsNumberDashboardModuleDocument,
  );
  const [updatePetitionsNumberDashboardModule] = useMutation(
    DashboardModuleDrawer_updatePetitionsNumberDashboardModuleDocument,
  );

  const [createPetitionsRatioDashboardModule] = useMutation(
    DashboardModuleDrawer_createPetitionsRatioDashboardModuleDocument,
  );
  const [updatePetitionsRatioDashboardModule] = useMutation(
    DashboardModuleDrawer_updatePetitionsRatioDashboardModuleDocument,
  );

  const [createPetitionsChartDashboardModule] = useMutation(
    DashboardModuleDrawer_createPetitionsPieChartDashboardModuleDocument,
  );
  const [updatePetitionsChartDashboardModule] = useMutation(
    DashboardModuleDrawer_updatePetitionsPieChartDashboardModuleDocument,
  );

  type CreateMutationFn = (options: {
    variables: {
      dashboardId: string;
      title?: string | null;
      size: DashboardModuleSize;
      settings: any;
    };
  }) => Promise<any>;

  type UpdateMutationFn = (options: {
    variables: {
      dashboardId: string;
      moduleId: string;
      data: {
        title?: string | null;
        size?: DashboardModuleSize;
        settings?: any;
      };
    };
  }) => Promise<any>;

  const executeDashboardModuleMutation = async (
    createMutation: CreateMutationFn,
    updateMutation: UpdateMutationFn,
    data: DashboardModuleDrawerFormData,
    prepareSettings: (data: DashboardModuleDrawerFormData) => any,
  ): Promise<any> => {
    const isUpdate = isNonNullish(data.selectedModule?.id);
    const settings = prepareSettings(data);

    if (isUpdate) {
      return await updateMutation({
        variables: {
          dashboardId,
          moduleId: data.selectedModule!.id!,
          data: {
            title: data.name,
            size: data.size,
            settings,
          },
        },
      });
    } else {
      return await createMutation({
        variables: {
          dashboardId,
          title: data.name,
          size: data.size,
          settings,
        },
      });
    }
  };

  const prepareProfilesNumberSettings = (
    data: DashboardModuleDrawerFormData,
  ): ProfilesNumberDashboardModuleSettingsInput => ({
    profileTypeId: data.settings.profileTypeId!,
    filter: filterEmptyFilters(data.settings.filters)[0],
    type: data.settings.type === "COUNT" ? "COUNT" : "AGGREGATE",
    profileTypeFieldId: data.settings.type === "COUNT" ? null : data.settings.profileTypeFieldId,
    aggregate: data.settings.type === "COUNT" ? null : data.settings.type,
  });

  const prepareProfilesRatioSettings = (
    data: DashboardModuleDrawerFormData,
  ): ProfilesRatioDashboardModuleSettingsInput => ({
    profileTypeId: data.settings.profileTypeId!,
    profileTypeFieldId: data.settings.type === "COUNT" ? null : data.settings.profileTypeFieldId,
    filters: filterEmptyFilters(data.settings.filters),
    graphicType: data.settings.ratioGraphicType!,
    type: data.settings.type === "COUNT" ? "COUNT" : "AGGREGATE",
    aggregate: data.settings.type === "COUNT" ? null : data.settings.type,
  });

  const prepareProfilesChartSettings = (
    data: DashboardModuleDrawerFormData,
  ): ProfilesPieChartDashboardModuleSettingsInput => ({
    profileTypeId: data.settings.profileTypeId!,
    profileTypeFieldId: data.settings.type === "COUNT" ? null : data.settings.profileTypeFieldId,
    items:
      data.settings.items?.map((item) => ({
        color: item.color,
        filter: filterEmptyFilters(item.filters)[0],
        label: item.label,
      })) ?? [],
    graphicType: data.settings.chartGraphicType!,
    type: data.settings.type === "COUNT" ? "COUNT" : "AGGREGATE",
    aggregate: data.settings.type === "COUNT" ? null : data.settings.type,
    groupByFilter: data.settings.groupByProfileTypeFieldId
      ? filterEmptyFilters(data.settings.filters)[0]
      : undefined,
    groupByProfileTypeFieldId: data.settings.groupByProfileTypeFieldId,
  });

  const preparePetitionButtonSettings = (
    data: DashboardModuleDrawerFormData,
  ): CreatePetitionButtonDashboardModuleSettingsInput => ({
    buttonLabel: data.settings.buttonLabel!,
    templateId: data.settings.templateId!,
  });

  const preparePetitionsNumberSettings = (
    data: DashboardModuleDrawerFormData,
  ): PetitionsNumberDashboardModuleSettingsInput => ({
    filters: filterEmptyFilters(data.settings.filters)[0] as PetitionFilter,
  });

  const preparePetitionsRatioSettings = (
    data: DashboardModuleDrawerFormData,
  ): PetitionsRatioDashboardModuleSettingsInput => ({
    filters: filterEmptyFilters(data.settings.filters) as PetitionFilter[],
    graphicType: data.settings.ratioGraphicType!,
  });

  const preparePetitionsChartSettings = (
    data: DashboardModuleDrawerFormData,
  ): PetitionsPieChartDashboardModuleSettingsInput => ({
    items:
      data.settings.items?.map<PetitionsPieChartDashboardModuleSettingsItemInput>((item) => ({
        color: item.color,
        filter: filterEmptyFilters(item.filters)[0],
        label: item.label,
      })) ?? [],
    graphicType: data.settings.chartGraphicType!,
  });

  const handleProfilesNumberDashboardModule = (data: DashboardModuleDrawerFormData) => {
    return executeDashboardModuleMutation(
      createProfilesNumberDashboardModule,
      updateProfilesNumberDashboardModule,
      data,
      prepareProfilesNumberSettings,
    );
  };

  const handleProfilesRatioDashboardModule = (data: DashboardModuleDrawerFormData) => {
    return executeDashboardModuleMutation(
      createProfilesRatioDashboardModule,
      updateProfilesRatioDashboardModule,
      data,
      prepareProfilesRatioSettings,
    );
  };

  const handleProfilesPieChartDashboardModule = (data: DashboardModuleDrawerFormData) => {
    return executeDashboardModuleMutation(
      createProfilesChartDashboardModule,
      updateProfilesChartDashboardModule,
      data,
      prepareProfilesChartSettings,
    );
  };

  const handleCreatePetitionButtonDashboardModule = (data: DashboardModuleDrawerFormData) => {
    return executeDashboardModuleMutation(
      createCreatePetitionButtonDashboardModule,
      updateCreatePetitionButtonDashboardModule,
      data,
      preparePetitionButtonSettings,
    );
  };

  const handlePetitionsNumberDashboardModule = (data: DashboardModuleDrawerFormData) => {
    return executeDashboardModuleMutation(
      createPetitionsNumberDashboardModule,
      updatePetitionsNumberDashboardModule,
      data,
      preparePetitionsNumberSettings,
    );
  };

  const handlePetitionsRatioDashboardModule = (data: DashboardModuleDrawerFormData) => {
    return executeDashboardModuleMutation(
      createPetitionsRatioDashboardModule,
      updatePetitionsRatioDashboardModule,
      data,
      preparePetitionsRatioSettings,
    );
  };

  const handlePetitionsPieChartDashboardModule = (data: DashboardModuleDrawerFormData) => {
    return executeDashboardModuleMutation(
      createPetitionsChartDashboardModule,
      updatePetitionsChartDashboardModule,
      data,
      preparePetitionsChartSettings,
    );
  };

  const moduleHandlers: Record<ModuleType, (data: DashboardModuleDrawerFormData) => Promise<any>> =
    {
      DashboardProfilesNumberModule: handleProfilesNumberDashboardModule,
      DashboardProfilesRatioModule: handleProfilesRatioDashboardModule,
      DashboardProfilesPieChartModule: handleProfilesPieChartDashboardModule,
      DashboardCreatePetitionButtonModule: handleCreatePetitionButtonDashboardModule,
      DashboardPetitionsNumberModule: handlePetitionsNumberDashboardModule,
      DashboardPetitionsRatioModule: handlePetitionsRatioDashboardModule,
      DashboardPetitionsPieChartModule: handlePetitionsPieChartDashboardModule,
    };

  const handleCreateModule = () => {
    handleSubmit(async (data) => {
      try {
        const moduleType = data.selectedModule?.type;
        if (moduleType && moduleType in moduleHandlers) {
          await moduleHandlers[moduleType](data);
        }

        handleClose();
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error(e);
        }
        showGenericErrorToast(e);
      }
    })();
  };

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      finalFocusRef={finalFocusRef}
      size="sm"
      closeOnOverlayClick={false}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton top={selectedModule ? 5 : 4} onClick={handleClose} />
        <DrawerHeader
          paddingX={4}
          paddingY={selectedModule ? 3 : 4}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          {selectedModule ? (
            <HStack>
              {isNullish(selectedModule.id) ? (
                <IconButtonWithTooltip
                  variant="ghost"
                  size="sm"
                  icon={<ArrowBackIcon boxSize={4} />}
                  label={intl.formatMessage({ id: "generic.go-back", defaultMessage: "Go back" })}
                  onClick={handleCancel}
                />
              ) : (
                <SettingsIcon marginEnd={2} />
              )}
              <Stack spacing={0}>
                <Text as="span">{selectedModule.name}</Text>
                <Text as="span" color="gray.500" fontSize="sm" fontWeight={500}>
                  {selectedModule.tabTitle}
                </Text>
              </Stack>
            </HStack>
          ) : (
            <FormattedMessage id="page.home.add-module" defaultMessage="Add module" />
          )}
        </DrawerHeader>
        <DrawerBody padding={0} overflow="hidden">
          <FormProvider {...form}>
            {isNonNull(selectedModule) ? (
              <DashboardModuleForm />
            ) : (
              <Tabs index={tabIndex} onChange={setTabIndex} {...extendFlexColumn} height="100%">
                <TabList>
                  {tabs.map((tab, index) => {
                    return (
                      <Tab paddingY={3} key={index}>
                        <Stack align="center" spacing={1}>
                          <Icon as={tab.icon} boxSize={5} />
                          <Text textTransform="uppercase" fontSize="xs" fontWeight={500}>
                            {tab.title}
                          </Text>
                        </Stack>
                      </Tab>
                    );
                  })}
                </TabList>

                <TabPanels {...extendFlexColumn}>
                  {tabs.map((tab, index) => {
                    return (
                      <TabPanel
                        key={index}
                        as={ScrollShadows}
                        {...extendFlexColumn}
                        overflow="auto"
                      >
                        <Stack spacing={3}>
                          {tab.modules.map((module) => {
                            return (
                              <DashboardModuleTypeCard
                                key={module.type}
                                onAdd={() => {
                                  setValue("selectedModule", {
                                    id: null,
                                    ...module,
                                    tabTitle: tab.title,
                                  } as any);
                                  setValue("size", minSizeByCategory[module.category]);
                                  setValue("settings.filters", getDefaultFilters(module.type));
                                }}
                                module={module}
                              />
                            );
                          })}
                        </Stack>
                      </TabPanel>
                    );
                  })}
                </TabPanels>
              </Tabs>
            )}
          </FormProvider>
        </DrawerBody>
        {isNonNull(selectedModule) ? (
          <DrawerFooter justifyContent="start">
            <Button variant="outline" onClick={handleCancel} marginEnd={2}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
            <Button colorScheme="primary" onClick={handleCreateModule}>
              <FormattedMessage id="generic.save" defaultMessage="Save" />
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

DashboardModuleDrawer.fragments = {
  get DashboardModulePetitionFilter() {
    return gql`
      fragment DashboardModuleDrawer_DashboardModulePetitionFilter on DashboardModulePetitionFilter {
        approvals {
          filters {
            value
            operator
          }
          operator
        }
        fromTemplateId
        sharedWith {
          filters {
            value
            operator
          }
          operator
        }
        signature
        status
        tags {
          operator
          filters {
            value
            operator
          }
        }
      }
    `;
  },
  get DashboardModule() {
    return gql`
      fragment DashboardModuleDrawer_DashboardModule on DashboardModule {
        id
        size
        title
        ... on DashboardProfilesNumberModule {
          profilesNumberSettings: settings {
            type
            profileTypeId
            profileTypeFieldId
            aggregate
            filters {
              ...fullDashboardModuleProfileFilter
            }
          }
        }
        ... on DashboardPetitionsRatioModule {
          petitionsRatioSettings: settings {
            graphicType
            filters {
              ...DashboardModuleDrawer_DashboardModulePetitionFilter
            }
          }
        }
        ... on DashboardProfilesRatioModule {
          profilesRatioSettings: settings {
            type
            graphicType
            profileTypeId
            profileTypeFieldId
            aggregate
            filters {
              ...fullDashboardModuleProfileFilter
            }
          }
        }
        ... on DashboardPetitionsPieChartModule {
          petitionsPieChartSettings: settings {
            graphicType
            items {
              filter {
                ...DashboardModuleDrawer_DashboardModulePetitionFilter
              }
              color
              label
            }
          }
        }
        ... on DashboardProfilesPieChartModule {
          profilesPieChartSettings: settings {
            type
            graphicType
            profileTypeId
            profileTypeFieldId
            groupByProfileTypeFieldId
            aggregate
            items {
              filter {
                ...fullDashboardModuleProfileFilter
              }
              color
              label
            }
            groupByFilter {
              ...fullDashboardModuleProfileFilter
            }
          }
        }
        ... on DashboardCreatePetitionButtonModule {
          createPetitionButtonSettings: settings {
            template {
              id
            }
            label
          }
        }
        ... on DashboardPetitionsNumberModule {
          petitionsNumberSettings: settings {
            filters {
              ...DashboardModuleDrawer_DashboardModulePetitionFilter
            }
          }
        }
      }
      ${this.DashboardModulePetitionFilter}
      ${fullDashboardModuleProfileFilter}
    `;
  },
};

const _mutations = [
  gql`
    mutation DashboardModuleDrawer_createCreatePetitionButtonDashboardModule(
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
    mutation DashboardModuleDrawer_createPetitionsNumberDashboardModule(
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
    mutation DashboardModuleDrawer_createPetitionsRatioDashboardModule(
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
    mutation DashboardModuleDrawer_createPetitionsPieChartDashboardModule(
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
    mutation DashboardModuleDrawer_createProfilesNumberDashboardModule(
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
    mutation DashboardModuleDrawer_createProfilesPieChartDashboardModule(
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
    mutation DashboardModuleDrawer_createProfilesRatioDashboardModule(
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
    mutation DashboardModuleDrawer_updateProfilesRatioDashboardModule(
      $dashboardId: GID!
      $moduleId: GID!
      $data: UpdateProfilesRatioDashboardModuleInput!
    ) {
      updateProfilesRatioDashboardModule(
        dashboardId: $dashboardId
        moduleId: $moduleId
        data: $data
      ) {
        id
        ...DashboardModuleDrawer_DashboardModule
      }
    }
    ${DashboardModuleDrawer.fragments.DashboardModule}
  `,
  gql`
    mutation DashboardModuleDrawer_updateProfilesPieChartDashboardModule(
      $dashboardId: GID!
      $moduleId: GID!
      $data: UpdateProfilesPieChartDashboardModuleInput!
    ) {
      updateProfilesPieChartDashboardModule(
        dashboardId: $dashboardId
        moduleId: $moduleId
        data: $data
      ) {
        id
        ...DashboardModuleDrawer_DashboardModule
      }
    }
    ${DashboardModuleDrawer.fragments.DashboardModule}
  `,
  gql`
    mutation DashboardModuleDrawer_updateProfilesNumberDashboardModule(
      $dashboardId: GID!
      $moduleId: GID!
      $data: UpdateProfilesNumberDashboardModuleInput!
    ) {
      updateProfilesNumberDashboardModule(
        dashboardId: $dashboardId
        moduleId: $moduleId
        data: $data
      ) {
        id
        ...DashboardModuleDrawer_DashboardModule
      }
    }
    ${DashboardModuleDrawer.fragments.DashboardModule}
  `,
  gql`
    mutation DashboardModuleDrawer_updatePetitionsPieChartDashboardModule(
      $dashboardId: GID!
      $moduleId: GID!
      $data: UpdatePetitionsPieChartDashboardModuleInput!
    ) {
      updatePetitionsPieChartDashboardModule(
        dashboardId: $dashboardId
        moduleId: $moduleId
        data: $data
      ) {
        id
        ...DashboardModuleDrawer_DashboardModule
      }
    }
    ${DashboardModuleDrawer.fragments.DashboardModule}
  `,
  gql`
    mutation DashboardModuleDrawer_updatePetitionsRatioDashboardModule(
      $dashboardId: GID!
      $moduleId: GID!
      $data: UpdatePetitionsRatioDashboardModuleInput!
    ) {
      updatePetitionsRatioDashboardModule(
        dashboardId: $dashboardId
        moduleId: $moduleId
        data: $data
      ) {
        id
        ...DashboardModuleDrawer_DashboardModule
      }
    }
    ${DashboardModuleDrawer.fragments.DashboardModule}
  `,
  gql`
    mutation DashboardModuleDrawer_updateCreatePetitionButtonDashboardModule(
      $dashboardId: GID!
      $moduleId: GID!
      $data: UpdateCreatePetitionButtonDashboardModuleInput!
    ) {
      updateCreatePetitionButtonDashboardModule(
        dashboardId: $dashboardId
        moduleId: $moduleId
        data: $data
      ) {
        id
        ...DashboardModuleDrawer_DashboardModule
      }
    }
    ${DashboardModuleDrawer.fragments.DashboardModule}
  `,
  gql`
    mutation DashboardModuleDrawer_updatePetitionsNumberDashboardModule(
      $dashboardId: GID!
      $moduleId: GID!
      $data: UpdatePetitionsNumberDashboardModuleInput!
    ) {
      updatePetitionsNumberDashboardModule(
        dashboardId: $dashboardId
        moduleId: $moduleId
        data: $data
      ) {
        id
        ...DashboardModuleDrawer_DashboardModule
      }
    }
    ${DashboardModuleDrawer.fragments.DashboardModule}
  `,
];
