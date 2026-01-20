import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import {
  Box,
  Button,
  DrawerBody,
  DrawerFooter,
  FormControl,
  FormErrorMessage,
  Grid,
  GridItem,
  HStack,
  Input,
  Stack,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import {
  DashboardModuleForm_createCreatePetitionButtonDashboardModuleDocument,
  DashboardModuleForm_createPetitionsNumberDashboardModuleDocument,
  DashboardModuleForm_createPetitionsPieChartDashboardModuleDocument,
  DashboardModuleForm_createPetitionsRatioDashboardModuleDocument,
  DashboardModuleForm_createProfilesNumberDashboardModuleDocument,
  DashboardModuleForm_createProfilesPieChartDashboardModuleDocument,
  DashboardModuleForm_createProfilesRatioDashboardModuleDocument,
  DashboardModuleForm_DashboardModuleFragment,
  DashboardModuleForm_updateCreatePetitionButtonDashboardModuleDocument,
  DashboardModuleForm_updatePetitionsNumberDashboardModuleDocument,
  DashboardModuleForm_updatePetitionsPieChartDashboardModuleDocument,
  DashboardModuleForm_updatePetitionsRatioDashboardModuleDocument,
  DashboardModuleForm_updateProfilesNumberDashboardModuleDocument,
  DashboardModuleForm_updateProfilesPieChartDashboardModuleDocument,
  DashboardModuleForm_updateProfilesRatioDashboardModuleDocument,
  DashboardModuleSize,
  DashboardPieChartModuleSettingsType,
  DashboardRatioModuleSettingsType,
  fullDashboardModulePetitionFilterFragment,
  ModuleResultAggregateType,
} from "@parallel/graphql/__types";
import { removeTypenames, WithoutTypenames } from "@parallel/utils/apollo/removeTypenames";
import { never } from "@parallel/utils/never";
import { ProfileFieldValuesFilterGroup } from "@parallel/utils/ProfileFieldValuesFilter";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { DashboardModuleFormLabel } from "./components/DashboardModuleFormLabel";
import { ModuleSettingsRadioButton } from "./components/ModuleSettingsRadioButton";
import { DashboardModuleType } from "./hooks/useDashboardModules";
import { DashboardModulePetitionForm } from "./modules/petitions/DashboardModulePetitionForm";
import { DashboardModuleProfileForm } from "./modules/profiles/DashboardModuleProfileForm";
import {
  defaultDashboardModulePetitionFilter,
  defaultDashboardModuleProfileFilter,
} from "./utils/moduleUtils";

export interface DashboardModuleFormData {
  name: string | null;
  size: DashboardModuleSize;
  settings: {
    buttonLabel?: string;
    templateId?: string | null;
    items?: {
      label: string;
      filters: Record<string, any>[];
      color: string;
    }[];
    profileTypeId?: string | null;
    profileTypeFieldId?: string | null;
    type?: ModuleResultAggregateType | "COUNT" | null;
    ratioGraphicType?: DashboardRatioModuleSettingsType;
    chartGraphicType?: DashboardPieChartModuleSettingsType;
    groupByProfileTypeFieldId?: string | null;
    groupByFilter?: Record<string, any>;
    filters?: Record<string, any>[];
  };
}

export const MODULE_SIZE_LIMITS = {
  DashboardPetitionsNumberModule: ["SMALL", "MEDIUM"],
  DashboardPetitionsRatioModule: ["SMALL", "MEDIUM"],
  DashboardPetitionsPieChartModule: ["MEDIUM", "LARGE"],
  DashboardCreatePetitionButtonModule: ["SMALL", "MEDIUM"],
  DashboardProfilesNumberModule: ["SMALL", "MEDIUM"],
  DashboardProfilesRatioModule: ["SMALL", "MEDIUM"],
  DashboardProfilesPieChartModule: ["MEDIUM", "LARGE"],
} as Record<DashboardModuleType, [DashboardModuleSize, DashboardModuleSize]>;

export function DashboardModuleForm({
  module,
  onBack,
  onClose,
  moduleType,
  dashboardId,
}: {
  module: DashboardModuleForm_DashboardModuleFragment | null;
  onBack: () => void;
  onClose: () => void;
  moduleType: DashboardModuleType;
  dashboardId: string;
}) {
  assert(isNonNullish(module) || isNonNullish(moduleType));
  const intl = useIntl();
  const form = useForm<DashboardModuleFormData>({
    defaultValues: {
      name: module?.title ?? "",
      size: (module?.size as DashboardModuleSize) ?? MODULE_SIZE_LIMITS[moduleType][0],
      settings: getDefaultDashboardModuleFormDataSettings(moduleType, module),
    },
  });
  const {
    control,
    register,
    formState: { errors },
    handleSubmit,
  } = form;

  const isUpdating = isNonNullish(module);

  const apollo = useApolloClient();
  return (
    <Box
      as="form"
      onSubmit={handleSubmit(async (formData) => {
        const data = {
          title: formData.name!,
          size: formData.size,
          settings: {} as any,
        };
        switch (moduleType) {
          case "DashboardProfilesNumberModule":
          case "DashboardProfilesRatioModule":
          case "DashboardProfilesPieChartModule":
            data.settings.profileTypeId = formData.settings.profileTypeId!;
            if (formData.settings.type === "COUNT") {
              data.settings.type = "COUNT";
            } else {
              data.settings.type = "AGGREGATE";
              data.settings.aggregate = formData.settings.type!;
              data.settings.profileTypeFieldId = formData.settings.profileTypeFieldId!;
            }
            switch (moduleType) {
              case "DashboardProfilesNumberModule":
                data.settings.filter = prepareDashboardModuleProfileFilter(
                  formData.settings.filters![0] as any,
                );
                break;
              case "DashboardProfilesRatioModule":
                data.settings.filters = formData.settings.filters!.map((f) =>
                  prepareDashboardModuleProfileFilter(f as any),
                );
                data.settings.graphicType = formData.settings.ratioGraphicType!;
                break;
              case "DashboardProfilesPieChartModule":
                data.settings.graphicType = formData.settings.chartGraphicType!;
                if (isNonNullish(formData.settings.groupByProfileTypeFieldId)) {
                  data.settings.groupByFilter = prepareDashboardModuleProfileFilter(
                    formData.settings.groupByFilter as any,
                  );
                  data.settings.groupByProfileTypeFieldId =
                    formData.settings.groupByProfileTypeFieldId!;
                  data.settings.items = [];
                } else {
                  data.settings.items = formData.settings.items!.map((item) => ({
                    color: item.color,
                    label: item.label,
                    filter: prepareDashboardModuleProfileFilter(item.filters![0] as any),
                  }));
                }
                break;
            }
            break;
          case "DashboardPetitionsNumberModule":
            data.settings.filters = prepareDashboardModulePetitionFilter(
              formData.settings.filters![0],
            );
            break;
          case "DashboardPetitionsRatioModule":
            data.settings.filters = formData.settings.filters!.map((f) =>
              prepareDashboardModulePetitionFilter(f),
            );
            data.settings.graphicType = formData.settings.ratioGraphicType!;
            break;
          case "DashboardPetitionsPieChartModule":
            data.settings.items =
              formData.settings.items?.map((item) => ({
                color: item.color,
                filter: prepareDashboardModulePetitionFilter(item.filters![0]),
                label: item.label,
              })) ?? [];
            data.settings.graphicType = formData.settings.chartGraphicType!;
            break;
          case "DashboardCreatePetitionButtonModule":
            data.settings.buttonLabel = formData.settings.buttonLabel!;
            data.settings.templateId = formData.settings.templateId!;
            break;
        }
        if (isUpdating) {
          const mutation = (
            {
              DashboardProfilesNumberModule:
                DashboardModuleForm_updateProfilesNumberDashboardModuleDocument,
              DashboardProfilesRatioModule:
                DashboardModuleForm_updateProfilesRatioDashboardModuleDocument,
              DashboardProfilesPieChartModule:
                DashboardModuleForm_updateProfilesPieChartDashboardModuleDocument,
              DashboardPetitionsNumberModule:
                DashboardModuleForm_updatePetitionsNumberDashboardModuleDocument,
              DashboardPetitionsRatioModule:
                DashboardModuleForm_updatePetitionsRatioDashboardModuleDocument,
              DashboardPetitionsPieChartModule:
                DashboardModuleForm_updatePetitionsPieChartDashboardModuleDocument,
              DashboardCreatePetitionButtonModule:
                DashboardModuleForm_updateCreatePetitionButtonDashboardModuleDocument,
            } as const
          )[moduleType];
          await apollo.mutate({
            mutation,
            variables: {
              dashboardId,
              moduleId: module!.id,
              data,
            },
          });
        } else {
          const mutation = (
            {
              DashboardProfilesNumberModule:
                DashboardModuleForm_createProfilesNumberDashboardModuleDocument,
              DashboardProfilesRatioModule:
                DashboardModuleForm_createProfilesRatioDashboardModuleDocument,
              DashboardProfilesPieChartModule:
                DashboardModuleForm_createProfilesPieChartDashboardModuleDocument,
              DashboardPetitionsNumberModule:
                DashboardModuleForm_createPetitionsNumberDashboardModuleDocument,
              DashboardPetitionsRatioModule:
                DashboardModuleForm_createPetitionsRatioDashboardModuleDocument,
              DashboardPetitionsPieChartModule:
                DashboardModuleForm_createPetitionsPieChartDashboardModuleDocument,
              DashboardCreatePetitionButtonModule:
                DashboardModuleForm_createCreatePetitionButtonDashboardModuleDocument,
            } as const
          )[moduleType];
          await apollo.mutate({
            mutation,
            variables: {
              dashboardId,
              ...data,
            } as any,
          });
        }
        onClose();
      })}
      display="flex"
      flexDirection="column"
      flex={1}
      minHeight={0}
    >
      <DrawerBody padding={0} overflow="hidden">
        <FormProvider {...form}>
          <Stack as={ScrollShadows} padding={6} spacing={4} overflow="auto" height="100%">
            <FormControl isInvalid={!!errors.name}>
              <DashboardModuleFormLabel field="name" isUpdating={isUpdating}>
                <FormattedMessage
                  id="component.dashboard-module-form.module-name"
                  defaultMessage="Name"
                />
              </DashboardModuleFormLabel>
              <Input
                {...register("name", { required: true })}
                placeholder={intl.formatMessage({
                  id: "component.dashboard-module-form.module-name-placeholder",
                  defaultMessage: "Module name",
                })}
              />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.required-field-error"
                  defaultMessage="The field is required"
                />
              </FormErrorMessage>
            </FormControl>
            <FormControl>
              <DashboardModuleFormLabel field="size" isUpdating={isUpdating}>
                <FormattedMessage
                  id="component.dashboard-module-form.module-size"
                  defaultMessage="Size"
                />
              </DashboardModuleFormLabel>
              <Controller
                name="size"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DashboardModuleSizes moduleType={moduleType} value={value} onChange={onChange} />
                )}
              />
            </FormControl>

            {["DashboardProfilesRatioModule", "DashboardPetitionsRatioModule"].includes(
              moduleType,
            ) ? (
              <FormControl>
                <DashboardModuleFormLabel field="settings.ratioGraphicType" isUpdating={isUpdating}>
                  <FormattedMessage
                    id="component.dashboard-module-form.ratio-type-label"
                    defaultMessage="Type"
                  />
                </DashboardModuleFormLabel>
                <Controller
                  name="settings.ratioGraphicType"
                  defaultValue="RATIO"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DashboardModuleRatioType value={value} onChange={onChange} />
                  )}
                />
              </FormControl>
            ) : null}
            {[
              "DashboardProfilesNumberModule",
              "DashboardProfilesRatioModule",
              "DashboardProfilesPieChartModule",
            ].includes(moduleType) ? (
              <DashboardModuleProfileForm moduleType={moduleType} isUpdating={isUpdating} />
            ) : [
                "DashboardPetitionsNumberModule",
                "DashboardPetitionsRatioModule",
                "DashboardPetitionsPieChartModule",
                "DashboardCreatePetitionButtonModule",
              ].includes(moduleType) ? (
              <DashboardModulePetitionForm moduleType={moduleType} isUpdating={isUpdating} />
            ) : null}
          </Stack>
        </FormProvider>
      </DrawerBody>
      <DrawerFooter justifyContent="start">
        <Button variant="outline" onClick={isNonNullish(module) ? onClose : onBack} marginEnd={2}>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      </DrawerFooter>
    </Box>
  );
}

