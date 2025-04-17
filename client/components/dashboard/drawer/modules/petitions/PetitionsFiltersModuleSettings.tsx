import { Button, Grid, HStack, Stack, Text } from "@chakra-ui/react";
import { PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { MultiCheckboxSimpleSelect } from "@parallel/components/common/MultiCheckboxSimpleSelect";
import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { PetitionListApprovalsFilterLine } from "@parallel/components/petition-list/filters/PetitionListApprovalsFilter";
import { PetitionListSharedWithFilterLine } from "@parallel/components/petition-list/filters/PetitionListSharedWithFilter";
import { PetitionListTagFilterLine } from "@parallel/components/petition-list/filters/PetitionListTagFilter";
import { useLogicalOperators } from "@parallel/utils/useLogicalOperators";
import { usePetitionSignatureStatusLabels } from "@parallel/utils/usePetitionSignatureStatusLabels";
import { usePetitionStatusLabels } from "@parallel/utils/usePetitionStatusLabels";
import { ReactNode, useCallback, useMemo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { DashboardModuleFilterContainer } from "../../components/DashboardModuleFilterContainer";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";

interface PetitionsFiltersModuleSettingsProps {
  index?: number;
  path?: string;
}

export function PetitionsFiltersModuleSettings({
  index = 0,
  path,
}: PetitionsFiltersModuleSettingsProps) {
  const { control } = useFormContext<DashboardModuleDrawerFormData>();
  const basePath = path ?? `settings.filters.${index}`;
  return (
    <>
      <Controller
        control={control}
        name={`${basePath}.status` as any}
        render={({ field: { value, onChange } }) => (
          <DashboardModuleFilterContainer
            label={
              <FormattedMessage
                id="component.petition-filters-module-settings.petition-status-label"
                defaultMessage="Status"
              />
            }
            field={`${basePath}.status`}
          >
            <PetitionStatusFilter value={value} onChange={onChange} />
          </DashboardModuleFilterContainer>
        )}
      />

      <Controller
        control={control}
        name={`${basePath}.signature` as any}
        render={({ field: { value, onChange } }) => (
          <DashboardModuleFilterContainer
            label={
              <FormattedMessage
                id="component.petition-filters-module-settings.signature-status-label"
                defaultMessage="eSignature status"
              />
            }
            field={`${basePath}.signature`}
          >
            <SignatureStatusFilter value={value} onChange={onChange} />
          </DashboardModuleFilterContainer>
        )}
      />

      <Controller
        control={control}
        name={`${basePath}.fromTemplateId` as any}
        render={({ field: { value, onChange } }) => (
          <DashboardModuleFilterContainer
            label={
              <FormattedMessage
                id="component.petition-filters-module-settings.template-label"
                defaultMessage="Template"
              />
            }
            field={`${basePath}.fromTemplateId`}
          >
            <TemplateFilter value={value} onChange={onChange} />
          </DashboardModuleFilterContainer>
        )}
      />

      <DashboardModuleFilterContainer
        label={
          <FormattedMessage
            id="component.petition-filters-module-settings.tags-label"
            defaultMessage="Tags"
          />
        }
        field={`${basePath}.tags`}
      >
        <BaseLogicalFilter
          rootPath={`${basePath}.tags`}
          renderFilterLine={({ key, ...rest }) => <PetitionListTagFilterLine key={key} {...rest} />}
          createEmptyFilter={() => ({ value: [], operator: "CONTAINS" })}
        />
      </DashboardModuleFilterContainer>

      <DashboardModuleFilterContainer
        label={
          <FormattedMessage
            id="component.petition-filters-module-settings.approvals-label"
            defaultMessage="Approvals"
          />
        }
        field={`${basePath}.approvals`}
      >
        <BaseLogicalFilter
          rootPath={`${basePath}.approvals`}
          renderFilterLine={({ key, ...rest }) => (
            <PetitionListApprovalsFilterLine key={key} {...rest} />
          )}
          createEmptyFilter={() => ({ value: null, operator: "STATUS" })}
        />
      </DashboardModuleFilterContainer>

      <DashboardModuleFilterContainer
        label={
          <FormattedMessage
            id="component.petition-filters-module-settings.shared-with-label"
            defaultMessage="Shared"
          />
        }
        field={`${basePath}.sharedWith`}
      >
        <BaseLogicalFilter
          rootPath={`${basePath}.sharedWith`}
          renderFilterLine={({ key, ...rest }) => (
            <PetitionListSharedWithFilterLine key={key} {...rest} />
          )}
          createEmptyFilter={() => ({ value: null, operator: "SHARED_WITH" })}
        />
      </DashboardModuleFilterContainer>
    </>
  );
}

function PetitionStatusFilter({
  value,
  onChange,
}: {
  value?: string[];
  onChange: (v: string[]) => void;
}) {
  const intl = useIntl();
  const petitionStatuses = usePetitionStatusLabels();
  const petitionStatusesOptions = useMemo(() => {
    return Object.entries(petitionStatuses).map(([value, text]) => ({
      value: value,
      label: text,
    }));
  }, [petitionStatuses]);

  const handleChange = useCallback(
    (newValue: string[]) => {
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <MultiCheckboxSimpleSelect
      options={petitionStatusesOptions}
      value={value ?? []}
      isClearable
      isSearchable
      placeholder={intl.formatMessage({
        id: "component.petitions-fitlers-module-settings.all-petition-status-placeholder",
        defaultMessage: "All statuses",
      })}
      onChange={handleChange}
    />
  );
}

function SignatureStatusFilter({
  value,
  onChange,
}: {
  value?: string[];
  onChange: (v: string[]) => void;
}) {
  const intl = useIntl();
  const signatureStatuses = usePetitionSignatureStatusLabels();
  const petitionSignatureStatusesOptions = useMemo(() => {
    return Object.entries(signatureStatuses).map(([value, text]) => ({
      value: value,
      label: text,
    }));
  }, []);

  return (
    <MultiCheckboxSimpleSelect
      options={petitionSignatureStatusesOptions}
      value={value ?? []}
      isClearable
      isSearchable
      placeholder={intl.formatMessage({
        id: "component.petitions-fitlers-module-settings.any-signature-status-placeholder",
        defaultMessage: "Any signature status",
      })}
      onChange={onChange}
    />
  );
}

function TemplateFilter({
  value,
  onChange,
}: {
  value?: string[];
  onChange: (v: string[]) => void;
}) {
  const intl = useIntl();
  return (
    <PetitionSelect
      isMulti
      defaultOptions
      type="TEMPLATE"
      value={value ?? []}
      onChange={(v) => {
        const templateIds = v?.map((p) => p.id) ?? [];
        onChange(templateIds);
      }}
      noOfLines={2}
      placeholder={intl.formatMessage({
        id: "component.petitions-fitlers-module-settings.any-template-placeholder",
        defaultMessage: "Any template",
      })}
    />
  );
}

interface LogicalOperatorFilterContainerProps {
  filterCount: number;
  children: ReactNode;
  onAddFilter: () => void;
  rootPath: string;
}

function LogicalOperatorFilterContainer({
  filterCount,
  onAddFilter,
  children,
  rootPath,
}: LogicalOperatorFilterContainerProps) {
  const { control } = useFormContext();
  const logicalOperators = useLogicalOperators();
  return (
    <Stack width="100%">
      {filterCount > 0 ? (
        <Grid
          minWidth={0}
          width="100%"
          templateColumns="32px auto"
          alignItems="center"
          columnGap={2}
          rowGap={2}
        >
          {children}
        </Grid>
      ) : (
        <Text textStyle="hint" textAlign="center">
          <FormattedMessage
            id="generic.no-filter-applied"
            defaultMessage="No filter is being applied."
          />
        </Text>
      )}
      <HStack>
        <Button
          variant="outline"
          size="sm"
          paddingX={2}
          fontWeight="normal"
          leftIcon={<PlusCircleFilledIcon color="primary.500" position="relative" boxSize={5} />}
          onClick={onAddFilter}
          isDisabled={filterCount >= 5}
        >
          <FormattedMessage id="generic.add-filter" defaultMessage="Add filter" />
        </Button>
        {filterCount > 1 ? (
          <Controller
            control={control}
            name={`${rootPath}.operator`}
            defaultValue="AND"
            render={({ field }) => (
              <SimpleSelect size="sm" isSearchable={false} options={logicalOperators} {...field} />
            )}
          />
        ) : null}
      </HStack>
    </Stack>
  );
}

interface BaseFilterLineConfig {
  index: number;
  rootPath: string;
  onRemove: () => void;
  key: string;
}

function BaseLogicalFilter({
  rootPath,
  renderFilterLine,
  createEmptyFilter,
}: {
  rootPath: string;
  renderFilterLine: (props: BaseFilterLineConfig) => ReactNode;
  createEmptyFilter: () => any;
}) {
  const { control, setValue } = useFormContext();
  const {
    fields: filters,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `${rootPath}.filters`,
  });

  return (
    <Stack width="100%">
      <LogicalOperatorFilterContainer
        filterCount={filters.length}
        onAddFilter={() => {
          if (filters.length === 0) {
            setValue(`${rootPath}.operator`, "AND");
          }
          append(createEmptyFilter());
        }}
        rootPath={rootPath}
      >
        {filters.map((filter, index) =>
          renderFilterLine({
            key: filter.id,
            index,
            rootPath,
            onRemove: () => remove(index),
          }),
        )}
      </LogicalOperatorFilterContainer>
    </Stack>
  );
}