function prepareDashboardModulePetitionFilter(
  filter: WithoutTypenames<fullDashboardModulePetitionFilterFragment>,
) {
  return {
    fromTemplateId: (filter.fromTemplateId?.length ?? 0) > 0 ? filter!.fromTemplateId : null,
    signature: (filter.signature?.length ?? 0) > 0 ? filter!.signature : null,
    status: (filter.status?.length ?? 0) > 0 ? filter!.status : null,
    approvals:
      (filter.approvals?.filters?.length ?? 0) > 0 ? removeTypenames(filter!.approvals) : null,
    tags: (filter.tags?.filters?.length ?? 0) > 0 ? removeTypenames(filter!.tags) : null,
    sharedWith:
      (filter.sharedWith?.filters?.length ?? 0) > 0 ? removeTypenames(filter!.sharedWith) : null,
  };
}

function prepareDashboardModuleProfileFilter(filter: {
  status: string[];
  values: ProfileFieldValuesFilterGroup;
}) {
  return {
    status: filter.status.length > 0 ? filter.status : null,
    values: filter.values.conditions.length > 0 ? filter.values : null,
  };
}

function getDefaultDashboardModuleFormDataSettings(
  moduleType: DashboardModuleType,
  module: DashboardModuleForm_DashboardModuleFragment | null,
): DashboardModuleFormData["settings"] {
  switch (module?.__typename) {
    case "DashboardPetitionsNumberModule":
      return {
        filters: [defaultDashboardModulePetitionFilter(module.petitionsNumberSettings.filters)],
      };
    case "DashboardPetitionsRatioModule":
      return {
        ratioGraphicType: module.petitionsRatioSettings.graphicType,
        filters: module.petitionsRatioSettings.filters.map((f) =>
          defaultDashboardModulePetitionFilter(f),
        ),
      };
    case "DashboardPetitionsPieChartModule":
      return {
        chartGraphicType: module.petitionsPieChartSettings.graphicType,
        items: module.petitionsPieChartSettings.items.map((item) => ({
          color: item.color,
          label: item.label,
          filters: [defaultDashboardModulePetitionFilter(item.filter)],
        })),
      };
    case "DashboardCreatePetitionButtonModule":
      return {
        buttonLabel: module.createPetitionButtonSettings.label,
        templateId: module.createPetitionButtonSettings.template?.id,
      };
    case "DashboardProfilesNumberModule":
      return {
        type:
          module.profilesNumberSettings.type === "COUNT"
            ? "COUNT"
            : module.profilesNumberSettings.aggregate,
        profileTypeId: module.profilesNumberSettings.profileTypeId ?? null,
        profileTypeFieldId: module.profilesNumberSettings.profileTypeFieldId ?? null,
        filters: [defaultDashboardModuleProfileFilter(module.profilesNumberSettings.filters)],
      };
    case "DashboardProfilesRatioModule":
      return {
        type:
          module.profilesRatioSettings.type === "COUNT"
            ? "COUNT"
            : module.profilesRatioSettings.aggregate,
        profileTypeId: module.profilesRatioSettings.profileTypeId ?? null,
        profileTypeFieldId: module.profilesRatioSettings.profileTypeFieldId ?? null,
        filters: module.profilesRatioSettings.filters.map((f) =>
          defaultDashboardModuleProfileFilter(f),
        ),
        ratioGraphicType: module.profilesRatioSettings.graphicType,
      };
    case "DashboardProfilesPieChartModule":
      return {
        type:
          module.profilesPieChartSettings.type === "COUNT"
            ? "COUNT"
            : module.profilesPieChartSettings.aggregate,
        chartGraphicType: module.profilesPieChartSettings.graphicType,
        profileTypeId: module.profilesPieChartSettings.profileTypeId ?? null,
        profileTypeFieldId: module.profilesPieChartSettings.profileTypeFieldId ?? null,
        items: module.profilesPieChartSettings.items.map((item) => ({
          color: item.color,
          label: item.label,
          filters: [defaultDashboardModuleProfileFilter(item.filter)],
        })),
        groupByProfileTypeFieldId:
          module.profilesPieChartSettings.groupByProfileTypeFieldId ?? null,
        groupByFilter: defaultDashboardModuleProfileFilter(
          module.profilesPieChartSettings.groupByFilter ?? undefined,
        ),
      };
    default:
      switch (moduleType) {
        case "DashboardPetitionsNumberModule":
          return {
            filters: [defaultDashboardModulePetitionFilter()],
          };
        case "DashboardPetitionsRatioModule":
          return {
            ratioGraphicType: "RATIO",
            filters: [
              defaultDashboardModulePetitionFilter(),
              defaultDashboardModulePetitionFilter(),
            ],
          };
        case "DashboardPetitionsPieChartModule":
          return {
            chartGraphicType: "PIE",
            items: [],
          };
        case "DashboardCreatePetitionButtonModule":
          return {
            buttonLabel: "",
            templateId: null,
          };
        case "DashboardProfilesNumberModule":
          return {
            type: "COUNT",
            profileTypeId: null,
            profileTypeFieldId: null,
            filters: [defaultDashboardModuleProfileFilter()],
          };
        case "DashboardProfilesRatioModule":
          return {
            type: "COUNT",
            profileTypeId: null,
            profileTypeFieldId: null,
            filters: [defaultDashboardModuleProfileFilter(), defaultDashboardModuleProfileFilter()],
            ratioGraphicType: "RATIO",
          };
        case "DashboardProfilesPieChartModule":
          return {
            type: "COUNT",
            chartGraphicType: "PIE",
            profileTypeId: null,
            profileTypeFieldId: null,
            items: [],
            groupByProfileTypeFieldId: null,
            groupByFilter: defaultDashboardModuleProfileFilter(),
          };
        default:
          never();
      }
  }
}

interface DashboardModuleSizesProps {
  moduleType: DashboardModuleType;
  value: DashboardModuleSize;
  onChange: (value: DashboardModuleSize) => void;
}

function DashboardModuleSizes({ moduleType, value, onChange }: DashboardModuleSizesProps) {
  const [minSize, maxSize] = MODULE_SIZE_LIMITS[moduleType];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "size",
    value,
    defaultValue: "SMALL",
    onChange,
  });

  return (
    <HStack {...getRootProps()}>
      <ModuleSettingsRadioButton
        {...getRadioProps({ value: "SMALL" })}
        isDisabled={minSize === "MEDIUM" || minSize === "LARGE"}
      >
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.sizes-small"
            defaultMessage="Small"
          />
        </Text>
        <Grid templateColumns="repeat(4, 1fr)" gap={1} width="100%">
          <GridItem height={6} borderRadius="md" bg="primary.200" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
        </Grid>
      </ModuleSettingsRadioButton>
      <ModuleSettingsRadioButton
        {...getRadioProps({ value: "MEDIUM" })}
        isDisabled={minSize === "LARGE" || maxSize === "SMALL"}
      >
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.sizes-medium"
            defaultMessage="Medium"
          />
        </Text>
        <Grid templateColumns="repeat(4, 1fr)" gap={1} width="100%">
          <GridItem colSpan={2} height={6} borderRadius="md" bg="primary.200" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
        </Grid>
      </ModuleSettingsRadioButton>
      <ModuleSettingsRadioButton
        {...getRadioProps({ value: "LARGE" })}
        isDisabled={maxSize === "SMALL" || maxSize === "MEDIUM"}
      >
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.sizes-large"
            defaultMessage="Large"
          />
        </Text>
        <GridItem width="100%" height={6} borderRadius="md" bg="primary.200" />
      </ModuleSettingsRadioButton>
    </HStack>
  );
}

interface DashboardModuleRatioTypeProps {
  value?: DashboardRatioModuleSettingsType;
  onChange: (value: DashboardRatioModuleSettingsType) => void;
}

function DashboardModuleRatioType({ value, onChange }: DashboardModuleRatioTypeProps) {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "ratioGraphicType",
    value,
    defaultValue: "RATIO",
    onChange,
  });

  return (
    <HStack {...getRootProps()}>
      <ModuleSettingsRadioButton {...getRadioProps({ value: "RATIO" })}>
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.ratio-type-ratio"
            defaultMessage="Ratio"
          />
        </Text>
      </ModuleSettingsRadioButton>
      <ModuleSettingsRadioButton {...getRadioProps({ value: "PERCENTAGE" })}>
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.ratio-type-percentage"
            defaultMessage="Percentage"
          />
        </Text>
      </ModuleSettingsRadioButton>
    </HStack>
  );
}

const _fragments = {
  DashboardModule: gql`
    fragment DashboardModuleForm_DashboardModule on DashboardModule {
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
            ...fullDashboardModulePetitionFilter
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
              ...fullDashboardModulePetitionFilter
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
            ...fullDashboardModulePetitionFilter
          }
        }
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation DashboardModuleForm_createCreatePetitionButtonDashboardModule(
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
    mutation DashboardModuleForm_createPetitionsNumberDashboardModule(
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
    mutation DashboardModuleForm_createPetitionsRatioDashboardModule(
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
    mutation DashboardModuleForm_createPetitionsPieChartDashboardModule(
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
    mutation DashboardModuleForm_createProfilesNumberDashboardModule(
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
    mutation DashboardModuleForm_createProfilesPieChartDashboardModule(
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
    mutation DashboardModuleForm_createProfilesRatioDashboardModule(
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
    mutation DashboardModuleForm_updateProfilesRatioDashboardModule(
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
        ...DashboardModuleForm_DashboardModule
      }
    }
  `,
  gql`
    mutation DashboardModuleForm_updateProfilesPieChartDashboardModule(
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
        ...DashboardModuleForm_DashboardModule
      }
    }
  `,
  gql`
    mutation DashboardModuleForm_updateProfilesNumberDashboardModule(
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
        ...DashboardModuleForm_DashboardModule
      }
    }
  `,
  gql`
    mutation DashboardModuleForm_updatePetitionsPieChartDashboardModule(
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
        ...DashboardModuleForm_DashboardModule
      }
    }
  `,
  gql`
    mutation DashboardModuleForm_updatePetitionsRatioDashboardModule(
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
        ...DashboardModuleForm_DashboardModule
      }
    }
  `,
  gql`
    mutation DashboardModuleForm_updateCreatePetitionButtonDashboardModule(
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
        ...DashboardModuleForm_DashboardModule
      }
    }
  `,
  gql`
    mutation DashboardModuleForm_updatePetitionsNumberDashboardModule(
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
        ...DashboardModuleForm_DashboardModule
      }
    }
  `,
];
